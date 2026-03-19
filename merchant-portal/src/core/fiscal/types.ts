/**
 * Tipos de configuração fiscal — core/fiscal/types.ts
 *
 * Tipos partilhados entre todos os módulos fiscais (SAF-T PT, TicketBAI, etc.).
 * Nunca importar de fiscal-modules/ aqui — este ficheiro é a fonte canónica
 * dentro do merchant-portal.
 */

// ---------------------------------------------------------------------------
// Endereço fiscal
// ---------------------------------------------------------------------------

export interface FiscalAddress {
  streetName: string;
  buildingNumber?: string;
  city: string;
  postalCode: string;
  region?: string;
  country: string; // ISO 3166-1 alpha-2 (PT, ES, BR)
}

// ---------------------------------------------------------------------------
// Configuração fiscal do restaurante
// ---------------------------------------------------------------------------

export interface FiscalConfig {
  /** País de jurisdição fiscal */
  country: 'PT' | 'BR' | 'ES';

  /** NIF (PT), CNPJ (BR), NIF (ES) */
  taxId: string;

  /** Razão social / Nome da empresa */
  companyName: string;

  /** Morada fiscal */
  address: FiscalAddress;

  /** Número de certificação AT do software (Portaria 363/2010) */
  softwareCertNumber?: string;

  /** Região fiscal portuguesa (continente, Açores, Madeira) */
  region?: 'PT' | 'AZ' | 'MA';

  /** Identificador da série de documentos */
  series: string;

  /** Feature flag — desativar emissão fiscal */
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Documento fiscal emitido
// ---------------------------------------------------------------------------

/** Tipos de documento fiscal SAF-T PT */
export type SaftDocumentType = 'FT' | 'FR' | 'NC' | 'FS';

/** Estado do documento fiscal */
export type FiscalDocumentStatus =
  | 'DRAFT'
  | 'EMITTED'
  | 'CANCELLED'
  | 'ANNULLED';

export interface FiscalDocumentLine {
  lineNumber: number;
  productCode: string;
  productDescription: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number; // sem IVA, 2 casas decimais
  taxRate: number; // ex.: 0.23
  taxRateCode: string; // 'NOR', 'INT', 'RED', 'ISE'
  creditAmount?: number; // para notas de crédito
  debitAmount?: number; // para faturas
  taxExemptionReason?: string; // obrigatório quando ISE
  taxExemptionCode?: string; // código M (M01-M99)
}

export interface FiscalDocument {
  /** Tipo de documento (FT, FR, NC, FS) */
  documentType: SaftDocumentType;

  /** Número sequencial do documento — ex.: "FT A/1" */
  documentNumber: string;

  /** Série do documento */
  series: string;

  /** Número sequencial dentro da série */
  sequentialNumber: number;

  /** Data de emissão (YYYY-MM-DD) */
  invoiceDate: string;

  /** Data e hora de criação no sistema (YYYY-MM-DDTHH:MM:SS) */
  systemEntryDate: string;

  /** NIF do cliente (consumidor final = 999999990) */
  customerTaxId: string;

  /** Linhas do documento */
  lines: FiscalDocumentLine[];

  /** Total bruto (com IVA) */
  grossTotal: number;

  /** Total líquido (sem IVA) */
  netTotal: number;

  /** Total de imposto */
  taxPayable: number;

  /** Hash da cadeia criptográfica (AT) */
  hash: string;

  /** 4 primeiros caracteres do hash (impresso no documento) */
  hashControl: string;

  /** ATCUD — código único de documento AT */
  atcud: string;

  /** Estado do documento */
  status: FiscalDocumentStatus;

  /** Motivo de anulação (quando aplicável) */
  statusReason?: string;

  /** ID do pedido no POS */
  sourceOrderId?: string;

  /** Método de pagamento */
  paymentMechanism?: 'CC' | 'CD' | 'CH' | 'CO' | 'CS' | 'DE' | 'LC' | 'MB' | 'NU' | 'OU' | 'PR' | 'TB' | 'TR';
}

// ---------------------------------------------------------------------------
// Resultado de validação
// ---------------------------------------------------------------------------

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ---------------------------------------------------------------------------
// Verificação de sequência de numeração
// ---------------------------------------------------------------------------

export interface SequenceValidation {
  series: string;
  documentType: string;
  lastNumber: number;
  totalDocuments: number;
  gaps: number[];
  isValid: boolean;
}
