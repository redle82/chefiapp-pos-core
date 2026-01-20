# ✅ Checklist Pós-Migração - Hardening P0 (v0.9.2)

**Após aplicar as migrations, siga este checklist na ordem.**

---

## 🔍 FASE 1: Validação Técnica (15 minutos)

### 1.1 Verificar Migrations Aplicadas

Execute no Supabase SQL Editor:

```sql
-- Verificar colunas críticas
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('gm_restaurants', 'integration_orders', 'gm_orders')
AND column_name IN ('fiscal_config', 'external_ids', 'sync_metadata', 'version')
ORDER BY table_name, column_name;
```

**✅ Resultado esperado:**
- `gm_restaurants`: `fiscal_config`, `external_ids`
- `gm_orders`: `sync_metadata`, `version`
- `integration_orders`: tabela criada

### 1.2 Verificar Funções RPC

```sql
SELECT proname, pronargs 
FROM pg_proc 
WHERE proname IN ('create_order_atomic', 'check_open_orders_with_lock')
ORDER BY proname;
```

**✅ Resultado esperado:**
- `create_order_atomic` com **4 parâmetros**
- `check_open_orders_with_lock` com **1 parâmetro**

### 1.3 Verificar Trigger

```sql
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname = 'trigger_increment_order_version';
```

**✅ Resultado esperado:**
- Trigger `trigger_increment_order_version` existe na tabela `gm_orders`

---

## 🧪 FASE 2: Testes de Sanidade (30 minutos)

### 2.1 Teste: Criar Pedido Online

1. Abrir TPV no navegador
2. Criar um pedido simples (1 item, mesa qualquer)
3. Verificar que pedido aparece na lista
4. Verificar no banco:

```sql
SELECT id, short_id, version, sync_metadata 
FROM gm_orders 
ORDER BY created_at DESC 
LIMIT 1;
```

**✅ Validações:**
- `version` = 1 (para pedido novo)
- `sync_metadata` = NULL (pedido online não precisa)

### 2.2 Teste: Modificar Pedido (Versioning)

1. Abrir o pedido criado acima
2. Adicionar um item
3. Verificar no banco:

```sql
SELECT id, version, updated_at 
FROM gm_orders 
WHERE id = '<ORDER_ID>';
```

**✅ Validações:**
- `version` incrementou para 2
- `updated_at` foi atualizado

### 2.3 Teste: Cash Register Alert

1. Fechar caixa (se estiver aberto)
2. Acessar TPV
3. **✅ Deve aparecer banner vermelho:** "⚠️ Caixa Fechado"
4. Abrir caixa
5. **✅ Banner deve desaparecer**

---

## 🧪 FASE 3: Testes Offline (1 hora)

### 3.1 Teste: Criar Pedido Offline

1. Abrir DevTools → Network → Offline (ou desligar WiFi)
2. Criar pedido offline (2-3 itens)
3. Verificar IndexedDB:
   - DevTools → Application → IndexedDB → `offline_queue`
   - Deve ter 1 item com `type: 'ORDER_CREATE'`
   - Anotar `localId` do payload

4. Ligar WiFi (ou desmarcar Offline)
5. Aguardar sincronização (2-3 segundos)
6. Verificar no banco:

```sql
SELECT id, sync_metadata, version 
FROM gm_orders 
WHERE (sync_metadata->>'localId')::TEXT = '<LOCAL_ID_ANOTADO>';
```

**✅ Validações:**
- Pedido foi criado no banco
- `sync_metadata` contém `localId`
- `version` = 1

### 3.2 Teste: Idempotência (Fechar Aba Durante Sync)

1. Criar pedido offline novamente
2. Ligar WiFi
3. **Fechar aba IMEDIATAMENTE** (durante sync)
4. Reabrir TPV
5. Verificar que pedido **NÃO foi duplicado**:

```sql
SELECT COUNT(*) as total
FROM gm_orders 
WHERE (sync_metadata->>'localId')::TEXT = '<LOCAL_ID>';
```

