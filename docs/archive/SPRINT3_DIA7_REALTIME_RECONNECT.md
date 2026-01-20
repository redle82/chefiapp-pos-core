# SPRINT 3 — DIA 7 — REALTIME RECONNECT

**Data:** 2026-01-17  
**Objetivo:** Implementar reconnect automático com exponential backoff  
**Status:** ⏳ **INICIANDO**

---

## 📋 OBJETIVO

Implementar reconexão automática do Supabase Realtime com:
- Exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s)
- Status visual de conexão no KDS
- Auto-heal na reconexão
- Polling defensivo como fallback

---

## 🔍 ANÁLISE DA IMPLEMENTAÇÃO ATUAL

### OrderContextReal.tsx

**Status Atual:**
- ✅ Realtime subscription implementado
- ✅ Polling defensivo como fallback (30s)
- ✅ Status de conexão exposto (`realtimeStatus`, `lastRealtimeEvent`)
- ⚠️ Reconnect manual (não automático)
- ⚠️ Sem exponential backoff

**Código Relevante:**
```typescript
// Linha ~250-350: Realtime subscription
const channel = supabase
  .channel(`orders:${restaurantId}`)
  .on('postgres_changes', { ... }, handleRealtimeUpdate)
  .subscribe((status) => {
    setRealtimeStatus(status);
    if (status === 'SUBSCRIBED') {
      setLastRealtimeEvent(new Date());
    }
  });
```

**Problemas Identificados:**
1. Se conexão cair, não reconecta automaticamente
2. Sem retry logic com backoff
3. Status visual não é claro para usuário

---

## 📋 IMPLEMENTAÇÃO NECESSÁRIA

### 1. Exponential Backoff Utility (30min)

**Arquivo:** `merchant-portal/src/core/realtime/ReconnectManager.ts`

**Funcionalidades:**
- Calcular delay baseado em tentativas
- Max delay de 30s
- Reset após sucesso

**Código:**
```typescript
export class ReconnectManager {
  private attempts = 0;
  private maxAttempts = 10;
  private baseDelay = 1000; // 1s
  private maxDelay = 30000; // 30s

  getDelay(): number {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.attempts),
      this.maxDelay
    );
    return delay;
  }

  increment(): void {
    this.attempts = Math.min(this.attempts + 1, this.maxAttempts);
  }

  reset(): void {
    this.attempts = 0;
  }

  shouldRetry(): boolean {
    return this.attempts < this.maxAttempts;
  }
}
```

---

### 2. Auto-Reconnect Logic (1h)

**Arquivo:** `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx`

**Mudanças:**
- Detectar quando conexão cai (`status === 'CLOSED'` ou `'CHANNEL_ERROR'`)
- Iniciar reconnect com exponential backoff
- Auto-heal: refetch orders na reconexão
- Cancelar reconnect se componente desmontar

**Código:**
```typescript
const reconnectManagerRef = useRef(new ReconnectManager());
const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// Detectar desconexão
useEffect(() => {
  if (realtimeStatus === 'CLOSED' || realtimeStatus === 'CHANNEL_ERROR') {
    if (reconnectManagerRef.current.shouldRetry()) {
      const delay = reconnectManagerRef.current.getDelay();
      console.log(`[Realtime] Reconnecting in ${delay}ms (attempt ${reconnectManagerRef.current.attempts + 1})`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectManagerRef.current.increment();
        // Re-subscribe
        channel.unsubscribe();
        setupRealtimeSubscription();
      }, delay);
    } else {
      console.error('[Realtime] Max reconnection attempts reached. Using polling fallback.');
    }
  } else if (realtimeStatus === 'SUBSCRIBED') {
    // Reset on success
    reconnectManagerRef.current.reset();
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }

  return () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  };
}, [realtimeStatus]);
```

---

### 3. Status Visual no KDS (30min)

**Arquivo:** `merchant-portal/src/pages/TPV/KDS/KitchenDisplay.tsx`

**Mudanças:**
- Mostrar indicador de conexão no header
- Cores: Verde (conectado), Amarelo (reconectando), Vermelho (desconectado)
- Mostrar tempo desde último evento (se > 30s, alerta)

**Código:**
```typescript
const { realtimeStatus, lastRealtimeEvent } = useOrders();

const getConnectionStatus = () => {
  if (realtimeStatus === 'SUBSCRIBED') {
    const timeSinceLastEvent = lastRealtimeEvent 
      ? Date.now() - lastRealtimeEvent.getTime() 
      : Infinity;
    
    if (timeSinceLastEvent > 30000) {
      return { color: '#ff9f0a', label: 'Sem eventos recentes', icon: '⚠️' };
    }
    return { color: '#30d158', label: 'Conectado', icon: '🟢' };
  }
  
  if (realtimeStatus === 'SUBSCRIBING' || realtimeStatus === 'TIMED_OUT') {
    return { color: '#ff9f0a', label: 'Reconectando...', icon: '🟡' };
  }
  
  return { color: '#ff453a', label: 'Desconectado', icon: '🔴' };
};
```

---

### 4. Auto-Heal na Reconexão (30min)

**Funcionalidade:**
- Quando reconecta, fazer refetch completo de orders
- Garantir que estado local está sincronizado com servidor

**Código:**
```typescript
// No useEffect de reconexão
if (realtimeStatus === 'SUBSCRIBED' && wasDisconnectedRef.current) {
  console.log('[Realtime] Reconnected! Refetching orders...');
  wasDisconnectedRef.current = false;
  getActiveOrdersInternal(restaurantId, false); // Force refetch
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: ReconnectManager (30min)
- [ ] Criar `merchant-portal/src/core/realtime/ReconnectManager.ts`
- [ ] Implementar exponential backoff
- [ ] Testes unitários básicos

### Fase 2: Auto-Reconnect (1h)
- [ ] Adicionar lógica de detecção de desconexão
- [ ] Implementar reconnect com backoff
- [ ] Cleanup de timeouts
- [ ] Logs informativos

### Fase 3: Status Visual (30min)
- [ ] Adicionar indicador no KDS
- [ ] Cores e ícones apropriados
- [ ] Mostrar tempo desde último evento

### Fase 4: Auto-Heal (30min)
- [ ] Refetch automático na reconexão
- [ ] Sincronizar estado local

### Fase 5: Testes (30min)
- [ ] Testar desconexão simulada (desligar internet)
- [ ] Verificar que reconecta automaticamente
- [ ] Verificar que status visual atualiza
- [ ] Verificar que dados são refetchados na reconexão

---

## 🎯 RESULTADOS ESPERADOS

| Funcionalidade | Status | Notas |
|----------------|--------|-------|
| ReconnectManager | ⏳ | Aguardando implementação |
| Auto-Reconnect | ⏳ | Aguardando implementação |
| Status Visual | ⏳ | Aguardando implementação |
| Auto-Heal | ⏳ | Aguardando implementação |
| Testes | ⏳ | Aguardando implementação |

---

## 📊 TEMPO ESTIMADO

**Total:** 3h
- ReconnectManager: 30min
- Auto-Reconnect: 1h
- Status Visual: 30min
- Auto-Heal: 30min
- Testes: 30min

---

## 🎯 PRÓXIMOS PASSOS

1. **Criar ReconnectManager** → Utility class
2. **Implementar Auto-Reconnect** → OrderContextReal.tsx
3. **Adicionar Status Visual** → KitchenDisplay.tsx
4. **Implementar Auto-Heal** → Refetch na reconexão
5. **Testar** → Simular desconexão

---

**Tempo Estimado:** 3h  
**Status:** ⏳ **AGUARDANDO IMPLEMENTAÇÃO**
