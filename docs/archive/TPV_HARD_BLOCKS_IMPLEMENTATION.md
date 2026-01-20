# TPV Hard Blocks - Implementação

**Data**: 2025-01-27  
**Status**: 🟡 **EM IMPLEMENTAÇÃO**

---

## 🎯 Objetivo

Implementar bloqueios duros (hard-blocks) para garantir que o TPV não permita operações inválidas, mesmo em condições de erro ou uso incorreto.

---

## ✅ Hard Blocks Implementados

### 1. Caixa como Gatekeeper (Parcial) ✅

**Backend (OrderEngine):**
- ✅ Validação no `createOrder`: verifica caixa aberto antes de criar pedido
- ✅ Lança erro `CASH_REGISTER_CLOSED` se caixa fechado

**Frontend (TPV.tsx):**
- ✅ Botão "Nova Venda" desativado quando `!cashRegisterOpen`
- ✅ `handleCreateOrder` verifica caixa antes de qualquer ação
- ✅ Double-check: verifica caixa no backend também
- ✅ Redireciona para modal de abertura se caixa fechado

**Status**: ✅ **IMPLEMENTADO** (mas precisa validar todos os fluxos)

---

### 2. Uma Mesa = Um Pedido Ativo ✅

**Backend (OrderEngine):**
- ✅ Validação no `createOrder`: verifica se mesa já tem pedido ativo
- ✅ Constraint SQL: `UNIQUE (table_id) WHERE status = 'OPEN'`
- ✅ Lança erro `TABLE_HAS_ACTIVE_ORDER` se violado

**Frontend (TPV.tsx):**
- ✅ `handleSelectTable` abre pedido existente automaticamente
- ✅ Tratamento de erro específico com recovery

**Status**: ✅ **IMPLEMENTADO**

---

### 3. Pedido Não Vazio ✅

**Backend (OrderEngine):**
- ✅ Validação no `createOrder`: verifica se tem pelo menos 1 item
- ✅ Lança erro `EMPTY_ORDER` se violado

**Frontend (TPV.tsx):**
- ✅ `handleCreateOrder` não cria pedido vazio (redireciona para menu)
- ✅ `handleAddItem` cria pedido apenas quando adiciona primeiro item

**Status**: ✅ **IMPLEMENTADO**

---

### 4. Recuperar Pedido Ativo ✅

**Frontend (TPV.tsx):**
- ✅ `localStorage.getItem('chefiapp_active_order_id')` ao carregar
- ✅ `useEffect` recupera pedido ativo após reload

**Status**: ✅ **IMPLEMENTADO** (mas precisa validar recovery completo)

---

## 🔴 Hard Blocks Pendentes

### 1. Pagamento Atômico ❌

**Problema Atual:**
- `PaymentEngine.processPayment` cria pagamento
- Trigger SQL atualiza status do pedido
- Não há transação única (tudo ou nada)

**O que falta:**
- Transação SQL única: pagamento + status + impacto no caixa
- Rollback em caso de falha
- Estado consistente sempre

**Prioridade**: 🔴 **CRÍTICA**

---

### 2. Lock Otimista Real ❌

**Problema Atual:**
- Campo `version` existe no schema
- Não é usado no código
- Não há validação de concorrência

**O que falta:**
- Validar `version` antes de atualizar
- Lançar erro se `version` mudou
- UI mostra aviso de edição concorrente

**Prioridade**: 🔴 **CRÍTICA**

---

### 3. Recovery de Estados ❌

**Problema Atual:**
- Navegador fecha no meio do pagamento → estado inconsistente
- Não há flag de transação em progresso
- Não há reconciliação automática

**O que falta:**
- Flag `payment_in_progress` no pedido
- Recovery automático ao recarregar
- Reconciliação de estados inconsistentes

**Prioridade**: 🟡 **IMPORTANTE**

---

## 📊 Checklist de Blindagem

### Bloqueios Duros
- [x] Sem caixa aberto → botão "Nova Venda" desativado (hard-block)
- [x] Uma mesa = um pedido ativo (já implementado, validar)
- [x] Recuperar pedido ativo após reload (já implementado, validar)
- [ ] Pagamento = fechamento (ação única, atômica) ❌
- [ ] Aviso/lock em edição concorrente (version field real) ❌

### Transações Atômicas
- [ ] Pagamento como transação única ❌
- [ ] Rollback em caso de falha ❌
- [ ] Estado consistente sempre ❌

### Recovery
- [ ] Flag de transação em progresso ❌
- [ ] Recovery automático ❌
- [ ] Reconciliação de estados ❌

---

## 🎯 Próximos Passos

1. **Transação atômica de pagamento** (crítico)
   - Usar transação SQL ou garantir sequência com rollback
   - Validar estado antes e depois

2. **Lock otimista real** (crítico)
   - Usar campo `version` no código
   - Validar antes de atualizar
   - UI mostra aviso

3. **Recovery de estados** (importante)
   - Flag de transação em progresso
   - Recovery automático
   - Reconciliação

---

**Status**: 🟡 **BLINDAGEM EM PROGRESSO**

**Não é produção ainda. É operação assistida.**

