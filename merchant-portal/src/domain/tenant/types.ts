/**
 * Tenant Domain Types
 *
 * No nosso domínio, Tenant = restaurante (organização).
 * Identidade e localização vivem em domain/restaurant.
 * Aqui apenas o conceito de "tenant" para uso em regras puras.
 */

/** ID do tenant (restaurant_id) */
export type TenantId = string;
