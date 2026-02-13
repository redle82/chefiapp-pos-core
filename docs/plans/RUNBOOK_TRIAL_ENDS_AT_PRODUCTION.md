# Runbook — Aplicar `trial_ends_at` em produção

**Objetivo:** Garantir que a coluna `trial_ends_at` existe em `gm_restaurants` no Core de produção, para o paywall e countdown (FASE 1 Vendável PT) funcionarem com dados reais.

---

## 1. Verificar se já existe

No SQL Editor da base de dados de produção:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'gm_restaurants'
  AND column_name = 'trial_ends_at';
```

- Se devolver uma linha: a coluna já existe; não é necessário aplicar.
- Se devolver zero linhas: aplicar o passo 2.

---

## 2. Aplicar a migration

Executar o seguinte SQL na base de dados de produção (Supabase SQL Editor, InsForge, ou cliente psql ligado ao Postgres de produção):

```sql
-- FASE 1: trial_ends_at para paywall e countdown
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

COMMENT ON COLUMN public.gm_restaurants.trial_ends_at IS 'Fim do período de trial (14 dias a partir da criação). Usado para paywall e countdown.';
```

---

## 3. (Opcional) Preencher trial_ends_at para restaurantes existentes em trial

Se já existem restaurantes com `billing_status = 'trial'` e `trial_ends_at` NULL, pode definir um valor default (ex.: 14 dias a partir de `created_at`):

```sql
UPDATE public.gm_restaurants
SET trial_ends_at = created_at + INTERVAL '14 days'
WHERE billing_status = 'trial'
  AND trial_ends_at IS NULL;
```

---

## 4. Core Docker (local ou volume existente)

Se o Core de produção for o mesmo stack Docker:

```bash
cd docker-core
make migrate-trial-ends-at
```

Core novo (`make reset` ou primeiro `up`): a migration já corre no init (05.7-trial-ends-at.sql).

---

## Referências

- Migration: `migrations/20260213_01_trial_ends_at.sql`, `docker-core/schema/migrations/20260213_trial_ends_at.sql`
- Plano: `docs/plans/FASE_2_POS_VENDAVEL_PORTUGAL.md`
