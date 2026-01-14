# ✅ EXTERNAL ID RETRY - IMPLEMENTADO

**Data:** 2026-01-24  
**Status:** ✅ **CÓDIGO PRONTO - FALTA TESTAR**

---

## 🎯 O QUE FOI IMPLEMENTADO

### 1. **Mock Adapter com Falhas** ✅
- `fiscal-modules/adapters/MockFiscalAdapterWithFailures.ts`
- Simula: timeout, 500, success_no_protocol, success
- Útil para testes determinísticos

### 2. **Estados Explícitos no DB** ✅
- Migration: `supabase/migrations/20260124000001_add_external_id_status.sql`
- Estados:
  - `PENDING_EXTERNAL_ID` - Aguardando External ID
  - `CONFIRMED_EXTERNAL_ID` - External ID recebido
  - `FAILED_EXTERNAL_ID` - Falhou após max retries

### 3. **Validação Crítica no Worker** ✅
- `server/fiscal-queue-worker.ts` atualizado
- Detecta `SUCCESS` sem `gov_protocol`
- Mantém status `PENDING_EXTERNAL_ID` e força retry
- Após 10 tentativas → `FAILED_EXTERNAL_ID`

### 4. **View para Alertas** ✅
- `v_fiscal_pending_external_ids` - Pedidos sem External ID
- Inclui: order_id, retry_count, last_error, minutes_since_created

### 5. **Endpoint API** ✅
- `GET /api/fiscal/pending-external-ids`
- Retorna: pending, failed, total
- Usado para alertas no dashboard

### 6. **Script de Teste** ✅
- `scripts/test-external-id-retry.js`
- Verifica migration, pedidos sem External ID, view

---

## 🧪 COMO TESTAR

### Teste 1: Verificar Implementação
```bash
node scripts/test-external-id-retry.js
```

### Teste 2: Simular External ID Missing
```typescript
// No worker, usar MockFiscalAdapterWithFailures
const adapter = new MockFiscalAdapterWithFailures('success_no_protocol');
// Worker deve detectar e retry
```

### Teste 3: Verificar Retry Persistente
```bash
# 1. Criar pedido fiscal
# 2. Mock retorna success_no_protocol
# 3. Worker detecta e marca PENDING_EXTERNAL_ID
# 4. Reiniciar worker
# 5. Verificar se retry continua (persistente)
```

### Teste 4: Verificar Alerta após Max Retries
```bash
# 1. Forçar 10 tentativas sem External ID
# 2. Verificar se status = FAILED_EXTERNAL_ID
# 3. Verificar se aparece em /api/fiscal/pending-external-ids
```

---

## 📋 CHECKLIST DE VALIDAÇÃO

- [ ] Migration aplicada (`external_id_status` existe)
- [ ] Worker detecta External ID missing
- [ ] Retry automático funciona (exponential backoff)
- [ ] Retry persiste após reload do app
- [ ] Após 10 tentativas → `FAILED_EXTERNAL_ID`
- [ ] Endpoint `/api/fiscal/pending-external-ids` funciona
- [ ] View `v_fiscal_pending_external_ids` retorna dados corretos

---

## 🚦 CRITÉRIO DE PRODUÇÃO

**✅ ENTRA em março se:**
- ✅ External ID missing é detectado
- ✅ Retry automático funciona
- ✅ Retry persiste após reload
- ✅ Alerta visível após timeout (5 min) ou max retries

**❌ NÃO ENTRA se:**
- ❌ External ID pode "sumir" sem alerta
- ❌ Retry não persiste após reload
- ❌ Gerente não tem visibilidade de falha

---

## 📝 PRÓXIMOS PASSOS

1. **Aplicar Migration**
   ```bash
   psql $DATABASE_URL -f supabase/migrations/20260124000001_add_external_id_status.sql
   ```

2. **Testar Worker com Mock**
   - Usar `MockFiscalAdapterWithFailures('success_no_protocol')`
   - Verificar retry automático

3. **Testar Persistência**
   - Reiniciar worker durante retry
   - Verificar se continua

4. **Implementar Alerta Visual** (opcional, mas recomendado)
   - Badge no dashboard com contagem de `FAILED_EXTERNAL_ID`
   - Notificação push/email após 5 min sem External ID

---

**Última Atualização:** 2026-01-24  
**Status:** Código pronto, aguardando testes
