# 📘 Day 6 – Implementation Report

**Date**: 2026-02-21  
**Scope**: Monitoring, payment integration, load testing, security hardening  
**Status**: ✅ Completed

---

## 1. Monitoring Infrastructure (Phase 1)

**Migration**: `docker-core/schema/migrations/20260330_day6_monitoring_functions.sql`  
**Gateway**: `integration-gateway/src/index.ts` + `MonitoringService`

- **RPCs criados**:
  - `get_webhook_delivery_metrics(p_restaurant_id UUID, p_hours INT DEFAULT 24)`
  - `get_failed_deliveries_alert(p_max_age_hours INT DEFAULT 1)`
  - `get_webhook_performance_metrics()`
  - `get_payment_to_delivery_latency(p_hours INT DEFAULT 24)`
- **Índices** em `webhook_deliveries` e `webhook_events` para suportar:
  - filtros por `restaurant_id`, `status`, `created_at`, `next_retry_at`
  - consultas de latência e throughput
- **Endpoints de monitorização** no gateway:
  - `GET /api/v1/monitoring/restaurant/:restaurantId`
  - `GET /api/v1/monitoring/alerts`
  - `GET /api/v1/monitoring/duplicates`
  - `GET /api/v1/monitoring/performance`
  - `GET /api/v1/monitoring/latency`
  - `GET /api/v1/monitoring/dashboard`

**Resultado**: o Core consegue expor métricas por restaurante e de sistema, com latências P50/P95/P99, taxa de sucesso e alertas de falhas.

---

## 2. Payment Integration (Phase 2)

**Migration**: `docker-core/schema/migrations/20260331_day6_payment_integration.sql`  
**Service**: `integration-gateway/src/services/payment-integration.ts`  
**Gateway**: `integration-gateway/src/index.ts`

- **Tabela nova**: `merchant_code_mapping`
  - Mapeia `provider + merchant_code` → `restaurant_id`
  - Permite múltiplos providers (Stripe, SumUp, etc.) por restaurante
- **Colunas novas**:
  - `webhook_events`: `order_id`, `merchant_code`, `payment_reference`, `order_status_before`, `order_status_after`
  - `gm_orders`: `payment_method`, `payment_amount`, `payment_date`, `last_payment_event_id`
- **RPCs**:
  - `resolve_restaurant_from_merchant_code(merchant_code, provider)`
  - `link_payment_to_order(order_id, webhook_event_id, payment_status, payment_amount)`
  - `get_pending_order_payments(restaurant_id, max_age_minutes)`
  - `update_order_from_payment_event(webhook_event_id, payment_status, payment_amount)`
- **Endpoints**:
  - `GET /api/v1/payment/resolve-merchant/:merchantCode`
  - `GET /api/v1/payment/pending/:restaurantId`
  - `GET /api/v1/payment/merchants/:restaurantId`
  - `POST /api/v1/payment/merchants`
  - `GET /api/v1/payment/summary/:restaurantId`
  - `POST /api/v1/payment/link-order`
  - `POST /api/v1/payment/update-from-event`

**Resultado**: eventos de pagamento de SumUp/Stripe são resolvidos para restaurante + order, atualizando `gm_orders.payment_status` e ligando `webhook_events` à ordem.

---

## 3. Load Testing & Performance (Phase 3)

**Scripts**:
- `scripts/day6_seed_payment_fixtures.sh`
- `scripts/day6_load_test.sh`
- `integration-gateway/src/run-load-tests.ts` (runner TypeScript)

### 3.1 Seed determinístico

- Cria:
  - `gm_restaurants(id=LOADTEST_RESTAURANT_ID)`
  - `gm_orders(id=LOADTEST_ORDER_ID, payment_status='PENDING')`
  - `webhook_events(id=LOADTEST_WEBHOOK_EVENT_ID, merchant_code=LOADTEST_MERCHANT_CODE)`
  - `merchant_code_mapping` coerente com o restaurante de teste
- Garante que os testes de escrita têm dados válidos para resolver order/payment.

### 3.2 Load test (bash)

- Cenários:
  - Normal load (≈50 req/min)
  - Peak load (100+ req/min concorrentes)
  - Merchant resolution
  - Pending payment queries
  - Mixed operations
- Métricas:
  - Latências (P50, P95, P99)
  - Sucesso vs erro
  - Throughput (req/min)
- Saída em `load-test-results/`:
  - `latencies.txt`
  - `errors.txt`
  - `summary.txt`

### 3.3 Resultados (seeded rerun)

- Bash suite:
  - 290 requests, **100% sucesso**
  - Latências típicas: P50 ≈ 29ms, P95 ≈ 97ms, P99 ≈ 186ms
- TypeScript suite:
  - 355 requests, **100% sucesso**
  - Latências típicas: P50 ≈ 6ms, P95 ≈ 13ms, P99 ≈ 43ms

