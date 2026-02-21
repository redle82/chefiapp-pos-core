/**
 * Tipos para Entidades Legais — quem fatura, quem responde juridicamente, documentos oficiais.
 * Ref: Entidades Legais — fiscal, jurídico, administrativo. Sem métricas, sem operação.
 */
// @ts-nocheck


export type LegalEntityType = "person" | "company";

export interface LegalEntity {
  id: string;
  type: LegalEntityType;
  legalName: string;
  taxId: string; // NIF / CIF / VAT ID
  fiscalCountry: string;
  fiscalAddress: string;
  createdAt: string;
  updatedAt: string;
}

/** Uso da entidade: faturação, recibos, relatórios fiscais. */
export interface LegalEntityUsage {
  useForBilling: boolean;
  useForReceipts: boolean;
  useForFiscalReports: boolean;
}

/** Associação Ubicación → Entidade legal (Fase 1: 1 entidade; Fase 2: múltiplas). */
export interface LocationEntityAssignment {
  locationId: string;
  entityId: string;
}

/** Dados fiscais adicionais: texto rodapé, referência legal, notas internas. */
export interface LegalFiscalExtras {
  defaultFiscalFooter: string;
  legalReference: string; // ex: Registro mercantil
  internalNotes: string; // não aparece no recibo
}
