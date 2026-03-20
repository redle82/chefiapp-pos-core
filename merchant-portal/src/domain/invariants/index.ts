/**
 * Domain Invariants
 *
 * Re-exports all invariant modules for convenient access.
 * Each module contains pure guard functions that return { allowed, reason? }.
 */

export * from "./OrderInvariants";
export * from "./PaymentInvariants";
export * from "./StaffInvariants";
export * from "./InventoryInvariants";
export * from "./ReservationInvariants";
