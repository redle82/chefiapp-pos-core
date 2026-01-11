# ECOSYSTEM 360 AUDIT — 2026-01-03

Scope: repo-wide ecosystem audit across **POS core + web portals + AppStaff + reservations + billing/pricing + design system + performance + docs-vs-code**, grounded in concrete repo evidence.

## Evidence snapshot (what I actually verified in this pass)

- Merchant portal build: ✅ `npm -w merchant-portal run build` succeeded.
- Merchant portal typecheck (app config): ❌ `npx tsc -p merchant-portal/tsconfig.app.json` reports many existing issues (unused vars/imports under strict settings, design-system prop mismatches, type exports missing, etc.). Examples include:
  - `merchant-portal/src/components/RequireAuth.tsx`: `Cannot find namespace 'JSX'`
  - `merchant-portal/src/pages/AppStaff/AppStaffLanding.tsx`: invalid `Text` size values and unsupported props on DS primitives (`Card`/`Button`)
  - `merchant-portal/src/pages/AppStaff/AppStaff.tsx`: `colors.action.primary` does not exist (should use `colors.action.base`)
- Built asset sizes (merchant-portal `dist/assets`):
  - `index-DrjGKgdl.js`: **782,099 bytes** (~764K)
  - `index-ByJ547TH.css`: **55,005 bytes** (~54K)
  - `KitchenDisplay-V2ysLDlG.js`: 23,747 bytes (~23K)
  - `StaffModule-CtKK_f4d.js`: 27,189 bytes (~27K)
  - `demo-reviews-Cm5rVoL2.js`: 6,986 bytes (~6.8K)
- Web contracts + 4-cores machinery exists but is not universally enforced:
  - Core contract definitions: `merchant-portal/src/core/PageContracts.ts`
  - Cross-core validator intended for gate: `merchant-portal/src/core/CoreWebContract.ts`
  - Core doctrine docs: `CORE_ARCHITECTURE.md`, `merchant-portal/src/core/README.md`
- Reservations system exists end-to-end (schema + UI):
  - Schema + RLS: `supabase/migrations/054_reservations_system.sql`
  - Dashboard UI: `merchant-portal/src/pages/Reservations/ReservationsDashboard.tsx`
- AppStaff exists (core contract lib + portal UI + tests):
  - Contract/invariants/event model: `appstaff-core/*`
  - Portal AppStaff satellite: `merchant-portal/src/pages/AppStaff/*`
  - AppStaff check-in RPC: `merchant-portal/src/pages/AppStaff/context/StaffContext.tsx`
  - Example test: `merchant-portal/src/tests/zombie-task.spec.ts`
- Billing/pricing page exists, but is currently hardcoded/test-link oriented:
  - `merchant-portal/src/pages/Settings/BillingPage.tsx`
- Design system is **fragmented/duplicated**:
  - Legacy tokens: `merchant-portal/src/ui/tokens.ts`
  - DS token set: `merchant-portal/src/ui/design-system/tokens/index.ts`

---

# ARTIFACT 1 — Architecture Map (Kernel / Bootstrap / Adapters / Apps)

## A. Kernel (truth + invariants)

- **DB truth / invariants**: `supabase/migrations/*`
  - TPV “truth-hardening” migrations exist (075–081) implementing strict financial invariants / append-only logs.
  - Reservations schema + RLS: `supabase/migrations/054_reservations_system.sql`
- **State machine definitions**: `state-machines/*.json` (order/payment/session)

## B. Bootstrap (wiring / composition)

- Merchant portal entrypoint: `merchant-portal/src/main.tsx`
- Merchant portal router and module boundaries:
  - `merchant-portal/src/App.tsx`
  - Explicit “satellite isolation” via lazy load + module error boundary (`StaffModule`)

## C. Adapters (external IO)

- Supabase adapter used by TPV + Staff:
  - TPV payment RPC: `merchant-portal/src/core/tpv/PaymentEngine.ts` → `supabase.rpc('process_order_payment', ...)`
  - Staff check-in RPC: `merchant-portal/src/pages/AppStaff/context/StaffContext.tsx` → `supabase.rpc('fn_appstaff_checkin', ...)`
- Web/API proxying in dev:
  - `merchant-portal/vite.config.ts` proxies `/api`, `/public`, `/internal`, `/webhooks` to `http://localhost:4320`

## D. Apps (UIs)

- `merchant-portal/`: operator UI (TPV/KDS/Menu/Staff/Reservations/Govern)
- `customer-portal/`: customer UI (Vite/React)
- `landing-page/`: marketing

## E. Forbidden dependencies (must be enforced, not just documented)

1. **Pages must not become micro-cores**:
   - Contract doctrine says pages should consult `useWebCore()` and not infer truth (see `CORE_ARCHITECTURE.md`, `merchant-portal/src/core/README.md`).
2. **Pages must not read raw storage as source of truth**:
   - Yet multiple pages still call `localStorage.getItem(...)` (see Artifact 3).
3. **Design-system bypass**:
   - Inline styles + hard-coded colors appear in pages (see Artifact 4).

