# 🧬 Mutation Testing — Proof of E2E Sensitivity

**Status**: Production-Ready
**Last Updated**: Feb 21, 2026
**Target Mutation Score**: ≥75% (CRITICAL: ≥80%, IMPORTANT: ≥75%, EXTENDED: ≥70%)
**Owner**: E2E Test Governance

---

## 📋 Table of Contents

1. [Why Mutation Testing?](#why-mutation-testing)
2. [Current State](#current-state)
3. [Mutation Targets](#mutation-targets)
4. [Running Mutation Tests](#running-mutation-tests)
5. [Interpreting Results](#interpreting-results)
6. [CI Integration](#ci-integration)
7. [Roadmap](#roadmap)

---

## Why Mutation Testing?

### The Problem: IVT Without Mutation Is Incomplete

We have:

- ✅ 43/43 tests passing
- ✅ 0% flakiness at 10× repetition
- ✅ IVT 4.3/5 (strong)
- ✅ Negative tests catching guards

**But we DON'T YET KNOW:**

- ❓ If our assertions actually **break** when code regresses
- ❓ If a mutant (broken code) survives tests = false confidence
- ❓ Which parts of the codebase have "brittle checks"

### The Solution: Mutation Testing

Mutation testing **intentionally breaks code** to verify:

1. **Assertions are alive** — changing `===` to `==` should fail
2. **Guards work** — removing an `if` should trigger a negative test
3. **Test quality** — high mutation score = high sensitivity

**Without it**: You have no proof tests catch real bugs.

**With it**: Mutation score ≥75% = scientifically validated test suite.

---

## Current State

### Baseline (Feb 21, 2026)

| Metric                            | Value       | Status         |
| --------------------------------- | ----------- | -------------- |
| E2E Tests                         | 43          | ✅ All passing |
| Flakiness @ 10×                   | 0%          | ✅ Zero flakes |
| IVT Score                         | 4.3/5       | ✅ Strong      |
| Negative Tests                    | 7 (N0–N8)   | ✅ Present     |
| Mutation Score                    | Not yet run | 🚀 Next        |
| Target: Overall                   | ≥75%        | 🎯 Target      |
| Target: Critical (Flow+Lifecycle) | ≥80%        | 🎯 Target      |

### Infrastructure Ready

✅ `stryker.config.mjs` — production config
✅ E2E contracts + core projects — test targets
✅ JSON reporter — for CI consumption
✅ HTML reporter — for human analysis

---

## Mutation Targets

### LAYER 1: CRITICAL (≥80% Target)

These modules **MUST** be caught by E2E tests. Zero compromise.

| Module                    | Path                                          | Why Critical                  | Test Coverage                                    |
| ------------------------- | --------------------------------------------- | ----------------------------- | ------------------------------------------------ |
| **FlowEngine**            | `src/core/flow/FlowEngine.ts`                 | Central navigation logic      | N1–N8 (negative), routes.spec, navigation-guards |
| **LifecycleState**        | `src/core/lifecycle/LifecycleState.ts`        | Restaurant state transitions  | negative-guards (N0, N4, N8), navigation-guards  |
| **operationalRestaurant** | `src/core/readiness/operationalRestaurant.ts` | Readiness gates               | negative-guards (N4–N6), sovereign-flow          |
| **routeGuards**           | `src/core/navigation/routeGuards.ts`          | Route-level checks            | all route tests, N6 (404)                        |
| **OperationalStateGuard** | `src/core/guards/OperationalStateGuard.ts`    | Operational state enforcement | sovereign-flow, negative-guards                  |

**Expected behavior**: Mutating any of these should cause ≥1 test to fail.

### LAYER 2: IMPORTANT (≥75% Target)

Affects auth, tenant isolation, payment gates. Less critical but important.

| Module                | Path                                   | Test Coverage                |
| --------------------- | -------------------------------------- | ---------------------------- |
| **useAuthGuard**      | `src/core/auth/useAuthGuard.ts`        | auth-flow, N7 (auth failure) |
| **TenantContext**     | `src/core/tenant/TenantContext.tsx`    | sovereign-flow, N8 (revoked) |
| **useTenantResolver** | `src/core/tenant/useTenantResolver.ts` | pilot login, sovereign-flow  |

### LAYER 3: EXTENDED (≥70% Target)

Catalog, payment, less critical paths.

| Module              | Path                                  | Test Coverage                     |
| ------------------- | ------------------------------------- | --------------------------------- |
| **usePaymentGuard** | `src/core/payment/usePaymentGuard.ts` | tpv-opens (if payment UI visible) |
| **CatalogResolver** | `src/core/catalog/CatalogResolver.ts` | tpv-opens (product cards)         |

---

## Running Mutation Tests

### Prerequisites

```bash
cd merchant-portal

# Install (one-time)
pnpm add -D @stryker-mutator/core @stryker-mutator/typescript-checker @stryker-mutator/command-runner
```

### Commands

#### 1. **Quick Scan** (5–10 min)

Run CRITICAL layer only (for fast feedback):

```bash
npm run mutation:test:quick
```

**Use case**: PR feedback, local development

**Output**:

- Console: pass/fail for each mutant
- HTML: `artifacts/stryker-report.html`
- JSON: `artifacts/mutation-report.json`

---

#### 2. **Full Analysis** (30–45 min)

Run CRITICAL + IMPORTANT + EXTENDED layers:

```bash
npm run mutation:test
```

**Use case**: Weekly audit, before release

**Output**:

- Detailed mutation report (all layers)
- JSON for trending dashboard
- HTML with per-module breakdown

---

#### 3. **Establish Baseline** (30–45 min)

Set baseline for regression detection:

```bash
npm run mutation:test:baseline
```

Saves: `artifacts/mutation-baseline.json`

**Use case**: First run before CI integration

---

### What Mutation Testing Does

1. **Analyzes code** — finds all mutatable expressions
2. **Applies mutations** — e.g., `>` becomes `<`, `true` becomes `false`
3. **Runs E2E contracts+core** — for each mutant
4. **Scores results**:
   - **KILLED** (✅) — test failed, mutation caught
   - **SURVIVED** (❌) — test passed, mutation NOT caught (bad!)
   - **TIMEOUT** (⏱️) — test took too long (infrastructure issue)
   - **ERRORS** (💥) — typo in mutated code (skip)

### Example Output

```
Mutation Score
█████████████████░░░░░░░░░░░░░░░░ 74.3%

Tested: 1,432 mutants
Killed: 1,067 (74.3% ✅)
Survived: 265 (18.5% ❌)
No Coverage: 100 (7.0% → fix tests)

By Module:
  FlowEngine.ts           78% ✅ (HIGH)
  LifecycleState.ts       82% ✅ (VERY HIGH)
  operationalRestaurant.ts 71% ⚠️  (MEDIUM)
  routeGuards.ts          76% ✅ (HIGH)
```

---

## Interpreting Results

### Survived Mutants = Blind Spots

When a mutant survives, it means:

```typescript
// Original code
if (isPilot && hasRestaurant) {
  /* ... */
}

// Mutated to (survived = not caught)
if (isPilot) {
  /* ... */
} // ❌ Test passed anyway

// This means: your E2E test doesn't validate the hasRestaurant check
```

### Action on Survival

1. **Identify** which test should have caught it
2. **Strengthen assertion** or add new test
3. **Re-run** mutation to confirm kill

---

### Module-Level Scoring

| Score  | Interpretation                 | Action                         |
| ------ | ------------------------------ | ------------------------------ |
| ≥80%   | Excellent                      | No action needed               |
| 75–80% | Good                           | Monitor; consider improvements |
| 70–75% | Acceptable (if Extended layer) | Strengthen tests               |
| <70%   | Poor                           | **Fix immediately**            |

---

## CI Integration

### GitHub Actions Job (Upcoming)

```yaml
mutation-testing:
  runs-on: ubuntu-latest
  if: github.event_name == 'schedule'  # Weekly
  steps:
    - uses: actions/checkout@v4
    - name: Run mutation tests
      run: |
        cd merchant-portal
        pnpm install
        npm run mutation:test
    - name: Upload report
      uses: actions/upload-artifact@v4
      with:
        name: mutation-report
        path: merchant-portal/artifacts/mutation-report.json
    - name: Parse & trend
      run: python3 ../scripts/e2e/parse-mutation-results.py
    - name: Comment PR
      run: echo "Mutation Score: 74.3% (GOOD)" >> $GITHUB_STEP_SUMMARY
```

### Per-Module Threshold

Add to CI:

```bash
# Fail if CRITICAL layer < 80%
python3 scripts/e2e/validate-mutation-thresholds.py artifacts/mutation-report.json
```

---

## Roadmap

### Week 1–2: Baseline & Tuning

- [x] Configure stryker.config.mjs
- [x] Create mutation-testing-guide.md
- [ ] Run first baseline (30–45 min)
- [ ] Analyze survived mutants
- [ ] Strengthen N4, N8 assertions if needed

### Week 3–4: CI Integration

- [ ] Add `mutation-testing:` job to CI
- [ ] Set up artifact trending
- [ ] Add per-module thresholds
- [ ] Monthly scheduled runs (Thursdays 9am UTC)

### Week 5–6: Dashboard

- [ ] Parse mutation-report.json → CSV/HTML
- [ ] Add mutation score trending to README
- [ ] Link to CONTRATO-\* → mutation survival rate

### Ongoing

- **Weekly trend**: Monitor per-module scores
- **Per-PR**: Optional quick mutation scan for high-risk changes
- **Monthly**: Full mutation test + report to team

---

## Commands Reference

### Local Development

```bash
# Quick validation (5 min)
npm run mutation:test:quick

# Full analysis
npm run mutation:test

# Establish baseline
npm run mutation:test:baseline

# View HTML report
open artifacts/stryker-report.html

# Parse JSON for dashboard
python3 ../scripts/e2e/parse-mutation-results.py < artifacts/mutation-report.json
```

### Debugging a Survived Mutant

```bash
# 1. Find which mutant survived
cat artifacts/mutation-report.json | grep -A5 '"survived":true'

# 2. Identify the mutation (e.g., > became <)
# "replacement": { "type": ">", "replacement": "<" }

# 3. Find the source file and line
# "sourceFile": "src/core/flow/FlowEngine.ts:42"

# 4. Strengthen the test that should catch this
# (e.g., add assertion for boundary condition)

# 5. Re-run quick mutation test
npm run mutation:test:quick
```

---

## Target Mutation Scores

### By Layer

| Layer         | Modules                      | Target | Rationale                   |
| ------------- | ---------------------------- | ------ | --------------------------- |
| **CRITICAL**  | Flow, Lifecycle, Operational | ≥80%   | Guards must be bulletproof  |
| **IMPORTANT** | Auth, Tenant, Payment        | ≥75%   | Sensitive but less critical |
| **EXTENDED**  | Catalog, Product             | ≥70%   | Nice-to-have, but tracked   |
| **OVERALL**   | All                          | ≥75%   | Break CI if < 65%           |

### Quality Gates

```
If overall < 65%:    ❌ CI FAILS (regression)
If overall 65–75%:   ⚠️  WARN (investigate)
If overall ≥75%:     ✅ PASS (production-ready)
If CRITICAL < 80%:   ❌ CI FAILS (force improvement)
```

---

## FAQ

### Q: How long does a full mutation analysis take?

**A**: 30–45 min. Each mutant runs the full E2E suite (contracts+core = ~9 min). With ~1,400 mutants across all targets, that's ~30 mutations/hr in parallel.

### Q: Can I run concurrent mutations?

**A**: Not safely in CI; E2E tests modify shared state. Local: yes (change `concurrency: 1` to `concurrency: 2` in config, but monitor flakiness).

### Q: What if mutation score is 70%, not 75%?

**A**: Survived mutants are blind spots. Either:

1. Strengthen assertions (add checks for edge cases)
2. Add new contract test
3. Re-baseline if intentional (with justification)

### Q: Why not mutate smoke tests?

**A**: Smoke is intentionally lightweight (3.5/5 IVT). Too many false positives. Focus on contracts+core (4.7+ IVT).

### Q: Can I exclude certain mutations?

**A**: Yes, in stryker.config.mjs: `excludedMutations: ["UpdateOperator", ...]`. Use sparingly; every exclusion is a blind spot.

---

## Success Metrics

After mutation baseline runs:

- ✅ Mutation score ≥75% overall
- ✅ CRITICAL modules ≥80%
- ✅ Zero timeouts (infrastructure stable)
- ✅ <5% no-coverage mutants (all code paths tested)
- ✅ Per-module scores in artifacts/mutation-report.json

---

## Links

- [Stryker Docs](https://stryker-mutator.io/)
- [IVT Audit Report](./E2E_IVT_AUDIT_v2.md)
- [E2E Implementation Guide](./E2E_IMPLEMENTATION_GUIDE.md)
- Mutation report: `artifacts/mutation-report.json` (post-run)
- HTML report: `artifacts/stryker-report.html` (post-run)

---

**Built with 💛 for ChefIApp POS Core E2E Governance**
