# Canonical Document Index
>
> **Status:** LOCKED | **Last Audit:** 2026-01-14

This index lists all canonical documents that govern the ChefIApp OS architecture.
Only documents listed here are considered authoritative.

---

## 🔒 CANON (Locked - Require CR to Modify)

| Document | Status | Enforced By | Source Refs | Conflicts |
|----------|--------|-------------|-------------|-----------|
| [ARCHITECTURAL_INVARIANTS.md](../ARCHITECTURAL_INVARIANTS.md) | LOCKED | `audit-architecture.cjs` | `src/core/**` | None |
| [DOMAIN_STATE_MACHINE.md](../DOMAIN_STATE_MACHINE.md) | LOCKED | `audit-domain.cjs` + DB triggers | `OrderEngine`, `PaymentEngine` | None |
| [UI_CONTRACT.md](../UI_CONTRACT.md) | LOCKED | `audit-architecture.cjs` | All `pages/**` | None |
| [PRODUCTION_RISK_MATRIX.md](../PRODUCTION_RISK_MATRIX.md) | LIVING | Manual review | All systems | None |
| [CHEFIAPP_OS_WHITEPAPER.md](../CHEFIAPP_OS_WHITEPAPER.md) | LOCKED | Institutional | All systems | None |

---

## 📋 LIVING (Active Development)

| Document | Purpose | Owner |
|----------|---------|-------|
| [ROUTE_MANIFEST.md](./ROUTE_MANIFEST.md) | Route definitions and guards | Arch Team |
| [PRODUCTION_RISK_MATRIX.md](../PRODUCTION_RISK_MATRIX.md) | Risk tracking | Arch Team |

---

## 📦 ARCHIVE (Historical - No Enforcement)

All other documents not listed above are considered **historical artifacts**.
They have been moved to `docs/archives/2026-01-legacy/`.

These documents may contain:

- Superseded decisions
- Previous implementation attempts
- Historical context

**They are NOT authoritative and should NOT be referenced for current architecture.**

---

## Enforcement Chain

```
CANONICAL_INDEX.md
    ↓
ARCHITECTURAL_INVARIANTS.md ← audit-architecture.cjs
    ↓
DOMAIN_STATE_MACHINE.md ← audit-domain.cjs + DB triggers
    ↓
UI_CONTRACT.md ← audit-architecture.cjs
    ↓
PRODUCTION_RISK_MATRIX.md ← Manual review
```

---

## Invariant Summary

| Code | Rule | File |
|------|------|------|
| INV-001 | Domain never reads storage | `ARCHITECTURAL_INVARIANTS.md` |
| INV-003 | Gate before Domain | `ARCHITECTURAL_INVARIANTS.md` |
| INV-006 | UI never calculates totals | `UI_CONTRACT.md` |
| INV-007 | No implicit transitions | `DOMAIN_STATE_MACHINE.md` |
| DOM-001 | No direct status assignment | `DOMAIN_STATE_MACHINE.md` |
| DOM-002 | No setState with status | `DOMAIN_STATE_MACHINE.md` |
| DOM-003 | No useEffect mutations | `DOMAIN_STATE_MACHINE.md` |

---

## Verification Command

```bash
npm run audit:all
```

Expected output:

```
🏛️ ARCHITECTURE GUARDIAN   ✓ ALL PASS
🔄 DOMAIN GUARDIAN         ✓ ALL PASS
```