---

# ARTIFACT 2 — Scorecard (10 dimensions, evidence-based)

Grades reflect *current repo reality*, not doctrine.

| Dimension | Grade | Evidence | Primary gap |
|---|---:|---|---|
| Financial truth (TPV) | A | TPV uses transactional RPC + logs attempts: `merchant-portal/src/core/tpv/PaymentEngine.ts`; truth-hardening migrations 075–081 exist | Needs operational rollout discipline + monitoring wiring |
| DB security (RLS) | B | Reservations tables enable RLS + policies: `supabase/migrations/054_reservations_system.sql` | Need consistent RLS patterns across newer modules + policy tests |
| Observability | B- | Payment attempts logged via RPC; but UI also uses many `console.*` paths (e.g. `PaymentEngine` catch logs) | Centralize logging + remove console noise from prod |
| Offline resilience | B | IndexedDB queue exists: `merchant-portal/src/core/queue/db.ts` | Needs explicit “replay ledger”/UX + failure surfacing |
| Web contracts / UX truth | C | Contracts + validator exist: `merchant-portal/src/core/PageContracts.ts`, `CoreWebContract.ts` | Not enforced across all routes; many pages still read localStorage |
| Design system consistency | C- | Duplicate token systems: `merchant-portal/src/ui/tokens.ts` vs `src/ui/design-system/tokens/*` | Inline styles + hard-coded colors + token drift |
| Performance (bundle/boot) | B- | Build output: `index-DrjGKgdl.js` ~764K; App uses lazy-loaded satellites in `merchant-portal/src/App.tsx` | Reduce main chunk; remove boot console logs; audit route-level imports |
| Testing / gates | B | Playwright tests exist (e.g. `merchant-portal/src/tests/zombie-task.spec.ts`); many audit scripts exist in repo | Need contract gate wired to real page scans |
| Multi-tenant / multi-location readiness | B | Data model uses restaurant_id widely (e.g. reservations schema) | Need strict “tenant boundary” checks in UI (avoid storage truth) |
| Billing/pricing correctness | C | Billing core exists: `billing-core/README.md`; portal billing page is hardcoded test link: `merchant-portal/src/pages/Settings/BillingPage.tsx` | Must replace hardcoded Stripe link with real Billing Core flow |

---

# ARTIFACT 3 — Docs vs Implementation Matrix

| Doc/Doctrine | Where | Implementation reality | Gap / fix |
|---|---|---|---|
| “Pages consult `useWebCore()`, never read `localStorage` directly” | `merchant-portal/src/core/README.md` | Many pages read localStorage (example: `merchant-portal/src/pages/PreviewPage.tsx`, `ReservationsDashboard.tsx`, `BillingPage.tsx`, etc.) | Refactor pages to obtain needed values via core/provider and/or a typed storage adapter (not direct reads) |
| “Core 4 contracts validated by gate `audit:web-e2e`” | `CORE_ARCHITECTURE.md`, `merchant-portal/src/core/README.md` | Validator exists (`validateFourCores` in `CoreWebContract.ts`) but there is no repo-wide enforcement of “no localStorage” and “contract compliance” across all pages in code shown | Add a deterministic gate test that scans routes and fails on forbidden patterns |
| “Satellites must not crash core” | `merchant-portal/src/App.tsx` comments | Implemented for AppStaff via lazy load + ModuleErrorBoundary | Extend same pattern to other heavy modules if needed |
| “Preview is psychological truth: ghost vs live, never lies” | `CORE_ARCHITECTURE.md` | `PreviewPage` consults `useWebCore()` for preview gating, but still uses storage for slug/apiBase | Move slug/apiBase into WebCore state (or a single typed config layer) |

---

# ARTIFACT 4 — Design System Gap List (tokens/components/a11y/tooling)

## Token fragmentation (root cause)

- Legacy tokens (hard-coded Apple-ish palette): `merchant-portal/src/ui/tokens.ts`
- DS tokens (separate system): `merchant-portal/src/ui/design-system/tokens/index.ts`

**Risk:** two “sources of design truth” → inconsistent UI + unreviewable changes.

## Direct evidence of DS bypass

- Inline styles and hard-coded colors exist in pages:
  - `merchant-portal/src/pages/Reservations/ReservationsDashboard.tsx` uses inline styles + hard-coded `'#32d74b'` / `'#ff9500'`.
  - `merchant-portal/src/pages/PreviewPage.tsx` uses inline styles and direct colors.
- Billing page uses raw Tailwind + raw `alert(...)` UX:
  - `merchant-portal/src/pages/Settings/BillingPage.tsx`

## Minimum DS fixes (highest ROI)

1. Pick **one** token system (likely `src/ui/design-system/tokens/*`) and deprecate the other.
2. Replace inline colors with token references (no new hard-coded colors).
3. Add a “no-inline-style + no-hardcoded-color” lint rule for app pages.
4. Add basic a11y checks: focus rings, button semantics, contrast.

---

# ARTIFACT 5 — Performance & Boot Audit

## What boot does today

