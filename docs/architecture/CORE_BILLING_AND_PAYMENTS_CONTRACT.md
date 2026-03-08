# Contrato Core — Billing e Pagamentos

## Lei do sistema

**Quem cobra? Em nome de quem? Com qual gateway? Com qual regra? E o que o Core pode ou não fazer com dinheiro?**

Este contrato é obrigatório. Resolve: (1) venda do ChefIApp (SaaS), (2) operação do restaurante (pagamentos ao cliente final), (3) multi-gateway (Stripe, SumUp, Pix), (4) separação entre Core, terminal e gateway.

**Princípio imutável:** O Core **nunca** é um gateway de pagamento. O Core governa, valida, regista e reconcilia — **não processa** dinheiro.

---

## 0. Soberania — NO SUPABASE

**O Core NÃO usa Supabase.**

| Decisão | Regra |
|--------|--------|
| Core soberano | Docker-first; Postgres próprio; RPCs internos; event sourcing / execution model. |
| Sem BaaS como fonte de verdade | Supabase **não** é autoridade do Core. |
| Supabase, se existir | Apenas integração periférica ou mock (ex.: auth placeholder). Nunca persistência de billing nem fonte de verdade. |

Toda a persistência e validação de billing acontecem no **Core (Postgres + Core API)**. A UI apenas consome a API do Core.

---

## Sovereignty

This contract is subordinate to [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md). No rule, state or execution defined here overrides the Docker Financial Core.

---

## 1. Regra de ouro

| Camada | Pode fazer | Não pode fazer |
|--------|------------|----------------|
| **Core** | Validar valores, regras, estado do pagamento, reconciliação; expor GET/POST billing/config, POST saas/portal | Processar cartão, guardar dados sensíveis |
| **TPV** | Iniciar pagamento, escolher método (autorizado pelo Core) | Calcular impostos/regras (Core) |
| **Gateway** (Stripe/SumUp/Pix) | Processar pagamento real | Decidir regras do sistema |
| **Web (Command Center)** | Configurar gateways, planos, chaves (via Core API) | Cobrar cliente final (TPV/Web Pública) |
| **AppStaff** | Ver estado (pago / pendente) | Iniciar cobrança |

---

## 2. Fonte de verdade (Core Docker)

| Camada | Tecnologia |
|--------|------------|
| Core | Docker + Postgres próprio |
| Execução | RPCs internas / Core API |
| UI | merchant-portal (só consome Core API) |
| TPV / KDS | Clientes do Core |
| Stripe / SumUp / Pix | Gateways externos |

**Nada de Supabase como backend.**

---

## 3. Tipos de billing (separados)

### 3.1 Billing SaaS (ChefIApp → Stripe)

**Quem paga:** Restaurante → ChefIApp.

| Aspecto | Valor |
|---------|--------|
| Gateway | Stripe |
| Produto | Assinatura mensal/anual |
| Onde é gerido | `/app/billing`; Stripe Customer Portal |
| Como a UI obtém URL | `POST /core/billing/saas/portal` → Core retorna URL do Stripe |

Sem Supabase. Sem lógica de Stripe no frontend. A UI chama o Core; o Core chama Stripe e devolve a URL.

### 3.2 Billing do restaurante (clientes finais)

**Quem paga:** Cliente do restaurante (conta, mesa, takeaway).

O Core persiste a configuração em **Postgres (Docker)** na tabela `billing_configs`:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| restaurant_id | UUID | FK gm_restaurants |
| provider | TEXT | stripe \| sumup \| pix \| custom |
| currency | TEXT | EUR \| USD \| BRL |
| enabled | BOOLEAN | Gateway activo |
| credentials_ref | TEXT | Referência cifrada (nunca dados em claro) |
| updated_at | TIMESTAMPTZ | |

**Regras Core:**

- `enabled = false` → TPV **bloqueia** cobrança.
- Core **nunca** guarda dados de cartão.
- Core **nunca** cobra; só valida e reconcilia.

---

## 4. API Core (Docker-native)

