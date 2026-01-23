# 🚨 Bloqueadores de Produção (UX)

**Data:** 2026-01-24  
**Status:** 🔴 **BLOQUEANTES - Corrigir ANTES de Produção**

---

## ⚠️ ATENÇÃO

**Estes 4 erros críticos de UX devem ser corrigidos ANTES de usar com clientes reais.**

⏱️ **Tempo estimado:** 1-2 dias  
🎯 **Prioridade:** 🔴 MÁXIMA

---

## 🔴 BLOQUEADOR 1: Cliente não sabe se pedido foi recebido

**ID:** ERRO-001  
**Impacto:** 🔴 **ALTO** - Cliente pode criar pedido duplicado  
**Tempo:** 30 minutos

### Problema
Após cliente enviar pedido via web, não há feedback claro de que pedido foi recebido pelo restaurante.

### Impacto
- Cliente não sabe se precisa reenviar
- Risco de pedido duplicado
- Ansiedade do cliente
- Possível perda de confiança

### Correção
Adicionar confirmação clara após envio:
- ✅ Mensagem: "Pedido recebido! Número: #123"
- ✅ Status em tempo real
- ✅ Número de pedido visível

**Tarefa:** TAREFA-001  
**Arquivo:** `merchant-portal/src/public/pages/PublicOrderingPage.tsx`

---

## 🔴 BLOQUEADOR 2: Garçom não sabe origem do pedido

**ID:** ERRO-002  
**Impacto:** 🔴 **ALTO** - Garçom não sabe onde entregar  
**Tempo:** 1 hora

### Problema
Garçom não sabe se pedido veio da web ou foi criado por outro garçom. Não sabe qual mesa entregar.

### Impacto
- Atraso na entrega
- Confusão na equipe
- Cliente esperando sem saber
- Possível erro de entrega

### Correção
Adicionar badge visual claro:
- ✅ Badge "WEB" para pedidos web
- ✅ Número da mesa sempre visível
- ✅ Ícone diferenciado

**Tarefa:** TAREFA-002  
**Arquivo:** `mobile-app/app/(tabs)/staff.tsx`

---

## 🔴 BLOQUEADOR 3: Ação "acknowledge" não é clara

**ID:** ERRO-003  
**Impacto:** 🔴 **ALTO** - Garçom não entende o que fazer  
**Tempo:** 30 minutos

### Problema
Botão "ACKNOWLEDGE" não é claro. Garçom não sabe o que significa ou o que acontecerá ao clicar.

### Impacto
- Garçom hesita em clicar
- Atraso na ação
- Possível erro de interpretação
- Frustração do usuário

### Correção
Mudar para linguagem clara:
- ✅ "VER PEDIDO" em vez de "ACKNOWLEDGE"
- ✅ Ou "CONFIRMAR RECEBIMENTO"
- ✅ Tooltip explicativo

**Tarefa:** TAREFA-003  
**Arquivo:** `mobile-app/app/(tabs)/staff.tsx`

---

## 🔴 BLOQUEADOR 4: Duplo clique em pagamento

**ID:** ERRO-004  
**Impacto:** 🔴 **CRÍTICO** - Pagamento pode ser duplicado  
**Tempo:** 1 hora

### Problema
Não há proteção contra duplo clique no botão de pagamento. Cliente/garçom pode pagar duas vezes.

### Impacto
- **CRÍTICO:** Pagamento duplicado
- Cliente cobrado duas vezes
- Problema financeiro grave
- Perda de confiança total

### Correção
Implementar proteção:
- ✅ Debounce no botão (desabilitar após clique)
- ✅ Loading state durante processamento
- ✅ Confirmação antes de processar
- ✅ Validação no backend

**Tarefa:** TAREFA-004  
**Arquivo:** `mobile-app/app/(tabs)/staff.tsx` (handlePaymentConfirm)

---

## ✅ CHECKLIST DE CORREÇÃO

### Antes de Produção
- [ ] **ERRO-001:** Adicionar confirmação de pedido recebido (30min)
- [ ] **ERRO-002:** Adicionar badge origem pedido + mesa (1h)
- [ ] **ERRO-003:** Mudar "acknowledge" para linguagem clara (30min)
- [ ] **ERRO-004:** Proteção contra duplo clique em pagamento (1h)

**Total:** 3 horas (1 dia de trabalho)

---

## 📋 PRÓXIMOS PASSOS

### Após Corrigir os 4 Bloqueadores

1. **Testar 1 turno completo** no Sofia
2. **Anotar fricções humanas reais**
3. **Ajustar microfluxos** (não features)
4. **Só então:** Pitch, Venda, Escala

---

## 📚 REFERÊNCIAS

- **Plano detalhado:** [`ACTION_PLAN_UX_FIXES.md`](./ACTION_PLAN_UX_FIXES.md)
- **Relatório completo:** [`HUMAN_TEST_REPORT.md`](./HUMAN_TEST_REPORT.md)
- **Resumo executivo:** [`HUMAN_TEST_EXECUTIVE_SUMMARY.md`](./HUMAN_TEST_EXECUTIVE_SUMMARY.md)

---

**Versão:** 1.0  
**Data:** 2026-01-24  
**Status:** 🔴 **BLOQUEANTES - Corrigir ANTES de Produção**
