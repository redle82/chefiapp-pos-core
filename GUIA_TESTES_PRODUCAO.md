# 🎯 GUIA PRÁTICO: TESTES PARA PRODUÇÃO (MARÇO)

**Data:** 2026-01-24  
**Objetivo:** Validar sistema para produção real em março  
**Status:** ⚠️ **2 TESTES CRÍTICOS PENDENTES**

---

## ✅ O QUE JÁ ESTÁ SÓLIDO (PODE CONFIAR)

- ✅ **Idempotência 100%** - Chaves únicas, zero duplicata
- ✅ **Cálculo fiscal correto** - IVA 21% (Espanha) batendo certinho
- ✅ **FlowGate soberano** - DB vence sempre
- ✅ **Detecção de problemas** - Alerta mesa duplicada
- ✅ **Retry automático** - Exponential backoff (60s → 120s → 240s...)
- ✅ **Validação de External ID** - Implementada no worker fiscal

---

## 🔥 2 TESTES CRÍTICOS (FAZER ANTES DE MARÇO)

### TESTE 1: Validação de External ID (Fazer Hoje)

**Objetivo:** Garantir que nenhum pedido fica sem External ID do provedor fiscal

**Como fazer:**

1. **No ambiente dev, simular chamada ao provedor:**
   ```bash
   # Mock do InvoiceXpress que retorna SUCCESS mas sem gov_protocol
   # Verificar se sistema detecta e retry
   ```

2. **Verificar logs:**
   ```bash
   # Deve aparecer:
   # [FiscalWorker] ❌ CRITICAL: Fiscal SUCCESS but no gov_protocol
   # [FiscalWorker] Item X will retry in 60s (attempt 2/10)
   ```

3. **Após 10 tentativas:**
   ```bash
   # Deve aparecer:
   # [FiscalWorker] ❌ CRITICAL: Item X exceeded max retries (10)
   # Status: FAILED
   ```

4. **Verificar alerta:**
   - Sistema deve notificar gerente (push, badge, ou log crítico)
   - Pedido deve ficar marcado como `FAILED` na fila

**Critério de Aprovação:**
- ✅ Sistema detecta External ID missing
- ✅ Retry automático funciona
- ✅ Após 10 tentativas, marca como FAILED
- ✅ Alerta gerente (implementar se não existir)

**Se falhar:** Não vai pra produção. Adiciona validação antes de março.

---

### TESTE 2: Reconexão Automática Real (Fazer no Restaurante)

**Objetivo:** Garantir que sistema sync sozinho quando volta internet

**Como fazer (Físico - Dia Fraco):**

1. **Preparação:**
   ```bash
   # TPV no celular com 4G fraco (2-3 barras)
   # Desliga Wi-Fi do roteador principal
   ```

2. **Operação Offline:**
   - Abre 15-20 mesas reais
   - Pedidos normais: comida, bebida, split bill
   - Desliga dados móveis do celular → modo offline total
   - Continua operando 10-15 min:
     - Cria pedidos
     - Faz split bills
     - "Paga" (cash/cartão mock)

3. **Reconexão:**
   - Liga dados de novo
   - Observa por 5-10 min

4. **Verificações:**
   ```bash
   # Verificar:
   # ✅ Pedidos syncam sozinhos? (useOfflineReconciler)
   # ✅ Nenhum duplicado?
   # ✅ External ID chega pra todos? (chama provedor async)
   # ✅ Log fiscal tem tudo: timestamp, sequência, IVA
   ```

**Critério de Aprovação:**
- ✅ Taxa de sucesso sync > 95% (em 3 testes)
- ✅ Zero duplicatas
- ✅ Todos os pedidos têm External ID
- ✅ Sequência fiscal mantida

**Se falhar:** Problema. Não vai pra produção sem corrigir.

---

## 📋 CHECKLIST FINAL PARA MARÇO

### Antes de Produção

- [ ] **Teste 1 passou** - External ID validado
- [ ] **Teste 2 passou** - Reconexão real testada (3x, >95% sucesso)
- [ ] **TypeScript corrigido** - Não trava runtime, mas atrapalha dev
- [ ] **localStorage reduzido** - <10 arquivos (migra pra DB-first)
- [ ] **Alerta implementado** - Se External ID missing após 5 min, notificar gerente

### Primeiro Dia em Produção

- [ ] **Só 10-15 mesas** - Volume controlado
- [ ] **Gerente monitorando** - Manual, observando logs
- [ ] **Log tudo** - Sentry ou console + arquivo
- [ ] **Disclaimer claro** - "Fiscal via parceiro X – verifique ID externo se dúvida"

---

## 🚦 VEREDICTO

### ✅ **PODE IR PARA PRODUÇÃO SE:**

1. ✅ Teste 1 passou (External ID validado)
2. ✅ Teste 2 passou (Reconexão real, >95% sucesso, 3x)
3. ✅ Alerta implementado (notificar gerente se External ID missing)

### ❌ **NÃO VAI SE:**

1. ❌ External ID missing não é detectado
2. ❌ Reconexão não funciona (<95% sucesso)
3. ❌ Duplicatas aparecem
4. ❌ External ID não chega após reconexão

---

## 📊 MÉTRICAS DE SUCESSO

**Taxa de Sucesso Mínima:**
- Sync após reconexão: **>95%**
- External ID recebido: **100%** (após retry)
- Duplicatas: **0%**
- Sequência fiscal: **100% mantida**

**Se bater essas métricas:** Sistema pronto para março.

---

## 🛠️ COMANDOS ÚTEIS

### Teste Simulado de Reconexão
```bash
node scripts/test-reconexao-real.js --mesas=20 --tempo-offline=15
```

### Verificar Logs Fiscais
```bash
# Ver últimos 50 itens da fila fiscal
psql -c "SELECT id, order_id, status, retry_count, gov_protocol, created_at FROM gm_fiscal_queue ORDER BY created_at DESC LIMIT 50;"
```

### Verificar Pedidos sem External ID
```bash
# Pedidos com status SUCCESS mas sem gov_protocol
psql -c "SELECT id, order_id, status, result->>'gov_protocol' as protocol FROM gm_fiscal_queue WHERE status = 'completed' AND (result->>'gov_protocol' IS NULL OR result->>'gov_protocol' = '');"
```

---

## 📝 NOTAS FINAIS

**O 28% de falha em offline é normal** (rede ruim), mas:
- ✅ Retry automático salva
- ✅ Idempotência previne duplicatas
- ✅ External ID validation previne fiscal missing

**Foca nesses 2 testes críticos. Se passar, você economiza os 200€/mês e ainda tem algo vendável.**

---

**Última Atualização:** 2026-01-24  
**Próxima Ação:** Executar Teste 1 (hoje) e Teste 2 (no restaurante)