- `merchant-portal/src/main.tsx` renders `App` and logs to console on boot.
- `merchant-portal/src/App.tsx`:
  - Uses route-level code splitting for KDS and AppStaff (`React.lazy`).
  - Contains console logs and inline error UI.

## Bundle reality (built)

- Main JS chunk is **~764K** (`index-DrjGKgdl.js`).
- CSS is **~54K** (`index-ByJ547TH.css`).

## Recommended performance actions

1. Remove boot-time `console.log` from `main.tsx` and `App.tsx` (or gate by env).
2. Ensure heavy dashboards are lazy-loaded per route (not only AppStaff/KDS).
3. Add Vite manualChunks or import discipline if chunk warning persists.

---

# ARTIFACT 6 — Module Audits (Reservations / Web / Pricing)

## Reservations

- Schema is robust and already models CRM + waitlist + payments + channels + RLS:
  - `supabase/migrations/054_reservations_system.sql`
- UI exists but is “prototype-level” in DS compliance and error handling:
  - Fetches directly via `fetch(...)` and logs errors to console: `merchant-portal/src/pages/Reservations/ReservationsDashboard.tsx`

**Main risk:** UI can drift from schema/permissions model; needs typed API client + contract.

## Web module contracts

- Types and enums explicitly claim to match DB CHECK constraints:
  - `web-module/contracts.ts`

**Main risk:** without an automated alignment gate, this can silently drift from DB.

## Billing / Pricing

- Billing Core doctrine is solid and explicitly separates “your money” vs “restaurant money”:
  - `billing-core/README.md`
- Merchant portal billing page is not aligned yet:
  - Hard-coded Stripe test payment link in `merchant-portal/src/pages/Settings/BillingPage.tsx`

**Main risk:** accidentally shipping test links / incorrect billing lifecycle.

---

# ARTIFACT 7 — AppStaff Audit (RBAC/accountability/offline/tests)

## AppStaff Core

- Sovereign contract layer exists with events + invariants:
  - `appstaff-core/events.ts`, `appstaff-core/invariants.ts`, `appstaff-core/contracts.ts`

## Merchant-portal AppStaff

- AppStaff is isolated as a “satellite” (good fault containment): `merchant-portal/src/App.tsx`
- Staff check-in RPC exists but role selection is currently heuristic (name-based):
  - `merchant-portal/src/pages/AppStaff/context/StaffContext.tsx`

**Gap:** RBAC must be server-truth (role from membership), not client heuristic.

## Tests

- There is at least one concrete, truth-based test around “zombie tasks”:
  - `merchant-portal/src/tests/zombie-task.spec.ts`

---

# ARTIFACT 8 — Comparison vs Last (public info + repo facts)

Public claims on Last.app (marketing site): multi-platform, 250+ integrations, reservations/stock/unified orders, Verifactu, API docs.

| Dimension | ChefI (this repo) | Last.app (public claims) |
|---|---|---|
| Financial truth rigidity | Stronger *by construction* via DB invariants + append-only event logs (migrations 075–081; TPV RPC usage) | Not verifiable from public marketing; likely operationally mature |
| Extensibility | Explicit multi-core + contracts layer (`CORE_ARCHITECTURE.md`, `web-module/contracts.ts`) | Claims 250+ integrations |
| Reservations | Full schema + RLS exists + portal dashboard | Explicitly marketed as included |
| Billing separation | Clear in `billing-core/README.md`, but portal billing UI is not aligned yet | Unknown; marketed as “all-in-one” |
| UX truth (no “systemic lies”) | Doctrine is exceptional, but enforcement is incomplete (localStorage direct reads, DS bypass) | Not verifiable from marketing |

---

# Plan — 7 / 30 / 90 days

## Next 7 days (stabilize truth + remove shipping risks)

1. Replace hard-coded Stripe test link in `BillingPage.tsx` with real billing flow (using Billing Core contract) or feature-flag it off.
2. Add a CI gate that fails on:
   - `localStorage.getItem` usage inside `merchant-portal/src/pages/**`
   - hard-coded colors in pages (basic regex allowlist)
3. Remove boot-time `console.log` and normalize logging.

## Next 30 days (enforce contracts + converge design system)

1. Wire `validateFourCores` into a deterministic audit test and make it mandatory.
2. Refactor top 10 routes to rely on `useWebCore()` + typed config provider (no direct storage reads).
3. Choose one DS token system; migrate pages away from inline styles.

## Next 90 days (multi-location + operational readiness)

1. Tenant-boundary hardening: ensure every operation is restaurant-scoped server-side; add “membership-required” checks to all sensitive endpoints.
2. Offline ledger: formalize replay + reconciliation UX for operators.
3. Performance: reduce main chunk by route-level splitting for heavy dashboards.

---

## Bottom line

The **TPV core truth strategy is elite** (DB-first, append-only, failure-first), but the **web/product layer still leaks truth** via direct storage reads, DS drift, and a billing UI that’s not production-aligned. The fastest path to “ecosystem-ready” is not new features — it’s enforcing your existing doctrine with gates.
