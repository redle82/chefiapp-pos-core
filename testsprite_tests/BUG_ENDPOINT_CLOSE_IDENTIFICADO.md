# 🔴 BUG IDENTIFICADO - Endpoint /close

**Data:** 13 Janeiro 2026  
**Severidade:** 🔴 P0 - CRÍTICO  
**Status:** ❌ **BUG REAL**

---

## 🐛 Problema

**Endpoint:** `POST /api/orders/{orderId}/close`  
**Erro:** Retorna `404 Not Found`  
**Causa:** Usa tabela `orders` em vez de `gm_orders`

---

## 📍 Localização

**Arquivo:** `server/web-module-api-server.ts`  
**Linhas:** 2862, 2876, 2880

---

## 🔍 Análise

### Código Atual (INCORRETO):

```typescript
// Linha 2862
const { rows } = await pool.query(
  'SELECT status FROM orders WHERE id = $1',  // ❌ Tabela 'orders' não existe
  [orderId]
)

// Linha 2876
await pool.query('UPDATE orders SET status = \'closed\' ...', [orderId])  // ❌

// Linha 2880
const { rows: updatedRows } = await pool.query(
  'SELECT ... FROM orders WHERE id = $1',  // ❌
  [orderId]
)
```

### Problema:

1. Query busca em tabela `orders` (não existe)
2. `rows.length === 0` (nenhum resultado)
3. Código retorna 404 (linha 2867): `ORDER_NOT_FOUND`
4. Endpoint nunca funciona

---

## ✅ Correção Necessária

**Substituir todas as ocorrências:**

```typescript
// ❌ ANTES
'SELECT status FROM orders WHERE id = $1'
'UPDATE orders SET status = \'closed\' ...'
'SELECT ... FROM orders WHERE id = $1'

// ✅ DEPOIS
'SELECT status FROM public.gm_orders WHERE id = $1'
'UPDATE public.gm_orders SET status = \'closed\' ...'
'SELECT ... FROM public.gm_orders WHERE id = $1'
```

---

## 🔧 Fix Completo

**Arquivo:** `server/web-module-api-server.ts:2852-2896`

**Substituir:**
- Linha 2862: `'SELECT status FROM orders WHERE id = $1'` → `'SELECT status FROM public.gm_orders WHERE id = $1'`
- Linha 2876: `'UPDATE orders SET status = \'closed\' ...'` → `'UPDATE public.gm_orders SET status = \'closed\' ...'`
- Linha 2880: `'SELECT ... FROM orders WHERE id = $1'` → `'SELECT ... FROM public.gm_orders WHERE id = $1'`

---

## 📊 Impacto

- 🔴 **Crítico:** Fechamento de pedidos não funciona
- 🔴 **Bloqueador:** Testes TC005 e TC006 falham
- 🔴 **Produção:** Endpoint não funcional

---

## ✅ Após Correção

- ✅ Endpoint `/close` deve funcionar
- ✅ Testes TC005 e TC006 devem passar
- ✅ Fechamento de pedidos operacional

---

**Status:** 🔴 **P0 - CORRIGIR AGORA**
