/**
 * Cierres temporales — modelo de dados.
 * Preparado para integração futura com reservas, TPV, QR, delivery e auditoria.
 */
// @ts-nocheck


export type CierreType =
  | "TOTAL"
  | "PARCIAL"
  | "OPERACIONAL"
  | "TECNICO"
  | "EMERGENCIA";

export type CierreStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED";

export interface CierreScope {
  reservations: boolean;
  pos: boolean;
  delivery: boolean;
  qr: boolean;
}

export interface CierreTemporal {
  id: string;
  type: CierreType;
  scope: CierreScope;
  startAt: string;
  endAt: string;
  locationId: string;
  reason?: string;
  createdBy?: string;
  status: CierreStatus;
  notifyClients?: boolean;
}

export const CIERRE_TYPE_LABELS: Record<CierreType, string> = {
  TOTAL: "Total",
  PARCIAL: "Parcial",
  OPERACIONAL: "Operacional",
  TECNICO: "Técnico",
  EMERGENCIA: "Emergência",
};

export const CIERRE_STATUS_LABELS: Record<CierreStatus, string> = {
  ACTIVE: "Ativo",
  SCHEDULED: "Programado",
  EXPIRED: "Expirado",
};