A UI **só consome** estes endpoints. Nenhum `supabase.from(...)` nem Edge Function para billing.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/core/billing/config` | Obter configuração de billing do restaurante (billing_configs). |
| POST | `/core/billing/config` | Criar/actualizar configuração (provider, currency, enabled, credentials_ref). |
| POST | `/core/billing/saas/portal` | Criar sessão Stripe Customer Portal; retorna `{ url }`. |

Implementação no Core: PostgREST (tabela `billing_configs`) + RPC ou serviço que chama Stripe para o portal SaaS.

---

## 5. O que o Core NÃO pode fazer (lei)

| Proibido | Motivo |
|----------|--------|
| Guardar dados de cartão | PCI; só o gateway guarda. |
| Simular sucesso de pagamento real | Verdade única; gateway responde. |
| Misturar billing SaaS com billing restaurante | Fluxos e responsabilidade legal distintos. |
| Processar dinheiro offline | Pagamento offline **proibido**. |

---

## 6. Contratos cruzados

| Sistema | Relação com Billing |
|---------|----------------------|
| **TPV** | Executa pagamento **autorizado** pelo Core; antes de cobrança, chama Core para verificar billing config; se disabled → bloqueia e mostra erro (CORE_TPV_BEHAVIOUR_CONTRACT). |
| **Command Center** | Painel Billing: carrega/grava via GET/POST `/core/billing/config`; link para `/app/billing` (SaaS); usa core-design-system. |
| **Web Pública** | Usa gateway configurado para o restaurante (checkout cliente). |
| **AppStaff** | Apenas visualização de estado (pago / pendente). |
| **Offline** | Pagamento offline proibido (CORE_OFFLINE_CONTRACT). |

---

## 7. Enforcement

| Regra | Onde está / deve estar |
|-------|------------------------|
| NO SUPABASE para billing | Nenhum billing persistido ou autorizado via Supabase; BillingBroker chama Core API; PaymentGuard/FlowGate (billing_status) devem passar a ler do Core. |
| Rota `/app/billing` (SaaS) | BillingPage chama `POST /core/billing/saas/portal` e redirecciona para URL retornada; PaymentGuard Safe Harbor. |
| Command Center: painel Billing | SystemTree → Billing; BillingConfigPanel: load/save via Core API; selecção de gateway, moeda, enabled, credenciais (ref cifrada). |
| TPV: cobrança só se autorizado | Antes de cobrança: chamar Core para verificar billing config; se disabled → bloquear e mostrar erro. |
| Sem dados de cartão no Core | Nenhum componente Core ou UI guarda PAN, CVC; apenas referências e estado. |

---

## 8. Contaminação Supabase (a remover)

| Ficheiro | Uso actual | Alvo |
|----------|------------|------|
| `BillingBroker.ts` | `supabase.functions.invoke("stripe-billing")` | Chamar `POST /core/billing/saas/portal` (e checkout se aplicável) via Core API. |
| `PaymentGuard.tsx` | `supabase.from("gm_restaurants").select("billing_status")` | Obter status via Core (GET billing/status ou gm_restaurants via PostgREST do Core quando backend = Docker). |
| `FlowGate.tsx` | `supabase.from("gm_restaurants").select("..., billing_status")` | Idem: fonte = Core. |

---

## 9. Stripe subscription lifecycle (Fase 3 Billing Real)

**Fonte de verdade:** `gm_restaurants.billing_status` e `gm_restaurants.trial_ends_at` (Core). Opcional: `merchant_subscriptions` (status, stripe_subscription_id, trial_end, canceled_at).

**Eventos Stripe tratados (webhook → RPC `sync_stripe_subscription_from_event`):**

| Evento Stripe | Acção no Core |
|---------------|----------------|
| `customer.subscription.created` | Atualiza `gm_restaurants.billing_status` e `merchant_subscriptions`; mapeia `trialing` → trial, `active` → active. |
| `customer.subscription.updated` | Idem; reflecte mudança de estado (trial → active, past_due, canceled). |
| `customer.subscription.deleted` | `billing_status` = canceled. |
| `invoice.payment_failed` | `billing_status` = past_due (dunning). |
| `invoice.paid` | `billing_status` = active. |

**Estados de billing (UI + PaymentGuard):** `trial` | `active` | `past_due` | `canceled`.

**Quem bloqueia o quê:**

| Estado | PaymentGuard | Safe Harbor (sempre permitido) |
|--------|--------------|-------------------------------|
| trial, active | Passa | `/app/billing`, `/app/console`, `/app/setup` |
| past_due | Banner + CTA "Escolher plano" → `/app/billing`; trial expirado = bloqueio total com paywall. | Idem |
| canceled | Bloqueio total (GlobalBlockedView); CTA "Reactivar plano" → `/app/billing`. | Idem |

**Dunning:** Banner `paymentPending` + link para `/app/billing` quando `past_due`. PaymentGuard mostra barra superior e permite uso com aviso; trial expirado bloqueia.

**Implementação:** Edge Function `webhook-stripe` chama `process_webhook_event` (idempotente) e depois `sync_stripe_subscription_from_event` para os eventos acima. Core: RPC em `docker-core/schema/migrations/20260324_stripe_subscription_sync.sql` e equivalente em `supabase/migrations/20260222140000_stripe_subscription_sync.sql`.

---

## 10. Referências

- [PAYMENT_AND_POSITIONING.md](../legal/PAYMENT_AND_POSITIONING.md) — Posicionamento jurídico e técnico: o que o ChefIApp é/não é; separação pagamento SaaS vs transação; exigências evitadas.
- [PAYMENT_LAYER.md](./PAYMENT_LAYER.md) — Arquitetura do módulo de pagamento (providers plugáveis).
- [PAYMENT_CREDENTIALS_AND_WEBHOOKS.md](../security/PAYMENT_CREDENTIALS_AND_WEBHOOKS.md) — Segurança de credenciais por restaurante e webhooks; separação SaaS vs transação.
- [CORE_TPV_BEHAVIOUR_CONTRACT.md](./CORE_TPV_BEHAVIOUR_CONTRACT.md) — TPV executa; Core manda.
- [CORE_WEB_COMMAND_CENTER_CONTRACT.md](./CORE_WEB_COMMAND_CENTER_CONTRACT.md) — SystemTree inclui nó Billing.
- [CORE_OFFLINE_CONTRACT.md](./CORE_OFFLINE_CONTRACT.md) — Offline: fila de sync; pagamento offline proibido.
- [CONTRACT_ENFORCEMENT.md](./CONTRACT_ENFORCEMENT.md) — Secção Billing actualizada.

---

**Frase de sistema maduro:** *Dinheiro é soberania. Quem não separa billing de execução, perde o controlo do sistema. O Core é Docker; não há Supabase como autoridade.*
