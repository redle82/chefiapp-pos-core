# 🔍 AUDITORIA RODADA 2 - BLOQUEIOS ADICIONAIS

**Data:** 2026-01-24  
**Status:** ⚠️ **5 PROBLEMAS ADICIONAIS IDENTIFICADOS**

---

## 🎯 RESUMO

Após corrigir os 4 BLOCKERs iniciais, encontrei **5 problemas adicionais** que podem causar loops, performance degradada ou comportamento inesperado.

---

## 🟠 HIGH: Problemas que Podem Causar Loops

### BUG-014: Loop Potencial em useOfflineReconciler

**Arquivo:** `merchant-portal/src/core/queue/useOfflineReconciler.ts:76`

**Problema:**
```typescript
useEffect(() => {
    // ... setup polling e listeners ...
}, [refresh, items]) // ⚠️ PROBLEMA: refresh pode mudar a cada render
```

**Causa:**
- `refresh` é uma função que pode ser recriada a cada render
- `items` é um array que pode mudar de referência mesmo com mesmo conteúdo
- Isso causa re-execução constante do `useEffect`

**Sintoma:**
- Polling sendo recriado constantemente
- Event listeners sendo adicionados/removidos repetidamente
- Performance degradada

**Correção:**
```typescript
// Opção 1: Usar useCallback para refresh
const refresh = useCallback(() => {
    // ... lógica de refresh ...
}, [/* dependências estáveis */]);

// Opção 2: Usar ref para items (se não precisa re-renderizar)
const itemsRef = useRef(items);
useEffect(() => {
    itemsRef.current = items;
}, [items]);

useEffect(() => {
    // Usar itemsRef.current ao invés de items
}, [refresh]); // refresh precisa ser estável
```

**Prioridade:** 🟠 HIGH

---

### BUG-015: Loop Potencial em OrderContext (Legacy)

**Arquivo:** `merchant-portal/src/pages/TPV/context/OrderContext.tsx:119`

**Problema:**
```typescript
useEffect(() => {
    // ...
    const channel = supabase.channel('nervous_system_orders')
        .on('postgres_changes', {...}, (payload) => {
            fetchOrders(); // ⚠️ PROBLEMA: fetchOrders pode mudar
        })
        .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    };
}, [restaurantId, isDemo, fetchOrders]); // ⚠️ fetchOrders na deps
```

**Causa:**
- `fetchOrders` é uma função que pode ser recriada a cada render
- Isso causa unsubscribe/subscribe constante

**Sintoma:**
- Realtime subscription sendo recriada constantemente
- Performance degradada
- Possível perda de eventos

**Correção:**
```typescript
// Opção 1: Usar useCallback para fetchOrders
const fetchOrders = useCallback(async () => {
    // ... lógica ...
}, [restaurantId, isDemo]);

// Opção 2: Remover fetchOrders das deps e usar ref
const fetchOrdersRef = useRef(fetchOrders);
useEffect(() => {
    fetchOrdersRef.current = fetchOrders;
}, [fetchOrders]);

useEffect(() => {
    // ...
    const channel = supabase.channel('nervous_system_orders')
        .on('postgres_changes', {...}, () => {
            fetchOrdersRef.current(); // Usar ref
        })
        .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    };
}, [restaurantId, isDemo]); // Remover fetchOrders
```

**Prioridade:** 🟠 HIGH

**Nota:** Este é o `OrderContext.tsx` (legacy), não o `OrderContextReal.tsx` que já foi corrigido.

---

### BUG-016: Loop Potencial em GMBridgeProvider

**Arquivo:** `merchant-portal/src/intelligence/gm-bridge/GMBridgeProvider.tsx:50`

**Problema:**
```typescript
useEffect(() => {
    if (!restaurantId) return;

    const interval = setInterval(() => {
        runDetectors();
    }, SCAN_INTERVAL_MS);

    return () => clearInterval(interval);
}, [orders, tasks, restaurantId]); // ⚠️ orders e tasks mudam frequentemente
```

**Causa:**
- `orders` e `tasks` são arrays que mudam de referência a cada atualização
- Isso causa recriação constante do interval
- `runDetectors` não está nas deps mas usa `orders` e `tasks` (stale closure)

**Sintoma:**
- Interval sendo recriado constantemente
- `runDetectors` pode usar valores antigos (stale closure)

**Correção:**
```typescript
// Usar refs para orders e tasks
const ordersRef = useRef(orders);
const tasksRef = useRef(tasks);

useEffect(() => {
    ordersRef.current = orders;
    tasksRef.current = tasks;
}, [orders, tasks]);

useEffect(() => {
    if (!restaurantId) return;

    const interval = setInterval(() => {
        runDetectors(ordersRef.current, tasksRef.current); // Passar como params
    }, SCAN_INTERVAL_MS);

    return () => clearInterval(interval);
}, [restaurantId]); // Apenas restaurantId
```

**Prioridade:** 🟠 HIGH

---

## 🟡 MEDIUM: Problemas de Performance

### BUG-017: Stale Closure em OrderContextReal

**Arquivo:** `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx:240`

