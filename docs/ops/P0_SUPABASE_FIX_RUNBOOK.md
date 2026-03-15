# Runbook: fechar bloqueio `/admin/config/general` (backend Supabase)

Frente tratada como **backend/schema**. O frontend já está em ordem; os 400 vêm de colunas em falta ou de RLS/objetos que as referenciam.

---

## 1. Confirmar estado no Supabase

No **SQL Editor** do Supabase Dashboard, executar:

```sql
-- Diagnóstico: colunas disabled_at
SELECT 'gm_restaurants' AS tabela, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'gm_restaurants' AND column_name = 'disabled_at'
UNION ALL
SELECT 'gm_restaurant_members', column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'gm_restaurant_members' AND column_name = 'disabled_at';
```

- **0 linhas:** nenhuma das duas tabelas tem `disabled_at` → aplicar migrações (passo 2).
- **1 linha:** só uma tabela tem → aplicar a migração que falta.
- **2 linhas:** ambas têm → só falta `NOTIFY pgrst, 'reload schema';` (passo 3).

---

## 2. Aplicar migrações (por ordem)

Duas opções.

### Opção A — Migrações completas (recomendado)

No SQL Editor, executar **por ordem** o conteúdo destes ficheiros do repo:

1. `supabase/migrations/20260310000000_gm_restaurants_supabase_optional_columns.sql`  
   (colunas opcionais em `gm_restaurants` + `restaurant_setup_status`)

2. `supabase/migrations/20260310100000_gm_restaurant_members_disabled_at.sql`  
   (coluna `disabled_at` em `gm_restaurant_members`)

### Opção B — Só colunas `disabled_at` (mínimo para os 400)

Se quiseres apenas remover os 400 de `disabled_at`, executar o script:

`supabase/scripts/P0_apply_disabled_at_and_reload.sql`

(detalhes no ficheiro; faz ADD COLUMN em ambas as tabelas se não existir e depois NOTIFY).

---

## 3. Recarregar schema do PostgREST

Depois de aplicar as migrações, no mesmo SQL Editor:

```sql
NOTIFY pgrst, 'reload schema';
```

---

## 4. Validar

1. Hard refresh em `http://localhost:5175/admin/config/general`.
2. Abrir a consola do browser: não devem aparecer 400 em `gm_restaurant_members` nem em `gm_restaurants`.
3. O tenant deve resolver sem fallback para seed (se existirem dados em `gm_restaurant_members`).

---

## Resumo

| Passo | Ação |
|-------|------|
| 1 | Executar o SELECT de diagnóstico (acima). |
| 2 | Aplicar as migrações por ordem (Opção A) ou o script mínimo (Opção B). |
| 3 | Executar `NOTIFY pgrst, 'reload schema';` |
| 4 | Hard refresh e verificar consola. |

Se os 400 continuarem após isto, usar `merchant-portal/scripts/supabase-audit-disabled-at.sql` para auditar policies/views/funções que referenciem `disabled_at`.
