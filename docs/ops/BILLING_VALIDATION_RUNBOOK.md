# Billing — Roteiro operacional de validação (runbook ultra-detalhado)

**Objetivo:** Executar passo a passo a validação operacional da fase "Billing Freeze": fluxos reais em 3 moedas, checklist de fecho e simulação de falhas. Nenhum código novo — apenas confirmação em ambiente real.

**Quando a fase está realmente fechada:** Executaste todos os fluxos reais em 3 moedas (BR/US/EU), forçaste as quatro falhas intencionais, nenhum estado foi corrompido e nenhum incidente inesperado surgiu.

**Regra:** Um único item incerto → não fechar.

---

## Pré-requisitos (obrigatório antes de começar)

### Comandos exactos

1. **Core (Postgres + PostgREST)**  
   - Local Docker: `cd docker-core && docker compose -f docker-compose.core.yml up -d`  
   - Health: `curl -s http://localhost:3001/rest/v1/` deve devolver 200.  
   - Ou usar: `bash scripts/core/health-check-core.sh`

2. **Aplicar migrações de billing (Core)**  
   - `cd docker-core`  
   - `export DATABASE_URL="postgres://postgres:postgres@localhost:5433/chefiapp?sslmode=disable"` (ajustar host/porta se diferente)  
   - `dbmate up`  
   - Migrações relevantes (ordem): `20260128_billing_configs.sql`, `20260221_billing_plans_stripe_price_id.sql`, `20260222_merchant_subscriptions.sql`, `20260223_stripe_sync_timestamp_guard.sql`, `20260228_billing_plan_prices_seed_multi_currency.sql`, `20260324_stripe_subscription_sync.sql`, `20260325_billing_incidents.sql`, `20260326_billing_incidents_index_and_view.sql`, `20260327_stripe_sync_billing_incidents.sql`, `20260333_billing_plan_prices.sql` (se existir).  
   - **Confirmar que a tabela `billing_incidents` existe e que a função `sync_stripe_subscription_from_event` está actualizada (20260327):**
     ```sql
     SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'billing_incidents';
     ```

3. **Gateway (Stripe test)**  
   - Na raiz do repo: `pnpm run dev:gateway` (usa `scripts/start-gateway-billing.sh`).  
   - Com Stripe: `STRIPE_SECRET_KEY=sk_test_... pnpm run dev:gateway`  
   - Gateway deve estar na porta **4320**. Health: `curl -s http://localhost:4320/health | jq .status` → `"ok"`

4. **Variáveis de ambiente (gateway)**  
   - `STRIPE_SECRET_KEY` (obrigatório)  
   - `STRIPE_PRICE_PRO_EUR`, `STRIPE_PRICE_PRO_USD`, `STRIPE_PRICE_PRO_BRL` (IDs de preço Stripe para plano Pro em cada moeda)

5. **Portal (frontend)**  
   - `pnpm -w merchant-portal run dev` (porta 5175 por defeito)  
   - Config: copiar `merchant-portal/.env.local.example` para `merchant-portal/.env.local`; deve incluir `VITE_API_BASE=http://localhost:4320` e `VITE_INTERNAL_API_TOKEN=chefiapp-internal-token-dev`

6. **Acesso ao DB (Core)**  
   - psql ou cliente SQL contra o Postgres do Core (ex.: `psql -h localhost -p 5433 -U postgres -d chefiapp`) para executar as consultas deste runbook.

---

# Parte 1 — Execução do BILLING_FLOWS_MANUAL_CHECKLIST

Ref.: [BILLING_FLOWS_MANUAL_CHECKLIST.md](./BILLING_FLOWS_MANUAL_CHECKLIST.md). Seguir na ordem.

---

## 1.1 Criar três restaurantes por mercado (BR, US, EU)

### Brasil (BR / BRL)

- **Acção:** Criar restaurante com `country` = `BR` e `currency` = `BRL` (via UI de onboarding/registo ou inserção directa no Core, conforme disponível).
- **Verificação de moeda (API):** O portal usa `getRestaurantBillingCurrency(restaurantId)` que lê `gm_restaurants.currency` ou deriva de `country` (ver [coreBillingApi.ts](../../merchant-portal/src/core/billing/coreBillingApi.ts)). Deve devolver `BRL`.
- **SQL para confirmar e anotar o `id` do restaurante BR:**
  ```sql
  SELECT id, name, country, currency, billing_status, trial_ends_at, last_billing_event_at
  FROM gm_restaurants
  WHERE country = 'BR' AND (currency = 'BRL' OR currency IS NULL)
  ORDER BY created_at DESC LIMIT 1;
  ```
