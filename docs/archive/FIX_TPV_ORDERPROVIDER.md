**Status:** ARCHIVED
**Reason:** Fix aplicado; sistema em estado PURE DOCKER (ver STATE_PURE_DOCKER_APP_LAYER.md)
**Arquivado em:** 2026-01-28

---

# 🔧 Fix: TPV — OrderProvider Missing

**Data:** 2026-01-25
**Status:** ✅ Corrigido

---

## 🔴 Problema

Erro ao abrir o TPV:

```
Error: useOrders must be used within an OrderProvider
    at useOrders (OrderContextReal.tsx:1226:25)
    at TPVContent (TPV.tsx:133:226)
```

**Causa:** O `TPVContent` está usando `useOrders()`, mas o `OrderProvider` não estava envolvendo o componente. O comentário no código dizia que os providers eram injetados pelo `AppDomainWrapper`, mas o `App.tsx` atual não usa o `AppDomainWrapper`.

---

## ✅ Solução Implementada

### 1. Adicionados Providers no Componente TPV

**Arquivo:** `merchant-portal/src/pages/TPV/TPV.tsx`

**Mudanças:**

- Importados `OrderProvider`, `TableProvider`, `OfflineOrderProvider`
- Envolvido `TPVContent` com os providers necessários
- Restaurant ID fixo para desenvolvimento: `00000000-0000-0000-0000-000000000100`

**Código:**

```typescript
const TPV = () => {
  const restaurantId =
    getTabIsolated("chefiapp_restaurant_id") ||
    "00000000-0000-0000-0000-000000000100";

  return (
    <OfflineOrderProvider>
      <OrderProvider restaurantId={restaurantId}>
        <TableProvider restaurantId={restaurantId}>
          <LoyaltyProvider>
            <TPVContent />
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
          </LoyaltyProvider>
        </TableProvider>
      </OrderProvider>
    </OfflineOrderProvider>
  );
};
```

### 2. TableProvider Atualizado para Docker Core

**Arquivo:** `merchant-portal/src/pages/TPV/context/TableContext.tsx`

**Mudanças:**

- Removida dependência do Kernel
- Substituído `supabase` por `dockerCoreClient`
- `updateTableStatus` agora usa PostgREST diretamente
- Realtime desabilitado temporariamente (mesmo problema do KDS)

---

## 📊 Estrutura de Providers

```
TPV
  └── OfflineOrderProvider
      └── OrderProvider (restaurantId)
          └── TableProvider (restaurantId)
              └── LoyaltyProvider
                  └── TPVContent (usa useOrders, useTables)
```

---

## ✅ Validação

- ✅ `OrderProvider` envolvendo `TPVContent`
- ✅ `TableProvider` envolvendo `TPVContent`
- ✅ `OfflineOrderProvider` envolvendo tudo
- ✅ Restaurant ID configurado
- ✅ Sem erros de lint

---

## 🧪 Como Testar

1. Abrir TPV: `http://localhost:5175/tpv`
2. Verificar que não há erro de `OrderProvider`
3. Verificar que o TPV carrega corretamente
4. Testar criação de pedidos

---

**Última atualização:** 2026-01-25
