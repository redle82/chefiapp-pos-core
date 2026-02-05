# Plano venda — Stripe live, domínio, onboarding real

**Objetivo:** Um único doc com os passos concretos para venda real (Stripe em produção, domínio público, primeiro cliente pagante).

**Referências:** [ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md](./ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md) · [CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](./pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md) · [ONDA_4_PILOTO_P1.md](./pilots/ONDA_4_PILOTO_P1.md)

---

## 1. Stripe live

**Checklist detalhado:** [VALIDACAO_STRIPE_PRODUCAO.md](./VALIDACAO_STRIPE_PRODUCAO.md) (env, RPC, webhook, /billing/success, teste manual).

- [ ] **Conta Stripe** em modo live (não test).
- [ ] **Produto e preço** criados no Stripe (ex.: €79/mês); anotar Price ID.
- [ ] **Variáveis de ambiente:** `VITE_STRIPE_PUBLISHABLE_KEY` (live), `STRIPE_SECRET_KEY` (live), `VITE_STRIPE_PRICE_ID` no merchant-portal e no backend que expõe `create_checkout_session`.
- [ ] **Webhook** Stripe configurado para o domínio de produção (ex.: `https://app.chefiapp.pt/webhooks/stripe`); evento `checkout.session.completed` (e outros necessários) atualiza `gm_restaurants.billing_status` ou tabela de subscrições.
- [ ] **Migração** `billing_status` em `gm_restaurants` aplicada em produção.

---

## 2. Domínio

**Checklist detalhado:** [VALIDACAO_DOMINIO_PRODUCAO.md](./VALIDACAO_DOMINIO_PRODUCAO.md) (DNS, HTTPS, deploy, Stripe redirects, teste).

- [ ] **Domínio** comprado e DNS apontado para o host do merchant-portal (ex.: Vercel, Netlify, ou VPS).
- [ ] **HTTPS** ativo (certificado automático ou Let’s Encrypt).
- [ ] **URL base** definida (ex.: `https://app.chefiapp.pt`) e, se necessário, `base` no `vite.config.ts` / build para produção.
- [ ] **Stripe redirect URLs** e webhook URL atualizados para o domínio real.

---

## 3. Onboarding real (primeiro cliente pagante)

**Checklist detalhado:** [CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](./pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md). **Fluxo no dia (URLs na ordem):** [VALIDACAO_ONBOARDING_PRIMEIRO_CLIENTE.md](./VALIDACAO_ONBOARDING_PRIMEIRO_CLIENTE.md).

Seguir na ordem:

1. **Pré-requisitos** — [CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md](./pilots/CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE.md) (pré-requisitos: BD, Stripe, 1 restaurante piloto escolhido).
2. **Dia do cliente** — Mesmo checklist: criar restaurante → 1 turno real → "Ativar agora" (Stripe) → €79 cobrado → feedback.
3. **Bloco 1 piloto** — [VALIDACAO_BLOCO_1_PILOTO.md](./VALIDACAO_BLOCO_1_PILOTO.md) (5 tarefas); detalhe em [ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md](./ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md) e [ONDA_4_PILOTO_P1.md](./pilots/ONDA_4_PILOTO_P1.md).

---

## Ordem sugerida

1. Stripe live (keys, price, webhook, migração).
2. Domínio + deploy merchant-portal em produção.
3. Primeiro cliente pagante (CHECKLIST_PRIMEIRO_CLIENTE_PAGANTE).
4. Bloco 1 piloto — [VALIDACAO_BLOCO_1_PILOTO.md](./VALIDACAO_BLOCO_1_PILOTO.md) (ICP, alvos, agendamentos).
5. Bloco 2 piloto — [VALIDACAO_BLOCO_2_PILOTO.md](./VALIDACAO_BLOCO_2_PILOTO.md) (métricas, report, checklist 2 sem, go/no-go).
6. Bloco 3 Production Readiness — [VALIDACAO_BLOCO_3_PRODUCTION.md](./VALIDACAO_BLOCO_3_PRODUCTION.md) (testes, CI, release, migrações, observabilidade).

---

## Contrato produto (inalterado)

- `/` = produto (TPV demo + overlay).
- `/auth` = signup/login.
- `/op/tpv?mode=demo` = demo direto.
- `/app/billing` = faturação.

Independente da porta em dev ou do domínio em produção.
