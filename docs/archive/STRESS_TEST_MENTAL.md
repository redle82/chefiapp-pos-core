# 🧠 STRESS TEST MENTAL - ONDE ISSO QUEBRA?

**Data:** 12 Janeiro 2026  
**Versão:** v0.9.2  
**Objetivo:** Identificar pontos de falha antes de produção

---

## 🔴 CENÁRIOS CRÍTICOS

### **1. Perda de Conexão Durante Pagamento**

**Cenário:**
- Cliente está pagando
- Internet cai no meio do processo
- Pagamento processado offline
- Internet volta
- Sincronização falha

**Onde quebra:**
- ⚠️ Duplicação de pagamento
- ⚠️ Pedido não sincronizado
- ⚠️ Estado inconsistente

**Mitigação:**
- ✅ Idempotência implementada
- ✅ Retry com backoff
- ✅ Validação de estado antes de sync

**Status:** ✅ Mitigado

---

### **2. Múltiplos Garçons no Mesmo Pedido**

**Cenário:**
- Garçom A adiciona item
- Garçom B adiciona item simultaneamente
- Ambos veem estados diferentes

**Onde quebra:**
- ⚠️ Conflito de versão
- ⚠️ Perda de dados
- ⚠️ Estado inconsistente

**Mitigação:**
- ✅ Realtime subscriptions
- ✅ Optimistic updates
- ✅ Conflict resolution

**Status:** ✅ Mitigado

---

### **3. Fechamento de Caixa com Pedidos Abertos**

**Cenário:**
- Caixa tenta fechar
- Há pedidos ainda abertos
- Sistema bloqueia ou permite?

**Onde quebra:**
- ⚠️ Perda de receita
- ⚠️ Inconsistência contábil
- ⚠️ Problemas fiscais

**Mitigação:**
- ✅ Validação antes de fechar
- ✅ Bloqueio de fechamento com pedidos abertos
- ✅ Alertas visuais

**Status:** ✅ Mitigado

---

### **4. InvoiceXpress API Down**

**Cenário:**
- Pagamento processado
- InvoiceXpress API está down
- Fiscal não é gerado

**Onde quebra:**
- ⚠️ Não compliance fiscal
- ⚠️ Perda de documentos
- ⚠️ Problemas legais

**Mitigação:**
- ✅ Retry automático
- ✅ Queue de eventos fiscais
- ✅ Fallback para impressão local
- ✅ `fiscal_event_store` como evidência

**Status:** ✅ Mitigado

---

### **5. Glovo Webhook Duplicado**

**Cenário:**
- Glovo envia webhook
- Webhook é processado
- Glovo reenvia (retry)
- Pedido duplicado criado

**Onde quebra:**
- ⚠️ Pedidos duplicados
- ⚠️ Confusão na cozinha
- ⚠️ Perda de tempo

**Mitigação:**
- ✅ `processedOrderIds` Set
- ✅ Validação de idempotência
- ✅ Verificação antes de processar

**Status:** ✅ Mitigado

---

## 🟡 CENÁRIOS DE ESTRESSE

### **6. 100 Pedidos Simultâneos**

**Cenário:**
- Pico de movimento
- 100 pedidos criados em 1 minuto
- Sistema sobrecarregado

**Onde quebra:**
- ⚠️ Timeout de queries
- ⚠️ Degradação de performance
- ⚠️ Perda de dados

**Mitigação:**
- ✅ Indexes otimizados
- ✅ Connection pooling
- ✅ Rate limiting
- ⚠️ **Necessita teste de carga**

**Status:** ⚠️ Necessita validação

---

### **7. Múltiplos Restaurantes Simultâneos**

**Cenário:**
- 10 restaurantes usando sistema
- Todos em pico simultâneo
- Banco sobrecarregado

**Onde quebra:**
- ⚠️ Degradação de performance
- ⚠️ Timeout de queries
- ⚠️ Isolamento comprometido

