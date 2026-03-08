/**
 * Payment Infrastructure Layer
 *
 * Providers de pagamento plugáveis.
 * Exporta interface, registry e providers.
 */

export * from "./interface";
export * from "./registry";
export { manualProvider } from "./providers/manual";
export { mbwayProvider } from "./providers/mbway";
export { pixProvider } from "./providers/pix";
export { stripeProvider } from "./providers/stripe";
export { sumupProvider } from "./providers/sumup";
