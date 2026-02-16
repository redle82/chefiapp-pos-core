# dbmate - Database Migration Tool

## Setup
```bash
brew install dbmate                    # macOS
# or
curl -fsSL -o /usr/local/bin/dbmate \
  https://github.com/amacneil/dbmate/releases/latest/download/dbmate-linux-amd64  # Linux
```

## Usage
```bash
cd docker-core
export DATABASE_URL="postgres://postgres:postgres@localhost:5433/chefiapp?sslmode=disable"
dbmate up           # Apply pending migrations
dbmate status       # Show migration status
dbmate new <name>   # Create new migration
dbmate rollback     # Rollback last migration
```

## Convention
- Migrations live in `docker-core/schema/migrations/`
- Format: `YYYYMMDDHHMMSS_description.sql`
- Each file must have `-- migrate:up` and `-- migrate:down` sections

## Example
```sql
-- migrate:up
CREATE TABLE example (id uuid PRIMARY KEY DEFAULT gen_random_uuid());

-- migrate:down
DROP TABLE IF EXISTS example;
```

## Migrations de referência

| Ficheiro | Descrição | Contrato |
|----------|-----------|----------|
| `20260225_restaurant_logo_url.sql` | Coluna `logo_url` em `gm_restaurants` (identidade visual: web pública, KDS, TPV, AppStaff) | [RESTAURANT_LOGO_IDENTITY_CONTRACT](../../docs/architecture/RESTAURANT_LOGO_IDENTITY_CONTRACT.md) |
| `20260226_sofia_gastrobar_real_identity.sql` | Identidade real Sofia Gastrobar (email dono, city, address, country, type, etc.) | [SOFIA_GASTROBAR_REAL_PILOT](../../docs/architecture/SOFIA_GASTROBAR_REAL_PILOT.md) |
| `20260301_webhook_out_config.sql` | Webhooks OUT: `webhook_out_config`, `webhook_out_delivery_log` (Integrações → APIs & Webhooks) | [CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC](../../docs/CHEFIAPP_EVENT_BUS_WEBHOOKS_SPEC.md) |
| `20260301_api_keys.sql` | API Keys para API pública v1 (Integrações → API IN) | [CHEFIAPP_API_PUBLICA_V1_SPEC](../../docs/CHEFIAPP_API_PUBLICA_V1_SPEC.md) |
| `20260222_merchant_subscriptions.sql` | Assinaturas, planos e RPCs Stripe placeholder (`create_checkout_session`, `create_saas_portal_session`) | Faturação /app/billing |
| `20260221_device_heartbeats_and_runtime_views.sql` | Views de runtime (TPV/KDS online). Pré-requisito de `get_multiunit_overview`. | Dashboard multi-unidade |
| `20260221_multiunit_aggregate_views.sql` | RPC `get_multiunit_overview` e views de faturação/tasks/stock por restaurante | Dashboard multi-unidade (/admin/reports/overview) |
| `20260211_core_audit_logs.sql` | Tabela `gm_audit_logs` (trilha de auditoria, eventos fiscais FISCAL_SYNC_*) | Observabilidade → Sync Fiscal (/admin/observability) |

## Erro "relation public.gm_audit_logs does not exist" (Observabilidade → Sync Fiscal)

Se na página **Observabilidade** (`/admin/observability`) aparecer o erro `relation "public.gm_audit_logs" does not exist`, a migração de audit logs não está aplicada. Para ativar a secção Sync Fiscal:

```bash
cd docker-core
dbmate up
```

Ou manualmente (Postgres na porta 54320):

```bash
psql -h localhost -p 54320 -U postgres -d chefiapp_core -f schema/migrations/20260211_core_audit_logs.sql
```

Reinicie o PostgREST para atualizar o schema: `docker compose -f docker-compose.core.yml restart postgrest`.

## Erro 404 get_multiunit_overview (dashboard multi-unidade)

Se na consola aparecer `POST .../rpc/get_multiunit_overview 404 (Not Found)`, a migração de views multi-unidade não está aplicada. O portal trata o RPC como opcional (após o primeiro 404 deixa de repetir o pedido para evitar ruído). Para ativar o dashboard multi-unidade:

```bash
cd docker-core
export DATABASE_URL="postgres://postgres:postgres@localhost:5433/chefiapp?sslmode=disable"
dbmate up
```

Se usar Postgres na porta 54320 (docker-compose.core.yml):

```bash
psql -h localhost -p 54320 -U postgres -d chefiapp_core -f schema/migrations/20260221_device_heartbeats_and_runtime_views.sql
psql -h localhost -p 54320 -U postgres -d chefiapp_core -f schema/migrations/20260221_multiunit_aggregate_views.sql
```

Reinicie o PostgREST para atualizar o schema: `docker compose -f docker-compose.core.yml restart postgrest`.

## Erro PGRST202 na Faturação (create_checkout_session não encontrada)

Se na página **Faturação** (`/app/billing`) aparecer o erro `Could not find the function public.create_checkout_session(cancel_url, price_id, success_url)`, a migração de assinaturas não está aplicada (por exemplo, o volume do Postgres foi criado antes desta migração existir no init). Aplique manualmente:

```bash
cd docker-core
# Postgres na porta 54320 (docker-compose.core.yml)
psql -h localhost -p 54320 -U postgres -d chefiapp_core -f schema/migrations/20260222_merchant_subscriptions.sql
```

Reinicie o PostgREST para atualizar o schema cache (ou reinicie o stack: `docker compose -f docker-compose.core.yml restart postgrest`).

## Aplicar migrações de integração manualmente (psql)

Se as tabelas `api_keys`, `webhook_out_config` ou `webhook_out_delivery_log` não existirem, o portal em Integrações → APIs & Webhooks pode devolver 404. Aplique as migrações:

```bash
cd docker-core
# Postgres na porta 54320 (docker-compose.core.yml)
psql -h localhost -p 54320 -U postgres -d chefiapp_core -f schema/migrations/20260301_webhook_out_config.sql
psql -h localhost -p 54320 -U postgres -d chefiapp_core -f schema/migrations/20260301_api_keys.sql
```
