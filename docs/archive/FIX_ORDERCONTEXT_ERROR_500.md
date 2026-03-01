**Status:** ARCHIVED
**Reason:** Fix aplicado; sistema em estado PURE DOCKER (ver STATE_PURE_DOCKER_APP_LAYER.md)
**Arquivado em:** 2026-01-28

---

# 🔧 Fix: OrderContextReal.tsx — Erro 500

**Data:** 2026-01-25
**Status:** ✅ Corrigido

---

## 🔴 Problema

Erro 500 ao carregar `OrderContextReal.tsx`:

```
GET http://localhost:5175/src/pages/TPV/context/OrderContextReal.tsx?t=1769382447490
net::ERR_ABORTED 500 (Internal Server Error)
```

**Causa:** Variáveis duplicadas no código:

- Linha 698: `const item = order?.items.find(...)`
- Linha 701: `const item = orders.find(...)` - **DUPLICADO**

- Linha 697: `const order = orders.find(...)`
- Linha 721: `const order = orders.find(...)` - **DUPLICADO**

---

## ✅ Solução Implementada

### 1. Removida Declaração Duplicada de `item`

**Antes:**

```typescript
const order = orders.find((o) => o.id === orderId);
const item = order?.items.find((i) => i.id === itemId);
const unitPriceCents = item?.price;
// DOCKER CORE: Atualizar quantidade diretamente via PostgREST
const item = orders
  .find((o) => o.id === orderId)
  ?.items.find((i) => i.id === itemId); // DUPLICADO
if (!item) throw new Error("Item não encontrado");
```

**Depois:**

```typescript
const order = orders.find((o) => o.id === orderId);
const item = order?.items.find((i) => i.id === itemId);
if (!item) throw new Error("Item não encontrado");
const unitPriceCents = item.price;
// DOCKER CORE: Atualizar quantidade diretamente via PostgREST
```

### 2. Removida Declaração Duplicada de `order`

**Antes:**

```typescript
const order = orders.find((o) => o.id === orderId);
// ... código ...
// Atualizar total do pedido
const order = orders.find((o) => o.id === orderId); // DUPLICADO
const currentTotal = order?.total || 0;
```

**Depois:**

```typescript
const order = orders.find((o) => o.id === orderId);
// ... código ...
// Atualizar total do pedido
// Reutilizar order já declarado acima
const currentTotal = order?.total || 0;
```

---

## 📊 Arquivo Corrigido

**Arquivo:** `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx`

**Linhas corrigidas:**

- Linha 701: Removida declaração duplicada de `item`
- Linha 721: Removida declaração duplicada de `order`

---

## ✅ Validação

- ✅ Sem erros de lint
- ✅ Variáveis não duplicadas
- ✅ Código compila corretamente
- ✅ Arquivo carrega sem erro 500

---

## 🧪 Como Testar

1. Abrir o app: `http://localhost:5175`
2. Verificar que não há erro 500 no console
3. Acessar `/garcom` ou `/tpv`
4. Verificar que `OrderContextReal` carrega corretamente

---

**Última atualização:** 2026-01-25
