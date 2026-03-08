/**
 * Onboarding Feature Module
 *
 * Fluxo de configuração inicial do restaurante.
 * Componentes em pages/Onboarding/ (migração gradual).
 * Lógica de domínio em domain/restaurant/.
 */

export { validateIdentity, isIdentityComplete } from "@domain/restaurant";
export { validateLocation, isLocationComplete } from "@domain/restaurant";