**Resultado**: infraestrutura suporta o perfil de carga desenhado, com latência e taxa de sucesso dentro dos limites definidos para ambiente local.

---

## 4. Security Hardening (Phase 4)

### 4.1 Encriptação de segredos de webhook (Core)

**Migration**: `docker-core/schema/migrations/20260332_day6_webhook_security.sql`

- **Alterações em `webhook_secrets`**:
  - `secret_encrypted BYTEA` – armazenamento cifrado do segredo
  - `secret_hash TEXT` – hash SHA-256 (hex) para comparação não reversível
- **Extensão**:
  - `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
- **RPCs**:
  - `store_webhook_secret_encrypted(p_webhook_id UUID, p_secret_plain TEXT, p_master_key TEXT)`
    - Encripta `p_secret_plain` com `pgp_sym_encrypt`
    - Calcula `secret_hash` com `digest(..., 'sha256')`
    - Atualiza `webhook_secrets` (mantendo `secret_key` a `NULL` após migração)
  - `verify_webhook_signature_encrypted(p_webhook_id UUID, p_payload TEXT, p_signature TEXT, p_master_key TEXT)`
    - Desencripta `secret_encrypted` com `pgp_sym_decrypt` (ou cai em `secret_key` legacy)
    - Calcula assinatura HMAC-SHA256 do payload
    - Compara com `p_signature` (hex, case-insensitive)
- **Segurança**:
  - Funções com `SECURITY DEFINER` e `search_path = public`
  - `GRANT EXECUTE` apenas para `service_role`
  - `REVOKE ALL ON public.webhook_secrets FROM anon;`

**Integração esperada**:
- Gateway passa a chamar estes RPCs com uma master key de runtime (ex.: `WEBHOOK_SECRET_KEY`) para:
  - Rotacionar segredos de SumUp/Stripe sem expor texto claro
  - Validar assinaturas sem manter chaves em ficheiros `.env` em claro

### 4.2 Rate Limiting no Integration Gateway

**Ficheiro**: `integration-gateway/src/index.ts`

- **Implementado** um rate limiter em memória:
  - Por restaurante:
    - Limite por defeito: **50 pedidos/minuto**
    - Chave: `restaurant:<restaurantId>`
    - Window: 60s
  - Por IP:
    - Limite por defeito: **1000 pedidos/hora**
    - Chave: `ip:<clientIp>`
    - Window: 3600s
- **Configuração via env**:
  - `RATE_LIMIT_RESTAURANT_PER_MINUTE` (default `50`)
  - `RATE_LIMIT_IP_PER_HOUR` (default `1000`)
- **Escopo**:
  - Middleware global em `app.use(rateLimitMiddleware)`
  - `/health` excluído explicitamente do rate limiting
  - Detecção de `restaurantId` best-effort a partir de:
    - `body.restaurantId` / `body.restaurant_id`
    - `params.restaurantId`
    - `query.restaurantId`
- **Respostas**:
  - 429 com corpo JSON:
    - Para restaurante: `{ error, restaurant_id, limit_per_minute, timestamp }`
    - Para IP: `{ error, ip, limit_per_hour, timestamp }`

**Resultado**: gateway protegido contra bursts acidentais ou maliciosos por restaurante/IP, sem bloquear health checks e com configuração via env.

---

## 5. Verificação & Como Reproduzir

### 5.1 Aplicar migrations

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
# usar scripts padrão de migrations do projeto
bash scripts/apply-migrations-supabase.sh
```

### 5.2 Gateway + testes de carga

```bash
# 1. Seed fixtures de pagamento
bash scripts/day6_seed_payment_fixtures.sh

# 2. Arrancar gateway
pnpm run dev:gateway

# 3. Correr load tests
./scripts/day6_load_test.sh

# 4. Ver sumário
cat load-test-results/summary.txt
```

### 5.3 Webhook secrets

- Criar entrada em `webhook_secrets` para provider (ex.: SumUp).
- Chamar `store_webhook_secret_encrypted` a partir de um cliente privilegiado (`service_role`), passando:
  - `p_webhook_id`
  - `p_secret_plain`
  - `p_master_key` (derivado de `WEBHOOK_SECRET_KEY`)
- Opcionalmente, usar `verify_webhook_signature_encrypted` para validar uma assinatura de teste, antes de integrar com o gateway.

---

## 6. Estado Final do Day 6

- ✅ Phase 1 – Monitoring RPCs + endpoints
- ✅ Phase 2 – Payment integration (RPCs + endpoints)
- ✅ Phase 3 – Load testing (bash + TypeScript, seeded rerun verde)
- ✅ Phase 4 – Security hardening (encryption + rate limiting)

Day 6 está pronto para ser usado como base para o **Day 7: validação abrangente, edge cases e checklist de produção**.

