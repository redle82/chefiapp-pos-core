# 🚀 GUIA DE APLICAÇÃO - MIGRATIONS P0
**Data:** 12 Janeiro 2026  
**Status:** ⚠️ **PENDENTE** - Migrations criadas, aguardando aplicação

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📋 MIGRATIONS P0 CRIADAS

Estas migrations corrigem bugs críticos identificados na auditoria:

| Migration | Objetivo | Prioridade |
|-----------|----------|------------|
| `20260118000001_add_sync_metadata_to_orders.sql` | Idempotência offline | 🔴 P0 |
| `20260118000002_update_create_order_atomic_with_sync_metadata.sql` | Suporte sync_metadata no RPC | 🔴 P0 |
| `20260118000003_add_version_to_orders.sql` | Lock otimista com versioning | 🔴 P0 |
| `20260118000004_add_check_open_orders_rpc.sql` | Fechamento de caixa seguro | 🔴 P0 |
| `20260118000005_add_fiscal_retry_count.sql` | Retry fiscal | 🟡 P1 |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ⚠️ ANTES DE APLICAR

### 1. Backup do Banco de Dados

```bash
# Via Supabase CLI
supabase db dump -f backup_pre_p0_$(date +%Y%m%d).sql

# Ou via Dashboard:
# Settings → Database → Backups → Create Backup
```

### 2. Verificar Ordem de Aplicação

As migrations devem ser aplicadas **NESTA ORDEM**:

1. ✅ `20260118000001_add_sync_metadata_to_orders.sql` (primeiro)
2. ✅ `20260118000002_update_create_order_atomic_with_sync_metadata.sql` (depende do 1)
3. ✅ `20260118000003_add_version_to_orders.sql` (independente)
4. ✅ `20260118000004_add_check_open_orders_rpc.sql` (independente)
5. ✅ `20260118000005_add_fiscal_retry_count.sql` (independente)

### 3. Verificar Dependências

```sql
-- Verificar se tabela gm_orders existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gm_orders'
);

-- Verificar se função create_order_atomic existe
SELECT EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'create_order_atomic'
);
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔧 MÉTODO 1: VIA SUPABASE DASHBOARD (Recomendado)

### Passo a Passo:

1. **Acessar Supabase Dashboard**
   - Ir para: `https://app.supabase.com`
   - Selecionar o projeto

2. **Navegar para SQL Editor**
   - Menu lateral → `SQL Editor`
   - Ou: `Database` → `SQL Editor`

3. **Aplicar cada migration individualmente**

   **Migration 1: sync_metadata**
   ```sql
   -- Copiar conteúdo de: supabase/migrations/20260118000001_add_sync_metadata_to_orders.sql
   -- Colar no SQL Editor
   -- Clicar em "Run"
   ```

   **Migration 2: create_order_atomic update**
   ```sql
   -- Copiar conteúdo de: supabase/migrations/20260118000002_update_create_order_atomic_with_sync_metadata.sql
   -- Colar no SQL Editor
   -- Clicar em "Run"
   ```

   **Migration 3: version**
   ```sql
   -- Copiar conteúdo de: supabase/migrations/20260118000003_add_version_to_orders.sql
   -- Colar no SQL Editor
   -- Clicar em "Run"
   ```

   **Migration 4: check_open_orders_rpc**
   ```sql
   -- Copiar conteúdo de: supabase/migrations/20260118000004_add_check_open_orders_rpc.sql
   -- Colar no SQL Editor
   -- Clicar em "Run"
   ```

   **Migration 5: fiscal_retry_count**
   ```sql
   -- Copiar conteúdo de: supabase/migrations/20260118000005_add_fiscal_retry_count.sql
   -- Colar no SQL Editor
   -- Clicar em "Run"
   ```