- **UI:** Abrir `/app/billing` com sessão desse tenant. Verificar que a UI de planos mostra preços em **BRL** (símbolo e valor). Anotar qualquer inconsistência.

### EUA (US / USD)

- **Acção:** Criar restaurante com `country` = `US` e `currency` = `USD`.
- **SQL:**
  ```sql
  SELECT id, name, country, currency, billing_status, trial_ends_at, last_billing_event_at
  FROM gm_restaurants
  WHERE country = 'US' AND (currency = 'USD' OR currency IS NULL)
  ORDER BY created_at DESC LIMIT 1;
  ```
- **UI:** `/app/billing` com esse tenant → preços em **USD**.

### Europa (EU / EUR)

- **Acção:** Criar restaurante com `country` = `PT` (ou `DE`, `FR`) e `currency` = `EUR`.
- **SQL:**
  ```sql
  SELECT id, name, country, currency, billing_status, trial_ends_at, last_billing_event_at
  FROM gm_restaurants
  WHERE country IN ('PT','DE','FR') AND (currency = 'EUR' OR currency IS NULL)
  ORDER BY created_at DESC LIMIT 1;
  ```
- **UI:** `/app/billing` com esse tenant → preços em **EUR**.

**Anotar os três UUIDs** (ex.: `id_br`, `id_us`, `id_eu`) para os passos seguintes.

---

## 1.2 Upgrade / downgrade

### Upgrade (Starter ou trial → Pro)

- **SQL ANTES** (substituir `<restaurant_id>` por um dos três, ex. `id_eu`):
  ```sql
  SELECT id, billing_status, trial_ends_at, last_billing_event_at FROM gm_restaurants WHERE id = '<restaurant_id>';
  SELECT restaurant_id, plan_id, status, stripe_subscription_id, canceled_at FROM merchant_subscriptions WHERE restaurant_id = '<restaurant_id>';
  ```
- **Acção:** Com esse restaurante seleccionado no portal, ir a `/app/billing`, iniciar checkout para plano **Pro**, concluir pagamento no Stripe (cartão de teste).
- **SQL DEPOIS:** Repetir as duas consultas acima.  
  **Esperado:** `merchant_subscriptions.plan_id` = `pro` (ou equivalente configurado), `gm_restaurants.billing_status` = `active` (ou `trial` se trial).  
  **Anotar:** Se `billing_status` ou `plan_id` não baterem com o esperado.

### Downgrade (Pro → Starter, se suportado)

- **Acção:** No portal ou via novo checkout, alterar de Pro para Starter.  
- **SQL DEPOIS:** Mesmas consultas; estado deve refletir o novo plano.

---

## 1.3 Cancelamento e re-subscribe

Seguir **na íntegra** o [BILLING_CANCEL_RESUBSCRIBE_CHECKLIST.md](./BILLING_CANCEL_RESUBSCRIBE_CHECKLIST.md) (passos 1–5).

- **Resumo operacional:**
  1. Estado inicial: restaurante com `billing_status` = `active` ou `trial` e `merchant_subscriptions` com `stripe_subscription_id` preenchido.
  2. Cancelar no Stripe Dashboard (test): Customers → customer do restaurante → Subscriptions → Cancel (immediately ou at period end). Ou via Stripe Customer Portal na UI ("Gerir faturação").
  3. **SQL após cancelamento** (substituir `<restaurant_id>`):
     ```sql
     SELECT id, billing_status, trial_ends_at FROM gm_restaurants WHERE id = '<restaurant_id>';
     SELECT restaurant_id, status, stripe_subscription_id, canceled_at FROM merchant_subscriptions WHERE restaurant_id = '<restaurant_id>';
     ```
     **Esperado:** `billing_status` = `canceled` ou `past_due` (conforme lógica do Core); `merchant_subscriptions.status` = `canceled`, `canceled_at` preenchido.
  4. Re-subscribe: Na UI, "Ativar agora" / "Mudar plano" → concluir checkout Stripe.
  5. **SQL após re-subscribe:** `billing_status` = `active` (ou `trial`); `merchant_subscriptions`: nova linha ou atualização com `status` = `active`, `canceled_at` = NULL.

