/**
 * DocumentNumbering — Numeração sequencial de documentos fiscais (AT).
 *
 * Requisitos da Autoridade Tributária:
 *   1. Numeração sequencial por tipo de documento e série.
 *   2. Sem lacunas (gaps) na numeração.
 *   3. Formato: "{TIPO} {SÉRIE}/{NÚMERO}" — ex.: "FT A/1", "FT A/2".
 *   4. Reset anual da numeração (nova série por ano fiscal).
 *
 * Armazenamento:
 *   - IndexedDB para operação offline.
 *   - Sincronização com backend quando online.
 */

import type { SaftDocumentType, SequenceValidation } from '../types';

// ---------------------------------------------------------------------------
// IndexedDB
// ---------------------------------------------------------------------------

const DB_NAME = 'chefiapp_fiscal';
const DB_VERSION = 1;
const STORE_NAME = 'document_numbers';

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
      // Garantir que hash_chain store também existe (partilhado com HashChain)
      if (!db.objectStoreNames.contains('hash_chain')) {
        const store = db.createObjectStore('hash_chain', { keyPath: 'series' });
        store.createIndex('series', 'series', { unique: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

interface NumberRecord {
  /** Chave composta: "{series}:{type}" */
  key: string;
  /** Série do documento */
  series: string;
  /** Tipo de documento */
  type: SaftDocumentType;
  /** Último número usado */
  lastNumber: number;
  /** Todos os números usados (para verificação de gaps) */
  usedNumbers: number[];
  /** Última atualização */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// DocumentNumbering
// ---------------------------------------------------------------------------

export class DocumentNumbering {
  /**
   * Obtém o próximo número de documento para uma série e tipo.
   *
   * Formato retornado: "FT A/1", "FR B/42", etc.
   *
   * @param series - Identificador da série (ex.: "A", "2024A")
   * @param type - Tipo de documento (FT, FR, NC, FS)
   * @returns Número de documento formatado
   */
  async getNextNumber(
    series: string,
    type: SaftDocumentType,
  ): Promise<string> {
    const key = this.buildKey(series, type);
    const record = await this.getRecord(key);

    const nextNumber = record ? record.lastNumber + 1 : 1;
    return this.formatDocumentNumber(type, series, nextNumber);
  }

  /**
   * Obtém o próximo número sequencial (apenas o número, sem formatação).
   */
  async getNextSequentialNumber(
    series: string,
    type: SaftDocumentType,
  ): Promise<number> {
    const key = this.buildKey(series, type);
    const record = await this.getRecord(key);
    return record ? record.lastNumber + 1 : 1;
  }

  /**
   * Regista um número de documento como utilizado.
   *
   * Deve ser chamado APÓS emissão bem-sucedida do documento.
   * Falha silenciosamente se IndexedDB não estiver disponível.
   *
   * @param series - Série do documento
   * @param type - Tipo de documento
   * @param number - Número sequencial utilizado
   */
  async registerNumber(
    series: string,
    type: SaftDocumentType,
    number: number,
  ): Promise<void> {
    const key = this.buildKey(series, type);

    try {
      const db = await openDB();
      const existing = await this.getRecord(key);

      const usedNumbers = existing?.usedNumbers ?? [];
      if (!usedNumbers.includes(number)) {
        usedNumbers.push(number);
        usedNumbers.sort((a, b) => a - b);
      }

      const record: NumberRecord = {
        key,
        series,
        type,
        lastNumber: Math.max(number, existing?.lastNumber ?? 0),
        usedNumbers,
        updatedAt: new Date().toISOString(),
      };

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(record);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      // IndexedDB indisponível — a sincronização com backend tratará
    }
  }

  /**
   * Verifica se existem lacunas na sequência de numeração.
   *
   * A AT exige numeração contínua sem saltos.
   * Esta verificação usa os dados locais (IndexedDB).
   *
   * @param series - Série a verificar
   * @param type - Tipo de documento
   * @returns Resultado da validação com gaps encontrados
   */
  async verifySequence(
    series: string,
    type: SaftDocumentType,
  ): Promise<SequenceValidation> {
    const key = this.buildKey(series, type);
    const record = await this.getRecord(key);

    if (!record || record.usedNumbers.length === 0) {
      return {
        series,
        documentType: type,
        lastNumber: 0,
        totalDocuments: 0,
        gaps: [],
        isValid: true,
      };
    }

    const gaps: number[] = [];
    const sorted = [...record.usedNumbers].sort((a, b) => a - b);

    // Verificar se começa em 1
    if (sorted[0] !== 1) {
      for (let i = 1; i < sorted[0]; i++) {
        gaps.push(i);
      }
    }

    // Verificar lacunas entre números consecutivos
    for (let i = 1; i < sorted.length; i++) {
      const expected = sorted[i - 1] + 1;
      if (sorted[i] !== expected) {
        for (let n = expected; n < sorted[i]; n++) {
          gaps.push(n);
        }
      }
    }

    return {
      series,
      documentType: type,
      lastNumber: record.lastNumber,
      totalDocuments: sorted.length,
      gaps,
      isValid: gaps.length === 0,
    };
  }

  /**
   * Obtém o último número utilizado para uma série/tipo.
   */
  async getLastNumber(
    series: string,
    type: SaftDocumentType,
  ): Promise<number> {
    const key = this.buildKey(series, type);
    const record = await this.getRecord(key);
    return record?.lastNumber ?? 0;
  }

  /**
   * Formata o número de documento conforme SAF-T PT.
   *
   * Formato: "{TIPO} {SÉRIE}/{NÚMERO}"
   * Exemplos: "FT A/1", "FR B/42", "NC A/3"
   */
  formatDocumentNumber(
    type: SaftDocumentType,
    series: string,
    number: number,
  ): string {
    return `${type} ${series}/${number}`;
  }

  /**
   * Extrai os componentes de um número de documento formatado.
   *
   * @param documentNumber - Ex.: "FT A/1"
   * @returns Componentes ou null se formato inválido
   */
  static parseDocumentNumber(
    documentNumber: string,
  ): { type: SaftDocumentType; series: string; number: number } | null {
    // Formato: "FT A/1" ou "FT A/123"
    const match = documentNumber.match(
      /^(FT|FR|NC|FS)\s+([A-Za-z0-9]+)\/(\d+)$/,
    );
    if (!match) return null;

    return {
      type: match[1] as SaftDocumentType,
      series: match[2],
      number: parseInt(match[3], 10),
    };
  }

  // -----------------------------------------------------------------------
  // Internos
  // -----------------------------------------------------------------------

  private buildKey(series: string, type: SaftDocumentType): string {
    return `${series}:${type}`;
  }

  private async getRecord(key: string): Promise<NumberRecord | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve((request.result as NumberRecord) ?? null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }
}
