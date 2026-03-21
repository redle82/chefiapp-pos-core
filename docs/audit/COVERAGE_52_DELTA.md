# Delta para 52% Branch Coverage — Merchant Portal

**Estado atual (fev 2026):**
- Branches: **50.36%** (4077/8095)
- Statements: 62.74%
- Functions: 56.45%
- Lines: 64.54%

**Meta:** 52% branches

**Delta necessário:** ~133 branches (+1.64pp)

---

## Cálculo

```
Target: 52% × 8095 ≈ 4209 branches
Current: 4077
Delta: ~132 branches
Impacto por branch: ~0.0124pp
```

---

## Top módulos por oportunidade (sem tocar UI)

| Ficheiro | Uncovered | Se fechar tudo | ROI |
|----------|-----------|----------------|-----|
| core/billing/coreBillingApi.ts | 32 | +0.41pp | Alto (já testado) |
| core/sync/SyncEngine.ts | 46 | +0.59pp | Médio |
| core/infra/dockerCoreFetchClient.ts | 34 | +0.43pp | Médio |
| core/fiscal/FiscalPrinter.ts | 82 | +1.04pp | Médio |
| core/catalog/catalogApi.ts | 61 | +0.78pp | Médio |
| core/groups/GroupEngine.ts | 63 | +0.80pp | Médio |

**Estratégia para 52% sem UI:**
- coreBillingApi (32) + dockerCoreFetchClient (34) + core/catalog (parcial) ≈ +1pp → **51.4%**
- Adicionar 20–30 branches em SyncEngine ou FiscalPrinter → **52%+**

---

## Testes skipped (4)

| Ficheiro | Motivo |
|----------|--------|
| HardeningP0.locking.test.ts | Requer `DATABASE_URL` (Postgres) |
| HardeningP0.triggers.test.ts | Requer `DATABASE_URL` (Postgres) |
| OfflineStressTest.test.ts (×2) | Singleton isolation; SyncEngine refactor pendente |

**Para correr HardeningP0:** `DATABASE_URL=postgres://... pnpm vitest run tests/core/HardeningP0.*`
