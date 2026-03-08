# integration-gateway / Render — Deprecado (Stack 2026)

**Estado:** Deprecado. Backend oficial é **Supabase Edge Functions**.

---

## O que usar em vez disso

| Antes (Render / gateway) | Agora (Stack 2026) |
|-------------------------|--------------------|
| `VITE_API_BASE` = URL do Render ou localhost:4320 | **Produção:** `VITE_API_BASE=https://<PROJECT_REF>.supabase.co/functions/v1` |
| Webhooks em Render | Edge: `webhook-stripe`, `webhook-sumup` |
| Billing / internal/events no gateway | Edge: `billing-create-checkout-session`, `internal-events` |
| SumUp/PIX no gateway | Edge: `sumup-create-checkout`, `sumup-get-checkout`, `payment-pix-checkout` |

---

## Referências

- **Migração:** [MIGRATION_RENDER_TO_EDGE.md](./MIGRATION_RENDER_TO_EDGE.md)
- **Runbook cutover produção:** [PRODUCTION_CUTOVER_RUNBOOK.md](./PRODUCTION_CUTOVER_RUNBOOK.md)
- **Variáveis:** [ENV_MATRIX.md](./ENV_MATRIX.md)
- **Edge env:** [EDGE_ENV.md](./EDGE_ENV.md)

---

## Uso local (dev)

Em desenvolvimento podes continuar a usar o gateway em localhost:4320 para não depender do Supabase remoto:

- `pnpm run dev:gateway` (raiz) ou conforme `scripts/start-gateway-billing.sh`
- `VITE_API_BASE=http://localhost:4320`

Em **produção** não deve haver tráfego para Render nem para um deployment do integration-gateway; todo o tráfego de API (billing, webhooks, events) deve ir para as Edge Functions.

---

## Quando apagar o projeto Render

Após validar em produção que:

1. Webhooks Stripe e SumUp apontam para Edge e funcionam
2. Checkout billing (Stripe) e internal-events funcionam via Edge
3. `VITE_API_BASE` no Vercel (ou build de produção) é a URL das Edge Functions

podes desactivar ou apagar o serviço no Render. O código em `server/integration-gateway.ts` e em `integration-gateway/` pode permanecer no repositório como referência ou ser removido numa fase posterior de limpeza (Fase 4).
