/**
 * Gateway Config — Mapeamento país → payment gateway.
 *
 * ChefIApp expande por gateway, não por geografia.
 * Ref: docs/commercial/GATEWAY_DEPLOYMENT_MATRIX.md
 */

export type Gateway = "PIX" | "SUMUP" | "STRIPE";

export type ActiveCountryCode = "BR" | "ES" | "GB" | "US";

export const ACTIVE_GATEWAYS: Record<ActiveCountryCode, Gateway> = {
  BR: "PIX",
  ES: "SUMUP",
  GB: "SUMUP",
  US: "STRIPE",
};
