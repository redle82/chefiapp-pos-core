# TypeScript errors — classification and baseline

**Baseline:** See `scripts/baseline-ts-errors.txt`. CI gate: `scripts/ci/ts-error-gate.sh` (fails if count exceeds baseline).

**Current baseline:** 0 (as of hardening sprint). Do not increase without explicit update of the baseline file and justification in PR.

---

## Priority categories

When classifying new TS errors, use:

- **P0 (fix first):** ARIA invalid, broken typing that causes runtime risk, incorrect props that break components, critical accessibility.
- **P1 (fix to approach < 300):** Other type safety issues, redundant types, non-critical a11y.
- **Ignore for count reduction:** Cosmetic CSS-related typing, style-only types.

Only P0 and P1 are targeted for resolution. The gate blocks *increase* in total count; reduction is done by fixing P0 then P1.

---

## How to update the baseline

1. Run `bash scripts/ci/ts-error-gate.sh` locally.
2. If intentionally raising the cap: edit `scripts/baseline-ts-errors.txt` with the new integer, commit with a short justification (e.g. "baseline: N — temporary while migrating X").
