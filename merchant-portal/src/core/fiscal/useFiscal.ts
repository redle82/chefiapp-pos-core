/**
 * useFiscal — Hook React para operações fiscais SAF-T PT.
 *
 * Orquestra:
 *   - Emissão de documentos fiscais (FT, FR, FS, NC)
 *   - Exportação SAF-T para período
 *   - Verificação de saúde fiscal (chain integrity, gaps)
 *
 * Não substitui o FiscalService existente — complementa-o com
 * geração real de documentos SAF-T PT com hash chain.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  FiscalConfig,
  FiscalDocument,
  FiscalDocumentLine,
  SaftDocumentType,
} from './types';
import { TaxCalculator } from './tax/TaxCalculator';
import type { OrderItem, TaxBreakdown, TaxRegion } from './tax/TaxCalculator';
import { FiscalHashChain } from './saft/HashChain';
import { DocumentNumbering } from './saft/DocumentNumbering';
import { SaftPTGenerator } from './saft/SaftPTGenerator';
import type { SaftExportData } from './saft/SaftPTGenerator';

// ---------------------------------------------------------------------------
// Tipos do hook
// ---------------------------------------------------------------------------

export interface FiscalHealth {
  /** A cadeia de hashes está íntegra */
  isValid: boolean;
  /** Último documento emitido (número) */
  lastDocument: string | null;
  /** Foram detetadas lacunas na numeração */
  gapsDetected: boolean;
  /** Detalhes de gaps por série/tipo */
  gapDetails?: Array<{ series: string; type: string; gaps: number[] }>;
}

/** Dados mínimos de um pedido para emissão fiscal */
export interface FiscalOrderInput {
  orderId: string;
  items: Array<{
    productCode: string;
    description: string;
    quantity: number;
    unitPriceGross: number; // preço com IVA incluído
    taxRateCode?: 'NOR' | 'INT' | 'RED' | 'ISE';
    taxExemptionReason?: string;
    taxExemptionCode?: string;
  }>;
  customerTaxId?: string; // NIF do cliente (omitir = consumidor final)
  paymentMechanism?: FiscalDocument['paymentMechanism'];
}

export interface UseFiscalReturn {
  /** Emitir documento fiscal para um pedido */
  emitDocument: (
    order: FiscalOrderInput,
    type: SaftDocumentType,
  ) => Promise<FiscalDocument>;

  /** Exportar SAF-T XML para um período */
  exportSaft: (from: Date, to: Date) => Promise<Blob>;

  /** Estado de saúde fiscal */
  health: FiscalHealth;

  /** Operação em curso */
  loading: boolean;

  /** Último erro */
  error: string | null;
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const CONSUMER_FINAL_NIF = '999999990';

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDateTime(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, '');
}

// ---------------------------------------------------------------------------
// useFiscal
// ---------------------------------------------------------------------------

