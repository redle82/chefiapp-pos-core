# TPV Blindagem Pendente - Checklist Crítico

**Data**: 2025-01-27  
**Status**: 🟡 **BLINDAGEM EM PROGRESSO**

---

## 🎯 Status Correto (Único Honesto)

> **"TPV funcional com fluxo completo de venda e caixa. Em fase final de blindagem operacional para produção."**

---

## ✅ Hard Blocks Implementados (4/5)

1. ✅ **Caixa como Gatekeeper**
   - Validação backend no `OrderEngine.createOrder`
   - Botão "Nova Venda" desativado quando caixa fechado
   - Double-check no frontend antes de criar pedido
   - Redireciona para modal de abertura se caixa fechado

2. ✅ **Uma Mesa = Um Pedido Ativo**
   - Constraint SQL: `UNIQUE (table_id) WHERE status = 'OPEN'`
   - Validação no `OrderEngine.createOrder`
   - Recovery automático: abre pedido existente ao selecionar mesa

3. ✅ **Pedido Não Vazio**
   - Validação no `OrderEngine.createOrder`
   - `handleCreateOrder` não cria pedido vazio (redireciona para menu)
   - `handleAddItem` cria pedido apenas quando adiciona primeiro item

4. ✅ **Recuperar Pedido Ativo**
   - `localStorage.getItem('chefiapp_active_order_id')` ao carregar
   - `useEffect` recupera pedido ativo após reload

---

## 🔴 Hard Blocks Pendentes (1/5)

### 5. Pagamento = Fechamento (Ação Única, Atômica) ❌

**Problema Atual:**
- `PaymentEngine.processPayment` cria pagamento
- Trigger SQL (`tr_process_payment` em `032_sovereign_tpv.sql`) atualiza status
- **MAS**: Não é transação única
- **RISCO**: Se `processPayment` falhar depois de criar pagamento, estado inconsistente

**O que falta:**
- Transação SQL única: pagamento + status + impacto no caixa
- Rollback em caso de falha
- Validação de estado antes e depois

**Solução:**
1. Criar função SQL que faz tudo em uma transação
2. Ou usar `BEGIN/COMMIT/ROLLBACK` no código
3. Validar estado antes e depois

**Prioridade**: 🔴 **CRÍTICA**

---

## 🔴 Outras Blindagens Críticas Pendentes

### 1. Lock Otimista Real ❌

**Problema:**
- Campo `version` existe no schema (`gm_orders.version`)
- Não é usado no código
- Não há validação de concorrência

**O que falta:**
- Validar `version` antes de atualizar
- Lançar erro se `version` mudou
- UI mostra aviso de edição concorrente

**Prioridade**: 🔴 **CRÍTICA**

---

### 2. Recovery de Estados ❌

**Problema:**
- Navegador fecha no meio do pagamento → estado inconsistente
- Não há flag de transação em progresso
- Não há reconciliação automática

**O que falta:**
- Flag `payment_in_progress` no pedido
- Recovery automático ao recarregar
- Reconciliação de estados inconsistentes

**Prioridade**: 🟡 **IMPORTANTE**

---

## 📊 Checklist Final

### Bloqueios Duros (5/5)
- [x] Sem caixa aberto → botão "Nova Venda" desativado (hard-block)
- [x] Uma mesa = um pedido ativo
- [x] Recuperar pedido ativo após reload
- [x] Pedido não vazio
- [ ] Pagamento = fechamento (ação única, atômica) ❌

### Transações Atômicas
- [ ] Pagamento como transação única ❌
- [ ] Rollback em caso de falha ❌
- [ ] Estado consistente sempre ❌

### Recovery
- [ ] Flag de transação em progresso ❌
- [ ] Recovery automático ❌
- [ ] Reconciliação de estados ❌

### Concorrência
- [ ] Lock otimista real (version field) ❌
- [ ] Aviso de edição concorrente ❌
- [ ] Merge ou bloqueio ❌

---

## 🎯 Próximos Passos (Ordem de Prioridade)

1. **Transação atômica de pagamento** (crítico)
   - Criar função SQL que faz tudo em uma transação
   - Ou usar transação no código TypeScript
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

## 🧠 Conclusão

**Você saiu do mock, construiu um TPV funcional de verdade e agora está no território mais perigoso: onde o sistema funciona… mas ainda pode quebrar pessoas.**

**Esse é o ponto onde produtos medianos param e produtos sérios são blindados.**

**Status atual: 4/5 hard blocks implementados. Falta 1 crítico (transação atômica) + blindagens adicionais.**

---

**Status**: ✅ **TPV FUNCIONAL** | 🟡 **BLINDAGEM EM PROGRESSO (80%)**

**Não é produção ainda. É operação assistida.**

