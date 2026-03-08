# Foundation Sprint - 7 Day Operational Order

**Status:** Active when approved by leadership
**Date:** 2026-03-08
**Scope:** Security isolation, state durability, observability baseline, critical test confidence
**Rule:** No parallel feature fronts outside foundation scope

## Objective

Move ChefIApp POS CORE from "advanced MVP" to "operationally reliable base" by resolving the three blocking foundations:

1. tenant isolation enforcement,
2. durable transactional state,
3. fiscal readiness path definition.

## Non-Negotiable Rules During Sprint

1. No new non-foundational feature work.
2. One active front per owner at a time.
3. Every task must map to issue + branch + PR.
4. Required CI must pass before closure.
5. No skipped closure steps (branch/worktree/issue cleanup is mandatory).

## Refactor Policy During Foundation Sprint

Refactor is allowed only when it directly reduces operational risk for `WS1`..`WS5`.

### Allowed Refactors (During Sprint)

- Persistence-path refactor required to remove state-loss risk in TenantKernel flows.
- PostgREST role/claims boundary refactor required to enforce tenant isolation.
- Fiscal adapter boundary refactor required to replace fake adapter path with real integration-ready interface.
- Critical test harness refactor required to unskip and stabilize P0/P1 tests.
- Small decoupling/refinement that unblocks evidence delivery for current workstream exit criteria.

### Prohibited Refactors (Until Sprint GO)

- broad aesthetic cleanup with no direct WS1..WS5 impact,
- mass renaming/reorganization by preference,
- layer reshuffling without measurable risk reduction,
- feature-driven refactor not tied to foundation exit criteria,
- large architecture rewrites without immediate operational proof output.

### Exception Rule

A prohibited refactor can proceed only if all are true:

1. linked to an active foundation issue,
2. explicit blocker evidence is documented in checkpoint,
3. owner marks gate impact as `RISK` or `NO-GO` if not executed,
4. approval is recorded in writing in issue + PR.

## Workstreams and Owners

- **WS1 Security/RLS:** PostgREST role model and tenant isolation proof.
- **WS2 State Durability:** TenantKernel persistence and crash/refresh resilience.
- **WS3 Test Confidence:** re-enable critical skipped tests and stabilize.
- **WS4 Observability:** runtime error and reliability signals visible.
- **WS5 Fiscal Track:** certified provider integration plan and legal readiness gate.

Set explicit owner names in kickoff.

## Activation (D0 Kickoff)

Run this block before Day 1 execution.

### D0 Checklist (Mandatory)

1. Confirm sprint window and freeze policy for non-foundational features.
2. Assign one owner per workstream (`WS1`..`WS5`).
3. Open one tracking issue per workstream with explicit deliverables.
4. Create branches/worktrees linked to those issues.
5. Publish baseline metrics snapshot (open `.skip`, current isolation test status, current crash-loss repro status).
6. Define daily checkpoint time and reporting owner.

### Owner Matrix (D0 Snapshot)

Update owner names in kickoff thread before Day 1 starts:

| Workstream           | Owner           | Issue  | Branch                                  | Worktree                               | ETA   |
| -------------------- | --------------- | ------ | --------------------------------------- | -------------------------------------- | ----- |
| WS1 Security/RLS     | `goldmonkey777` | `#99`  | `foundation/ws1-security-rls`           | `/private/tmp/chefiapp-foundation-ws1` | `D+2` |
| WS2 State Durability | `goldmonkey777` | `#100` | `foundation/ws2-state-durability`       | `/private/tmp/chefiapp-foundation-ws2` | `D+3` |
| WS3 Test Confidence  | `goldmonkey777` | `#101` | `foundation/ws3-test-confidence`        | `/private/tmp/chefiapp-foundation-ws3` | `D+4` |
| WS4 Observability    | `goldmonkey777` | `#102` | `foundation/ws4-observability-baseline` | `/private/tmp/chefiapp-foundation-ws4` | `D+5` |
| WS5 Fiscal Track     | `goldmonkey777` | `#103` | `foundation/ws5-fiscal-readiness`       | `/private/tmp/chefiapp-foundation-ws5` | `D+6` |

### Daily Checkpoint Format (15 min)

Each owner reports:

- done since last checkpoint,
- blockers,
- evidence links (PR/CI/log),
- next 24h plan,
- gate impact (`GO`, `RISK`, `NO-GO`).

Escalation rule: any `NO-GO` item blocks feature-expansion discussion until resolved or risk-accepted in writing.

## Day-by-Day Plan

### Day 1 - Isolation Baseline

- lock current architecture assumptions,
- define runtime role matrix (`anon`, `authenticated`, service roles),
- implement minimal role correction path in local/staging,
- write tenant A/B negative test cases.

**Exit criteria:** isolation test plan approved and executable.

### Day 2 - RLS Enforcement Proof

- apply PostgREST role config hardening,
- validate claims-to-role path,
- run cross-tenant read/write denial tests,
- produce evidence log and rollback notes.

**Exit criteria:** cross-tenant denial is proven in staging.

### Day 3 - Kernel Durability Wiring

- connect critical state transitions to durable persistence path,
- guarantee idempotent write path for order/session/payment critical states,
- run refresh/crash simulation scripts.

**Exit criteria:** no critical state loss in defined crash scenarios.

### Day 4 - Critical Test Recovery

- inventory `.skip` tests by criticality,
- re-enable P0/P1 critical tests first,
- fix failures with minimal scope patches,
- publish pre/post confidence matrix.

**Exit criteria:** critical test set enabled and green.

### Day 5 - Observability Baseline

- instrument runtime error capture (Sentry or equivalent),
- set key alerts for isolation/durability regressions,
- define dashboard for top operational signals,
- validate alert path with synthetic failure.

**Exit criteria:** one operational dashboard + validated alert route.

### Day 6 - Fiscal Readiness Track

- define target market compliance path (PT AT and/or BR SEFAZ),
- select certified provider candidates,
- produce integration decision memo (scope, cost, timeline, risks),
- define technical gates for fiscal cutover.

**Exit criteria:** approved fiscal execution plan with accountable owner.

### Day 7 - Hard Gate Review

- run full foundation checklist,
- classify unresolved risks,
- issue go/no-go recommendation for feature expansion unlock,
- publish closure report with evidence links.

**Exit criteria:** leadership decision documented.

## Evidence Required (Per Workstream)

- PR links and merge status,
- CI run links,
- test logs/screenshots where relevant,
- rollback notes for risky changes,
- updated docs indexes and runbook links.

## Go/No-Go Gate to Resume Features

Resume non-foundational feature development only if all are true:

1. tenant isolation proof is green,
2. critical durability flows are resilient,
3. critical tests are re-enabled and passing,
4. observability baseline is active,
5. fiscal track has approved execution plan.

If any item is missing: **NO-GO**.

## Command Checklist (Operational)

- list open PRs and active fronts,
- verify no unauthorized feature branch was opened,
- verify workspace cleanliness for active owners,
- verify worktree ownership metadata,
- verify issue/PR closure hygiene.

## Final Statement

This sprint is a sequencing correction, not a slowdown.
It protects product trust, legal viability, and future delivery velocity.
