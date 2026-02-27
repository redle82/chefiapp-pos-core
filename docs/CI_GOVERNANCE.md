# CI Governance — Stabilisation Phase

> **Effective:** 2026-02-27 &nbsp;|&nbsp; **Review date:** 2026-03-13 (2 weeks)

---

## 1. Why this change

Before this consolidation the repo had **9 GitHub Actions workflows**, up to **7 of which fired on every push to `main`**. Each performed its own `npm ci`, some duplicated `tsc --noEmit`, and two spun up Playwright browsers. This caused:

- ~20-30 min of aggregate CI time per push (most of it redundant).
- Constant red badges that were noise, not signal (false-positive grep failures, formatting drift in 6 000+ files).
- "Broken dashboard" fatigue — real failures got lost in the noise.

The "1 445 workflow runs" visible in GitHub Actions is a **historical counter** (every push × every workflow × every re-run). It does **not** mean 1 445 workflows are running concurrently. At any given push there were ~7 concurrent workflows; now there is **1** (+ deploy on tags).

---

## 2. What runs on every push / PR

| Trigger                    | Workflow       | Jobs                                                | Blocking? |
| -------------------------- | -------------- | --------------------------------------------------- | --------- |
| push `main`/`develop` + PR | **ci.yml**     | `validate` → `e2e-smoke` (main only)                | **Yes**   |
| push tag `v*`              | **deploy.yml** | build → docker → vercel → migrate → backend → smoke | **Yes**   |

### `validate` job (ci.yml) — single install, ~4-6 min

1. `npm ci`
2. `make simulate-failfast` (tsc + vite build)
3. `npm run -w merchant-portal lint`
4. `npm test` (unit, excludes e2e/playwright/massive/offline)
5. `bash scripts/sovereignty-gate.sh`
6. `bash scripts/check-financial-supabase.sh`
7. `bash scripts/contract-gate.sh`

### `e2e-smoke` job — only after `validate` passes, only on push to main

1. Playwright chromium — 4-layer E2E suite

---

## 3. What moved to weekly / manual

These workflows still exist but **only run on Saturday 04:00 UTC (schedule) or via workflow_dispatch**:

| Workflow                          | Why demoted                                         | Gate type     |
| --------------------------------- | --------------------------------------------------- | ------------- |
| Architecture Guardian             | Duplicated tsc; file-exists checks rarely change    | Informational |
| Canon Enforcement (Kill Switches) | Grep-based; useful but noisy during rapid iteration | Informational |
| Contract Gate (standalone)        | Key check (`contract-gate.sh`) folded into ci.yml   | Redundant     |
| Truth Gate                        | Playwright-heavy; test:truth spec                   | Informational |
| UI Guardrails                     | Light but path-filtered; low value per-push         | Informational |
| Check All Screens                 | Playwright screenshot all routes                    | Manual        |
| Core Validation                   | Requires Postgres service container                 | Manual        |

> **All can be run manually at any time** via GitHub Actions → Run workflow.

---

## 4. Reintroduction roadmap (3 phases)

### Phase 1 — Now (stabilisation, 2 weeks)

- Only `ci.yml` is blocking.
- Demoted gates run weekly to catch drift.
- Focus: green builds, fast iteration, reliable deploys.

### Phase 2 — Week 3-4

Reintroduce as **blocking on PR only** (not push):

- Architecture Guardian
- Canon Enforcement
- UI Guardrails
- Contract Gate (standalone)

### Phase 3 — Week 5+

Reintroduce as blocking on push + PR:

- Truth Gate (Playwright)
- Check All Screens (Playwright)
- Core Validation (when docker-tests are stable)

---

## 5. Concurrency

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

A new push to the same branch automatically cancels the previous CI run. No zombie runs accumulating.

---

## 6. Prettier

`npx prettier --check .` was removed from the blocking pipeline because **6 000+ files** in the repo have pre-existing formatting drift. Plan:

1. Add `.prettierignore` for generated/vendor/archive dirs.
2. Run `npx prettier --write .` in a dedicated formatting PR.
3. Re-enable `prettier --check .` in ci.yml once the baseline is clean.

---

## 7. Decision log

| Date       | Decision                                | Rationale                                |
| ---------- | --------------------------------------- | ---------------------------------------- |
| 2026-02-27 | Consolidate to 1 blocking workflow      | Reduce noise, save GH minutes            |
| 2026-02-27 | Remove prettier --check from CI         | 6 000 pre-existing violations            |
| 2026-02-27 | Fold contract-gate.sh into ci.yml       | Avoid separate npm ci                    |
| 2026-02-27 | Move canon/architecture/truth to weekly | Grep + Playwright too expensive per-push |