**Problema:**
```typescript
useEffect(() => {
    if (!restaurantId) return;
    
    getActiveOrders(false); // ⚠️ getActiveOrders não está nas deps
    
    // ...
}, [restaurantId]);
```

**Causa:**
- `getActiveOrders` não está nas dependências
- Pode usar `restaurantId` antigo se mudar rapidamente
- ESLint vai reclamar

**Sintoma:**
- Possível uso de `restaurantId` desatualizado
- Warning do ESLint

**Correção:**
```typescript
// Opção 1: Adicionar getActiveOrders nas deps (mas precisa ser estável)
const getActiveOrders = useCallback(async (isBackground = false) => {
    if (!restaurantId) return;
    await getActiveOrdersInternal(restaurantId, isBackground);
}, [restaurantId]);

// Opção 2: Usar ref para restaurantId
const restaurantIdRef = useRef(restaurantId);
useEffect(() => {
    restaurantIdRef.current = restaurantId;
}, [restaurantId]);

useEffect(() => {
    if (!restaurantIdRef.current) return;
    getActiveOrdersInternal(restaurantIdRef.current, false);
}, [restaurantId]);
```

**Prioridade:** 🟡 MEDIUM

---

### BUG-018: Múltiplos Navigate em FlowGate (Risco de Loop)

**Arquivo:** `merchant-portal/src/core/flow/FlowGate.tsx:236, 246, 261, 280, 307`

**Problema:**
- Múltiplos `navigate()` em sequência podem causar loops
- Não há guarda explícita contra navegação para mesma rota
- `location.pathname` pode mudar durante a execução

**Causa:**
- Se `navigate()` for chamado múltiplas vezes rapidamente
- Se `location.pathname` mudar durante a execução do `useEffect`
- Pode causar loop de redirecionamento

**Sintoma:**
- Loop de redirecionamento
- Navegação instável

**Correção:**
```typescript
// Adicionar guarda antes de cada navigate
if (location.pathname !== baseDecision.to) {
    navigate(baseDecision.to, { replace: true });
}

// Ou usar um ref para rastrear última navegação
const lastNavigateRef = useRef<string | null>(null);
if (lastNavigateRef.current !== baseDecision.to) {
    lastNavigateRef.current = baseDecision.to;
    navigate(baseDecision.to, { replace: true });
}
```

**Prioridade:** 🟡 MEDIUM

---

## 📊 RESUMO DE PROBLEMAS

| Bug | Severidade | Arquivo | Linha | Tipo |
|-----|------------|---------|-------|------|
| BUG-014 | 🟠 HIGH | useOfflineReconciler.ts | 76 | Loop potencial |
| BUG-015 | 🟠 HIGH | OrderContext.tsx | 119 | Loop potencial |
| BUG-016 | 🟠 HIGH | GMBridgeProvider.tsx | 50 | Loop potencial |
| BUG-017 | 🟡 MEDIUM | OrderContextReal.tsx | 240 | Stale closure |
| BUG-018 | 🟡 MEDIUM | FlowGate.tsx | múltiplas | Risco de loop |

---

## 🛠️ PLANO DE CORREÇÃO

### Prioridade 1: Corrigir Loops Potenciais (HIGH)

1. **BUG-014: useOfflineReconciler**
   - Tempo estimado: 30 min
   - Usar `useCallback` para `refresh`
   - Usar `useRef` para `items` se não precisa re-renderizar

2. **BUG-015: OrderContext (Legacy)**
   - Tempo estimado: 20 min
   - Usar `useCallback` para `fetchOrders`
   - Ou remover das deps e usar ref

3. **BUG-016: GMBridgeProvider**
   - Tempo estimado: 20 min
   - Usar `useRef` para `orders` e `tasks`
   - Passar como params para `runDetectors`

### Prioridade 2: Melhorias (MEDIUM)

4. **BUG-017: OrderContextReal**
   - Tempo estimado: 15 min
   - Usar `useCallback` para `getActiveOrders`

5. **BUG-018: FlowGate**
   - Tempo estimado: 20 min
   - Adicionar guardas antes de `navigate()`

**Total estimado:** ~1h45min

---

## ✅ CHECKLIST PÓS-CORREÇÃO

Após aplicar correções, validar:

- [ ] useOfflineReconciler não recria polling constantemente
- [ ] OrderContext (legacy) não recria subscription constantemente
- [ ] GMBridgeProvider não recria interval constantemente
- [ ] OrderContextReal não tem stale closure
- [ ] FlowGate não entra em loop de navegação
- [ ] Console sem warnings de ESLint sobre deps
- [ ] Performance melhorada (menos re-renders)

---

## 🎯 PRÓXIMOS PASSOS

1. **Aplicar correções HIGH** (BUG-014, BUG-015, BUG-016)
2. **Testar localmente** para validar que loops foram eliminados
3. **Aplicar correções MEDIUM** (BUG-017, BUG-018)
4. **Rodar "Antigrafte"** novamente para validar E2E completo

---

**Última Atualização:** 2026-01-24  
**Status:** Aguardando correções
