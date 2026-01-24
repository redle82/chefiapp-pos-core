# 🎯 MVP Demo 1-2 Semanas — Mapeamento Técnico

**Data:** 2026-01-13  
**Objetivo:** Mapear recorte de 1-2 semanas para arquivos/componentes reais do TPV atual

---

## 📊 Status Atual vs Recorte Necessário

### ✅ O QUE JÁ EXISTE (Base Sólida)

#### Épico 1 — Fluxo de Mesa/Conta
- ✅ **OrderEngine.createOrder()** — Cria pedido em estado `OPEN`
- ✅ **OrderEngine.closeOrder()** — Fecha pedido (estado `CLOSED`)
- ✅ **OrderContextReal** — Gerencia estado de pedidos
- ✅ **TableContext** — Gerencia mesas
- ✅ **TPV.tsx** — Tela principal com estrutura de layout
- ⚠️ **Falta:** Lista visual clara de mesas/contas com estados

#### Épico 2 — Lançamento de Itens
- ✅ **OrderEngine.addItemToOrder()** — Adiciona item
- ✅ **OrderEngine.removeItemFromOrder()** — Remove item
- ✅ **OrderEngine.updateItemQuantity()** — Atualiza quantidade
- ✅ **useMenuItems()** — Busca produtos do menu
- ✅ **QuickMenuPanel** — Grid de produtos (existe no layout)
- ⚠️ **Falta:** Editor simples de item (OrderItemEditor existe mas precisa revisão)
- ⚠️ **Falta:** Resumo lateral da conta sempre visível

#### Épico 3 — Pagamento
- ✅ **PaymentModal** — Modal de pagamento existe
- ✅ **PaymentEngine.processPayment()** — Processa pagamento
- ✅ **Suporta:** Cash, Card (Stripe), PIX
- ❌ **Falta:** Estado `PARTIALLY_PAID` (não existe)
- ❌ **Falta:** Split Bill por partes iguais
- ❌ **Falta:** Split Bill por itens

---

## 🎯 RECORTE 1-2 SEMANAS — Tarefas Específicas

### 📅 SEMANA 1 — Núcleo Funcional Visível

#### Épico 1 — Fluxo de Mesa/Conta

**Tarefa 1.1 — Lista de Mesas/Contas Ativas**
- **Arquivo:** `merchant-portal/src/pages/TPV/TPV.tsx`
- **Componente existente:** `TableMapPanel` (linha 22)
- **O que fazer:**
  - Modificar `TableMapPanel` para mostrar estados: **Livre / OPEN / PARTIALLY_PAID / CLOSED**
  - Integrar com `useOrders().getActiveOrders()` para buscar pedidos abertos
  - Adicionar ação rápida: **"Abrir conta"** em mesa livre
- **Arquivos a modificar:**
  - `merchant-portal/src/pages/TPV/TPV.tsx` (linha ~541)
  - `merchant-portal/src/ui/design-system/domain/TableMapPanel.tsx` (criar/modificar)
  - `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx` (já tem `getActiveOrders()`)

**Tarefa 1.2 — Abrir Conta (OPEN)**
- **Arquivo:** `merchant-portal/src/pages/TPV/TPV.tsx`
- **Função existente:** `handleCreateOrder()` (linha ~471)
- **O que fazer:**
  - Já funciona! Só precisa garantir que cria `order` com estado `OPEN`
  - Adicionar header fixo mostrando: mesa, hora abertura, total parcial
- **Arquivos a modificar:**
  - `merchant-portal/src/pages/TPV/TPV.tsx` (adicionar header fixo)
  - `merchant-portal/src/core/tpv/OrderEngine.ts` (já cria em `OPEN`)

**Tarefa 1.3 — Encerrar Conta (CLOSED)**
- **Arquivo:** `merchant-portal/src/pages/TPV/components/PaymentModal.tsx`
- **O que fazer:**
  - Já funciona! `PaymentModal` fecha conta após pagamento
  - Garantir que só permite fechar quando saldo == 0 (sem split) OU todos pagamentos aplicados (com split)
- **Arquivos a modificar:**
  - `merchant-portal/src/pages/TPV/components/PaymentModal.tsx` (adicionar validação de saldo)
  - `merchant-portal/src/core/tpv/OrderEngine.ts` (já tem `closeOrder()`)

---

#### Épico 2 — Lançamento de Itens

**Tarefa 2.1 — Grid de Produtos por Categoria**
- **Arquivo:** `merchant-portal/src/ui/design-system/domain/QuickMenuPanel.tsx`
- **O que fazer:**
  - Componente já existe! Só precisa garantir que:
    - Mostra categorias visíveis
    - 1 toque = adiciona 1 unidade na conta atual
    - Indicador visual de quantidades (badge)
- **Arquivos a modificar:**
  - `merchant-portal/src/ui/design-system/domain/QuickMenuPanel.tsx` (melhorar UX de toque)
  - `merchant-portal/src/pages/TPV/TPV.tsx` (garantir integração)

**Tarefa 2.2 — Editor Simples de Item**
- **Arquivo:** `merchant-portal/src/pages/TPV/components/OrderItemEditor.tsx`
- **O que fazer:**
  - Componente já existe! Revisar para garantir:
    - Ajustar quantidade (±)
    - Remover item
    - Campo opcional de observação
- **Arquivos a modificar:**
  - `merchant-portal/src/pages/TPV/components/OrderItemEditor.tsx` (simplificar se necessário)

