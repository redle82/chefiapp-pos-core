/**
 * Domain Layer
 *
 * Regras de negócio puras — sem React, sem infraestrutura.
 * Cada subdomínio exporta tipos, cálculos e validações.
 */

export * as payment from "./payment";
export * as order from "./order";
export * as kitchen from "./kitchen";
export * as restaurant from "./restaurant";
export * as reports from "./reports";
