/**
 * Schema Validation Layer
 *
 * Schemas Zod para validação de payloads em fronteiras.
 * Usar em: API responses, form submissions, external data.
 */

export * as paymentSchemas from "./payment";
export * as orderSchemas from "./order";
export * as restaurantSchemas from "./restaurant";

/**
 * Helper para validar e tipar dados.
 *
 * @example
 * const result = safeParse(PaymentIntentResultSchema, apiResponse);
 * if (result.success) {
 *   // result.data é tipado como PaymentIntentResult
 * } else {
 *   console.error(result.error);
 * }
 */
export { z } from "zod";
