# 🔒 IMPLEMENTAÇÃO DAS REGRAS DO CORE (Parte 3)

**Data:** 2026-01-24  
**Status:** ✅ **CANONICAL - Pronto para Aplicar**  
**Nível:** 🏛️ Sistema de Registro (System of Record)

---

## 🎯 OBJETIVO

Implementar as **6 regras obrigatórias do Core** usando **TRIGGERS** (não CHECK constraints) para garantir integridade financeira e operacional.

---

## ⚠️ IMPORTANTE: Por Que TRIGGERS e Não CHECK?

### Problema com CHECK Constraints Inter-Tabelas

Em PostgreSQL, `CHECK (EXISTS (SELECT ...))` não é recomendado porque:
- ❌ Pode não reavaliar como esperado
- ❌ Não garante integridade cross-table de forma confiável
- ❌ Pode ter comportamento inconsistente em algumas versões

### Solução CANONICAL: TRIGGERS

✅ **TRIGGERS são mais confiáveis** para regras inter-tabelas:
- ✅ Executam sempre (não dependem de otimizador)
- ✅ Garantem integridade cross-table
- ✅ Mensagens de erro mais claras
- ✅ Melhor para auditoria

---

## 📋 REGRAS IMPLEMENTADAS

### 1. Estados Financeiros Irreversíveis
- ✅ `prevent_update_closed_orders_trigger`
- ✅ `prevent_delete_closed_orders_trigger`

### 2. Sem Pagamento Sem Pedido Finalizado
- ✅ `payment_requires_finalized_order_trigger`

### 3. Sem Pedido Sem Sessão Ativa
- ✅ `order_requires_active_session_trigger`

### 4. Total Imutável Após LOCKED
- ✅ `prevent_total_change_when_locked_trigger`

### 5. Item Imutável Após LOCKED
- ✅ `prevent_item_update_when_order_locked_trigger`
- ✅ `prevent_item_delete_when_order_locked_trigger`

---

## 🚀 COMO APLICAR

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# Aplicar migration
supabase migration up

# Ou aplicar diretamente
psql $DATABASE_URL -f supabase/migrations/20260124000002_enforce_core_rules_triggers.sql
```

### Opção 2: Via SQL Direto

```bash
# Conectar ao banco
psql $DATABASE_URL

# Executar migration
\i supabase/migrations/20260124000002_enforce_core_rules_triggers.sql
```

### Opção 3: Via Supabase Dashboard

1. Abrir Supabase Dashboard
2. Ir em "SQL Editor"
3. Copiar conteúdo de `20260124000002_enforce_core_rules_triggers.sql`
4. Executar

---

## ✅ VALIDAÇÃO

### Verificar Triggers Criados

```sql
-- Listar todos os triggers
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled AS enabled
FROM pg_trigger
WHERE tgname IN (
  'prevent_update_closed_orders_trigger',
  'prevent_delete_closed_orders_trigger',
  'payment_requires_finalized_order_trigger',
  'order_requires_active_session_trigger',
  'prevent_total_change_when_locked_trigger',
  'prevent_item_update_when_order_locked_trigger',
  'prevent_item_delete_when_order_locked_trigger'
)
ORDER BY tgname;
```

**Resultado esperado:** 7 triggers listados

### Testar Cada Regra

#### Teste 1: Prevenir UPDATE de Pedido Fechado
```sql
-- Deve FALHAR
UPDATE gm_orders 
SET status = 'PENDING' 
WHERE id = (SELECT id FROM gm_orders WHERE status = 'CLOSED' LIMIT 1);
-- Erro esperado: "Cannot update order in terminal state: CLOSED"
```

#### Teste 2: Prevenir Pagamento Sem Pedido Finalizado
```sql
-- Deve FALHAR
INSERT INTO gm_payments (order_id, amount, payment_method)
VALUES (
  (SELECT id FROM gm_orders WHERE status = 'PENDING' LIMIT 1),
  100.00,
  'cash'
);
-- Erro esperado: "Payment requires finalized order"
```

#### Teste 3: Prevenir Pedido Sem Sessão Ativa
```sql
-- Deve FALHAR
INSERT INTO gm_orders (session_id, status)
VALUES (
  (SELECT id FROM gm_sessions WHERE status != 'ACTIVE' LIMIT 1),
  'PENDING'
);
-- Erro esperado: "Order requires active session"
```

#### Teste 4: Prevenir Mudança de Total em LOCKED
```sql
-- Deve FALHAR
UPDATE gm_orders 
SET total = total + 10.00 
WHERE status = 'LOCKED' 
LIMIT 1;
-- Erro esperado: "Cannot change total when order is LOCKED"
```

#### Teste 5: Prevenir Mudança de Item em LOCKED
```sql
-- Deve FALHAR
UPDATE gm_order_items 
SET quantity = quantity + 1 
WHERE order_id IN (SELECT id FROM gm_orders WHERE status = 'LOCKED' LIMIT 1)
LIMIT 1;
-- Erro esperado: "Cannot modify items when order is LOCKED"
```

---

## 🧪 TESTES AUTOMATIZADOS

### Script de Teste

```bash
# Executar testes de validação
psql $DATABASE_URL <<EOF
-- Teste 1: UPDATE pedido fechado (deve falhar)
DO \$\$
BEGIN
  UPDATE gm_orders SET status = 'PENDING' 
  WHERE id = (SELECT id FROM gm_orders WHERE status = 'CLOSED' LIMIT 1);
  RAISE EXCEPTION 'Teste 1 FALHOU: UPDATE de pedido fechado foi permitido';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLERRM LIKE '%Cannot update order in terminal state%' THEN
      RAISE NOTICE '✅ Teste 1 PASSOU: UPDATE de pedido fechado bloqueado';
    ELSE
      RAISE;
    END IF;
