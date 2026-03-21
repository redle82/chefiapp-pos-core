# CI Governance — ChefIApp POS Core

> Single source of truth for what blocks merge and what doesn't.
> Updated: 2026-02-27 (stabilisation phase — no staging DB yet)

---

## Required Check: `Validate Code Quality`

This job **blocks merge** to `main` and `develop`. Every step must pass.

| Step | What it does | Why it matters |
|---|---|---|
| `pnpm install --frozen-lockfile` | Reproducible dependency resolution | Catches lockfile drift |
| `make simulate-failfast` | `tsc --noEmit` + `pnpm run build` (root → merchant-portal → export to `public/app`) | Catches type errors and Vite build failures |
| Lint | `eslint` on `merchant-portal` | Zero warnings policy |
| Jest tests | `npm test` — front-only (DB/integration tests excluded via `testPathIgnorePatterns`) | Core logic regression |
| Sovereignty gate | `scripts/sovereignty-gate.sh` — static analysis | Orders must go through Core, not Supabase RPC |
| Financial domain gate | `scripts/check-financial-supabase.sh` | Financial writes must use Core |
| Contract gate | `scripts/contract-gate.sh` — docs integrity | Architecture contracts stay consistent |
| **Build artifact validation** | `scripts/ci/validate-build-artifact.sh` — checks `index.html`, `manifest.webmanifest`, `sw.js`, JS/CSS bundles exist | Prevents deploying an empty or broken build |
| **Smoke HTTP 200** | Starts `serve public/app`, curls `/` and `/app/staff/home` for HTTP 200 | Catches SPA rewrite failures, missing `index.html`, broken assets |

---

## Non-blocking: `E2E Suite (Playwright — 4 layers)`

This job **does not block merge**. It uses `continue-on-error: true`.

### When it runs

| Trigger | Runs? |
|---|---|
| PR with label `run-e2e` | ✅ |
| `workflow_dispatch` (manual) | ✅ |
| Push to `main` or `develop` | ✅ |
| Normal PR (no label) | ❌ Skipped |

### Why non-blocking

No staging database exists. Playwright contract/core tests need a Supabase/Core backend.
Running them without a backend produces false failures that waste CI time and create noise.

### Graduation criteria — when E2E becomes required

All 3 conditions must be met:

1. **Staging exists**: A Supabase project (or Docker Core in CI) with seeded test data is available in the GitHub Actions runner.
2. **Boot integrity**: `scripts/e2e/boot-integrity-gate.sh` passes in CI for **5 consecutive** runs on `main`.
3. **Flake-free**: Layer 0 (setup) + Layer 1 (smoke) tests pass with **0 flakes** over 30 `repeat-each` runs (use "Flakiness Audit" job via `workflow_dispatch`).

When all 3 are met, remove the `if:` condition and `continue-on-error: true` from `e2e-smoke` in `ci.yml`, and add `E2E Suite (Playwright — 4 layers)` to the branch protection required checks.

---

## Non-blocking: `Flakiness Audit (repeat-each × N)`

Manual-only (`workflow_dispatch`). Used to hunt flaky tests before promoting E2E.

---

## PWA / Service Worker policy

| Endpoint pattern | Workbox handler | Rationale |
|---|---|---|
| SPA shell (HTML/CSS/JS/icons) | **Precache** (via `globPatterns`) | Offline-capable shell |
| `/rest/v1/*` (Supabase REST) | **NetworkOnly** | POS cannot serve stale prices/orders |
| `/auth/*` (Supabase GoTrue) | **NetworkOnly** | Auth tokens must never be cached |
| Navigate fallback | `/index.html` | SPA client-side routing |
| Navigate denylist | `/rest/`, `/auth/`, `/api/`, `/internal/`, `/webhooks/`, `/rpc/` | These are API routes, not SPA routes |

### Adding offline reads later

When offline mode is needed for specific safe data (e.g., menu GET):
1. Add a `NetworkFirst` entry with `cacheableResponse: { statuses: [200] }` (never `[0, 200]` — status 0 caches opaque CORS errors including 401s).
2. Set a short `maxAgeSeconds` (e.g., 300).
3. Test with DevTools → Application → Service Workers → "Offline" checkbox.

---

## Incident runbook (2-minute diagnosis)

### "401 from SW cache" / ghost data

1. Open DevTools → Application → Cache Storage → look for `chefiapp-rest-get` or similar.
2. If present with stale entries: the `runtimeCaching` handler is not `NetworkOnly`. Fix in `vite.config.ts`.
3. Force-clear: DevTools → Application → Storage → "Clear site data".
4. Prevention: `runtimeCaching` for API endpoints should be `NetworkOnly` (current config).

### "Stuck on Carregando ChefIApp..."

This is the HTML fallback shown **before** React mounts. If it stays:
1. **TDZ crash**: Check browser console for `Cannot access 'X' before initialization`.
   - `installedDeviceStorage.ts`: must use `function storageKey()` (not `const`).
   - `vite.config.ts` L248-259: framer-motion/motion-dom/motion-utils must be in same chunk.
   - `main_debug.tsx` L7: `import "./config"` must be the first import.
2. **Chunk load failure**: Check Network tab for 404 on `.js` files → stale SW precache → clear SW.
3. **Auth infinite loop**: Check FlowGate console logs for repeated `resolveNextRoute` calls.

### "Deploy shows old version"

1. `skipWaiting: true` + `clientsClaim: true` are set → new SW activates immediately.
2. User may have a stale tab: hard-refresh (Cmd+Shift+R) or close all tabs.
3. Verify Vercel deployment: `vercel inspect <deployment-url>` → check build timestamp.
4. Check `public/app/` was populated: `ls -la public/app/index.html` → should have current timestamp.

### "Build passes locally but fails in CI"

1. Check `pnpm-lock.yaml` — is it committed? CI uses `--frozen-lockfile`.
2. Check Node version — CI uses Node 20 (`actions/setup-node`).
3. Typecheck: `npx tsc --noEmit` locally with the same `tsconfig.json`.
4. Build: `pnpm run build` from root (not from `merchant-portal/`).

---

## Vercel deploy checklist

Before each production deploy, verify:

- [ ] `pnpm run build` exits 0 locally
- [ ] `bash scripts/ci/validate-build-artifact.sh` exits 0
- [ ] `public/app/index.html` contains `<div id="root"`
- [ ] `public/app/manifest.webmanifest` has correct `start_url: "/app/staff/home"`
- [ ] `public/app/sw.js` exists (VitePWA output)
- [ ] `vercel.json` rewrite `/(.*) → /index.html` does NOT intercept `manifest.webmanifest` or `sw.js` (Vercel serves static files before rewrites — this is correct by default)
- [ ] Environment variables are set in Vercel project settings (not hardcoded)

---

*Maintained by the ChefIApp engineering team. Update this file when CI policy changes.*
