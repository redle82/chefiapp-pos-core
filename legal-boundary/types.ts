/**
 * Legal Boundary Types (Stub)
 *
 * Minimal type definitions for the legal-boundary domain.
 * Used by fiscal-modules to describe legally sealed events.
 */

export interface LegalSeal {
  seal_id: string;
  event_id: string;
  tenant_id: string;
  seal_type: string;
  sealed_at: string; // ISO 8601
  hash: string;
  payload: Record<string, unknown>;
}

export interface LegalBoundaryConfig {
  country: string;
  fiscalProvider?: string;
  enabled: boolean;
}
