# FINANCIAL CORE VIOLATION AUDIT

> **DECLARATION:** Nenhuma escrita/leitura financeira passa por Supabase em modo Docker.

## Violation History & Status

### P0: Critical Domain Leakage [RESOLVED]

**Status:** ✅ RESOLVED
**Date:** 2026-02-03
**State:**

- Orders, Stock, Fiscal, and Billing are strictly routed through Docker Core.
- Shim prevents accidental Supabase access in Docker mode.
- Anti-regression checks implemented to prevent future violations.

### P1: Route & Contract Alignment [RESOLVED]

**Status:** ✅ RESOLVED
**Date:** 2026-02-03
**State:**

- `ROTAS_E_CONTRATOS.md` aligned with `App.tsx`.
- Onboarding, Demo, and Operational routes are consistent.

### P2: Core Auth [ON HOLD]

**Status:** ⏸️ CONSCIOUS HOLD
**Reason:** Strategic decision to maintain Supabase Auth temporarily.
**Restriction:** Supabase Auth is isolated and does not touch financial data.

## Audit Log

- **2026-02-03**: Finalized architectural cycle. Implemented generic anti-regression check for `supabase.from` / `supabase.rpc` usage in critical tables. Confirmed Docker Core sovereignty.