export function useFiscal(
  restaurantId: string,
  config?: FiscalConfig,
): UseFiscalReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<FiscalHealth>({
    isValid: true,
    lastDocument: null,
    gapsDetected: false,
  });

  // Instâncias singleton por vida do componente
  const taxCalcRef = useRef(new TaxCalculator());
  const hashChainRef = useRef(new FiscalHashChain());
  const numberingRef = useRef(new DocumentNumbering());
  const generatorRef = useRef(new SaftPTGenerator());
  const initializedRef = useRef(false);

  // Documentos emitidos na sessão (para exportação SAF-T)
  const emittedDocsRef = useRef<FiscalDocument[]>([]);
  const taxBreakdownsRef = useRef<Map<string, TaxBreakdown[]>>(new Map());

  const region: TaxRegion = config?.region ?? 'PT';
  const series = config?.series ?? 'A';

  // Inicializar hash chain (gera chaves efémeras em dev)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    hashChainRef.current.init().catch((err) => {
      console.error('[useFiscal] Falha ao inicializar hash chain:', err);
      setError('Falha ao inicializar cadeia criptográfica fiscal');
    });
  }, []);

  // Verificar saúde fiscal ao montar
  useEffect(() => {
    checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, series]);

  // -----------------------------------------------------------------------
  // Verificar saúde fiscal
  // -----------------------------------------------------------------------

  const checkHealth = useCallback(async () => {
    try {
      const numbering = numberingRef.current;
      const types: SaftDocumentType[] = ['FT', 'FR', 'NC', 'FS'];
      const gapDetails: FiscalHealth['gapDetails'] = [];
      let lastDoc: string | null = null;
      let hasGaps = false;

      for (const type of types) {
        const validation = await numbering.verifySequence(series, type);
        if (!validation.isValid) {
          hasGaps = true;
          gapDetails.push({
            series,
            type,
            gaps: validation.gaps,
          });
        }
        if (validation.lastNumber > 0) {
          const docNum = numbering.formatDocumentNumber(
            type,
            series,
            validation.lastNumber,
          );
          lastDoc = docNum;
        }
      }

      setHealth({
        isValid: !hasGaps,
        lastDocument: lastDoc,
        gapsDetected: hasGaps,
        gapDetails: gapDetails.length > 0 ? gapDetails : undefined,
      });
    } catch (err) {
      console.error('[useFiscal] Erro ao verificar saúde fiscal:', err);
    }
  }, [series]);

  // -----------------------------------------------------------------------
  // Emitir documento fiscal
  // -----------------------------------------------------------------------

  const emitDocument = useCallback(
    async (
      order: FiscalOrderInput,
      type: SaftDocumentType,
    ): Promise<FiscalDocument> => {
      setLoading(true);
      setError(null);

      try {
        const taxCalc = taxCalcRef.current;
        const hashChain = hashChainRef.current;
        const numbering = numberingRef.current;

        // 1. Calcular impostos
        const orderItems: OrderItem[] = order.items.map((item) => ({
          productCode: item.productCode,
          description: item.description,
          quantity: item.quantity,
          unitPriceGross: item.unitPriceGross,
          taxRateCode: item.taxRateCode,
          taxExemptionReason: item.taxExemptionReason,
          taxExemptionCode: item.taxExemptionCode,
        }));

        const breakdowns = taxCalc.calculateOrderTax(orderItems, region);
        const totals = taxCalc.calculateDocumentTotals(breakdowns);

        // 2. Obter próximo número
        const seqNumber = await numbering.getNextSequentialNumber(series, type);
        const documentNumber = numbering.formatDocumentNumber(
          type,
          series,
          seqNumber,
        );

        // 3. Construir linhas do documento
        const rateTable =
          region === 'AZ'
            ? { NOR: 0.18, INT: 0.09, RED: 0.04, ISE: 0.0 }
            : region === 'MA'
              ? { NOR: 0.22, INT: 0.12, RED: 0.05, ISE: 0.0 }
              : { NOR: 0.23, INT: 0.13, RED: 0.06, ISE: 0.0 };

        const lines: FiscalDocumentLine[] = order.items.map((item, idx) => {
          const rateCode = item.taxRateCode ?? 'NOR';
          const rate =
            rateTable[rateCode as keyof typeof rateTable] ?? rateTable.NOR;
          const lineGross =
            Math.round(item.unitPriceGross * item.quantity * 100) / 100;
          const lineNet =
            rate > 0
              ? Math.round((lineGross / (1 + rate)) * 100) / 100
              : lineGross;
          const unitPriceNet =
            rate > 0
              ? Math.round((item.unitPriceGross / (1 + rate)) * 100) / 100
              : item.unitPriceGross;

          const line: FiscalDocumentLine = {
            lineNumber: idx + 1,
            productCode: item.productCode,
            productDescription: item.description,
            quantity: item.quantity,
            unitOfMeasure: 'UN',
            unitPrice: unitPriceNet,
            taxRate: rate,
            taxRateCode: rateCode as FiscalDocumentLine['taxRateCode'],
          };

          if (type === 'NC') {
            line.creditAmount = lineNet;
          } else {
            line.debitAmount = lineNet;
          }

          if (item.taxExemptionReason) {
            line.taxExemptionReason = item.taxExemptionReason;
            line.taxExemptionCode = item.taxExemptionCode;
          }

          return line;
        });

        // 4. Construir documento (sem hash ainda)
        const now = new Date();
        const invoiceDate = formatDate(now);
        const systemEntryDate = formatDateTime(now);

        const doc: FiscalDocument = {
          documentType: type,
          documentNumber,
          series,
          sequentialNumber: seqNumber,
          invoiceDate,
          systemEntryDate,
          customerTaxId: order.customerTaxId || CONSUMER_FINAL_NIF,
          lines,
          grossTotal: totals.grossTotal,
          netTotal: totals.netTotal,
          taxPayable: totals.taxPayable,
          hash: '', // preenchido abaixo
          hashControl: '',
          atcud: `${series}-${seqNumber}`,
          status: 'EMITTED',
          sourceOrderId: order.orderId,
          paymentMechanism: order.paymentMechanism,
        };

        // 5. Gerar hash (cadeia criptográfica)
        const previousHash = await hashChain.getLastHash(series);
        const hash = await hashChain.generateHash(doc, previousHash);
        doc.hash = hash;
        doc.hashControl = FiscalHashChain.extractHashControl(hash);

        // 6. Registar número e hash
        await numbering.registerNumber(series, type, seqNumber);
        await hashChain.storeLastHash(series, hash, documentNumber);

        // 7. Guardar para exportação SAF-T
        emittedDocsRef.current.push(doc);
        taxBreakdownsRef.current.set(documentNumber, breakdowns);

        // 8. Atualizar saúde fiscal
        await checkHealth();

        return doc;
      } catch (err: any) {
        const msg =
          err?.message || 'Erro desconhecido ao emitir documento fiscal';
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [region, series, checkHealth],
  );

  // -----------------------------------------------------------------------
  // Exportar SAF-T
  // -----------------------------------------------------------------------

  const exportSaft = useCallback(
    async (from: Date, to: Date): Promise<Blob> => {
      setLoading(true);
      setError(null);

      try {
        if (!config) {
          throw new Error(
            'Configuração fiscal não fornecida. Necessário FiscalConfig para exportação SAF-T.',
          );
        }

        const generator = generatorRef.current;

        // Filtrar documentos do período
        const fromStr = formatDate(from);
        const toStr = formatDate(to);

        const docsInPeriod = emittedDocsRef.current.filter((doc) => {
          return doc.invoiceDate >= fromStr && doc.invoiceDate <= toStr;
        });

        // Recolher breakdowns relevantes
        const relevantBreakdowns = new Map<string, TaxBreakdown[]>();
        for (const doc of docsInPeriod) {
          const bd = taxBreakdownsRef.current.get(doc.documentNumber);
          if (bd) {
            relevantBreakdowns.set(doc.documentNumber, bd);
          }
        }

        const exportData: SaftExportData = {
          config,
          documents: docsInPeriod,
          taxBreakdowns: relevantBreakdowns,
          period: { from: fromStr, to: toStr },
        };

        const saftDoc = generator.generateDocument(exportData);

        // Validar antes de exportar
        const validation = generator.validate(saftDoc);
        if (!validation.isValid) {
          const errorMessages = validation.errors
            .map((e) => e.message)
            .join('; ');
          throw new Error(`SAF-T inválido: ${errorMessages}`);
        }

        const xml = generator.toXML(saftDoc);
        return new Blob([xml], { type: 'application/xml;charset=utf-8' });
      } catch (err: any) {
        const msg = err?.message || 'Erro ao exportar SAF-T';
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [config],
  );

  return {
    emitDocument,
    exportSaft,
    health,
    loading,
    error,
  };
}
