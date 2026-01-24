# TPV Micro-Riscos Reais - Documentação

**Data**: 2025-01-27  
**Status**: ✅ **RISCOS IDENTIFICADOS E MITIGADOS**

---

## 🎯 Objetivo

Documentar micro-riscos reais (não teóricos) que ainda existem no TPV, mesmo após implementação da transação atômica.

---

## ⚠️ Micro-Riscos Identificados

### 1. Pagamento Duplo por Double-Click ✅ MITIGADO

**Cenário Real:**
- Garçom clica duas vezes rápido em "Cobrar"
- RPC chamada duas vezes quase simultâneas
- Risco: processar pagamento duas vezes

**Proteção Atual:**
- ✅ `payment_status = 'PAID'` check na função SQL
- ✅ `SELECT FOR UPDATE` adicionado (lock pessimista)
- ✅ Validação antes de processar

**Status**: ✅ **MITIGADO** (lock pessimista implementado)

---

### 2. Pagamento Parcial (Decisão de Produto) ✅ DOCUMENTADO

**Cenário:**
- Função permite `p_amount_cents != v_order_total_cents`
- Hoje valida apenas se não excede total
- Permite pagamento parcial implicitamente

**Decisão:**
- ✅ **Implementado**: Validação estrita `p_amount_cents != v_order_total_cents`
- ✅ **Documentado**: "Pagamentos parciais ainda não suportados"
- ✅ **Futuro**: Remover validação quando implementar split payment

**Status**: ✅ **RESOLVIDO** (validação estrita implementada)

---

### 3. Concorrência Visual (Não Financeira) 🟡 ACEITÁVEL

**Cenário Real:**
- Dois garçons
- Mesmo pedido
- Um edita enquanto outro vê estado antigo
- Risco: confusão operacional, não financeira

**Impacto:**
- ❌ NÃO quebra dinheiro
- ❌ NÃO quebra caixa
- ❌ NÃO quebra estado
- ✅ Só quebra UX em situações raras

**Mitigação Futura:**
- Lock otimista real (version field)
- Aviso de edição concorrente
- Merge ou bloqueio

**Status**: 🟡 **ACEITÁVEL** (não bloqueador para operação assistida)

---

## ✅ Mitigações Implementadas

### 1. SELECT FOR UPDATE ✅
- Lock pessimista no pedido
- Previne pagamento duplo simultâneo
- Liberado automaticamente ao final da transação

### 2. Validação Estrita de Valor ✅
- `p_amount_cents != v_order_total_cents` → erro
- Documentado: "Pagamentos parciais ainda não suportados"
- Fácil remover quando implementar split payment

---

## 📊 Matriz de Riscos

| Risco | Impacto Financeiro | Impacto Operacional | Status |
|-------|-------------------|---------------------|--------|
| Pagamento Duplo | 🔴 Alto | 🟡 Médio | ✅ Mitigado |
| Pagamento Parcial | 🟡 Médio | 🟡 Médio | ✅ Resolvido |
| Concorrência Visual | ❌ Nenhum | 🟡 Médio | 🟡 Aceitável |

---

## 🎯 Conclusão

**Todos os riscos financeiros críticos foram mitigados.**

**Riscos operacionais restantes:**
- 🟡 Concorrência visual (não bloqueador)
- 🟡 Recovery de estados (não bloqueador)

**Status**: ✅ **TPV SEGURO PARA OPERAÇÃO ASSISTIDA**

---

**Próximos passos (quando necessário):**
- Lock otimista real (version field)
- Recovery automático pós-crash
- Modo multi-garçom consciente

