# TPV Mínimo — Criado do Zero com Docker Core

**Data:** 2026-01-25
**Status:** ✅ Implementado

---

## 🎯 Objetivo

Criar um TPV (Terminal Ponto de Venda) completamente novo do zero, sem reutilizar componentes antigos, conectado exclusivamente ao Docker Core.

---

## ✅ Implementação

### Arquivo: `merchant-portal/src/pages/TPVMinimal/TPVMinimal.tsx`

**Características:**

- ✅ Criado do zero (sem reutilizar componentes antigos)
- ✅ Conectado exclusivamente ao Docker Core via `dockerCoreClient`
- ✅ Usa RPC `create_order_atomic` para criar pedidos
- ✅ Interface mínima (HTML básico, sem estilos complexos)
- ✅ Sem dependências de UI/UX antiga

### Funcionalidades

1. **Listar Produtos**

   - Carrega produtos do cardápio via `dockerCoreClient.from('gm_products')`
   - Filtra por `restaurant_id` e `available = true`
   - Ordena por `created_at`

2. **Carrinho de Compras**

   - Adicionar produtos ao carrinho
   - Incrementar/decrementar quantidade
   - Remover itens
   - Calcular total

3. **Criar Pedido**
   - Usa RPC `create_order_atomic` via `createOrder()` do `OrderWriter`
   - Origem: `'CAIXA'`
   - Método de pagamento: `'cash'`
   - Retorna feedback de sucesso/erro

---

## 🔌 Conexão com Docker Core

### Usa Apenas Docker Core

```typescript
import { dockerCoreClient } from "../../core-boundary/docker-core/connection";
import { createOrder } from "../../core-boundary/writers/OrderWriter";

// Ler produtos
const { data } = await dockerCoreClient
  .from("gm_products")
  .select("*")
  .eq("restaurant_id", RESTAURANT_ID)
  .eq("available", true);

// Criar pedido
const result = await createOrder(RESTAURANT_ID, cart, "CAIXA", "cash", {});
```

### Não Usa

- ❌ Supabase client antigo
- ❌ Componentes antigos do TPV
- ❌ Context providers antigos
- ❌ Hooks antigos

---

## 📊 Estrutura

```
TPVMinimal/
  └── TPVMinimal.tsx
      ├── loadProducts() → dockerCoreClient
      ├── addToCart()
      ├── removeFromCart()
      ├── updateQuantity()
      └── handleCreateOrder() → createOrder() → RPC create_order_atomic
```

---

## 🧪 Como Testar

1. Abrir TPV: `http://localhost:5173/tpv`
2. Verificar que produtos são carregados do Docker Core
3. Adicionar produtos ao carrinho
4. Criar pedido
5. Verificar que pedido aparece no KDS (`http://localhost:5173/kds-minimal`)

---

## ✅ Validação

- ✅ Usa apenas `dockerCoreClient`
- ✅ Usa apenas `createOrder()` do `OrderWriter`
- ✅ Sem referências a Supabase antigo
- ✅ Sem componentes antigos
- ✅ Interface mínima funcional
- ✅ Conectado ao Docker Core

---

## 🔄 Próximos Passos

1. Adicionar seleção de mesa (opcional)
2. Adicionar métodos de pagamento
3. Melhorar feedback visual
4. Adicionar validações

---

**Última atualização:** 2026-01-25
