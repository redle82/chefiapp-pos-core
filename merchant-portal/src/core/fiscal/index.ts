/**
 * core/fiscal — Barrel exports para módulos fiscais.
 *
 * Exporta todos os tipos e classes dos submódulos fiscais
 * para consumo por features e páginas do merchant-portal.
 */

// ---------------------------------------------------------------------------
// Tipos partilhados
// ---------------------------------------------------------------------------

export type {
  FiscalAddress,
  FiscalConfig,
  FiscalDocument,
  FiscalDocumentLine,
  FiscalDocumentStatus,
  SaftDocumentType,
  SequenceValidation,
  ValidationError,
  ValidationResult,
} from './types';

// ---------------------------------------------------------------------------
// Calculadora de impostos (IVA PT)
// ---------------------------------------------------------------------------

export { TaxCalculator } from './tax/TaxCalculator';
export type {
  OrderItem,
  SaftTaxTableEntry,
  TaxBreakdown,
  TaxRateCode,
  TaxRegion,
} from './tax/TaxCalculator';

// ---------------------------------------------------------------------------
// Cadeia de hashes criptográficos (AT)
// ---------------------------------------------------------------------------

export { FiscalHashChain } from './saft/HashChain';

// ---------------------------------------------------------------------------
// Numeração sequencial de documentos
// ---------------------------------------------------------------------------

export { DocumentNumbering } from './saft/DocumentNumbering';

// ---------------------------------------------------------------------------
// Gerador SAF-T PT v1.04_01
// ---------------------------------------------------------------------------

export { SaftPTGenerator } from './saft/SaftPTGenerator';
export type {
  SaftAddress,
  SaftCustomer,
  SaftDocument,
  SaftDocumentTotals,
  SaftExportData,
  SaftHeader,
  SaftInvoice,
  SaftInvoiceLine,
  SaftMasterFiles,
  SaftPayment,
  SaftProduct,
  SaftSourceDocuments,
  SaftTaxEntry,
} from './saft/SaftPTGenerator';

// ---------------------------------------------------------------------------
// Hook React
// ---------------------------------------------------------------------------

export { useFiscal } from './useFiscal';
export type {
  FiscalHealth,
  FiscalOrderInput,
  UseFiscalReturn,
} from './useFiscal';

// ---------------------------------------------------------------------------
// Serviços existentes (re-export para conveniência)
// ---------------------------------------------------------------------------

export { FiscalService, getFiscalService } from './FiscalService';
export { CoreFiscalEventStore } from './CoreFiscalEventStore';
export { FiscalQueue } from './FiscalQueueWorker';
export { exportSaftXml } from './SaftExportService';
export { atIntegrationService } from './ATIntegrationService';
