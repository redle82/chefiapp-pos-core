/**
 * Application Layer
 *
 * Facade that separates use cases from UI components.
 *
 * UI components (TPVPOSView, FiscalReceipt, etc.) call this layer
 * instead of importing services directly. Each use case function follows
 * the same pattern:
 *
 *   1. Validate domain invariants (pure, synchronous guards)
 *   2. Execute business logic via infrastructure services
 *   3. Emit domain events for audit trails
 *   4. Collect metrics / analytics
 *   5. Return a typed Result<T>
 *
 * Rules:
 *   - Use case modules contain NO React imports (pure TypeScript).
 *   - React hooks live in `application/hooks/` as thin wrappers.
 *   - Use cases never throw; they return `{ success, data?, error? }`.
 *   - Domain events are emitted after successful mutations, never before.
 *
 * Bounded Contexts:
 *   - OrderUseCases       — Order lifecycle, item mutations, discounts
 *   - PaymentUseCases     — Payment processing, refunds, split bill, reconciliation
 *   - StaffUseCases       — Clock in/out, breaks
 *   - InventoryUseCases   — Waste recording, stock transfers
 *   - ReservationUseCases — Reservations, cancellations, no-shows, waitlist
 */

export * as OrderUseCases from "./OrderUseCases";
export * as PaymentUseCases from "./PaymentUseCases";
export * as StaffUseCases from "./StaffUseCases";
export * as InventoryUseCases from "./InventoryUseCases";
export * as ReservationUseCases from "./ReservationUseCases";
