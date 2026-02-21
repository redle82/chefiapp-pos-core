# 🚀 Mutation Testing — Quick Start & First Run

**Goal**: Establish baseline mutation score + validate sensitivity of E2E suite.
**Time**: 30–45 min (one-time setup + baseline run)
**Owner**: E2E Test Governance

---

## Step 1: Verify Prerequisites (2 min)

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core/merchant-portal

# Check Node/npm
node --version  # v18+
npm --version   # v10+
pnpm --version  # v9+

# Check Playwright
npx playwright --version  # 1.57+

# Verify config
cat stryker.config.mjs | head -20
```

**Expected output:**

```
v20.x.x
10.x.x
9.x.x
1.57.0
(shows @stryker-mutator configuration)
```

---

## Step 2: Install Mutation Testing Tools (3 min)

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core/merchant-portal

# Install Stryker packages (one-time in merchant-portal)
pnpm add -D \
  @stryker-mutator/core \
  @stryker-mutator/typescript-checker \
  @stryker-mutator/command-runner

# Verify installation
npx stryker --version
```

**Expected output:**

```
@stryker-mutator/core@[version]
@stryker-mutator/typescript-checker@[version]
@stryker-mutator/command-runner@[version]
```

---

## Step 3: Establish Baseline (35–45 min)

### Run Full Mutation Analysis

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core/merchant-portal

# Option A: Full analysis (all CRITICAL + IMPORTANT + EXTENDED)
npm run mutation:test:baseline

# Option B: Quick scan (CRITICAL only, ~10 min)
npm run mutation:test:quick
```

### What's Happening

1. **Stryker discovers** all mutatable code in targets (FlowEngine, LifecycleState, etc.)
2. **For each mutant**: Stryker modifies the code (e.g., `>` → `<`)
3. **Runs E2E contracts+core** (9 min per iteration)
4. **Scores results**: KILLED (✅) vs SURVIVED (❌)
5. **Generates reports**: HTML + JSON
6. **Saves baseline**: `artifacts/mutation-baseline.json`

### Terminal Output During Run

```
Stryker runner started with 4 worker(s) and 1 timeout of 900000 ms per test runner.

Estimated time to completion: ~45 min

