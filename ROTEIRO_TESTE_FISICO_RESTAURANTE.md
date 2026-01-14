# 🏪 ROTEIRO DE TESTE FÍSICO NO RESTAURANTE

**Data:** 2026-01-24  
**Duração:** 1 tarde (3-4 horas)  
**Objetivo:** Validar reconexão real e External ID em condições reais

---

## 📋 PREPARAÇÃO (30 min antes)

### 1. Ambiente
- [ ] TPV no celular com 4G fraco (2-3 barras)
- [ ] Wi-Fi do restaurante desligado
- [ ] Backup: Last.app funcionando (caso precise)
- [ ] Gerente disponível para monitorar

### 2. Dados de Teste
- [ ] 15-20 mesas reais preparadas
- [ ] Produtos variados (comida, bebida)
- [ ] Split bills preparados (alguns pedidos)

### 3. Monitoramento
- [ ] Logs abertos no laptop (terminal com worker fiscal)
- [ ] Dashboard aberto (ver badge de alerta)
- [ ] Endpoint de teste pronto: `curl http://localhost:4320/api/fiscal/pending-external-ids`

---

## 🔥 TESTE 1: OFFLINE TOTAL (15 min)

### Fase 1: Preparação (2 min)
1. Desligar Wi-Fi do roteador principal
2. TPV no celular com 4G fraco (2-3 barras)
3. Verificar que sistema detecta conexão instável

### Fase 2: Operação Offline (10 min)
1. **Abrir 15-20 mesas reais**
   - Pedidos normais: comida, bebida
   - Alguns com split bill
   - Pagamentos mock (cash/cartão)

2. **Continuar operando normalmente**
   - Criar pedidos
   - Fazer split bills
   - "Pagar" pedidos

3. **Desligar dados móveis do celular** (modo offline total)
   - Continuar operando mais 5 min
   - Sistema deve funcionar em modo offline

### Fase 3: Observação (3 min)
- [ ] Pedidos são salvos localmente?
- [ ] Sistema não trava?
- [ ] Interface continua responsiva?

---

## 📡 TESTE 2: RECONEXÃO E SYNC (20 min)

### Fase 1: Reconexão (1 min)
1. Ligar dados móveis de novo
2. Verificar que sistema detecta reconexão

### Fase 2: Sync Automático (10 min)
**Observar por 10 minutos:**

1. **Pedidos syncam sozinhos?**
   - [ ] useOfflineReconciler funciona?
   - [ ] Pedidos aparecem no backend?
   - [ ] Nenhum pedido duplicado?

2. **External ID chega?**
   - [ ] Worker fiscal processa pedidos?
   - [ ] Chamadas ao provedor fiscal acontecem?
   - [ ] External ID é recebido e salvo?

3. **Logs fiscais corretos?**
   - [ ] Timestamp presente?
   - [ ] Sequência numerada?
   - [ ] IVA correto?

### Fase 3: Verificação Manual (9 min)
1. **Verificar endpoint:**
   ```bash
   curl http://localhost:4320/api/fiscal/pending-external-ids?restaurantId=<ID> \
     -H "x-restaurant-id: <ID>"
   ```
   - [ ] Retorna JSON correto?
   - [ ] Mostra pedidos pending/failed?
   - [ ] Contagem está correta?

2. **Verificar dashboard:**
   - [ ] Badge aparece se houver pendências?
   - [ ] Toast aparece?
   - [ ] Clicar leva para página de detalhes?

3. **Verificar banco:**
   ```sql
   SELECT 
     id, 
     order_id, 
     external_id_status, 
     retry_count,
     external_id,
     created_at
   FROM gm_fiscal_queue
   WHERE restaurant_id = '<ID>'
   ORDER BY created_at DESC;
   ```
   - [ ] Estados corretos (PENDING/CONFIRMED/FAILED)?
   - [ ] External IDs presentes?
   - [ ] Retry count correto?

---

## 🎯 CRITÉRIOS DE APROVAÇÃO

### ✅ **TESTE PASSOU SE:**

1. **Offline Funciona**
   - [ ] Sistema não trava em offline
   - [ ] Pedidos são salvos localmente
   - [ ] Interface continua responsiva

2. **Reconexão Funciona**
   - [ ] Taxa de sucesso sync > 95%
   - [ ] Zero duplicatas
   - [ ] Todos os pedidos têm External ID (após retry)

3. **External ID Funciona**
   - [ ] Worker processa pedidos automaticamente
   - [ ] External ID chega e é salvo
   - [ ] Estados corretos no banco

4. **Alertas Funcionam**
   - [ ] Badge aparece quando há pendências
   - [ ] Toast aparece
   - [ ] Endpoint retorna dados corretos

### ❌ **TESTE FALHOU SE:**

- ❌ Taxa de sucesso sync < 95%
- ❌ Duplicatas aparecem
- ❌ External ID não chega após reconexão
- ❌ Pedidos ficam "presos" em PENDING
- ❌ Sistema trava em offline

---

## 📊 MÉTRICAS A COLETAR

### Durante o Teste
- **Taxa de sucesso sync:** X/Y pedidos (deve ser > 95%)
- **Tempo médio de sync:** X segundos
- **External IDs recebidos:** X/Y pedidos (deve ser 100%)
- **Duplicatas:** X (deve ser 0)
- **Pedidos "presos":** X (deve ser 0)

### Após o Teste
- **Logs fiscais:** Todos têm timestamp, sequência, IVA?
- **Estados no banco:** Todos corretos?
- **Alertas:** Badge e toast funcionaram?

---

## 🛠️ FERRAMENTAS DE MONITORAMENTO

### 1. Terminal com Worker Fiscal
```bash
# Ver logs do worker em tempo real
tail -f logs/fiscal-worker.log

# Ou se estiver rodando via npm
npm run server:fiscal-worker
```

### 2. Dashboard
- Abrir dashboard no navegador
- Observar badge de alerta
- Clicar e ver página de detalhes

### 3. Endpoint de Teste
```bash
# Rodar a cada 30 segundos
watch -n 30 './scripts/test-endpoint-external-id.sh <restaurant-id>'
```

### 4. Banco de Dados
```sql
-- Ver pedidos pendentes em tempo real
SELECT * FROM v_fiscal_pending_external_ids
WHERE restaurant_id = '<ID>'
ORDER BY created_at DESC;
```

---

## ⚠️ PLANO B (SE ALGO QUEBRAR)

### Se Sistema Travar
1. Voltar para Last.app imediatamente
2. Documentar o que quebrou
3. Não tentar "consertar" durante teste

### Se External ID Não Chegar
1. Verificar logs do worker
2. Verificar credenciais do provedor
3. Verificar se worker está rodando
4. Se persistir → marcar como FAILED e alertar

### Se Duplicatas Aparecerem
1. Parar teste imediatamente
2. Verificar idempotência
3. Corrigir antes de continuar

---

## 📝 CHECKLIST FINAL

Antes de considerar "pronto para março":

- [ ] Teste offline passou (sistema não trava)
- [ ] Teste reconexão passou (>95% sucesso)
- [ ] External ID chega para todos os pedidos
- [ ] Zero duplicatas
- [ ] Alertas funcionam (badge + toast)
- [ ] Logs fiscais corretos (timestamp, sequência, IVA)
- [ ] Nenhum pedido "preso" em PENDING

---

**Última Atualização:** 2026-01-24  
**Próxima Ação:** Agendar teste físico no restaurante
