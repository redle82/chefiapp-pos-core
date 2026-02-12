# Fase fechada + próximos passos

**Data:** 2026-01-28
**Status:** Fase atual concluída; build verde; fluxo coerente.

---

## O que está feito

- **Build:** Constitution validado, Vite build OK, PWA gerado.
- **Fluxo:** Landing (`/`) → Trial Guide (`/trial-guide`) → TPV Trial (`/op/tpv?mode=trial`) → Dashboard (`/dashboard`) → Backoffice (`/app/backoffice`).
- **Narrativa:** Sistema operacional (não “TPV” como produto); Demo Guide reforça a landing.
- **Modos:** trial / piloto / ao vivo vividos na UI; card “Estado do sistema” no dashboard; transições raras e contratuais no Backoffice.
- **Proteção:** TPVMinimal e KDSMinimal protegidos por ModeGate (bloqueados em modo trial).
- **Landing/Trial Guide:** Sem vazamento de estado técnico (ModeIndicator oculto em `/` e `/trial-guide`).

---

## Próximos passos (ordem sugerida)

1. **Persistência de `productMode` no Core** — ✅ Implementado

   - Migration: `docker-core/schema/migrations/20260128_product_mode.sql` (coluna `product_mode` em `gm_restaurants`).
   - RuntimeReader lê `product_mode`; RuntimeWriter expõe `setProductMode`.
   - RestaurantRuntimeContext usa valor do Core ao carregar e persiste ao alterar (quando backend é Docker).
   - **Aplicar a migration:** `cd docker-core && make migrate-product-mode` (ver docker-core/README.md).

2. **Billing** — ✅ Implementado
   O webhook de billing (`server/billing-webhook-server.ts`) chama `server/core-client.ts` quando a assinatura Stripe fica `ACTIVE` (com `merchant_id` nos metadados) e atualiza `gm_restaurants.product_mode` para `'live'`. Contrato: [BILLING_PRODUCT_MODE_CONTRACT.md](BILLING_PRODUCT_MODE_CONTRACT.md).

3. **Sandbox TPV em modo piloto** — Implementado (marcação)
   Em modo piloto, pedidos criados no TPVMinimal são marcados com `origin = 'pilot'` no Core; aviso "Modo piloto — pedidos de teste" na UI. Mesa piloto e teto de pedidos permanecem como extensão futura. Contrato: [SANDBOX_TPV_PILOT_CONTRACT.md](SANDBOX_TPV_PILOT_CONTRACT.md).

4. **Lint**
   Reduzir warnings (no-explicit-any, no-unused-vars, etc.) sem refatorar comportamento. Correções simples: variáveis não usadas → prefixar com `_` (ex.: `catch (_e)`); fazer incrementalmente por área.

---

## Trilhos seguintes (escolher um)

Todos os passos acima estão **implementados** (1) ou **com contrato** (2–4). Para avançar:

- **Billing:** Concluído (webhook → Core). Opcional: fluxo redirect + "confirmar assinatura" no merchant-portal.
- **Sandbox TPV:** Marcação no Core + aviso na UI implementados. Opcional: mesa piloto ou teto conforme [SANDBOX_TPV_PILOT_CONTRACT.md](SANDBOX_TPV_PILOT_CONTRACT.md).
- **Lint:** Corrigir mais no-unused-vars / no-explicit-any por área, sem refatorar.
- **Congelar:** Fase tecnicamente fechada; próximas sessões partem de um dos trilhos acima.

---

## Referências

- [DOC_INDEX.md](DOC_INDEX.md) — Índice da documentação.
- [BILLING_PRODUCT_MODE_CONTRACT.md](BILLING_PRODUCT_MODE_CONTRACT.md) — Contrato billing → productMode live.
- [SANDBOX_TPV_PILOT_CONTRACT.md](SANDBOX_TPV_PILOT_CONTRACT.md) — Contrato sandbox TPV em modo piloto.
- [BACKOFFICE_LINEAR_SPEC.md](BACKOFFICE_LINEAR_SPEC.md) — Spec do Backoffice Linear.
- [DASHBOARD_MODO_VENDA.md](DASHBOARD_MODO_VENDA.md) — Dashboard modo venda.
- [MODO_TRIAL_EXPLICATIVO_SPEC.md](MODO_TRIAL_EXPLICATIVO_SPEC.md) — Modo Trial Explicativo + reposicionamento do System Tree (modo de leitura, não tela principal).