**Anotar** qualquer divergência.

---

## 1.4 Falha de pagamento

- **Acção:** No Stripe Dashboard (test), simular falha de pagamento (ex.: cartão recusado ou usar cartão de teste que falha). O webhook `invoice.payment_failed` deve ser recebido pelo Core/Edge.
- **SQL ANTES** (registar estado):
  ```sql
  SELECT id, billing_status, last_billing_event_at FROM gm_restaurants WHERE id = '<restaurant_id>';
  ```
- **SQL DEPOIS:**
  ```sql
  SELECT id, billing_status, last_billing_event_at FROM gm_restaurants WHERE id = '<restaurant_id>';
  SELECT id, provider, event_type, event_id, created_at FROM webhook_events ORDER BY created_at DESC LIMIT 5;
  ```
- **Esperado:** `gm_restaurants.billing_status` = `past_due` (conforme lógica do Core).  
**Anotar** se o estado não mudar ou se não aparecer evento em `webhook_events`.

---

## 1.5 Renovação automática

- **Acção:** Em test mode, avançar o relógio ou usar evento de teste Stripe para simular renovação (ex.: `invoice.paid` após renewal).
- **SQL DEPOIS:**
  ```sql
  SELECT id, billing_status, last_billing_event_at FROM gm_restaurants WHERE id = '<restaurant_id>';
  SELECT * FROM billing_incidents WHERE restaurant_id = '<restaurant_id>' ORDER BY created_at DESC LIMIT 5;
  ```
- **Esperado:** Estado permanece `active`; não deve surgir incidente desnecessário para evento de renovação válido.

---

## 1.6 Trial → pago

- **Acção:** Restaurante em trial: quando o trial termina (ou simular evento Stripe), verificar que o estado passa a `past_due` ou que o utilizador é direccionado para checkout. Concluir checkout e verificar `active`.
- **SQL antes do fim do trial:**
  ```sql
  SELECT id, billing_status, trial_ends_at, last_billing_event_at FROM gm_restaurants WHERE id = '<restaurant_id>';
  ```
- **SQL depois de concluir checkout:**
  ```sql
  SELECT id, billing_status, trial_ends_at FROM gm_restaurants WHERE id = '<restaurant_id>';
  SELECT restaurant_id, plan_id, status FROM merchant_subscriptions WHERE restaurant_id = '<restaurant_id>';
  ```
- **Esperado:** Após checkout, `billing_status` = `active` e subscription activa.

---

## 1.7 Consultas de resumo (qualquer momento)

| Tabela / coluna         | Consulta (substituir `?` por `'<restaurant_id>'`) |
|-------------------------|----------------------------------------------------|
| gm_restaurants          | `SELECT id, billing_status, trial_ends_at, last_billing_event_at FROM gm_restaurants WHERE id = ?` |
| merchant_subscriptions  | `SELECT restaurant_id, plan_id, status, stripe_subscription_id, canceled_at FROM merchant_subscriptions WHERE restaurant_id = ?` |
| webhook_events          | `SELECT id, provider, event_type, event_id, created_at FROM webhook_events ORDER BY created_at DESC LIMIT 20` |
| billing_incidents       | `SELECT * FROM billing_incidents WHERE restaurant_id = ? ORDER BY created_at DESC` (requer migração 20260327) |

---

# Parte 2 — Execução do BILLING_FREEZE_PHASE_CHECKLIST

Ref.: [BILLING_FREEZE_PHASE_CHECKLIST.md](./BILLING_FREEZE_PHASE_CHECKLIST.md). Cada critério abaixo tem **Como verificar** e **Evidência**. Marcar só quando a evidência estiver confirmada.

---

- [ ] **Metadata obrigatória**  
  - **Como verificar:** Chamar `POST /internal/billing/create-checkout-session` sem `restaurant_id` no body → deve falhar (400 ou 422). Com `restaurant_id` (UUID) no body → 200 e sessão Stripe criada; no Stripe Dashboard, sessão deve ter `subscription_data.metadata.restaurant_id` e `metadata.restaurant_id` iguais ao UUID. Código: [server/integration-gateway.ts](../../server/integration-gateway.ts) (body obrigatório).  
  - **Evidência:** Output do curl ou script E2E; screenshot do Stripe Dashboard (metadata da sessão).

