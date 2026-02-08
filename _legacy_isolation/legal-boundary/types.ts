export type LegalEntityType = "ORDER" | "PAYMENT" | "SESSION";
export type LegalState = "PAYMENT_SEALED" | "ORDER_DECLARED" | "ORDER_FINAL";

export interface LegalSeal {
  seal_id: string;
  entity_type: LegalEntityType;
  entity_id: string;
  seal_event_id: string;
  stream_hash: string;
  sealed_at: Date;
  sequence: number;
  financial_state: string;
  legal_state: LegalState;
}
