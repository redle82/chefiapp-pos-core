# Checklist — Primeiro cliente pagante

**Objetivo:** Instalar em 1 restaurante real e ativar o Stripe. Cobrar €79. Aprender com dinheiro real.

**Referências:** [ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md](../ONDA_4_PILOTO_E_PRODUCAO_CHECKLIST.md) · [ONDA_4_PILOTO_P1.md](./ONDA_4_PILOTO_P1.md) · [PLANO_PASSO_A_PASSO_CHEFIAPP.md](../PLANO_PASSO_A_PASSO_CHEFIAPP.md)

---

## Pré-requisitos (antes do dia)

- [ ] **Core/BD:** Coluna `gm_restaurants.billing_status` existe (migração `20260201180000_add_billing_status_to_gm_restaurants.sql` aplicada).
- [ ] **Stripe:** Conta Stripe configurada; `VITE_STRIPE_PRICE_ID` (e chaves) no ambiente do merchant-portal e Core RPC `create_checkout_session` operacional.
- [ ] **1 restaurante piloto** escolhido (nome, contacto, acordo: 2 semanas piloto + primeiro mês €79).

---

## Dia do primeiro cliente pagante

### 1. Criar 1 restaurante piloto

- [ ] Dono/gerente cria conta (landing → "Começar agora" → /auth).
- [ ] Completar bootstrap (criar restaurante).
- [ ] Completar primeiro produto (/onboarding/first-product).
- [ ] Confirmar acesso ao TPV (/op/tpv).

### 2. Operar 1 turno real

- [ ] Abrir turno (caixa) no TPV.
- [ ] Registrar pelo menos 1 pedido real e 1 pagamento (Dinheiro/Cartão/Outro).
- [ ] Fechar turno ou deixar aberto conforme operação.
- [ ] Confirmar no dashboard que pedido e métricas do dia aparecem.

### 3. Ativar agora (Stripe)

- [ ] Utilizador vê BillingBanner (trial) ou acede a /app/billing.
- [ ] Clicar **"Ativar agora"** (checkout Stripe).
- [ ] Completar pagamento no Stripe (cartão de teste ou real).
- [ ] Redirecionamento para /billing/success; confirmar mensagem e link para Dashboard/TPV.

### 4. Cobrar €79

- [ ] Confirmar que o primeiro pagamento (€79) foi registado no Stripe e, se aplicável, que `billing_status` do restaurante passou a `active` (via webhook ou atualização manual).

### 5. Feedback

- [ ] Perguntar ao dono/gerente: algo que faltou? algo que atrapalhou?
- [ ] Anotar 1–3 pontos (para ajustar antes do próximo cliente).

---

## Critério de sucesso

- 1 restaurante real operou 1 turno no ChefIApp.
- 1 pagamento €79 recebido via Stripe.
- Zero reclamação bloqueante OU reclamação registada e resposta definida.

---

## Próximo passo após este checklist

- Segundo cliente pagante (repetir com outro restaurante).
- Ou: ajustar copy/UX (ex. GlobalBlockedView, BillingPage) com base no feedback do primeiro.
