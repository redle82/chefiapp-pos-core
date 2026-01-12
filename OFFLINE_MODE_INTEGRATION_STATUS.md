# ✅ OFFLINE MODE INTEGRATION - STATUS

**Data:** 17 Janeiro 2026  
**Status:** 🟢 **FASE 1 COMPLETA** (Wrapper criado, integração pendente)

---

## ✅ O QUE FOI FEITO

### 1. Wrapper Offline-Aware Criado
**Arquivo:** `merchant-portal/src/core/tpv/OrderEngineOffline.ts`

**Funcionalidades:**
- ✅ Detecção automática online/offline (network + Supabase ping)
- ✅ Se online: chama `OrderEngine.createOrder()` diretamente
- ✅ Se offline: adiciona à fila IndexedDB
- ✅ Retry automático quando volta online (via `OfflineSync`)
- ✅ Idempotência garantida (não cria pedidos duplicados)
- ✅ Retorna pedido otimista para UI (mesmo offline)

**Código:**
```typescript
export async function createOrderOffline(input: OrderInput): Promise<Order>
```

---

### 2. Integração no OrderContextReal (PENDENTE)

**Status:** ⚠️ **PRECISA COMPLETAR**

**Problema:** `OrderContextReal.tsx` já tem lógica offline própria (linhas 306-370), mas não usa o wrapper novo.

**Solução:** Substituir lógica offline existente por chamada ao `createOrderOffline()`.

**Arquivo:** `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx`

**Mudanças necessárias:**
1. Adicionar import: `import { createOrderOffline } from '../../../core/tpv/OrderEngineOffline';`
2. Substituir lógica offline (linhas 306-370) por chamada ao wrapper
3. Remover código duplicado

---

## ⏭️ PRÓXIMOS PASSOS

### Passo 1: Completar Integração (2h)
- [ ] Adicionar import do `createOrderOffline`
- [ ] Substituir lógica offline existente
- [ ] Testar: criar pedido offline → ver na fila → voltar online → sincronizar

### Passo 2: UI Indicator (4h)
- [ ] Criar componente `OfflineStatusBadge`
- [ ] Mostrar: "Offline - X pedidos pendentes"
- [ ] Integrar no header do TPV
- [ ] Mostrar spinner quando sincronizando

### Passo 3: Testes Manuais (4h)
- [ ] Desligar WiFi
- [ ] Criar 20 pedidos offline
- [ ] Verificar que aparecem na fila
- [ ] Ligar WiFi
- [ ] Validar sincronização automática
- [ ] Verificar que pedidos aparecem no banco

---

## 📊 PROGRESSO

| Tarefa | Status | Progresso |
|--------|--------|-----------|
| Wrapper criado | ✅ Completo | 100% |
| Integração OrderContextReal | ⚠️ Pendente | 0% |
| UI Indicator | 🔴 Não iniciado | 0% |
| Testes manuais | 🔴 Não iniciado | 0% |

**Total:** 25% completo (wrapper criado, integração pendente)

---

## 🎯 OBJETIVO FINAL

Garantir que `OrderEngine.createOrder()` funciona completamente offline:
- ✅ Pedidos criados offline são salvos na fila IndexedDB
- ✅ UI mostra pedidos otimisticamente (mesmo offline)
- ✅ Sincronização automática quando volta online
- ✅ Idempotência garantida (não cria duplicados)
- ✅ UI mostra status offline claramente

---

**Próxima ação:** Completar integração no `OrderContextReal.tsx`
