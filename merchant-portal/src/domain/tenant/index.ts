/**
 * Tenant Domain
 *
 * Tenant = restaurante (organização). Validações de identidade e localização
 * estão em domain/restaurant. Este módulo expõe o conceito de tenant para
 * regras puras e re-exporta o necessário de restaurant.
 */

export * from "./types";
export {
  validateIdentity,
  isIdentityComplete,
  validateLocation,
  isLocationComplete,
} from "../restaurant";
export type {
  IdentityFormData,
  LocationFormData,
  ValidationResult,
  ValidationError,
} from "../restaurant";
