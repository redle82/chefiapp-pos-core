/**
 * Domain Layer
 *
 * Regras de negócio puras — sem React, sem infraestrutura.
 * Cada subdomínio exporta tipos, cálculos e validações.
 *
 * ── Bounded Contexts ──
 *
 * Order Management     — order lifecycle, status transitions, modifications
 * Payment Processing   — payment creation, refunds, tips, reconciliation
 * Kitchen Operations   — prep time, ticket routing
 * Staff & Attendance   — shifts, clock in/out, breaks, scheduling
 * Inventory & Stock    — waste recording, stock transfers
 * Reservations         — table bookings, no-shows
 * Restaurant Identity  — location, branding, configuration
 * Tenant               — multi-tenant isolation (restaurant = tenant)
 * Reports              — sales aggregation, analytics
 * Menu                 — menu structure, validation
 *
 * ── Invariants ──
 *
 * Pure guard functions that encode business rules.
 * Each returns { allowed: boolean, reason?: string }.
 *
 * ── Domain Events ──
 *
 * Immutable, append-only events for audit trails.
 * Emitted after mutations succeed; never drive control flow.
 */

export * as payment from "./payment";
export * as order from "./order";
export * as kitchen from "./kitchen";
export * as restaurant from "./restaurant";
export * as reports from "./reports";
export * as shift from "./shift";
export * as tenant from "./tenant";
export * as invariants from "./invariants";
export * as events from "./events";