**Mitigação:**
- ✅ RLS garante isolamento
- ✅ Indexes por tenant
- ⚠️ **Necessita teste de escala**

**Status:** ⚠️ Necessita validação

---

### **8. Offline Prolongado (24h)**

**Cenário:**
- Restaurante fica offline 24h
- 500 pedidos criados offline
- Internet volta
- Sincronização massiva

**Onde quebra:**
- ⚠️ Timeout de sincronização
- ⚠️ Perda de dados
- ⚠️ Estado inconsistente

**Mitigação:**
- ✅ Queue FIFO
- ✅ Batch processing
- ✅ Retry com backoff
- ⚠️ **Necessita teste de volume**

**Status:** ⚠️ Necessita validação

---

## 🟢 CENÁRIOS DE RECOVERY

### **9. Banco de Dados Corrompido**

**Cenário:**
- Banco corrompido
- Dados perdidos
- Sistema inoperante

**Onde quebra:**
- ⚠️ Perda total de dados
- ⚠️ Sistema inoperante
- ⚠️ Impossível recuperar

**Mitigação:**
- ✅ Backup diário
- ✅ Point-in-time recovery
- ✅ Teste de restore
- ⚠️ **Necessita validação de backup**

**Status:** ⚠️ Necessita validação

---

### **10. Ataque de Segurança**

**Cenário:**
- Ataque de força bruta
- SQL injection
- XSS attack

**Onde quebra:**
- ⚠️ Dados comprometidos
- ⚠️ Sistema comprometido
- ⚠️ Perda de confiança

**Mitigação:**
- ✅ RLS previne SQL injection
- ✅ Input validation
- ✅ Rate limiting
- ⚠️ **Necessita audit de segurança**

**Status:** ⚠️ Necessita validação

---

## 📊 MATRIZ DE RISCO

| Cenário | Probabilidade | Impacto | Status | Ação |
|---------|---------------|---------|--------|------|
| Perda de conexão durante pagamento | Alta | Alto | ✅ Mitigado | Monitorar |
| Múltiplos garçons no mesmo pedido | Média | Médio | ✅ Mitigado | Monitorar |
| Fechamento de caixa com pedidos abertos | Baixa | Alto | ✅ Mitigado | Monitorar |
| InvoiceXpress API down | Média | Alto | ✅ Mitigado | Monitorar |
| Glovo webhook duplicado | Baixa | Médio | ✅ Mitigado | Monitorar |
| 100 pedidos simultâneos | Baixa | Alto | ⚠️ Necessita teste | Teste de carga |
| Múltiplos restaurantes simultâneos | Baixa | Alto | ⚠️ Necessita teste | Teste de escala |
| Offline prolongado (24h) | Baixa | Alto | ⚠️ Necessita teste | Teste de volume |
| Banco corrompido | Muito baixa | Crítico | ⚠️ Necessita validação | Teste de backup |
| Ataque de segurança | Baixa | Crítico | ⚠️ Necessita validação | Audit de segurança |

---

## 🎯 AÇÕES PRIORITÁRIAS

### **Imediato:**
1. ⏳ Teste de carga (100 pedidos simultâneos)
2. ⏳ Teste de escala (10 restaurantes)
3. ⏳ Teste de volume (500 pedidos offline)

### **Curto Prazo:**
4. ⏳ Validação de backup
5. ⏳ Audit de segurança
6. ⏳ Teste de recovery

---

## ✅ CONCLUSÃO

**Status Geral:**
- ✅ **Cenários críticos:** Mitigados
- ⚠️ **Cenários de estresse:** Necessitam validação
- ⚠️ **Cenários de recovery:** Necessitam validação

**Recomendação:**
- ✅ Sistema pronto para soft launch
- ⚠️ Executar testes de carga antes de escala
- ⚠️ Validar backup e recovery

---

**Última atualização:** 12 Janeiro 2026
