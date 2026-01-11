# ✅ VERIFICAR STATUS DAS MIGRATIONS

**Objetivo:** Confirmar que todas as migrations foram aplicadas com sucesso  
**Método:** CLI + Dashboard

---

## 🔍 MÉTODO 1: VIA CLI (Se projeto estiver linkado)

### Passo 1: Verificar se está linkado

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core

# Verificar status
supabase status
```

**Se mostrar informações do projeto:** ✅ Projeto está linkado  
**Se der erro:** ⚠️ Projeto não está linkado (pule para Método 2)

### Passo 2: Listar migrations aplicadas

```bash
# Ver todas as migrations aplicadas
supabase migration list
```

**Resultado esperado:**
- Lista todas as migrations com status
- Deve incluir: `20260111182110_deploy_rls_race_conditions.sql`

### Passo 3: Verificar migrations pendentes

```bash
# Verificar se há migrations pendentes
supabase db push --dry-run
```

**Se mostrar "No migrations to apply":** ✅ Todas as migrations foram aplicadas  
**Se mostrar migrations:** ⚠️ Há migrations pendentes

---

## 🔍 MÉTODO 2: VIA DASHBOARD (Sempre funciona)

### Passo 1: Abrir SQL Editor

1. Acesse: https://supabase.com/dashboard/project/qonfbtwsxeggxbkhqnxl/sql/new
2. Faça login se necessário

### Passo 2: Executar validação completa

1. **No VS Code**, abra o arquivo: `VALIDAR_DEPLOY.sql`
2. **Selecione TODO o conteúdo** (`Cmd + A`)
3. **Copie** (`Cmd + C`)
4. **Cole no SQL Editor do Supabase** (`Cmd + V`)
5. **Execute** (`Cmd + Enter`)

### Passo 3: Verificar os 6 testes

Você verá **6 tabelas de resultados**. Verifique cada uma:

#### ✅ TESTE 1: RLS Ativo
**Query:** Verifica se RLS está ativo em 5 tabelas críticas

**Resultado esperado:**
- 5 linhas retornadas
- Todas com `rowsecurity = true`
- Todas com status `✅ RLS ATIVO`

**Tabelas que devem aparecer:**
- `gm_orders`
- `gm_order_items`
- `gm_tables`
- `gm_cash_registers`
- `gm_payments`

**Se falhar:**
- ❌ Alguma tabela mostra `❌ RLS INATIVO`
- **Ação:** A migration não foi aplicada completamente

---

#### ✅ TESTE 2: Policies Criadas
**Query:** Verifica se as policies RLS foram criadas

**Resultado esperado:**
- Múltiplas linhas (20+ policies)
- Cada policy com:
  - `tablename`: Nome da tabela
  - `policyname`: Nome da policy
  - `operation`: SELECT, INSERT, UPDATE, ou DELETE

**Se falhar:**
- ❌ Nenhuma policy listada
- **Ação:** As policies não foram criadas

---

#### ✅ TESTE 3: Unique Indexes (Race Conditions)
**Query:** Verifica se os unique indexes foram criados

**Resultado esperado:**
- 3 linhas retornadas
- Cada index com:
  - `tablename`: Nome da tabela
  - `indexname`: Nome do index
  - `indexdef`: Definição do index (deve conter `UNIQUE`)

**Indexes esperados:**
1. Index para prevenir múltiplos pedidos ativos na mesma mesa
2. Index para prevenir múltiplos caixas abertos no mesmo restaurante
3. Index para prevenir pagamentos duplicados

**Se falhar:**
- ❌ Menos de 3 indexes
- **Ação:** Os unique indexes não foram criados

---

#### ✅ TESTE 4: Helper Function
**Query:** Verifica se a função helper foi criada

**Resultado esperado:**
- 1 linha retornada
- `proname`: `user_restaurant_ids`
- `prokind`: `f` (function)

**Se falhar:**
- ❌ Nenhuma função encontrada
- **Ação:** A função helper não foi criada

---

#### ✅ TESTE 5: Performance Indexes
**Query:** Verifica se os indexes de performance foram criados

**Resultado esperado:**
- 4+ linhas retornadas
- Cada index listado com:
  - `tablename`: Nome da tabela
  - `indexname`: Nome do index
  - `indexdef`: Definição do index

**Se falhar:**
- ❌ Menos de 4 indexes
- **Ação:** Alguns indexes de performance não foram criados

---

#### ✅ TESTE 6: Resumo Geral
**Query:** Resumo final de tudo que foi aplicado

**Resultado esperado:**
- 1 linha com resumo
- Todos os campos devem mostrar números > 0:
  - `tabelas_com_rls`
  - `total_policies`
  - `unique_indexes`
  - `helper_functions`
  - `performance_indexes`

**Se falhar:**
- ❌ Algum campo mostra 0
- **Ação:** Verifique qual componente não foi aplicado

---

## 📊 INTERPRETAÇÃO DOS RESULTADOS

### ✅ TODOS OS TESTES PASSARAM
**Significa:**
- ✅ Todas as migrations foram aplicadas com sucesso
- ✅ RLS está ativo e funcionando
- ✅ Race conditions estão prevenidas
- ✅ Performance indexes foram criados

**Próximo passo:** Sistema está pronto para produção! 🎉

---

### ⚠️ ALGUM TESTE FALHOU
**Significa:**
- ⚠️ Alguma parte da migration não foi aplicada
- ⚠️ Pode haver problemas de segurança ou performance

**Ações:**
1. **Verifique qual teste falhou** (veja detalhes acima)
2. **Reaplique a migration:**
   - Via CLI: `supabase db push`
   - Via Dashboard: Execute `DEPLOY_MIGRATIONS_CONSOLIDADO.sql`
3. **Execute a validação novamente**

---

## 🚨 TROUBLESHOOTING

### Erro: "No migrations to apply"
**Significa:** Todas as migrations locais já foram aplicadas  
**Ação:** Execute a validação via Dashboard para confirmar

### Erro: "Project not linked"
**Significa:** O projeto não está conectado ao CLI  
**Ação:** Use o Método 2 (Dashboard) para verificar

### Erro na validação SQL
**Possíveis causas:**
- Conexão com o banco perdida
- Permissões insuficientes
- Tabelas não existem

**Ação:**
1. Verifique sua conexão
2. Verifique se você tem acesso ao projeto
3. Execute cada teste individualmente para identificar qual falha

---

## 📋 CHECKLIST DE VALIDAÇÃO

Marque cada item após verificar:

- [ ] TESTE 1: 5 tabelas com RLS ativo ✅
- [ ] TESTE 2: 20+ policies criadas ✅
- [ ] TESTE 3: 3 unique indexes criados ✅
- [ ] TESTE 4: Helper function criada ✅
- [ ] TESTE 5: 4+ performance indexes criados ✅
- [ ] TESTE 6: Resumo geral com todos os ✅

**Se todos marcados:** ✅ Migrations aplicadas com sucesso!

---

**Última atualização:** 2026-01-16
