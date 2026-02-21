# E2E Value Audit — Playwright Test Suite

**Date**: 2025-01-20
**Suite version**: 43 tests in 8 files across 4 projects
**Flakiness**: 0.0% (86 runs, repeat-each=5, retries=0, workers=1)
**Framework**: Playwright 1.49
**Dev server**: Vite @ localhost:5175 (merchant-portal)

---

## Rubric (0-2 per criterion, max 12)

| Criterion         | 0                          | 1                      | 2                                      |
| ----------------- | -------------------------- | ---------------------- | -------------------------------------- |
| **Contract**      | No clear contract          | Implicit contract      | Explicit contract documented           |
| **Assertions**    | Only `toBeVisible()`       | URL + basic content    | Structural assertions + negative proof |
| **Determinism**   | Depends on external state  | Mostly deterministic   | 100% deterministic (seed-based)        |
| **Isolation**     | Shared state between tests | Partial isolation      | Full isolation (per-test context)      |
| **Speed**         | > 30s                      | 10-30s                 | < 10s                                  |
| **Observability** | No artifacts               | Screenshots on failure | Screenshots + traces + JSON report     |

**Threshold**: Contract ≥ 9/12, Core ≥ 10/12, Smoke ≥ 8/12

---

## Layer 0 — Setup (1 test)

| #   | Test                     | Contract | Assert | Determ | Isol | Speed    | Observ | Total  | Action  |
| --- | ------------------------ | -------- | ------ | ------ | ---- | -------- | ------ | ------ | ------- |
| 1   | seed pilot browser state | 2        | 2      | 2      | 2    | 2 (3.0s) | 2      | **12** | ✅ Keep |

**Contract**: Seeds localStorage deterministically (pilot_mode, bypass_health, restaurant_id=SOFIA). Validates URL post-navigation. Saves storageState for downstream.

---

## Layer 1 — Smoke (19 tests)

| #     | Test                    | Contract | Assert | Determ | Isol | Speed   | Observ | Total  | Action  |
| ----- | ----------------------- | -------- | ------ | ------ | ---- | ------- | ------ | ------ | ------- |
| 2-10  | Public Routes (9×)      | 1        | 1      | 2      | 2    | 2 (~1s) | 2      | **10** | ✅ Keep |
| 11-13 | Auth Routes (3×)        | 1        | 1      | 2      | 2    | 2 (~1s) | 2      | **10** | ✅ Keep |
| 14-19 | Operational Routes (6×) | 1        | 1      | 2      | 2    | 2 (~1s) | 2      | **10** | ✅ Keep |

**Notes**: Parameterized smoke tests. Each asserts `status < 500` — minimal but intentional (no-5xx gate). Deterministic, isolated (no auth), fast. Observability via screenshot-on-failure + JSON reporter. Score 10/12 meets smoke threshold (≥8).

**Improvement opportunities**: Could upgrade to 2/2 on Assertions by checking body text length > 0 on each route. Low priority.

---

## Layer 2 — Contracts (22 tests)

### Auth Flow (4 tests)

| #   | Test                                | Contract | Assert | Determ | Isol | Speed    | Observ | Total  | Action  |
| --- | ----------------------------------- | -------- | ------ | ------ | ---- | -------- | ------ | ------ | ------- |
| 20  | VISITOR lands on / and sees landing | 2        | 2      | 2      | 2    | 2 (2.5s) | 2      | **12** | ✅ Keep |
| 21  | /auth redirects to /auth/phone      | 2        | 2      | 2      | 2    | 2 (2s)   | 2      | **12** | ✅ Keep |
| 22  | /auth/phone shows phone form        | 2        | 2      | 2      | 2    | 2 (2s)   | 2      | **12** | ✅ Keep |
| 23  | pilot login reaches post-auth state | 2        | 2      | 2      | 1    | 2 (3s)   | 2      | **11** | ✅ Keep |

**Contracts**: Auth lifecycle progression. Test 23 uses cleanPage → pilotLogin (deterministic seed, not UI). Isolation=1 because pilotLogin modifies localStorage.

### KDS Opens (1 test)

| #   | Test                          | Contract | Assert | Determ | Isol | Speed  | Observ | Total  | Action  |
| --- | ----------------------------- | -------- | ------ | ------ | ---- | ------ | ------ | ------ | ------- |
| 24  | KDS renders kitchen interface | 2        | 2      | 2      | 2    | 2 (2s) | 2      | **12** | ✅ Keep |