[████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 10% (142/1412 mutants)
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 20% (284/1412 mutants)
[████████████░░░░░░░░░░░░░░░░░░░░░░░░░░] 30% (426/1412 mutants)
...

Mutation Score
█████████████████░░░░░░░░░░░░░░░░ 75.3%

Tested: 1,412 mutants
Killed: 1,067 (75.3% ✅)
Survived: 265 (18.8% ⚠️)
No Coverage: 79 (5.6%)
```

---

## Step 4: Analyze Results (5 min)

### View Console Summary

The script automatically prints:

```
🎯 MUTATION SCORE BY LAYER

🔴 CRITICAL
  Target:  80%
  Score:   78%
  Killed:  567/728 mutants
  Status:  ✅ PASS

🟠 IMPORTANT
  Target:  75%
  Score:   76%
  Killed:  189/248 mutants
  Status:  ✅ PASS

📈 OVERALL MUTATION SCORE
Overall:     75.3%
Total:       1,412 mutants
Killed:      1,067 (75.3%)
Survived:    265 (18.8%)
Status:      ✅ EXCELLENT (≥75%)

✅ Artifacts written:
  - artifacts/mutation-score-trend.csv (for trending)
  - artifacts/mutation-dashboard.json (for visualization)
```

### View HTML Report

```bash
# Open interactive report
open artifacts/stryker-report.html

# Or view in browser
open -a "Google Chrome" artifacts/stryker-report.html
```

In the report, you'll see:

- Per-file mutation score breakdown
- Individual mutant status (KILLED vs SURVIVED)
- Source code with mutant locations highlighted
- Recommendations for improvement

---

## Step 5: Interpret Survived Mutants (5–10 min)

### What Does "Survived" Mean?

Survived = Mutant was applied, but test still passed.

**Example:**

```typescript
// Original
if (isPilot && hasRestaurant) {
  // ...
}

// Mutated (survived = bad!)
if (isPilot) {
  // ...
}
// Test passed anyway? → `hasRestaurant` check not validated
```

### Find Survived Mutants

```bash
# Parse JSON report
cat artifacts/mutation-report.json | \
  python3 -c "
import json, sys
data = json.load(sys.stdin)
survived = [m for f in data['files'].values() for m in f['mutants'] if m['status'] == 'Survived']
print(f'Total survived: {len(survived)}')
for m in survived[:10]:  # First 10
  print(f\"  {m['sourceFile']} line {m['location']['start']['line']}: {m['mutatorName']}\")
"
```

### Action on High Survival

1. **If FlowEngine has >15% survival**: Strengthen N1–N3 tests
2. **If LifecycleState has >20% survival**: Add state transition assertions
3. **If operationalRestaurant has >30% survival**: Add N4/N5/N6 detail checks

---

## Step 6: Validate Quality Gates (1 min)

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core

python3 scripts/e2e/validate-mutation-thresholds.py \
  merchant-portal/artifacts/mutation-report.json
```

**Expected output:**

```
================================================================================
🎯 MUTATION QUALITY GATES VALIDATION
================================================================================

✅ PASS CRITICAL      78.0% (target ≥80%) — 567/728
✅ PASS IMPORTANT     76.0% (target ≥75%) — 189/248
────────────────────────────────────────────────────────────────────────────

✅ OVERALL:       75.3% (EXCELLENT)
────────────────────────────────────────────────────────────────────────────

✅ All quality gates PASSED
```

---

## Step 7: Commit Baseline (1 min)

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core

# Save baseline for trend tracking
git add merchant-portal/artifacts/mutation-baseline.json \
        merchant-portal/artifacts/mutation-score-trend.csv

git commit -m "🧬 chore: establish mutation testing baseline (75.3% overall, 78% CRITICAL)"

git push
```

---

## Step 8: Next Steps

### ✅ Done This Session

- [x] Configured `stryker.config.mjs`
- [x] Created `MUTATION_TESTING_GUIDE.md`
- [x] Added npm scripts (`mutation:test`, `mutation:test:quick`, `mutation:test:baseline`)
- [x] Created parsers (`parse-mutation-results.py`, `validate-mutation-thresholds.py`)
- [x] (THIS) Quick start guide

### 🚀 Next Week

- [ ] Run baseline mutation (45 min)
- [ ] Review survived mutants
- [ ] List 3–5 improvements (N4, N8, coverage gaps)
- [ ] Extract mutations dashboard data for trending

### 🎯 Ongoing

- **Weekly**: Trend mutation score
- **Monthly**: Full mutation analysis
- **Per-PR (optional)**: Quick scan on high-risk changes

---

## Troubleshooting

### Error: "stryker: command not found"

```bash
cd merchant-portal
pnpm add -D @stryker-mutator/core @stryker-mutator/typescript-checker @stryker-mutator/command-runner
npx stryker --version  # Should work now
```

### Error: "timeout waiting for test runner"

Playwright E2E tests are taking >15 min per mutation. Options:

1. **Reduce concurrency** (already set to 1, safe)
2. **Run quick mutation only** (`npm run mutation:test:quick`)
3. **Check system resources** (CPU/RAM)

### HTML Report Not Opening

```bash
# Generate fresh report
npm run mutation:test:quick

# Open from command line
open artifacts/stryker-report.html

# Or import into browser manually
# File → Open → /path/to/artifacts/stryker-report.html
```

### "Mutation score too low, failing CI"

This is **expected** if you haven't tuned tests yet. To improve:

1. **Identify survived mutants** (see Step 5)
2. **Strengthen assertions** on high-survival modules
3. **Add negative tests** for guard conditions
4. **Re-run**: `npm run mutation:test:quick`

---

## Expected Results

### After Baseline Run (Feb 21, 2026)

| Metric                    | Expected | Status          |
| ------------------------- | -------- | --------------- |
| Overall Score             | 70–80%   | 🟢 Target: ≥75% |
| CRITICAL (Flow/Lifecycle) | 75–85%   | 🟢 Target: ≥80% |
| IMPORTANT (Auth/Tenant)   | 70–80%   | 🟢 Target: ≥75% |
| Survived Mutants          | 200–300  | 📊 Baseline     |
| HTML Report               | Present  | ✅ Yes          |
| Baseline JSON             | Present  | ✅ Yes          |
| Trend CSV                 | Started  | ✅ Yes          |

---

## Key Files Created

1. **stryker.config.mjs** — Production config (updated)
2. **MUTATION_TESTING_GUIDE.md** — Full playbook
3. **parse-mutation-results.py** — JSON parser + console output
4. **validate-mutation-thresholds.py** — CI quality gate validator
5. **package.json** — Three new npm scripts (updated)
6. **THIS FILE** — Quick start guide

---

## Commands Cheat Sheet

```bash
# Setup (one-time)
cd merchant-portal
pnpm add -D @stryker-mutator/{core,typescript-checker,command-runner}

# Quick run (10 min, CRITICAL only)
npm run mutation:test:quick

# Full analysis (45 min, all layers)
npm run mutation:test

# Establish baseline (same as full, plus saves baseline.json)
npm run mutation:test:baseline

# View reports
open artifacts/stryker-report.html  # Interactive
cat artifacts/mutation-report.json  # Raw JSON

# Validate thresholds
python3 ../scripts/e2e/validate-mutation-thresholds.py artifacts/mutation-report.json

# Monitor trend
cat artifacts/mutation-score-trend.csv
```

---

## Success Criteria

After running baseline, you should have:

✅ HTML report at `artifacts/stryker-report.html`
✅ JSON report at `artifacts/mutation-report.json`
✅ Baseline saved at `artifacts/mutation-baseline.json`
✅ Trend CSV started at `artifacts/mutation-score-trend.csv`
✅ Overall mutation score ≥65% (prevent regression)
✅ CRITICAL layer ≥75% (ideally ≥80%)
✅ Console summary showing per-module scores
✅ Understanding of 3–5 major survived mutants

---

**Ready to run baseline?**

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core/merchant-portal
npm run mutation:test:baseline
```

🎬 Go!

---

**For questions**, refer to `docs/audit/MUTATION_TESTING_GUIDE.md` (full reference).
