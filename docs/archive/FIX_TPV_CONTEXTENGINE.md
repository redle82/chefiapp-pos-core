**Status:** ARCHIVED
**Reason:** Fix aplicado; sistema em estado PURE DOCKER (ver STATE_PURE_DOCKER_APP_LAYER.md)
**Arquivado em:** 2026-01-28

---

# 🔧 Fix: TPV — ContextEngineProvider Missing

**Data:** 2026-01-25
**Status:** ✅ Corrigido

---

## 🔴 Problema

Erro ao abrir o TPV:

```
Error: useContextEngine must be used within a ContextEngineProvider
    at useContextEngine (ContextEngine.tsx:92:15)
    at TPVContent (TPV.tsx:259:31)
```

**Causa:** O `TPVContent` está usando `useContextEngine()`, mas o `ContextEngineProvider` não estava envolvendo o componente.

---

## ✅ Solução Implementada

### Adicionado ContextEngineProvider no Componente TPV

**Arquivo:** `merchant-portal/src/pages/TPV/TPV.tsx`

**Mudanças:**

- Importado `ContextEngineProvider` de `../../core/context`
- Envolvido toda a árvore de providers com `ContextEngineProvider`
- Configurado com `userRole="waiter"` e `hasTPV={true}` para desenvolvimento

**Código:**

```typescript
import { useContextEngine, ContextEngineProvider } from "../../core/context";

const TPV = () => {
  const restaurantId =
    getTabIsolated("chefiapp_restaurant_id") ||
    "00000000-0000-0000-0000-000000000100";

  return (
    <ContextEngineProvider userRole="waiter" hasTPV={true}>
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
    </ContextEngineProvider>
  );
};
```

---

## 📊 Estrutura de Providers Atualizada

```
TPV
  └── ContextEngineProvider (userRole="waiter", hasTPV=true)
      └── OfflineOrderProvider
          └── OrderProvider (restaurantId)
              └── TableProvider (restaurantId)
                  └── LoyaltyProvider
                      └── TPVContent (usa useContextEngine, useOrders, useTables)
```

---

## ✅ Validação

- ✅ `ContextEngineProvider` envolvendo toda a árvore
- ✅ `OrderProvider` envolvendo `TPVContent`
- ✅ `TableProvider` envolvendo `TPVContent`
- ✅ `OfflineOrderProvider` envolvendo tudo
- ✅ Restaurant ID configurado
- ✅ Sem erros de lint

---

## 🧪 Como Testar

1. Abrir TPV: `http://localhost:5173/tpv`
2. Verificar que não há erro de `ContextEngineProvider`
3. Verificar que o TPV carrega corretamente
4. Testar criação de pedidos

---

## ⚠️ Nota sobre JWT Secret

Há um erro separado relacionado ao JWT secret no PostgREST:

```
POST http://localhost:3001/rest/v1/rpc/create_order_atomic 500 (Internal Server Error)
Server lacks JWT secret
```

Este é um problema diferente relacionado à configuração do PostgREST no Docker Core. O PostgREST do Docker Core não deve usar JWT (conforme documentado em `docs/fixes/POSTGREST_NO_JWT.md`), mas parece que está reclamando da falta do JWT secret.

**Ação necessária:** Verificar a configuração do PostgREST no `docker-compose.core.yml` e garantir que não está exigindo JWT secret.

---

**Última atualização:** 2026-01-25