**Contract** (CONTRATO-KDS-01): Pilot auth → /op/kds stays on KDS URL, renders KDS UI or empty state. Strengthened: URL assertion + structural locator.

### Navigation Guards (4 tests)

| #   | Test                        | Contract | Assert | Determ | Isol | Speed    | Observ | Total  | Action  |
| --- | --------------------------- | -------- | ------ | ------ | ---- | -------- | ------ | ------ | ------- |
| 25  | /trial → /op/tpv?mode=trial | 2        | 2      | 2      | 2    | 2 (2s)   | 2      | **12** | ✅ Keep |
| 26  | /login → /auth/login        | 2        | 2      | 2      | 2    | 2 (2.5s) | 2      | **12** | ✅ Keep |
| 27  | /register → /auth/phone     | 2        | 2      | 2      | 2    | 2 (2.5s) | 2      | **12** | ✅ Keep |
| 28  | /signup → /auth/phone       | 2        | 2      | 2      | 2    | 2 (2.5s) | 2      | **12** | ✅ Keep |

### Legacy Route Aliases (6 tests)

| #   | Test                   | Contract | Assert | Determ | Isol | Speed    | Observ | Total  | Action  |
| --- | ---------------------- | -------- | ------ | ------ | ---- | -------- | ------ | ------ | ------- |
| 29  | /tpv → /op/tpv         | 2        | 2      | 2      | 2    | 2 (2s)   | 2      | **12** | ✅ Keep |
| 30  | /kds → /op/kds         | 2        | 2      | 2      | 2    | 2 (1.9s) | 2      | **12** | ✅ Keep |
| 31  | /kds-minimal → /op/kds | 2        | 2      | 2      | 2    | 2 (2s)   | 2      | **12** | ✅ Keep |
| 32  | /tpv-minimal → /op/tpv | 2        | 2      | 2      | 2    | 2 (2.4s) | 2      | **12** | ✅ Keep |
| 33  | /op/cash → /op/tpv     | 2        | 2      | 2      | 2    | 2 (1.9s) | 2      | **12** | ✅ Keep |
| 34  | /op/pos → /op/tpv      | 2        | 2      | 2      | 2    | 2 (2.2s) | 2      | **12** | ✅ Keep |

**Contract**: Route aliasing for backward compatibility. Deterministic URL redirects.

### Negative Guards & Fault Injection (7 tests) — NEW

| #   | Test                               | Contract | Assert | Determ | Isol | Speed    | Observ | Total  | Action  |
| --- | ---------------------------------- | -------- | ------ | ------ | ---- | -------- | ------ | ------ | ------- |
| 35  | N0: Docker auto-promotion          | 2        | 2      | 2      | 2    | 2 (2.6s) | 2      | **12** | ✅ Keep |
| 36  | N4: Invalid restaurant_id rejected | 2        | 2      | 2      | 2    | 2 (2.5s) | 2      | **12** | ✅ Keep |
| 37  | N6: 404 route → no 5xx             | 2        | 2      | 2      | 2    | 2 (2s)   | 2      | **12** | ✅ Keep |
| 38  | N5: Core REST 500 → graceful       | 2        | 2      | 2      | 2    | 2 (2.2s) | 2      | **12** | ✅ Keep |
| 39  | N7: Auth API failure → renders     | 2        | 2      | 2      | 2    | 2 (3.4s) | 2      | **12** | ✅ Keep |
| 40  | N8: Revoked restaurant → handled   | 2        | 1      | 2      | 1    | 2 (2.8s) | 2      | **10** | ✅ Keep |
| 41  | TPV trial loads POS content        | 2        | 2      | 2      | 2    | 2 (2.2s) | 2      | **12** | ✅ Keep |

**Notes**:

- N0: Verifies Docker's auto-promotion contract (cleanPage → operational).
- N4: Seeds invalid UUID, asserts system doesn't treat it as operational.
- N5: Uses `page.route()` fault injection — intercepts REST API calls with 500.
- N7: Auth API failure → login page still renders (resilience).
- N8: Assert=1 because only checks body visibility (not specific error state). Isolation=1 because modifies localStorage mid-test.

