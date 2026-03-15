# Schema Supabase compatível com fluxo soberano (P0.2)

## Objetivo

O seed canónico (`merchant-portal/scripts/seed-e2e-user.ts`) precisa que o projeto Supabase tenha as tabelas:

- **`gm_companies`** — empresa (owner_id, name, plan, status)
- **`gm_restaurants`** — restaurante (company_id, owner_id, name, slug, status)
- **`gm_restaurant_members`** — membership (restaurant_id, user_id, role)

Sem elas, o seed falha com: *"Could not find the table 'public.gm_companies' in the schema cache"* e não cria company/restaurant/membership.

---

## Fonte canónica do schema

- **Baseline (tabelas core):** `supabase/migrations/20260222111218_baseline_existing_production_schema.sql`  
  Cria `gm_restaurants`, `gm_restaurant_members`, `saas_tenants` e outras tabelas do Core. **Não** cria `gm_companies`.

- **Fluxo soberano (gm_companies + company_id):** `supabase/migrations/20260328000000_gm_companies_sovereign_flow.sql`  
  Cria `gm_companies`, adiciona `company_id` a `gm_restaurants` e define RLS/grants mínimos para o seed e para a app.

---

## Ordem de aplicação (Supabase)

As migrations em `supabase/migrations/` devem ser aplicadas **por ordem de nome**:

1. `20260222111218_baseline_existing_production_schema.sql` — tabelas base (gm_restaurants, gm_restaurant_members, etc.)
2. `20260222113000_security_hardening.sql`
3. `20260222113100_fk_indexes_hardening.sql`
4. `20260222113500_rpc_dashboard_functions.sql`
5. `20260222120000_rls_webhook_events_supabase.sql`
6. `20260222140000_stripe_subscription_sync.sql`
7. `20260223000000_stripe_sync_timestamp_guard.sql`
8. `20260224_core_rls_policies.sql`
9. `20260325_billing_incidents.sql`
10. `20260326_billing_incidents_index_and_view.sql`
11. `20260327_stripe_sync_billing_incidents.sql`
12. **`20260328000000_gm_companies_sovereign_flow.sql`** — obrigatória para o seed criar company + restaurant + membership
13. **`20260310000000_gm_restaurants_supabase_optional_columns.sql`** — opcional: colunas de identidade/config em `gm_restaurants` (city, address, type, logo_url, country, timezone, currency, locale, disabled_at, trial_ends_at, etc.) e tabela `restaurant_setup_status`. Necessária para `/admin/config/general` funcionar sem fallback mínimo (evita 400 por colunas ausentes).

---

## Caminho recomendado para alinhar o Supabase

### Opção A — Supabase CLI (recomendado)

Com o [Supabase CLI](https://supabase.com/docs/guides/cli) ligado ao teu projeto:

```bash
# Na raiz do repo
supabase link --project-ref <TEU_PROJECT_REF>
supabase db push
```

Isto aplica todas as migrations pendentes por ordem. Garante que `supabase/migrations/` contém o baseline e a migration `20260328000000_gm_companies_sovereign_flow.sql`.

### Opção B — Script com DATABASE_URL (Node)

Se tiveres a connection string da base (Supabase Dashboard → Project Settings → Database → **Connection string** → URI):

1. Adiciona ao `.env.local`: `DATABASE_URL=postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`
2. Na pasta `merchant-portal`: `pnpm tsx scripts/apply-sovereign-schema.ts`
3. O script aplica a migration e recarrega o schema cache; depois corre o seed.

### Opção C — Aplicar manualmente no SQL Editor (Supabase Dashboard)

Se não usares a CLI nem tiveres DATABASE_URL:

1. No Dashboard do Supabase: **SQL Editor**.
2. Abre o ficheiro **`supabase/migrations/20260328000000_gm_companies_sovereign_flow.sql`** no repo, copia todo o conteúdo e cola no SQL Editor.
3. Clica **Run**. Deve criar a tabela `gm_companies` e a coluna `company_id` em `gm_restaurants`.
4. Opcional: para refrescar o schema cache do PostgREST, executa: `NOTIFY pgrst, 'reload schema';`
5. Correr o seed: `cd merchant-portal && pnpm tsx scripts/seed-e2e-user.ts`

Se o projeto estiver **vazio** de schema (sem `gm_restaurants`), é preciso primeiro aplicar o baseline (ver ordem de aplicação acima) e só depois esta migration.

---

## Outras tabelas obrigatórias para o fluxo

Para o **seed** e para o **Admin (TenantContext, topbar)** funcionarem, é suficiente:

- `gm_companies` (nova migration)
- `gm_restaurants` (baseline) + coluna `company_id` (nova migration)
- `gm_restaurant_members` (baseline)

As policies RLS para `gm_restaurants` e `gm_restaurant_members` estão em `20260224_core_rls_policies.sql`; a nova migration adiciona RLS para `gm_companies`.

---

## Colunas opcionais para /admin/config/general

Para a página **Admin → Configuração → General** (`/admin/config/general`) carregar sem erros 400 (e sem depender do fallback mínimo do RuntimeReader), o Supabase deve ter as colunas de identidade/config em `gm_restaurants` e a tabela `restaurant_setup_status`:

- **Migration:** `supabase/migrations/20260310000000_gm_restaurants_supabase_optional_columns.sql`
- **Colunas adicionadas em gm_restaurants (se não existirem):** type, city, address, logo_url, country, timezone, currency, locale, disabled_at, trial_ends_at, product_mode, billing_status
- **Tabela:** `restaurant_setup_status` (restaurant_id, sections jsonb)

**Aplicar com script (requer DATABASE_URL no .env.local):**

```bash
cd merchant-portal && pnpm tsx scripts/apply-optional-restaurant-columns.ts
```

Ou copiar o conteúdo da migration para o **SQL Editor** do Supabase e executar. Depois: `NOTIFY pgrst, 'reload schema';` para refrescar o PostgREST.

---

## Depois de aplicar o schema

1. Confirma no Supabase (Table Editor ou SQL) que existem as tabelas `gm_companies`, `gm_restaurants`, `gm_restaurant_members` e que `gm_restaurants` tem a coluna `company_id`.
2. Se aplicaste a migration opcional, confirma que `gm_restaurants` tem city, address, type, logo_url, country, timezone, currency, locale (e que `restaurant_setup_status` existe).
3. No `merchant-portal`: `.env.local` com `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
4. Correr o seed: `cd merchant-portal && pnpm tsx scripts/seed-e2e-user.ts`.
5. Validar login e Admin conforme `docs/ops/FLUXO_SOBERANO_VALIDACAO_ADMIN.md`. Abrir `/admin/config/general` e confirmar que não há 400 por colunas ausentes.

---

## Referências

- Seed: `merchant-portal/scripts/seed-e2e-user.ts`
- Aplicar schema soberano (gm_companies): `merchant-portal/scripts/apply-sovereign-schema.ts`
- Aplicar colunas opcionais (gm_restaurants + restaurant_setup_status): `merchant-portal/scripts/apply-optional-restaurant-columns.ts`
- Runbook seed: `docs/ops/SEED_OWNER_SOBERANO.md`
- Validação Admin: `docs/ops/FLUXO_SOBERANO_VALIDACAO_ADMIN.md`
- Roadmap: `docs/roadmap/FLUXO_SOBERANO_INTEGRADO.md`
