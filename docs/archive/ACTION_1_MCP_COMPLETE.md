# ✅ AÇÃO 1 — Fix de Onboarding (via Migration)

**Status:** ✅ **Migration criada** | ⏳ **Aguardando aplicação**

---

## 📋 O QUE FOI FEITO

1. ✅ **Migration criada:** `supabase/migrations/20260111002710_fix_onboarding_heartbeat.sql`
2. ✅ **Script automatizado:** `scripts/apply-fix-via-migration.sh`
3. ✅ **SQL validado:** `FIX_ONBOARDING_SQL.sql`

---

## 🚀 APLICAR A MIGRATION (3 opções)

### Opção 1: Via Supabase CLI (Recomendado se autenticado)

```bash
# 1. Autenticar (se ainda não fez)
supabase login

# 2. Linkar projeto
supabase link --project-ref qonfbtwsxeggxbkhqnxl

# 3. Aplicar migration
supabase db push
```

**Resultado:** Migration aplicada automaticamente ✅

---

### Opção 2: Via Supabase Dashboard (Mais Rápido - 2 minutos)

1. **Abrir SQL Editor:**
   - URL: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new

2. **Abrir arquivo SQL:**
   ```bash
   open FIX_ONBOARDING_SQL.sql
   ```

3. **Copiar e colar:**
   - Selecione TODO (Cmd+A)
   - Copie (Cmd+C)
   - Cole no SQL Editor (Cmd+V)
   - Execute (Cmd+Enter)

**Resultado:** Fix aplicado imediatamente ✅

---

### Opção 3: Migration já está pronta

A migration foi criada em:
```
supabase/migrations/20260111002710_fix_onboarding_heartbeat.sql
```

Você pode:
- Aplicar via `supabase db push` (após autenticação)
- Ou copiar o conteúdo e colar no Dashboard

---

## ✅ APÓS APLICAR

1. **Testar onboarding:**
   - Voltar para o app
   - Tentar criar entidade novamente
   - O erro `null value in column "heartbeat"` deve desaparecer ✅

2. **Verificar função:**
   ```sql
   SELECT proname, pg_get_function_arguments(oid) 
   FROM pg_proc 
   WHERE proname = 'create_tenant_atomic';
   ```
   Deve retornar a função com os parâmetros corretos.

---

## 📊 STATUS

| Item | Status |
|------|--------|
| SQL Validado | ✅ |
| Migration Criada | ✅ |
| Aplicada no Cloud | ⏳ Pendente |
| Onboarding Testado | ⏳ Pendente |

---

## 🎯 PRÓXIMOS PASSOS

Após aplicar a migration:

1. [ ] Migration aplicada no Supabase Cloud
2. [ ] Onboarding testado e funcionando
3. [ ] Avançar para Ação 2 (Testar Onboarding Completo)

---

**Arquivos:**
- SQL: `FIX_ONBOARDING_SQL.sql`
- Migration: `supabase/migrations/20260111002710_fix_onboarding_heartbeat.sql`
- Script: `scripts/apply-fix-via-migration.sh`

**Tempo estimado:** 2 minutos (via Dashboard)