**Tarefa 2.3 — Resumo Lateral da Conta**
- **Arquivo:** `merchant-portal/src/pages/TPV/TPV.tsx`
- **O que fazer:**
  - Criar componente novo: `OrderSummaryPanel`
  - Sempre visível mostrando:
    - Lista de itens (nome + qty + subtotal)
    - Total parcial
    - Ações: "Dividir conta" e "Fechar e pagar"
- **Arquivos a criar:**
  - `merchant-portal/src/pages/TPV/components/OrderSummaryPanel.tsx` (novo)
- **Arquivos a modificar:**
  - `merchant-portal/src/pages/TPV/TPV.tsx` (adicionar ao layout)

---

### 📅 SEMANA 2 — Efeito "Uau" (Split Bill)

#### Épico 3 — Pagamento + Split Bill (Parcial)

**Tarefa 3.1 — Tela de Pagamento Simples (sem split)**
- **Arquivo:** `merchant-portal/src/pages/TPV/components/PaymentModal.tsx`
- **O que fazer:**
  - Já existe! Só garantir que:
    - Mostra total
    - Seleciona método (Dinheiro / Cartão / Outro)
    - Campo "valor recebido" para troco (quando Dinheiro)
- **Arquivos a modificar:**
  - `merchant-portal/src/pages/TPV/components/PaymentModal.tsx` (já tem, só revisar UX)

**Tarefa 3.2 — Estado PARTIALLY_PAID**
- **Arquivo:** `merchant-portal/src/core/tpv/OrderEngine.ts`
- **O que fazer:**
  - Adicionar estado `PARTIALLY_PAID` ao enum de status
  - Lógica: quando registrar 1 pagamento parcial → `PARTIALLY_PAID`
  - Quando saldo zerar → `CLOSED`
- **Arquivos a modificar:**
  - `merchant-portal/src/core/tpv/OrderEngine.ts` (adicionar estado)
  - `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx` (mapear estado)
  - `merchant-portal/src/pages/TPV/context/OrderTypes.ts` (adicionar ao tipo)

**Tarefa 3.3 — Split por Partes Iguais**
- **Arquivo:** `merchant-portal/src/pages/TPV/components/PaymentModal.tsx` (ou novo componente)
- **O que fazer:**
  - Criar componente: `SplitBillModal.tsx`
  - Fluxo:
    1. Perguntar "quantas pessoas?"
    2. Calcular valor por pessoa (ajustar cêntimos no último)
    3. UX para registrar pagamento de **uma pessoa por vez**:
       - Botão "Pessoa 1 pagou X em Dinheiro" → abate saldo
    4. Mostrar "saldo restante da conta"
- **Arquivos a criar:**
  - `merchant-portal/src/pages/TPV/components/SplitBillModal.tsx` (novo)
- **Arquivos a modificar:**
  - `merchant-portal/src/pages/TPV/components/PaymentModal.tsx` (adicionar botão "Dividir conta")
  - `merchant-portal/src/core/tpv/PaymentEngine.ts` (adicionar método `processPartialPayment()`)

---

## 📋 RESUMO DE ARQUIVOS

### ✅ Já Existem (Só Revisar/Melhorar)
- `merchant-portal/src/pages/TPV/TPV.tsx`
- `merchant-portal/src/pages/TPV/components/PaymentModal.tsx`
- `merchant-portal/src/pages/TPV/components/OrderItemEditor.tsx`
- `merchant-portal/src/core/tpv/OrderEngine.ts`
- `merchant-portal/src/core/tpv/PaymentEngine.ts`
- `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx`
- `merchant-portal/src/ui/design-system/domain/QuickMenuPanel.tsx`

### 🆕 Criar Novos
- `merchant-portal/src/pages/TPV/components/OrderSummaryPanel.tsx` (Tarefa 2.3)
- `merchant-portal/src/pages/TPV/components/SplitBillModal.tsx` (Tarefa 3.3)
- `merchant-portal/src/ui/design-system/domain/TableMapPanel.tsx` (se não existir)

### 🔧 Modificar Existentes
- `merchant-portal/src/core/tpv/OrderEngine.ts` (adicionar `PARTIALLY_PAID`)
- `merchant-portal/src/pages/TPV/context/OrderTypes.ts` (adicionar estado)
- `merchant-portal/src/core/tpv/PaymentEngine.ts` (adicionar `processPartialPayment()`)

---

## 🎯 PRIORIDADE DE IMPLEMENTAÇÃO

### Semana 1 (Núcleo)
1. **OrderSummaryPanel** (Tarefa 2.3) — Mais impacto visual
2. **TableMapPanel** melhorado (Tarefa 1.1) — Mostra estados
3. **Header fixo da conta** (Tarefa 1.2) — Contexto sempre visível

### Semana 2 (Diferencial)
1. **Estado PARTIALLY_PAID** (Tarefa 3.2) — Base para split
2. **SplitBillModal** (Tarefa 3.3) — Feature que vende

---

## ✅ CHECKLIST FINAL

### Semana 1
- [ ] OrderSummaryPanel criado e integrado
- [ ] TableMapPanel mostra estados (Livre/OPEN/CLOSED)
- [ ] Header fixo da conta (mesa, hora, total)
- [ ] QuickMenuPanel com toque rápido funcionando
- [ ] OrderItemEditor simplificado e funcional

### Semana 2
- [ ] Estado PARTIALLY_PAID implementado
- [ ] SplitBillModal criado (split por partes iguais)
- [ ] PaymentEngine.processPartialPayment() implementado
- [ ] Integração completa: dividir → pagar parcial → fechar

---

**Status:** ✅ Mapeamento completo  
**Próximo passo:** Começar implementação pela Semana 1, Tarefa 2.3 (OrderSummaryPanel)
