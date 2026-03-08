# Monorepo P1 Execution Plan: Core Consolidation & SSOT Enforcement

**Date:** 2026-03-08
**Context:** Following the successful completion of the P0 sprint (Gateway Authority & Border Hardening), the architectural health score is 71/100. The objective of P1 is to raise this score by executing the "fix all" strategy for remaining structural improvements without excessive refactoring.

## Objectives

1. **Billing Core Consolidation:** Eliminate the ambiguous `billing-core` module by absorbing its contents into the canonical Single Source of Truth (`core-engine`).
2. **Strict SSOT Enforcement:** Harden `core-engine` by removing duplicated stubs and contracts scattered across the repo.
3. **Role Clarifications:** Formally define the architectural boundaries and runtime roles for `mobile-app` (AppStaff/BYOD) and `fiscal-modules`.

## Execution Roadmap (3 Days)

### Day 1: Legacy Billing Erasure (P1-A)

- **Task:** Absorb `billing-core` into `core-engine`.
- **Action:** Move `billing-core/types.ts` to `core-engine/src/billing/types.ts`.
- **Action:** Update all imports in `merchant-portal`, `server`, and tests to reference the new `core-engine` path.
- **Action:** Delete the `billing-core` directory altogether to eliminate legacy ambiguity.

### Day 2: Core Engine Hardening (P1-B)

- **Task:** Endorse `core-engine` as the exact Single Source of Truth (SSOT).
- **Action:** Audit the repo for duplicated interfaces (e.g., `Order`, `Terminal`, `Product`) residing in `merchant-portal` or `server` that should be imported from `core-engine`.
- **Action:** Refactor those redundant stubs to import directly from `core-engine`.

### Day 3: Surface Boundaries Clarification (P1-C)

- **Task:** Clarify the roles of `mobile-app` and `fiscal-modules`.
- **Action:** Create `mobile-app/ARCHITECTURE_ROLE.md` to cleanly delineate its role as a secondary "AppStaff/BYOD" surface, preventing feature overlap with `merchant-portal`.
- **Action:** Update `fiscal-modules` documentation to enforce a strict contract-driven isolation boundary.

## Acceptance Criteria

- `billing-core` directory no longer exists.
- `tsc -b` and `npm run test` pass successfully after the billing and core-engine imports are rewritten.
- Architectural Health score reflects mitigation of "Critical" risks associated with `billing-core`.