**✅ Validação:**
- `total` = 1 (não 2)

---

## 🧪 FASE 4: Testes de Race Condition (30 minutos)

### 4.1 Teste: Modificação Simultânea

**Requisito:** 2 dispositivos/abas diferentes

1. **Dispositivo 1**: Abrir pedido existente
2. **Dispositivo 2**: Abrir mesmo pedido
3. **Dispositivo 1**: Adicionar item "A"
4. **Dispositivo 2**: Adicionar item "B" (ao mesmo tempo)
5. **Dispositivo 1**: Confirmar (deve suceder)
6. **Dispositivo 2**: Confirmar (deve falhar com `CONCURRENT_MODIFICATION`)

**✅ Validações:**
- Apenas 1 modificação sucede
- Outra recebe erro de conflito
- Console mostra: `[OrderEngine] CONCURRENT_MODIFICATION`

---

## 🧪 FASE 5: Teste Fiscal (30 minutos)

### 5.1 Teste: Sem Credenciais

1. Verificar que não há credenciais fiscais configuradas
2. Processar pagamento de um pedido
3. **✅ Deve aparecer alerta:** "⚠️ Fiscal não configurado - Risco de multa"
4. Verificar que pagamento não foi bloqueado (sistema continua funcionando)

### 5.2 Teste: Com Credenciais (Se disponível)

1. Configurar InvoiceXpress no Settings → Fiscal
2. Processar pagamento
3. Verificar `fiscal_event_store`:

```sql
SELECT status, gov_protocol, created_at 
FROM fiscal_event_store 
ORDER BY created_at DESC 
LIMIT 1;
```

**✅ Validações:**
- `status` = 'REPORTED' (não 'REJECTED')
- `gov_protocol` contém ID real (não 'INV-MOCK-*')

---

## 📊 FASE 6: Validação Final (15 minutos)

### 6.1 Checklist Completo

- [ ] Todas as migrations aplicadas
- [ ] Colunas críticas existem
- [ ] Funções RPC criadas
- [ ] Trigger funcionando
- [ ] Pedido online criado com sucesso
- [ ] Versioning incrementa corretamente
- [ ] Cash Register alert aparece
- [ ] Pedido offline sincroniza
- [ ] Idempotência funciona (não duplica)
- [ ] Race condition detectada (CONCURRENT_MODIFICATION)
- [ ] Fiscal alert aparece sem credenciais
- [ ] Sistema continua funcionando normalmente

### 6.2 Documentar Resultados

Preencher `VALIDACAO_HARDENING_P0.md` com:
- Data da validação
- Resultado de cada teste
- Bugs encontrados (se houver)
- Observações

---

## 🆘 Problemas Comuns

### Erro: "column sync_metadata does not exist"
**Solução:** Aplicar migration 3 (Offline Core)

### Erro: "function create_order_atomic does not exist"
**Solução:** Aplicar migration 4 (Atomic Order Creation)

### Erro: "function check_open_orders_with_lock does not exist"
**Solução:** Aplicar migration 5 (Cash Register Lock)

### Pedidos duplicados após reconexão
**Solução:** Verificar que migration 4 inclui verificação de idempotência (localId)

### Version não incrementa
**Solução:** Verificar que trigger `trigger_increment_order_version` existe

---

## ✅ Próximos Passos (Após Validação)

Se todos os testes passaram:

1. **Marcar release como validado** em `VALIDACAO_HARDENING_P0.md`
2. **Proceder com testes de produção real** (ver `tests/manual/production-test-scenarios.md`)
3. **Preparar para soft launch** com 1 restaurante piloto

Se houver falhas:

1. **Documentar bugs** encontrados
2. **Priorizar correções** (P0 > P1 > P2)
3. **Re-executar validação** após correções

---

**Última atualização:** 18 Janeiro 2026  
**Versão:** v0.9.2