- [ ] **PIX e SumUp**  
  - **Como verificar:** Docs [PIX_BILLING_BRL_AND_REFUNDS.md](../PIX_BILLING_BRL_AND_REFUNDS.md) e [SUMUP_WEBHOOK_EUR_PIX_AND_RETRY.md](../SUMUP_WEBHOOK_EUR_PIX_AND_RETRY.md) existem e hardening descrito está aplicado no código. Fluxos validados quando credenciais disponíveis.  
  - **Evidência:** Confirmação de leitura dos docs; se tiveres credenciais, nota de que fluxos foram testados (ou "a executar antes de go-live").

- [ ] **E2E checkout + webhook**  
  - **Como verificar:** Executar `./scripts/e2e-billing-three-currencies.sh` (gateway em 4320, variáveis `STRIPE_PRICE_PRO_*` e `STRIPE_SECRET_KEY` definidas). Script deve sair 0. Opcional: [E2E_BILLING_THREE_CURRENCIES_RUNBOOK.md](./E2E_BILLING_THREE_CURRENCIES_RUNBOOK.md) §1–§5 (webhook de teste e verificação no DB).  
  - **Evidência:** Output do script (todas as 3 moedas OK); se aplicável, resultado das consultas SQL do runbook E2E.

- [ ] **Cross-currency guard**  
  - **Como verificar:** Ver Parte 3 (Simulação de falha) — cenário **currency_mismatch**. Evento com moeda diferente não actualiza estado; `billing_incidents` com `reason = 'currency_mismatch'`.  
  - **Evidência:** Resultado do passo 3.1 abaixo (SQL de verificação).

- [ ] **i18n**  
  - **Como verificar:** Procurar fallbacks críticos em fluxos de billing/TPV (ex.: chaves de tradução em falta); strings de billing/facturação em namespaces (billing/common). Contrato: [UI_CURRENCY_AND_DATES_CONTRACT.md](../UI_CURRENCY_AND_DATES_CONTRACT.md).  
  - **Evidência:** Nota "auditado" ou lista de ficheiros revistos; sem fallbacks críticos em billing/TPV.

- [ ] **Runbook e incidentes**  
  - **Como verificar:** [RUNBOOKS.md](./RUNBOOKS.md) inclui secção **6.1. Billing e webhooks** com links para E2E, Cancel+Re-subscribe, BILLING_FLOWS_MANUAL_CHECKLIST, BILLING_FREEZE_PHASE_CHECKLIST. Em incidentes de billing, consultar `billing_incidents` (Core) quando a migração 20260327 estiver aplicada.  
  - **Evidência:** Confirmação de que RUNBOOKS.md §6.1 existe e referencia estes docs.

- [ ] **Checklist de fluxos reais**  
  - **Como verificar:** [BILLING_FLOWS_MANUAL_CHECKLIST.md](./BILLING_FLOWS_MANUAL_CHECKLIST.md) executado na íntegra (Parte 1 deste runbook) ou assinado como "a executar antes de go-live".  
  - **Evidência:** Checklist preenchido ou assinatura com data.

- [ ] **Migrations**  
  - **Como verificar:** Nenhuma migração de billing pendente no Core; ordem documentada em [docker-core/MIGRATIONS.md](../../docker-core/MIGRATIONS.md). Local: `cd docker-core && dbmate status`.  
  - **Evidência:** Output de `dbmate status`; lista de migrações de billing aplicadas.

- [ ] **TODOs billing**  
  - **Como verificar:** Nenhum TODO/FIXME em aberto em `merchant-portal/src/core/billing` nem em funções de billing do server (ou convertidos em issue e referenciados no checklist).  
  - **Evidência:** `grep -r TODO merchant-portal/src/core/billing` e grep em funções de billing no server vazios (ou lista de issues).

---

# Parte 3 — Simulação de falha (teste final)

Objetivo: Forçar os quatro cenários de guard e confirmar que (1) `billing_incidents` regista o motivo correcto e (2) o estado em `gm_restaurants` / `merchant_subscriptions` **não** é alterado.

**Pré-requisito:** Migração 20260327 aplicada no Core; webhook Stripe configurado para o endpoint que chama `sync_stripe_subscription_from_event` (Core RPC ou Edge Supabase).

---

## 3.1 currency_mismatch

