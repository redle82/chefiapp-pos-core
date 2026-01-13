# 🚀 APLICAR MIGRATIONS P0 - AGORA
**Data:** 12 Janeiro 2026  
**Status:** ⚠️ **PENDENTE** - Pronto para aplicar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ⚠️ ANTES DE COMEÇAR

### 1. Fazer Backup do Banco
**CRÍTICO:** Sempre fazer backup antes de aplicar migrations

**Via Dashboard:**
- Acessar: https://app.supabase.com
- Settings → Database → Backups → Create Backup

**Via CLI:**
```bash
supabase db dump -f backup_pre_p0_$(date +%Y%m%d_%H%M%S).sql
```

---

### 2. Verificar Status Atual

**Verificar se migrations já foram aplicadas:**
```sql
-- Executar no SQL Editor do Supabase Dashboard
SELECT 
    version,
    name,
    inserted_at
FROM supabase_migrations.schema_migrations
WHERE name LIKE '20260118%'
ORDER BY version;
```

**Se retornar vazio:** Migrations não foram aplicadas ✅  
**Se retornar registros:** Migrations já foram aplicadas ⚠️

---

## 🚀 MÉTODO 1: VIA SUPABASE DASHBOARD (Recomendado)

### Passo a Passo:

1. **Acessar SQL Editor**
   - URL: https://app.supabase.com/project/[seu-project-id]/sql/new
   - Ou: Dashboard → SQL Editor → New Query

2. **Aplicar Migration 1: sync_metadata**
   ```sql
   -- Copiar TODO o conteúdo de:
   -- supabase/migrations/20260118000001_add_sync_metadata_to_orders.sql
   ```
   - Colar no SQL Editor
   - Clicar em "Run" ou pressionar Cmd+Enter
   - Verificar que retorna "Success"

3. **Aplicar Migration 2: create_order_atomic**
   ```sql
   -- Copiar TODO o conteúdo de:
   -- supabase/migrations/20260118000002_update_create_order_atomic_with_sync_metadata.sql
   ```
   - Colar no SQL Editor
   - Clicar em "Run"
   - Verificar que retorna "Success"

4. **Aplicar Migration 3: version**
   ```sql
   -- Copiar TODO o conteúdo de:
   -- supabase/migrations/20260118000003_add_version_to_orders.sql
   ```
   - Colar no SQL Editor
   - Clicar em "Run"
   - Verificar que retorna "Success"

5. **Aplicar Migration 4: check_open_orders_rpc**
   ```sql
   -- Copiar TODO o conteúdo de:
   -- supabase/migrations/20260118000004_add_check_open_orders_rpc.sql
   ```
   - Colar no SQL Editor
   - Clicar em "Run"
   - Verificar que retorna "Success"

6. **Aplicar Migration 5: fiscal_retry_count**
   ```sql
   -- Copiar TODO o conteúdo de:
   -- supabase/migrations/20260118000005_add_fiscal_retry_count.sql
   ```
   - Colar no SQL Editor
   - Clicar em "Run"
   - Verificar que retorna "Success"

---

## 🚀 MÉTODO 2: VIA SUPABASE CLI

### Pré-requisitos:

```bash
# 1. Instalar Supabase CLI (se não tiver)
npm install -g supabase

# 2. Fazer login
supabase login

# 3. Linkar projeto
supabase link --project-ref [seu-project-ref]
```

### Aplicar Migrations:

```bash
# Aplicar todas as migrations pendentes
supabase db push

# Ou aplicar migration específica
supabase migration up 20260118000001
supabase migration up 20260118000002
supabase migration up 20260118000003
supabase migration up 20260118000004
supabase migration up 20260118000005
```

---

## ✅ VALIDAÇÃO PÓS-APLICAÇÃO

### 1. Verificar Estrutura

```sql
-- Verificar sync_metadata
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gm_orders' 
AND column_name = 'sync_metadata';

-- Verificar version
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gm_orders' 
AND column_name = 'version';
```

**Resultado Esperado:**
- `sync_metadata` deve existir (tipo: jsonb)
- `version` deve existir (tipo: integer)

### 2. Verificar Índices

```sql
-- Verificar índices criados
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'gm_orders' 
AND (indexname LIKE '%sync%' OR indexname LIKE '%version%');
```

**Resultado Esperado:**
- `idx_gm_orders_sync_local_id` deve existir
- `idx_gm_orders_version` deve existir

### 3. Verificar Funções RPC

```sql
-- Verificar função check_open_orders_with_lock
SELECT 
    proname,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'check_open_orders_with_lock';
```

**Resultado Esperado:**
- Função `check_open_orders_with_lock` deve existir

### 4. Verificar Triggers

```sql
-- Verificar trigger de version
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_increment_order_version';
```

**Resultado Esperado:**
- Trigger `trigger_increment_order_version` deve existir

---

## 🚨 SE DER ERRO

### Erro: "column already exists"
**Solução:** Migration já foi aplicada. Pular para próxima.

### Erro: "relation does not exist"
**Solução:** Verificar se tabela `gm_orders` existe. Pode ser necessário aplicar migrations anteriores.

### Erro: "permission denied"
**Solução:** Verificar permissões do usuário no Supabase. Usar conta com permissões de administrador.

### Erro: "syntax error"
**Solução:** Verificar se copiou TODO o conteúdo do arquivo SQL, incluindo linhas finais.

---

## 📋 CHECKLIST DE APLICAÇÃO

- [ ] Backup do banco criado
- [ ] Migration 1 aplicada e validada
- [ ] Migration 2 aplicada e validada
- [ ] Migration 3 aplicada e validada
- [ ] Migration 4 aplicada e validada
- [ ] Migration 5 aplicada e validada
- [ ] Validação pós-aplicação executada
- [ ] Todos os testes passando

---

## 🎯 PRÓXIMOS PASSOS APÓS APLICAÇÃO

1. **Testar Idempotência Offline**
   - Criar pedido offline
   - Sincronizar
   - Verificar que não duplica

2. **Testar Versioning**
   - Modificar pedido de múltiplos tablets
   - Verificar que version incrementa
   - Verificar que conflitos são detectados

3. **Testar Fechamento de Caixa**
   - Verificar que RPC funciona
   - Testar com pedidos abertos

---

**Status:** Guia criado, pronto para aplicar  
**Próximo Passo:** Fazer backup e aplicar migrations
