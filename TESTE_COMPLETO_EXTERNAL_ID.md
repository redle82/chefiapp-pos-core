# 🧪 TESTE COMPLETO DE EXTERNAL ID RETRY

**Data:** 2026-01-24  
**Objetivo:** Validar os 3 piores cenários antes de produção  
**Tempo estimado:** 30-45 minutos

---

## 🎯 OS 3 PIORES CENÁRIOS

### 1. **Provedor responde 500 cinco vezes seguidas**
- **Risco:** Sistema pode desistir cedo demais
- **Validação:** Deve retry até 10 tentativas, depois FAILED

### 2. **Provedor responde 200 mas sem gov_protocol**
- **Risco:** Fatura "emitida" mas sem selo legal → risco jurídico
- **Validação:** Deve detectar e manter PENDING até protocol chegar

### 3. **Rede cai após pagamento, antes da chamada fiscal**
- **Risco:** Pedido pago mas fiscal não emitido
- **Validação:** Deve manter PENDING e retry quando rede voltar

---

## 📋 PLANO DE TESTE (30-45 min)

### Passo 1: Ambiente Isolado ✅
```bash
# Opção A: Supabase branch (recomendado)
supabase branch create test-external-id

# Opção B: Banco local
supabase start

# Opção C: Ambiente dev (limpar antes)
psql $DATABASE_URL -c "DELETE FROM gm_fiscal_queue WHERE restaurant_id = '<test-id>'"
```

### Passo 2: Aplicar Migration ✅
```bash
psql $DATABASE_URL -f supabase/migrations/20260124000001_add_external_id_status.sql
```

### Passo 3: Rodar Teste Completo ✅
```bash
# Script automatizado
./scripts/test-external-id-complete.sh

# Ou manual
npm test -- tests/integration/external-id-retry-complete.test.ts
```

### Passo 4: Validar Endpoint ✅
```bash
# Iniciar servidor
npm run server:web-module

# Em outro terminal
curl http://localhost:4320/api/fiscal/pending-external-ids?restaurantId=<ID> \
  -H "x-restaurant-id: <ID>"
```

---

## ✅ CRITÉRIOS DE APROVAÇÃO

### 1. Migration Aplicada ✅
- [ ] Coluna `external_id_status` existe
- [ ] Coluna `external_id` existe
- [ ] View `v_fiscal_pending_external_ids` funciona
- [ ] Funções `confirm_external_id` e `fail_external_id` existem

### 2. Cenário 1: 500 Seguidas ✅
- [ ] Retry automático funciona (1-10 tentativas)
- [ ] Após 10 tentativas → `FAILED_EXTERNAL_ID`
- [ ] Status muda para `failed`
- [ ] `error_history` tem 10 entradas

### 3. Cenário 2: Success sem Protocol ✅
- [ ] Detecta `REPORTED` sem `gov_protocol`
- [ ] Mantém `PENDING_EXTERNAL_ID`
- [ ] Retry funciona
- [ ] Quando protocol chega → `CONFIRMED_EXTERNAL_ID`

### 4. Cenário 3: Rede Cai ✅
- [ ] Timeout detectado
- [ ] Mantém `PENDING_EXTERNAL_ID`
- [ ] `next_retry_at` agendado
- [ ] Quando rede volta → retry automático
- [ ] Protocol chega → `CONFIRMED_EXTERNAL_ID`

### 5. Nenhum Pedido "Preso" ✅
- [ ] Não há pedidos em PENDING há >1h sem retry agendado
- [ ] Todos têm `next_retry_at` ou `FAILED_EXTERNAL_ID`

### 6. Log Auditável ✅
- [ ] `error_history` tem todas as tentativas
- [ ] Cada entrada tem: timestamp, error, attempt
- [ ] Histórico completo até FAILED

### 7. View para Alertas ✅
- [ ] `v_fiscal_pending_external_ids` retorna pending
- [ ] `v_fiscal_pending_external_ids` retorna failed
- [ ] Inclui: minutes_since_created, retry_count, last_error

### 8. Endpoint API ✅
- [ ] `GET /api/fiscal/pending-external-ids` funciona
- [ ] Retorna JSON com pending/failed/total
- [ ] Autenticação funciona

---

## 🚦 VEREDICTO

### ✅ **APROVADO PARA PRODUÇÃO SE:**
- ✅ Todos os 8 critérios acima passarem
- ✅ Testes de integração passarem (npm test)
- ✅ Endpoint retorna dados corretos

### ❌ **NÃO APROVADO SE:**
- ❌ Qualquer critério falhar
- ❌ Pedidos ficam "presos" em PENDING
- ❌ External ID missing não é detectado
- ❌ Retry não funciona após reload

---

## 📝 CHECKLIST FINAL

Antes de aplicar em produção:

- [ ] Migration aplicada em ambiente de teste
- [ ] Testes de integração passaram
- [ ] Endpoint API testado manualmente
- [ ] Badge visual testado no dashboard
- [ ] Documentação atualizada

---

## 🛠️ COMANDOS ÚTEIS

### Verificar Estado Atual
```sql
SELECT 
  id, 
  order_id, 
  external_id_status, 
  retry_count, 
  last_error,
  created_at
FROM gm_fiscal_queue
WHERE external_id_status IN ('PENDING_EXTERNAL_ID', 'FAILED_EXTERNAL_ID')
ORDER BY created_at DESC;
```

### Verificar View
```sql
SELECT * FROM v_fiscal_pending_external_ids
ORDER BY created_at DESC
LIMIT 10;
```

### Forçar Retry Manual (apenas para teste)
```sql
UPDATE gm_fiscal_queue
SET next_retry_at = timezone('utc'::text, now())
WHERE id = '<queue-id>';
```

---

**Última Atualização:** 2026-01-24  
**Próxima Ação:** Executar `./scripts/test-external-id-complete.sh`
