# Supabase em excelência total

Guia para deixar o projeto **ChefApp-pos-core** no Supabase com todas as migrações aplicadas, RLS e extensões alinhadas ao Core.

---

## Finalizar Supabase (checklist)

1. **Supabase** → Project Settings → **Database** → **Connection string** → **URI** → copiar e substituir `[YOUR-PASSWORD]` pela password da base.
2. Na raiz do repo (terminal):
   ```bash
   export DATABASE_URL="postgresql://postgres:TUA_PASSWORD@db.TEU_REF.supabase.co:5432/postgres"
   pnpm run supabase:finalize
   ```
3. Esperar o script terminar (todas as migrações aplicadas).
4. Opcional: Supabase Dashboard → **Restart project** (ou aguardar ~30 s) para o PostgREST atualizar o schema.
5. Validar: Table Editor deve listar dezenas de tabelas; a app (Suscripción, Integrações, etc.) não deve dar 404 por tabelas/RPCs em falta.

**Pré-requisito:** `psql` instalado (`brew install libpq` no macOS se não tiveres).

---

## 1. Obter a connection string (Supabase)

1. **Dashboard** → teu projeto **ChefApp-pos-core** → **Project Settings** → **Database**.
2. Em **Connection string** escolhe **URI**.
3. Copia a string e substitui `[YOUR-PASSWORD]` pela password da base de dados (a mesma que definiste ao criar o projeto, ou repõe em **Database** → **Reset database password**).
4. Para migrações usa a **conexão direta** (porta **5432**), não o pooler (6543):
   - Formato: `postgresql://postgres.[project-ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres`
   - Ou (conexão direta): `postgresql://postgres:[PASSWORD]@db.[project-ref].supabase.co:5432/postgres`
   - Em **Connection string** no dashboard há a opção "Direct connection" / "Session mode" — usa essa.

Guarda a URI como variável de ambiente (nunca faças commit):

```bash
export DATABASE_URL="postgresql://postgres:TUA_PASSWORD@db.XXXX.supabase.co:5432/postgres"
```

---

## 2. Base (só se o projeto for novo)

Se o Supabase for **novo** (quase sem tabelas), aplica primeiro o schema base:

```bash
psql "$DATABASE_URL" -f docker-core/schema/core_schema.sql
```

Se já tens dezenas de tabelas (gm_restaurants, gm_orders, etc.), podes saltar este passo.

---

## 3. Aplicar todas as migrações (um comando)

Na **raiz do repositório** (com `DATABASE_URL` já definido):

```bash
pnpm run supabase:finalize
```

Ou diretamente: `./scripts/apply-migrations-supabase.sh`

O script:

- Usa `DATABASE_URL` (obrigatório).
- Aplica, por **ordem cronológica**, todos os ficheiros em `docker-core/schema/migrations/*.sql`.
- Cada migração usa `CREATE TABLE IF NOT EXISTS` / `CREATE OR REPLACE FUNCTION` etc., por isso é seguro re-executar (idempotente).
- Se uma migração falhar, o script para e reporta o ficheiro.

**Pré-requisito:** `psql` instalado (macOS: `brew install libpq` ou Postgres app; Linux: `postgresql-client`).

---

## 4. O que fica aplicado (resumo)

| Área | Tabelas / objetos |
|------|--------------------|
| **Core** | saas_tenants, gm_restaurants, gm_orders, gm_order_items, gm_products, gm_tables, gm_staff, gm_terminals, gm_cash_registers, gm_payments, event_store, legal_seals |
| **Billing** | billing_configs, billing_plans, merchant_subscriptions, billing_invoices, RPCs create_checkout_session / create_saas_portal_session |
| **Catálogo** | gm_catalog_menus, gm_catalog_categories, gm_catalog_items |
| **Inventário** | gm_locations, gm_equipment, gm_ingredients, gm_stock_levels, gm_stock_ledger, gm_product_bom |
| **Tasks** | gm_tasks, shift_logs, gm_task_packs, gm_task_templates |
| **Integrações** | api_keys, webhook_out_config, webhook_out_delivery_log, webhook_events, gm_integration_credentials |
| **Multi-unidade** | gm_organizations, gm_org_members, views/rpc get_multiunit_overview |
| **Auditoria** | gm_audit_logs, core_event_log, gm_device_heartbeats |
| **Outros** | gm_reservations, gm_customers, gm_fiscal_*, gm_refunds, gm_onboarding_state, etc. |

Após o script, o Supabase fica com o **schema completo** do Core, em excelência total.

---

## 5. Reiniciar cache do PostgREST (Supabase)

O Supabase expõe a base via PostgREST. Após migrações:

1. **Dashboard** → **Project Settings** → **API**.
2. Opcional: **Restart project** (ou só aguardar alguns segundos) para o PostgREST recarregar o schema.

Em projetos hospedados, o reload do schema é normalmente automático após alguns segundos.

---

## 6. Validar

- **Table Editor**: todas as tabelas listadas em §3 devem existir no schema `public`.
- **SQL Editor**: `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';` — o número deve ser elevado (dezenas de tabelas).
- **App**: login no portal, Suscripción, Integrações, Dashboard multi-unidade — não devem dar 404 por tabelas ou RPCs em falta.

---

## 7. Troubleshooting

| Erro | Solução |
|------|--------|
| `psql: command not found` | Instalar cliente Postgres: `brew install libpq` (macOS) e usar `$(brew --prefix libpq)/bin/psql` ou adicionar ao PATH. |
| `connection refused` ou `timeout` | Verificar DATABASE_URL (host, porta 5432, password). No Supabase, em **Database** → **Network**, permitir o teu IP se estiver restrito. |
| `relation "xxx" already exists` | Normal se já aplicaste migrações antes; as migrações usam `IF NOT EXISTS`. Podes ignorar ou garantir que o script não falha nesse caso. |
| `permission denied` | A connection string deve usar o role `postgres` (ou um role com permissão para CREATE TABLE/FUNCTION). |

---

## 8. Ordem das migrações

O script aplica os ficheiros em `docker-core/schema/migrations/` ordenados por **nome do ficheiro** (ex.: 20260126_*, 20260127_*, …, 20260331_*). Essa ordem é a ordem cronológica definida no repositório e deve ser respeitada.

Se quiseres aplicar manualmente no **SQL Editor** do Supabase, copia e executa o conteúdo de cada `.sql` por essa mesma ordem (do mais antigo ao mais recente).
