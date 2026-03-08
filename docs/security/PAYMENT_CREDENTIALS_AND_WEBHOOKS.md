# Credenciais de Pagamento e Webhooks — Segurança

Regras para (1) armazenamento e uso de chaves Stripe/SumUp por restaurante, (2) validação de webhooks e atualização de estado, (3) separação entre pagamento SaaS e pagamento transação.

Ver também: [PAYMENT_AND_POSITIONING.md](../legal/PAYMENT_AND_POSITIONING.md), [PAYMENT_LAYER.md](../architecture/PAYMENT_LAYER.md), [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](../architecture/CORE_BILLING_AND_PAYMENTS_CONTRACT.md).

---

## 1. Onde ficam as credenciais

| Uso | Local | Quem lê |
|-----|--------|---------|
| **Billing SaaS** (assinatura ChefIApp) | Variáveis de ambiente da plataforma (`STRIPE_SECRET_KEY`, etc.) no servidor que expõe checkout/portal. | Apenas o serviço de billing (integration-gateway ou Core) nas rotas exclusivas de SaaS (ex.: `/api/v1/billing/*`, criação de sessão Stripe para assinatura). Nunca ler `gm_integration_credentials` para billing SaaS. |
| **Pagamento transação** (cliente do restaurante) | Tabela **gm_integration_credentials** no Core (Postgres). Colunas: `restaurant_id`, `provider` (ex.: `stripe`, `sumup`), `credential_type`, `encrypted_data` (pgcrypto). | Integration-gateway (ou Core) ao criar PaymentIntent/checkout para um pedido: obtém credencial por `restaurant_id` + `provider` via RPC e usa apenas em memória para a chamada ao gateway externo. |

A tabela `gm_integration_credentials` e as RPCs `store_integration_credential` e `read_integration_credential` estão definidas em [docker-core/schema/migrations/20260305_integration_credentials.sql](../../docker-core/schema/migrations/20260305_integration_credentials.sql).

---

## 2. Chave de encriptação

- A encriptação em repouso usa **pgcrypto** com chave simétrica. O RPC `read_integration_credential` recebe `p_encryption_key`.
- **Não usar chave hardcoded.** A chave deve vir de variável de ambiente (ex.: `INTEGRATION_CREDENTIALS_ENCRYPTION_KEY`) ou de um vault. O código que invoca o Core (gateway ou serviço interno) deve passar essa chave ao chamar a RPC.
- Em desenvolvimento, se existir valor default no schema, garantir que em produção o default não é usado; exigir env.

---

## 3. Acesso às credenciais

- Acesso às credenciais apenas via RPCs **SECURITY DEFINER** que validam que o caller tem acesso ao `restaurant_id` (ex.: via `auth.uid()` e `gm_restaurant_members`). A política RLS em `gm_integration_credentials` já restringe por restaurante.
- **Logs:** Nunca logar o payload desencriptado nem as chaves. Logar apenas `restaurant_id`, `provider`, e resultado (sucesso/erro ou tipo de erro genérico).

---

## 4. Quem usa as credenciais

### 4.1 Integration-gateway (pagamento transação)

- Nas rotas de criação de checkout (Stripe PaymentIntent, SumUp checkout, PIX), o gateway deve receber `restaurant_id` no body ou header (autorizado por token interno).
- Fluxo: gateway chama o Core (RPC ou endpoint interno autenticado) para obter credenciais do restaurante para o provider solicitado; usa essa credencial apenas para a chamada ao gateway externo; descarta após uso.
- Se não existir credencial para o restaurante/provider: fallback para “modo manual” ou erro claro ao cliente. **Não usar a chave da plataforma (env) para transação do restaurante.**

### 4.2 Billing SaaS (assinatura ChefIApp)

- Usar **apenas** variáveis de ambiente da plataforma (`STRIPE_SECRET_KEY`, etc.).
- Rotas/contexto separados (ex.: apenas em `chefiapp.com` e paths `/app/billing`, `/api/v1/billing/*`). Nunca ler `gm_integration_credentials` para billing SaaS.

---

## 5. Separação explícita no código

- No gateway, rotas claramente separadas:
  - **SaaS:** ex. `/api/v1/billing/*` — apenas env keys; venda da plataforma.
  - **Transação restaurante:** ex. `/api/v1/payment/*`, `/api/v1/sumup/*`, `/api/v1/restaurant-payment/*` — credenciais por `restaurant_id` (via Core).
- Documentar esta separação no [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](../architecture/CORE_BILLING_AND_PAYMENTS_CONTRACT.md) e no [PAYMENT_LAYER.md](../architecture/PAYMENT_LAYER.md) (já referido).

---

## 6. Webhooks

### 6.1 Validação

- **Stripe:** Validar assinatura com `Stripe-Signature` e webhook secret (por conta/contexto). Em falha de validação: responder 401/400 e não atualizar estado.
- **SumUp / PIX:** Conforme documentação de cada provider; validar assinatura ou token quando aplicável. Em falha: responder 401/400 e não atualizar estado.

### 6.2 Lógica do handler

- Apenas: atualizar estado do pagamento (ex.: tabela `payments` ou equivalente no Core) e notificar o resto do sistema (evento interno ou Webhooks OUT). Não executar lógica de negócio que mova fundos; apenas “marcar como pago” e reconciliar.
- Idempotência: usar `event_id` ou equivalente para evitar processar o mesmo evento mais de uma vez.

### 6.3 Logging

- Não logar o corpo do webhook em claro (pode conter dados sensíveis). Logar apenas `event_id`, `type`, `payment_id` (ou referência) e resultado (sucesso/falha).

---

## 7. Checklist de implementação

| # | Item | Estado |
|---|------|--------|
| 1 | Chave de encriptação em variável de ambiente (`INTEGRATION_CREDENTIALS_ENCRYPTION_KEY` ou equivalente); não hardcoded. | A definir na implementação |
| 2 | Gateway recebe `restaurant_id` nas rotas de payment transação e chama Core para obter credenciais por restaurante. | A definir na implementação |
| 3 | Rotas de billing SaaS não usam `gm_integration_credentials`; usam apenas env da plataforma. | Já separado por path/origem (billing vs payment) |
| 4 | Todos os webhooks (Stripe, SumUp, PIX) validam assinatura antes de processar; em falha respondem 401/400. | A verificar/implementar por rota |
| 5 | Handlers de webhook não logam payload sensível; apenas event_id, type, payment_id, resultado. | A verificar na implementação |

Implementação em fases sugerida: (1) garantir encryption key em env e uso na RPC; (2) gateway a passar `restaurant_id` e a obter credenciais do Core para um provider (ex.: SumUp); (3) generalizar para Stripe/PIX; (4) revisar todos os webhooks e logs.

---

## 8. Referências

- [PAYMENT_AND_POSITIONING.md](../legal/PAYMENT_AND_POSITIONING.md) — Posicionamento jurídico; separação SaaS vs transação.
- [PAYMENT_LAYER.md](../architecture/PAYMENT_LAYER.md) — Arquitetura do módulo de pagamento.
- [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](../architecture/CORE_BILLING_AND_PAYMENTS_CONTRACT.md) — Contrato Core billing e pagamentos.
- [20260305_integration_credentials.sql](../../docker-core/schema/migrations/20260305_integration_credentials.sql) — Schema e RPCs de credenciais.
