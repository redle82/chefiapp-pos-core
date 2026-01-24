# 🚨 APLICAR MIGRATION AGORA

**Erro:** `null value in column "heartbeat" of relation "empire_pulses"`

**Solução:** A função RPC precisa ser atualizada no Supabase Cloud.

---

## ⚡ PASSO A PASSO (2 minutos)

### 1. Abrir Supabase Dashboard
👉 https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl

### 2. Ir para SQL Editor
- Menu lateral → **SQL Editor**
- Ou: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new

### 3. Copiar SQL
- Abra o arquivo: **`FIX_ONBOARDING_SQL.sql`** (na raiz do projeto)
- Selecione TODO o conteúdo (Cmd+A / Ctrl+A)
- Copie (Cmd+C / Ctrl+C)

### 4. Colar e Executar
- Cole no SQL Editor do Supabase
- Clique em **RUN** (ou pressione Cmd+Enter / Ctrl+Enter)

### 5. Verificar
- Deve aparecer: "Success. No rows returned"
- Ou uma tabela mostrando a função criada

### 6. Testar
- Volte para o app
- Tente criar a entidade novamente
- O erro deve desaparecer

---

## ✅ O que o SQL faz

1. **Remove** a função antiga (se existir)
2. **Cria** a função corrigida com:
   - `project_slug: 'chefiapp'` ✅
   - `tenant_slug: v_slug` ✅
   - `heartbeat: CURRENT_TIMESTAMP` ✅ (variável explícita)
   - `metrics` e `events` ✅

---

**Arquivo:** `FIX_ONBOARDING_SQL.sql`  
**Tempo:** 2 minutos  
**Resultado:** Onboarding funciona ✅
