/**
 * FiscalHashChain — Cadeia criptográfica de documentos fiscais (AT).
 *
 * Requisitos da Autoridade Tributária (Portaria 363/2010):
 *   1. Cada documento fiscal contém uma assinatura digital (hash).
 *   2. O conteúdo assinado inclui: data + data de sistema + número do documento
 *      + total bruto + hash do documento anterior.
 *   3. O primeiro documento de cada série tem previousHash = "".
 *   4. Algoritmo: RSA-SHA1 (PKCS#1 v1.5) — a AT exige SHA-1.
 *
 * Nota sobre SubtleCrypto:
 *   A Web Crypto API suporta RSA-SHA1 via "RSASSA-PKCS1-v1_5" com { name: "SHA-1" }.
 *   Em ambientes que bloqueiem SHA-1 (Chrome flags futuras), será necessário
 *   fallback para WASM ou server-side signing.
 *
 * A chave privada RSA vem da configuração do restaurante.
 * Neste módulo, usamos um stub configurável — em produção a chave é
 * carregada do cofre de secrets do backend.
 */

import type { FiscalDocument } from '../types';

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

interface HashInput {
  /** Data do documento (YYYY-MM-DD) */
  invoiceDate: string;
  /** Data/hora de entrada no sistema (YYYY-MM-DDTHH:MM:SS) */
  systemEntryDate: string;
  /** Número do documento (ex.: "FT A/1") */
  documentNumber: string;
  /** Total bruto com 2 casas decimais */
  grossTotal: number;
  /** Hash do documento anterior na série ("" se primeiro) */
  previousHash: string;
}

// ---------------------------------------------------------------------------
// Armazenamento local de hashes por série (IndexedDB)
// ---------------------------------------------------------------------------

const DB_NAME = 'chefiapp_fiscal';
const DB_VERSION = 1;
const STORE_NAME = 'hash_chain';

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'series' });
        store.createIndex('series', 'series', { unique: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

interface HashRecord {
  series: string;
  lastHash: string;
  lastDocumentNumber: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// FiscalHashChain
// ---------------------------------------------------------------------------

export class FiscalHashChain {
  private privateKey: CryptoKey | null = null;
  private publicKey: CryptoKey | null = null;

  /**
   * Inicializa a cadeia com um par de chaves RSA.
   *
   * Em produção, a chave privada é importada do backend (PEM/JWK).
   * Para desenvolvimento/testes, gera um par efémero.
   *
   * @param privateKeyJwk - Chave privada RSA em formato JWK (opcional)
   * @param publicKeyJwk - Chave pública RSA em formato JWK (opcional)
   */
  async init(
    privateKeyJwk?: JsonWebKey,
    publicKeyJwk?: JsonWebKey,
  ): Promise<void> {
    if (privateKeyJwk) {
      this.privateKey = await crypto.subtle.importKey(
        'jwk',
        privateKeyJwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-1' },
        false,
        ['sign'],
      );
    }

    if (publicKeyJwk) {
      this.publicKey = await crypto.subtle.importKey(
        'jwk',
        publicKeyJwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-1' },
        false,
        ['verify'],
      );
    }

    // Se nenhuma chave fornecida, gerar par efémero (dev/test)
    if (!this.privateKey && !this.publicKey) {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-1',
        },
        false,
        ['sign', 'verify'],
      );
      this.privateKey = keyPair.privateKey;
      this.publicKey = keyPair.publicKey;
    }
  }

  /**
   * Constrói a string de dados a assinar conforme especificação AT.
   *
   * Formato: "{invoiceDate};{systemEntryDate};{documentNumber};{grossTotal};{previousHash}"
   *
   * Quando previousHash está vazio (primeiro documento da série),
   * o campo fica vazio mas os separadores são mantidos.
   */
  private buildSignatureInput(input: HashInput): string {
    const grossStr = input.grossTotal.toFixed(2);
    return [
      input.invoiceDate,
      input.systemEntryDate,
      input.documentNumber,
      grossStr,
      input.previousHash,
    ].join(';');
  }

  /**
   * Gera o hash/assinatura para um documento fiscal.
   *
   * @param doc - Documento fiscal
   * @param previousHash - Hash do documento anterior na série ("" se primeiro)
   * @returns Base64 da assinatura RSA-SHA1
   */
  async generateHash(
    doc: FiscalDocument,
    previousHash: string,
  ): Promise<string> {
    if (!this.privateKey) {
      throw new Error(
        '[FiscalHashChain] Chave privada não inicializada. Chamar init() primeiro.',
      );
    }

    const input: HashInput = {
      invoiceDate: doc.invoiceDate,
      systemEntryDate: doc.systemEntryDate,
      documentNumber: doc.documentNumber,
      grossTotal: doc.grossTotal,
      previousHash,
    };

    const dataString = this.buildSignatureInput(input);
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      this.privateKey,
      data,
    );

    // Converter ArrayBuffer para Base64
    const bytes = new Uint8Array(signature);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Extrai o hashControl — primeiros 4 caracteres do hash.
   * Este valor é impresso no documento fiscal.
   */
  static extractHashControl(hash: string): string {
    return hash.substring(0, 4);
  }

  /**
   * Verifica a integridade da cadeia de hashes de uma série.
   *
   * @param documents - Documentos ordenados por número sequencial (ascendente)
   * @returns true se toda a cadeia é válida
   */
  async verifyChain(documents: FiscalDocument[]): Promise<boolean> {
    if (!this.publicKey) {
      throw new Error(
        '[FiscalHashChain] Chave pública não inicializada. Chamar init() primeiro.',
      );
    }

    if (documents.length === 0) return true;

    let previousHash = '';

    for (const doc of documents) {
      const input: HashInput = {
        invoiceDate: doc.invoiceDate,
        systemEntryDate: doc.systemEntryDate,
        documentNumber: doc.documentNumber,
        grossTotal: doc.grossTotal,
        previousHash,
      };

      const dataString = this.buildSignatureInput(input);
      const encoder = new TextEncoder();
      const data = encoder.encode(dataString);

      // Descodificar hash Base64 para ArrayBuffer
      const binaryStr = atob(doc.hash);
      const signatureBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        signatureBytes[i] = binaryStr.charCodeAt(i);
      }

      const isValid = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        this.publicKey,
        signatureBytes.buffer,
        data,
      );

      if (!isValid) {
        return false;
      }

      previousHash = doc.hash;
    }

    return true;
  }

  /**
   * Obtém o último hash armazenado para uma série (IndexedDB).
   *
   * @param series - Identificador da série (ex.: "A", "B")
   * @returns Último hash ou "" se não há documentos na série
   */
  async getLastHash(series: string): Promise<string> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(series);

        request.onsuccess = () => {
          const record = request.result as HashRecord | undefined;
          resolve(record?.lastHash ?? '');
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      // IndexedDB indisponível (ex.: modo privado sem suporte)
      return '';
    }
  }

  /**
   * Armazena o último hash de uma série (IndexedDB).
   *
   * @param series - Identificador da série
   * @param hash - Hash do último documento emitido
   * @param documentNumber - Número do documento
   */
  async storeLastHash(
    series: string,
    hash: string,
    documentNumber: string,
  ): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const record: HashRecord = {
          series,
          lastHash: hash,
          lastDocumentNumber: documentNumber,
          updatedAt: new Date().toISOString(),
        };

        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      // Silenciar — sincronização com backend tratará a persistência
    }
  }
}