4. **Verificar Aplicação**

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

   -- Verificar função check_open_orders_with_lock
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'check_open_orders_with_lock';
   ```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔧 MÉTODO 2: VIA SUPABASE CLI

### Pré-requisitos:

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar projeto
supabase link --project-ref <seu-project-ref>
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ✅ VALIDAÇÃO PÓS-APLICAÇÃO

### 1. Verificar Estrutura

```sql
-- Verificar colunas adicionadas
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'gm_orders' 
AND column_name IN ('sync_metadata', 'version')
ORDER BY column_name;
```

### 2. Verificar Índices

```sql
-- Verificar índices criados
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'gm_orders' 
AND indexname LIKE '%sync%' OR indexname LIKE '%version%';
```

### 3. Verificar Funções RPC

```sql
-- Verificar função check_open_orders_with_lock
SELECT 
    proname,
    pg_get_function_arguments(oid) as arguments,
    pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'check_open_orders_with_lock';
```

### 4. Testar Funcionalidade

```typescript
// Testar sync_metadata
const testOrder = await OrderEngine.createOrder({
    restaurantId: 'test-rest',
    tableNumber: 1,
    items: [...],
    syncMetadata: {
        localId: 'local-123',
        syncAttempts: 0,
        lastSyncAt: null
    }
});

// Verificar se sync_metadata foi salvo
const order = await OrderEngine.getOrderById(testOrder.id);
expect(order.syncMetadata?.localId).toBe('local-123');

// Testar versioning
const originalVersion = order.version;
await OrderEngine.updateOrderStatus(order.id, 'preparing');
const updatedOrder = await OrderEngine.getOrderById(order.id);
expect(updatedOrder.version).toBe(originalVersion + 1);
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🚨 ROLLBACK (Se Necessário)

### Rollback Manual:

```sql
-- Remover sync_metadata
ALTER TABLE gm_orders DROP COLUMN IF EXISTS sync_metadata;
DROP INDEX IF EXISTS idx_gm_orders_sync_local_id;

-- Remover version
ALTER TABLE gm_orders DROP COLUMN IF EXISTS version;
DROP INDEX IF EXISTS idx_gm_orders_version;
DROP TRIGGER IF EXISTS increment_order_version ON gm_orders;
DROP FUNCTION IF EXISTS increment_order_version();

-- Remover função RPC
DROP FUNCTION IF EXISTS check_open_orders_with_lock(restaurant_id_param UUID);
```

### Restaurar Backup:

```bash
# Via Supabase CLI
supabase db reset

# Ou restaurar backup manual
psql -h <host> -U <user> -d <database> < backup_pre_p0_20260112.sql
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📊 IMPACTO ESPERADO

### Após Aplicação:

✅ **Idempotência Offline Funcional**
- Pedidos offline não serão duplicados
- `checkOrderSynced()` funcionará corretamente

✅ **Lock Otimista Robusto**
- Race conditions eliminadas
- Versioning automático em cada UPDATE

✅ **Fechamento de Caixa Seguro**
- FOR UPDATE previne fechamento durante pagamento
- RPC `check_open_orders_with_lock` garante consistência

✅ **Fiscal Retry**
- Contador de tentativas para retry inteligente

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ⚠️ NOTAS IMPORTANTES

1. **Aplicar em Horário de Baixo Tráfego**
   - Migrations podem bloquear tabelas temporariamente
   - Recomendado: madrugada ou horário de fechamento

2. **Testar em Ambiente de Staging Primeiro**
   - Sempre testar migrations em staging antes de produção

3. **Monitorar Performance**
   - Índices novos podem afetar performance de INSERT
   - Monitorar queries lentas após aplicação

4. **Backup Antes de Tudo**
   - Sempre fazer backup antes de aplicar migrations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ✅ CHECKLIST DE APLICAÇÃO

- [ ] Backup do banco criado
- [ ] Migrations revisadas e validadas
- [ ] Ambiente de staging testado (se aplicável)
- [ ] Migration 1 aplicada e validada
- [ ] Migration 2 aplicada e validada
- [ ] Migration 3 aplicada e validada
- [ ] Migration 4 aplicada e validada
- [ ] Migration 5 aplicada e validada
- [ ] Testes funcionais executados
- [ ] Performance monitorada
- [ ] Documentação atualizada

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Status:** Guia criado, aguardando aplicação das migrations  
**Próximo Passo:** Aplicar migrations no Supabase Dashboard ou via CLI
