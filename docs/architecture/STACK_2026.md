# Stack 2026 — Referência única

**Fonte de verdade:** [ARCHITECTURE_OFFICIAL_2026.md](./ARCHITECTURE_OFFICIAL_2026.md)  
**Variáveis de ambiente:** [ENV_MATRIX.md](../ops/ENV_MATRIX.md)

---

## Stack oficial (uma cloud = Supabase)

| Camada | Tecnologia | Uso |
|--------|------------|-----|
| **Hosting** | Vercel | Frontend / PWA / static |
| **DB + Auth** | Supabase | Postgres, Auth, RLS, Realtime |
| **Server logic** | Supabase Edge | Webhooks Stripe/SumUp, internal-events, billing |
| **Payments** | Stripe / SumUp / Pix | Via abstraction; UI nunca importa SDK |
| **Observabilidade** | Sentry | Erros críticos; logs por `restaurant_id` |
| **Client** | React + Vite | PWA offline-first, Print spooler, MenuCache |

---

## O que eliminar

- **Render** — migrar webhooks para Edge; apagar projeto Render
- **Gateway duplicado** — eliminar `integration-gateway` quando Edge assumir
- **Lógica de domínio na UI** — mover para `packages/domain`
- **Integrações espalhadas** — centralizar em `packages/infra`
- **Estados ambíguos** — ConnectivityService único; idempotency_key explícito
- **Duplicação estrutural** — apps/ + packages/ (domain, infra, ui, shared)

---

## Regra de ouro da refatoração

**Nenhuma feature nova durante a refatoração.**  
Refatoração = estabilização, consolidação, clareza — não expansão.

---

## Fases do plano (referência)

1. **Fase 1 — Infra:** Render → Edge; variáveis centralizadas (ENV_MATRIX).
2. **Fase 2 — Código:** Domain vs UI; packages domain/infra/ui/shared; Payment abstraction.
3. **Fase 3 — Offline:** ConnectivityService único; idempotência; PrintQueue após OrderSync; MenuCache normalizado.
4. **Fase 4 — Limpeza:** Remover `any`, casts, código morto; consolidar design-system.
5. **Fase 5 — Observabilidade:** HealthPanel; conectividade; fila; último sync/erro.
