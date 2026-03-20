# ADR-004: Domain Invariants as Pure Functions

## Status

Accepted

## Context

Business rules were scattered across React components, hooks, and service
files. The same validation logic (e.g., "can this order transition to paid?")
was duplicated in multiple places with subtle differences. This made it
difficult to reason about correctness, write tests, or change rules without
hunting through UI code.

We needed a single source of truth for business rules that could be tested
in isolation, reused across surfaces, and reasoned about without React
knowledge.

## Decision

We extract all business invariants as **pure TypeScript functions** in
`domain/invariants/`, organized by bounded context:

- `OrderInvariants.ts` -- order lifecycle rules, valid transitions, totals
- `PaymentInvariants.ts` -- payment validation, split payment rules, refunds
- `StaffInvariants.ts` -- shift rules, break policies, role constraints
- `InventoryInvariants.ts` -- stock thresholds, waste limits, reorder points
- `ReservationInvariants.ts` -- booking validation, capacity checks, overlap

These functions:
- Take domain objects as input and return validation results
- Have no side effects (no API calls, no state mutation, no React)
- Are deterministic (same input always produces same output)
- Are exported through `domain/invariants/index.ts`

The `domain/` directory as a whole follows the same rule: no React imports,
no infrastructure imports. Only pure TypeScript.

## Consequences

**Positive:**
- Single source of truth for each business rule
- Trivially testable with unit tests (pure in, pure out)
- Reusable across all 6 surfaces without duplication
- Easy to review and audit business logic in one place
- Enforced by CI (`architecture-guardian.yml` checks import boundaries)

**Negative:**
- Requires discipline to keep domain layer pure (no React creep)
- Some rules that involve async I/O (e.g., checking stock against DB) live
  in `core/` services rather than `domain/`, which can be confusing
- Mapping between domain types and database types requires adapter code
- Initial extraction effort for rules already embedded in UI code
