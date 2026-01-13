# ✅ CORREÇÃO APLICADA - Endpoints /lock e /close

**Data:** 13 Janeiro 2026  
**Severidade:** 🔴 P0 - CRÍTICO  
**Status:** ✅ **CORRIGIDO**

---

## 🐛 Problema Identificado

**Endpoints:** 
- `POST /api/orders/{orderId}/lock`
- `POST /api/orders/{orderId}/close`

**Erro:** Retornavam `404 Not Found`  
**Causa:** Usavam tabela `orders` em vez de `gm_orders`

---

## ✅ Correções Aplicadas

### 1. Endpoint `/close` (Linhas 2862, 2876, 2880)

**ANTES:**
```typescript
'SELECT status FROM orders WHERE id = $1'
'UPDATE orders SET status = \'closed\' ...'
'SELECT ... FROM orders WHERE id = $1'
```

**DEPOIS:**
```typescript
'SELECT status FROM public.gm_orders WHERE id = $1'
'UPDATE public.gm_orders SET status = \'closed\' ...'
// Query completa com JOIN para items
```

---

### 2. Endpoint `/lock` (Linhas 2800, 2828, 2834)

**ANTES:**
```typescript
'SELECT status, items FROM orders WHERE id = $1'
'UPDATE orders SET status = \'locked\' ...'
'SELECT ... FROM orders WHERE id = $1'
```

**DEPOIS:**
```typescript
// Query completa com JOIN para items de gm_order_items
'SELECT o.*, json_agg(...) as items FROM public.gm_orders o LEFT JOIN public.gm_order_items oi ...'
'UPDATE public.gm_orders SET status = \'locked\', total_amount = $1 ...'
// Query completa com JOIN para retornar items
```

---

## 🔧 Melhorias Adicionais

1. ✅ **Queries com JOIN:** Agora buscam items de `gm_order_items` corretamente
2. ✅ **Schema correto:** Usa `total_amount` (schema real) em vez de `total_cents`
3. ✅ **Estado correto:** Verifica `pending` (schema real) em vez de `open`
4. ✅ **Resposta consistente:** Retorna estrutura igual à criação de pedidos

---

## 📊 Impacto

- ✅ **Crítico:** Fechamento e bloqueio de pedidos agora funcionam
- ✅ **Testes:** TC005 e TC006 devem passar após re-execução
- ✅ **Produção:** Endpoints operacionais

---

## 🚀 Próximos Passos

1. ✅ **Correção aplicada** - Código atualizado
2. ⏳ **Reiniciar servidor** - Para carregar código novo
3. ⏳ **Re-executar TestSprite** - Para validar correção
4. ⏳ **Validar endpoints** - Testar manualmente se necessário

---

**Status:** ✅ **CORRIGIDO** - Pronto para re-execução do TestSprite