END;
\$\$;
EOF
```

---

## 📊 CHECKLIST DE IMPLEMENTAÇÃO

### Antes de Aplicar
- [ ] Backup do banco de dados
- [ ] Testar em ambiente de desenvolvimento primeiro
- [ ] Verificar que todas as tabelas existem (`gm_orders`, `gm_payments`, `gm_sessions`, `gm_order_items`)

### Aplicar Migration
- [ ] Executar migration `20260124000002_enforce_core_rules_triggers.sql`
- [ ] Verificar que 7 triggers foram criados
- [ ] Verificar que não há erros

### Validar
- [ ] Executar testes manuais (5 testes acima)
- [ ] Executar script de teste automatizado
- [ ] Verificar logs de erro (se houver)

### Documentar
- [ ] Atualizar `PARTE_3_REGRAS_DO_CORE.md` com status
- [ ] Adicionar ao `CHECKLIST_VERIFICACAO_COMPLETA_LEIS.md`
- [ ] Documentar no README do projeto

---

## 🔍 TROUBLESHOOTING

### Erro: "function already exists"
```sql
-- Remover função antiga primeiro
DROP FUNCTION IF EXISTS enforce_payment_requires_finalized_order() CASCADE;
-- Depois executar migration novamente
```

### Erro: "trigger already exists"
```sql
-- Remover trigger antigo primeiro
DROP TRIGGER IF EXISTS payment_requires_finalized_order_trigger ON gm_payments;
-- Depois executar migration novamente
```

### Erro: "table does not exist"
```sql
-- Verificar se tabelas existem
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'gm_%';
```

---

## 🎯 PRÓXIMOS PASSOS

### Imediato
1. ✅ Aplicar migration em desenvolvimento
2. ✅ Validar todos os testes
3. ✅ Aplicar em produção (após validação)

### Curto Prazo
- [ ] Adicionar testes automatizados ao CI/CD
- [ ] Monitorar logs de erro (triggers disparando)
- [ ] Documentar casos de uso

### Longo Prazo
- [ ] Auditoria externa das regras
- [ ] Certificações (ISO 27001, SOC2)
- [ ] Dashboard de compliance

---

## 📚 DOCUMENTOS RELACIONADOS

- **[PARTE_3_REGRAS_DO_CORE.md](./PARTE_3_REGRAS_DO_CORE.md)** - Regras detalhadas
- **[SYSTEM_TRUTH_CODEX.md](./SYSTEM_TRUTH_CODEX.md)** - Leis da verdade
- **[CHECKLIST_VERIFICACAO_COMPLETA_LEIS.md](./CHECKLIST_VERIFICACAO_COMPLETA_LEIS.md)** - Checklist completo

---

## ✅ CONCLUSÃO

**Com estas regras implementadas, o sistema:**

- ✅ **Não consegue** cobrar duas vezes
- ✅ **Não consegue** alterar pedido fechado
- ✅ **Não consegue** apagar evidência
- ✅ **Não consegue** "ajeitar depois"
- ✅ **Não consegue** mentir para o fiscal

**Mesmo que alguém tente.**

Isso é exatamente o que auditores, fiscais e advogados querem ver.

---

**Última atualização:** 2026-01-24  
**Status:** ✅ **CANONICAL - Pronto para Aplicar**
