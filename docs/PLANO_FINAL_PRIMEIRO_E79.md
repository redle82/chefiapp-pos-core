# Plano final — Do agora até ao primeiro €79

**Regra global:** Não mexer em arquitetura, não "corrigir" 500s, não ligar Supabase antes do passo indicado.

---

## FASE 0 — BASE (já validada)

**Estado:** FECHADO. Nada a fazer aqui.

- Arquitetura OK
- Providers OK
- Onda 5 OK
- Vercel OK
- Estado consolidado documentado

**Começar na Fase 1.**

---

## FASE 1 — TESTE HUMANO E2E (OBRIGATÓRIO)

**Doc:** [VALIDACAO_TESTE_HUMANO_E2E.md](VALIDACAO_TESTE_HUMANO_E2E.md)

**Executar exatamente:**

1. Abrir http://localhost:5175/
2. Confirmar: TPV trial, Overlay, Preço 79€, CTAs visíveis
3. Clicar "Explorar primeiro"
4. Criar 1 pedido trial
5. Clicar "Começar agora"
6. Confirmar navegação para /auth
7. Confirmar sem crash / sem ecrã branco
8. (Opcional) Criar conta
9. Abrir aba anónima
10. Repetir passos 1 → 5

**Critério de fecho:** Escrever literalmente (num comentário, commit message ou doc):

> **"Agora vejo."**

Só depois disso avançar para Fase 2.

---

## FASE 2 — PAGAMENTOS (DINHEIRO PREPARADO)

**Doc principal:** [FASE_2_PAGAMENTOS.md](FASE_2_PAGAMENTOS.md) (Stripe + SumUp Europa + PIX Brasil)

**Por região:**

- **Stripe** (resto do mundo / assinatura SaaS): [VALIDACAO_STRIPE_PRODUCAO.md](VALIDACAO_STRIPE_PRODUCAO.md) — Price ID, env, /app/billing, webhook quando for cobrar.
- **SumUp Europa** (cartão EUR): [SUMUP_EUR_INTEGRATION_GUIDE.md](SUMUP_EUR_INTEGRATION_GUIDE.md) — token, gateway 4320, webhook.
- **PIX Brasil** (BRL): [PIX_ACTIVATION_PLAN.md](PIX_ACTIVATION_PLAN.md) · [PIX_UI_INTEGRATION_COMPLETE.md](PIX_UI_INTEGRATION_COMPLETE.md) — UI PIX + E2E com sandbox quando disponível.

**Mínimo para avançar:**

1. Entrar no Stripe Dashboard; criar produto (ex.: ChefIApp Plano Mensal, €79, Monthly); copiar Price ID.
2. No projeto: `merchant-portal/.env.local` — adicionar `VITE_STRIPE_PRICE_ID=price_xxx`.
3. Reiniciar dev; abrir /app/billing; confirmar: preço aparece, botão "Ativar agora" ativo.
4. (Se Europa) Configurar SumUp EUR conforme guia; (Se Brasil) Validar fluxo PIX na UI e E2E quando tiver sandbox.

**Nota:** Não ativar webhook Stripe ainda se não fores cobrar hoje.

---

## FASE 3 — DOMÍNIO + PRODUÇÃO

**Doc:** [VALIDACAO_DOMINIO_PRODUCAO.md](VALIDACAO_DOMINIO_PRODUCAO.md)

**Executar:**

1. Comprar domínio (ex.: chefiapp.pt)
2. Apontar DNS → Vercel
3. Em Vercel: adicionar domínio, confirmar HTTPS ativo
4. Verificar rotas: /, /auth, /app/billing, /billing/success (rota existe)

**Aviso:** Não ligar Supabase ainda.

---

## FASE 4 — PRIMEIRO CLIENTE PAGANTE (O DIA)

**Doc:** [VALIDACAO_ONBOARDING_PRIMEIRO_CLIENTE.md](VALIDACAO_ONBOARDING_PRIMEIRO_CLIENTE.md)

**Executar no restaurante piloto:**

1. Abrir https://teu-dominio/
2. Começar agora
3. Criar conta (dono)
4. Criar restaurante
5. Criar 1 produto
6. Abrir TPV
7. Criar 1 pedido real
8. Ir a /app/billing
9. Clicar "Ativar agora"
10. Completar checkout Stripe
11. Ver /billing/success
12. Confirmar: pagamento €79 no Stripe, cliente entende o produto, 1 feedback curto

**Neste momento o produto é oficialmente vendido.**

---

## FASE 5 — SUPABASE (SÓ AGORA)

**Doc:** [SUPABASE_QUANDO_ATIVAR.md](SUPABASE_QUANDO_ATIVAR.md)

**Executar:**

1. Criar projeto Supabase
2. Aplicar migrações: billing_status, get_shift_history
3. Definir envs: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
4. Configurar webhook Stripe: stripe-billing-webhook
5. Validar: 500s desaparecem, dados reais carregam

---

## FASE 6 — FECHO

1. Atualizar NEXT_STEPS.md — marcar "Primeiro cliente pago"
2. Criar tag:
   ```
   git tag first-paid-customer
   git push origin first-paid-customer
   ```
3. Respirar.

---

## Regra final (não negociável)

- **Não** "melhorar" backend antes do dinheiro
- **Não** limpar Network tab por estética
- **Não** refatorar nada estrutural agora
- **Sim:** executar checklists
- **Sim:** ouvir o humano
- **Sim:** cobrar

---

## Referências

- [ESTADO_CONSOLIDADO_SISTEMA.md](ESTADO_CONSOLIDADO_SISTEMA.md) — Estado atual válido e intencional
- [NEXT_STEPS.md](../NEXT_STEPS.md) — Ordem ativa e links

---

**Próxima ação:** Fase 6 concluída. Plano €79 fechado. Tag: `git tag first-paid-customer` e `git push origin first-paid-customer` quando fizer push.
