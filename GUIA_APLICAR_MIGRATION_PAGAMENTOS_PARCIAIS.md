# 🔧 GUIA: Aplicar Migration de Pagamentos Parciais

**Migration:** `20260120000001_add_partial_payment_support.sql`  
**Objetivo:** Habilitar suporte a pagamentos parciais (Split Bill)  
**Tempo estimado:** 5-10 minutos

---

## ⚠️ PRÉ-REQUISITOS

Antes de aplicar, garantir:
- [ ] Acesso ao Supabase Dashboard ou CLI
- [ ] Backup do banco de dados (recomendado)
- [ ] Nenhum pagamento parcial em andamento (se houver, finalizar primeiro)

---

## 📋 MÉTODO 1: Supabase Dashboard (Recomendado)

### **Passo 1: Acessar SQL Editor**
1. Abrir Supabase Dashboard
2. Navegar para **SQL Editor**
3. Clicar em **New Query**

### **Passo 2: Aplicar Migration**
1. Abrir arquivo: `supabase/migrations/20260120000001_add_partial_payment_support.sql`
2. Copiar todo o conteúdo
3. Colar no SQL Editor do Supabase
4. Clicar em **Run** (ou `Ctrl/Cmd + Enter`)

### **Passo 3: Verificar Sucesso**
Procurar por mensagens de sucesso:
- ✅ `ALTER TYPE` executado com sucesso
- ✅ `CREATE OR REPLACE FUNCTION` executado com sucesso
- ✅ `COMMENT ON FUNCTION` executado com sucesso

Se houver erro, verificar:
- ❌ ENUM `payment_status` já existe com `'partially_paid'`? (pode ignorar)
- ❌ Função `process_order_payment` já existe? (deve ser substituída)

---

## 📋 MÉTODO 2: Supabase CLI

### **Passo 1: Verificar Conexão**
```bash
supabase status
```

### **Passo 2: Aplicar Migration**
```bash
supabase db push
```

Ou aplicar migration específica:
```bash
supabase migration up 20260120000001_add_partial_payment_support
```

### **Passo 3: Verificar Sucesso**
```bash
supabase db diff
```
Deve retornar vazio (sem diferenças) se migration foi aplicada.

---

## ✅ VALIDAÇÃO PÓS-APLICAÇÃO

### **1. Verificar ENUM**
```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_status')
ORDER BY enumsortorder;
```

**Resultado esperado:**
- `pending`
- `paid`
- `refunded`
- `partially_paid` ← **DEVE APARECER**

### **2. Verificar Função RPC**
```sql
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'process_order_payment';
```

**Resultado esperado:**
- Função `process_order_payment` deve existir
- Deve ter 7 parâmetros (incluindo `p_amount_cents`)

### **3. Testar Função (Opcional)**
```sql
-- Criar pedido de teste primeiro
-- Depois testar pagamento parcial
SELECT public.process_order_payment(
    'restaurant_id'::uuid,
    'order_id'::uuid,
    'cash_register_id'::uuid,
    'operator_id'::uuid,
    1000, -- amount_cents (parcial)
    'cash',
    'test_idempotency_key_' || now()::text
);
```

**Resultado esperado:**
- `{"success": true, "payment_status": "partially_paid", ...}`

---

## 🐛 TROUBLESHOOTING

### **Erro: "enum label 'partially_paid' already exists"**
**Solução:** Migration já foi aplicada parcialmente. Continuar com o resto da migration.

### **Erro: "function process_order_payment does not exist"**
**Solução:** Verificar se migration anterior foi aplicada. A função deve existir antes de ser substituída.

### **Erro: "permission denied"**
**Solução:** Verificar permissões do usuário no Supabase. Usar conta com permissões de administrador.

### **Erro: "syntax error"**
**Solução:** Verificar se copiou todo o conteúdo do arquivo SQL. Não deve haver truncamento.

---

## 🔄 ROLLBACK (Se Necessário)

Se precisar reverter a migration:

### **1. Remover Valor do ENUM (CUIDADO)**
```sql
-- ATENÇÃO: Isso pode quebrar pedidos com payment_status = 'partially_paid'
-- Só fazer se não houver dados em produção

-- Primeiro, atualizar pedidos existentes
UPDATE public.gm_orders 
SET payment_status = 'pending' 
WHERE payment_status = 'partially_paid';

-- Depois, remover do ENUM (requer recriar o tipo)
-- Isso é complexo e não recomendado em produção
```

### **2. Reverter Função RPC**
```sql
-- Restaurar versão anterior da função
-- (manter backup da função original antes de aplicar migration)
```

**Recomendação:** Não fazer rollback em produção. Se necessário, criar migration de correção.

---

## 📝 CHECKLIST FINAL

Após aplicar migration:

- [ ] Migration aplicada sem erros
- [ ] ENUM `payment_status` inclui `'partially_paid'`
- [ ] Função `process_order_payment` atualizada
- [ ] Validação SQL executada com sucesso
- [ ] Teste manual de pagamento parcial funcionando
- [ ] Documentação atualizada

---

## 🎯 PRÓXIMOS PASSOS

Após aplicar migration:

1. **Testar Pagamento Parcial Manualmente:**
   - Criar pedido de teste
   - Dividir conta
   - Registrar pagamento parcial
   - Verificar que `payment_status = 'partially_paid'`

2. **Executar Testes de Balcão:**
   - Seguir `TESTE_BALCAO_MVP_DEMO.md`
   - Validar fluxo completo de split bill

3. **Monitorar Logs:**
   - Verificar se há erros relacionados a `process_order_payment`
   - Verificar se pagamentos parciais estão sendo criados corretamente

---

**Status:** ⏳ Aguardando aplicação  
**Última atualização:** 2026-01-20
