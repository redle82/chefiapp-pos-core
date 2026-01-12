# ✅ Validação Automática - Hardening P0 (v0.9.2)

**Após aplicar as migrations, execute esta validação automática.**

---

## 🚀 Método Rápido (Script Bash)

### Opção 1: Via Supabase CLI

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
./scripts/validate-hardening.sh
```

**Requisitos:**
- Supabase CLI instalado (`npm install -g supabase`)
- Projeto linkado (`supabase link`)

### Opção 2: Via SQL Manual

1. Acesse **Supabase Dashboard** → **SQL Editor**
2. Abra o arquivo: `scripts/validate-hardening-migrations.sql`
3. Cole e execute o script completo
4. Verifique os resultados

---

## 📋 O Que É Validado

### ✅ FASE 1: Colunas Críticas
- `gm_restaurants.fiscal_config` (JSONB)
- `gm_restaurants.external_ids` (JSONB)
- `gm_orders.sync_metadata` (JSONB)
- `gm_orders.version` (INTEGER)

### ✅ FASE 2: Funções RPC
- `create_order_atomic` (4 parâmetros)
- `check_open_orders_with_lock` (1 parâmetro)

### ✅ FASE 3: Triggers
- `trigger_increment_order_version` (ativo em `gm_orders`)

### ✅ FASE 4: Tabelas
- `integration_orders` (criada)
- `fiscal_event_store` (deve existir)

### ✅ FASE 5: Índices
- `idx_gm_orders_sync_local_id` (GIN index)
- `idx_gm_orders_version` (B-tree index)

### ✅ FASE 6: RLS Policies
- Policies para `integration_orders`

---

## 📊 Resultado Esperado

### ✅ Sucesso (Todas as Validações Passam)

```
✅ Passou: 12
❌ Falhou: 0

🎉 TODAS AS VALIDAÇÕES PASSARAM!
```

**Próximos passos:**
1. Executar testes manuais (`POS_MIGRATION_CHECKLIST.md`)
2. Validar funcionalidades no TPV
3. Testar cenários offline

### ❌ Falha (Algumas Validações Falham)

```
✅ Passou: 8
❌ Falhou: 4

⚠️  ALGUMAS VALIDAÇÕES FALHARAM
```

**Ações necessárias:**
1. Verificar quais migrations não foram aplicadas
2. Re-executar migrations faltantes
3. Executar script SQL manual para diagnóstico detalhado

---

## 🔍 Validação Detalhada (SQL)

Execute no Supabase SQL Editor para ver detalhes completos:

```sql
-- Ver todas as colunas críticas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('gm_restaurants', 'gm_orders')
    AND column_name IN ('fiscal_config', 'external_ids', 'sync_metadata', 'version')
ORDER BY table_name, column_name;

-- Ver funções RPC
SELECT 
    proname,
    pronargs,
    pg_get_function_arguments(oid) as parameters
FROM pg_proc 
WHERE proname IN ('create_order_atomic', 'check_open_orders_with_lock');

-- Ver triggers
SELECT 
    tgname,
    tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'trigger_increment_order_version';
```

---

## 🆘 Troubleshooting

### Erro: "column does not exist"
**Solução:** A migration correspondente não foi aplicada. Verifique `APLICAR_MIGRATIONS_AGORA.md`.

### Erro: "function does not exist"
**Solução:** A migration 4 ou 5 não foi aplicada. Re-execute.

### Erro: "trigger does not exist"
**Solução:** A migration 3 não foi aplicada completamente. Re-execute.

### Script bash não funciona
**Solução:** Use o método SQL manual (Opção 2).

---

## ✅ Após Validação Bem-Sucedida

1. **Marcar como validado** em `VALIDACAO_HARDENING_P0.md`
2. **Executar testes manuais** seguindo `POS_MIGRATION_CHECKLIST.md`
3. **Testar funcionalidades** no TPV:
   - Criar pedido online
   - Criar pedido offline
   - Modificar pedido (versioning)
   - Cash register alert
   - Fiscal alert

---

**Última atualização:** 18 Janeiro 2026  
**Versão:** v0.9.2