- **Como forçar:** Enviar webhook de teste (Stripe Dashboard → [Send test webhook](https://dashboard.stripe.com/test/webhooks)) com evento `customer.subscription.updated` (ou `customer.subscription.created`) em que:
  - `metadata.restaurant_id` = UUID de um restaurante que tem **billing_currency** ou **currency** = **EUR** (consultar `gm_restaurants`).
  - No payload do objeto subscription (ou items), **currency** = **usd** (ou outro diferente de eur).
- **SQL antes** (registar estado; substituir `<restaurant_id>`):
  ```sql
  SELECT id, billing_status, last_billing_event_at FROM gm_restaurants WHERE id = '<restaurant_id>';
  ```
- **Enviar o webhook.**
- **SQL depois — verificar que estado não mudou e que o incidente existe:**
  ```sql
  SELECT id, billing_status, last_billing_event_at FROM gm_restaurants WHERE id = '<restaurant_id>';
  SELECT id, restaurant_id, provider, event_id, event_type, reason, expected_currency, event_currency, created_at
  FROM billing_incidents
  WHERE restaurant_id = '<restaurant_id>' AND reason = 'currency_mismatch'
  ORDER BY created_at DESC LIMIT 1;
  ```
- **Esperado:** `gm_restaurants` inalterado; uma linha em `billing_incidents` com `reason = 'currency_mismatch'`, `expected_currency` = eur, `event_currency` = usd (ou equivalente).  
**Anotar** o `event_id` se precisares para idempotência (reenvio não deve duplicar linha graças a `ON CONFLICT (event_id, reason) DO NOTHING`).

---

## 3.2 price_mismatch

- **Como forçar:** Webhook com `metadata.restaurant_id` de um restaurante válido e moeda alinhada (ex.: EUR), mas **price_id** (em `items.data[0].price.id` ou em `lines.data[0].price.id` para invoice) que **não** existe em `billing_plan_prices` para esse `plan_id` + moeda. Por exemplo, usar um price_id de outro produto Stripe ou inventado.
- **Consultar preços esperados:**
  ```sql
  SELECT plan_id, currency, stripe_price_id FROM billing_plan_prices WHERE currency = 'eur' LIMIT 5;
  ```
  Usar um `price_id` que **não** esteja nessa lista para o restaurante em questão.
- **SQL antes:** Igual a 3.1 (registar `billing_status`, `last_billing_event_at`).
- **Enviar webhook** com esse `price_id` no payload.
- **SQL depois:**
  ```sql
  SELECT id, billing_status, last_billing_event_at FROM gm_restaurants WHERE id = '<restaurant_id>';
  SELECT id, restaurant_id, event_id, event_type, reason, expected_price_id, event_price_id, created_at
  FROM billing_incidents
  WHERE restaurant_id = '<restaurant_id>' AND reason = 'price_mismatch'
  ORDER BY created_at DESC LIMIT 1;
  ```
- **Esperado:** Estado inalterado; uma linha em `billing_incidents` com `reason = 'price_mismatch'`.

---

## 3.3 stale_event

- **Como forçar:** O Core ignora eventos cujo `event.created` (timestamp Stripe) seja **menor ou igual** a `gm_restaurants.last_billing_event_at`. Portanto: (1) Registar o valor actual de `last_billing_event_at` do restaurante. (2) Enviar um webhook de teste em que o campo `created` do evento seja **anterior** a esse timestamp (ex.: número Unix de ontem).
- **SQL para obter last_billing_event_at:**
  ```sql
  SELECT id, last_billing_event_at FROM gm_restaurants WHERE id = '<restaurant_id>';
  ```
  No Stripe "Send test webhook", se não puderes editar `created`, usar um restaurante que tenha `last_billing_event_at` já preenchido e enviar um evento de teste com data antiga (alguns clientes Stripe permitem override; caso contrário, pode ser necessário chamar o RPC manualmente com `p_event_created_at` no passado para simular).
- **Alternativa (se o Dashboard não permitir alterar `created`):** Chamar directamente o RPC do Core com um payload onde o evento tenha `created` antigo:
  ```sql
  SELECT * FROM sync_stripe_subscription_from_event(
    'customer.subscription.updated',
    '{"id":"evt_stale_1","created":1600000000,"data":{"object":{"metadata":{"restaurant_id":"<restaurant_id>"},"status":"active","currency":"eur",...}}'::jsonb,
    '2020-09-13T12:00:00Z'::timestamptz
  );
  ```
  (Ajustar o JSON ao schema esperado pela função e usar um `created` / `p_event_created_at` anterior a `last_billing_event_at`.)
- **SQL depois:**
  ```sql
  SELECT id, billing_status, last_billing_event_at FROM gm_restaurants WHERE id = '<restaurant_id>';
  SELECT id, restaurant_id, event_id, event_type, reason, created_at
  FROM billing_incidents
  WHERE restaurant_id = '<restaurant_id>' AND reason = 'stale_event'
  ORDER BY created_at DESC LIMIT 1;
  ```
- **Esperado:** Estado inalterado; uma linha em `billing_incidents` com `reason = 'stale_event'`.

---

## 3.4 no_tenant (tenant_not_found)

- **Como forçar (Edge / Supabase):** Enviar webhook Stripe **sem** `metadata.restaurant_id` (e sem que o `customer` do payload exista em `merchant_subscriptions.stripe_customer_id` para resolver restaurante). O Edge (Supabase function) insere em `billing_incidents` com `reason = 'no_tenant'`.
- **Como forçar (Core RPC directo):** Chamar `sync_stripe_subscription_from_event` com payload onde `metadata.restaurant_id` está ausente ou inválido e o `customer` não existe em `merchant_subscriptions`. O Core insere `reason = 'tenant_not_found'`.
- **SQL antes:** Escolher um `restaurant_id` que **não** vá ser resolvido (payload sem metadata ou com customer desconhecido). Não é necessário alterar estado desse restaurante; o objectivo é não criar/alterar nenhuma linha em `gm_restaurants`.
- **SQL depois (Edge):** Se o teu endpoint for o Supabase Edge:
  ```sql
  SELECT id, restaurant_id, provider, event_id, event_type, reason, created_at
  FROM billing_incidents
  WHERE reason IN ('no_tenant', 'tenant_not_found')
  ORDER BY created_at DESC LIMIT 1;
  ```
- **Esperado:** Uma linha com `reason = 'no_tenant'` (Edge) ou `'tenant_not_found'` (Core); `restaurant_id` pode ser NULL (Edge). Nenhum update em `gm_restaurants` para esse evento.

---

## Resumo Parte 3

| Cenário           | Como forçar                                                                 | Verificação SQL (resumo)                                                                 |
|-------------------|-----------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| currency_mismatch | Webhook com restaurant_id EUR e currency do payload = usd                    | `billing_incidents.reason = 'currency_mismatch'`; `gm_restaurants` inalterado             |
| price_mismatch    | Webhook com price_id fora de `billing_plan_prices` para esse tenant/moeda   | `billing_incidents.reason = 'price_mismatch'`; estado inalterado                         |
| stale_event       | Evento com `created` &lt;= `last_billing_event_at`                         | `billing_incidents.reason = 'stale_event'`; estado inalterado                             |
| no_tenant         | Webhook sem restaurant_id válido (e sem customer em merchant_subscriptions) | `billing_incidents.reason` IN ('no_tenant','tenant_not_found'); nenhum update em gm_restaurants |

---

# Referências cruzadas

- [BILLING_FLOWS_MANUAL_CHECKLIST.md](./BILLING_FLOWS_MANUAL_CHECKLIST.md) — checklist original de fluxos.
- [BILLING_FREEZE_PHASE_CHECKLIST.md](./BILLING_FREEZE_PHASE_CHECKLIST.md) — critérios de fecho da fase.
- [BILLING_CANCEL_RESUBSCRIBE_CHECKLIST.md](./BILLING_CANCEL_RESUBSCRIBE_CHECKLIST.md) — cancel + re-subscribe (Parte 1.3).
- [E2E_BILLING_THREE_CURRENCIES_RUNBOOK.md](./E2E_BILLING_THREE_CURRENCIES_RUNBOOK.md) — §1 script E2E; §2–§5 tenants, webhook, cross-currency, UI.
- [RUNBOOKS.md](./RUNBOOKS.md) §6.1 — índice Billing e webhooks.
- [docker-core/MIGRATIONS.md](../../docker-core/MIGRATIONS.md) — ordem das migrações.
- Core: `docker-core/schema/migrations/20260327_stripe_sync_billing_incidents.sql` — guards e inserção em `billing_incidents`.
- Edge: `supabase/functions/webhook-stripe/index.ts` — guard `no_tenant` e chamada ao RPC.
