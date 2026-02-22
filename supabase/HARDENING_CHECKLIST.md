# Supabase DB Hardening Checklist

## Migrations incluídas

- `20260222113000_security_hardening.sql`
- `20260222113100_fk_indexes_hardening.sql`

## Aplicação rápida

1. Aplicar migrations no ambiente alvo (staging antes de production).
2. Validar que não existem erros de permissão para fluxos críticos.
3. Validar performance das consultas de pedidos/pagamentos/stock.

## Verificações SQL (pós-aplicação)

### 1) Tabelas com RLS habilitado mas sem FORCE RLS

```sql
select n.nspname as schema_name, c.relname as table_name
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity = true
  and c.relforcerowsecurity = false
order by 1, 2;
```

Resultado esperado: `0 rows`.

### 2) Funções SECURITY DEFINER sem search_path fixo

```sql
select n.nspname as schema_name,
       p.proname as function_name,
       p.oid::regprocedure as signature,
       coalesce(array_to_string(p.proconfig, ', '), '') as function_config
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef = true
  and coalesce(array_to_string(p.proconfig, ', '), '') not ilike '%search_path=pg_catalog, public%'
order by 1, 2;
```

Resultado esperado: `0 rows`.

### 3) Foreign keys sem índice de suporte (prefix match)

```sql
with fk as (
  select con.oid,
         con.conname,
         con.conrelid,
         con.conkey,
         rel.relname as table_name,
         ns.nspname as schema_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace ns on ns.oid = rel.relnamespace
  where con.contype = 'f'
    and ns.nspname = 'public'
    and rel.relkind = 'r'
)
select fk.schema_name, fk.table_name, fk.conname as fk_name
from fk
where not exists (
  select 1
  from pg_index idx
  where idx.indrelid = fk.conrelid
    and idx.indisvalid = true
    and idx.indisready = true
    and array_length(string_to_array(trim(idx.indkey::text), ' ')::smallint[], 1) >= array_length(fk.conkey, 1)
    and (string_to_array(trim(idx.indkey::text), ' ')::smallint[])[1:array_length(fk.conkey, 1)] = fk.conkey
)
order by 1, 2, 3;
```

Resultado esperado: `0 rows`.