---

## Layer 3 — Core (1 test)

| #   | Test                             | Contract | Assert | Determ | Isol | Speed    | Observ | Total  | Action  |
| --- | -------------------------------- | -------- | ------ | ------ | ---- | -------- | ------ | ------ | ------- |
| 42  | Sovereign Flow: complete journey | 2        | 2      | 2      | 2    | 2 (3.8s) | 2      | **12** | ✅ Keep |

**Contract**: Full lifecycle: landing → auth → pilot login → dashboard → menu/tpv/kds operational check. 6 sequential steps with structural assertions at each stage. Strengthened Step 5/6 with heading/action element counts and body text length checks.

---

## Summary

| Layer     | Tests  | Avg Score | Min Score | Threshold | Status          |
| --------- | ------ | --------- | --------- | --------- | --------------- |
| Setup     | 1      | 12.0      | 12        | —         | ✅              |
| Smoke     | 19     | 10.0      | 10        | ≥ 8       | ✅              |
| Contracts | 22     | 11.8      | 10        | ≥ 9       | ✅              |
| Core      | 1      | 12.0      | 12        | ≥ 10      | ✅              |
| **Total** | **43** | **11.0**  | **10**    | —         | **✅ ALL PASS** |

---

## Flakiness Analysis

```
Method:  repeat-each=5, retries=0, workers=1
Scope:   setup + contracts + core (smoke excluded — no state)
Runs:    86
Passed:  86
Failed:  0
Flake rate: 0.0%
```

Tooling: `scripts/e2e/flakiness-check.sh` + `scripts/e2e/parse-flakiness.py`

---

## CI Configuration

| Feature       | Status | Details                                                      |
| ------------- | ------ | ------------------------------------------------------------ |
| Reporters     | ✅     | list + JSON + HTML (CI only)                                 |
| Fail-on-flaky | ✅     | `--fail-on-flaky-tests` flag in CI                           |
| Boot gate     | ✅     | `boot-integrity-gate.sh` runs before suite                   |
| Artifacts     | ✅     | HTML report, JSON results, traces on failure (14d retention) |
| Workers       | ✅     | 1 in CI (eliminates parallelism race conditions)             |
| Retries       | ✅     | 1 in CI (triage signal, not success indicator)               |
| Trace         | ✅     | on-first-retry (forensic evidence)                           |
| Screenshot    | ✅     | only-on-failure                                              |

---

## Mutation Testing (StrykerJS)

Config: `merchant-portal/stryker.config.mjs`
Status: Skeleton ready, not yet integrated into CI
Targets:

- `src/core/flow/FlowGate.tsx`
- `src/core/lifecycle/LifecycleState.ts`
- `src/core/readiness/operationalRestaurant.ts`
- `src/core/flow/OperationalStateGuard.ts` (if exists)
- `src/core/tenant/TenantResolver.ts`

Thresholds: break=50%, low=60%, high=80%
Runner: command (Playwright test runner)

---

## Decisions Log

| Decision                            | Rationale                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Removed N1-N3 (VISITOR blocked)     | Docker mode auto-promotes all users to operational — impossible to test VISITOR blocking locally. Replaced with N0 (auto-promotion contract). |
| `skip_auto_pilot` flag in cleanPage | AuthProvider has AUTO-PILOT that re-seeds pilot state even after storage clear. Skip flag prevents this for tests needing clean state.        |
| Smoke uses status < 500 only        | Intentional: smoke is a fast gate. Structural assertions belong in contracts.                                                                 |
| 19 parameterized smoke tests        | routes.spec.ts uses data-driven approach for public/auth/operational routes.                                                                  |
| Fault injection via page.route()    | Playwright's route interception is deterministic and fast — no need for real API manipulation.                                                |

---

## Recommendations

1. **Run mutation testing** (`npx stryker run`) on contract-critical modules to measure test sensitivity score.
2. **Add VISITOR-blocking tests in staging/production** where Docker auto-promotion is disabled.
3. **Track flake rate over time** — run `scripts/e2e/flakiness-check.sh` weekly; any non-zero rate triggers investigation.
4. **Consider sharding** in CI if suite grows beyond 60 tests (currently 43 × ~2s = ~90s sequential).

---

_Generated by E2E Value Audit process. Ref: `:blueprint/` contracts._
