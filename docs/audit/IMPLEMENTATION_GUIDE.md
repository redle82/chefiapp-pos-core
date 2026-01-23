# 🛠️ Guia de Implementação - Correções Pendentes

**Objetivo:** Guia prático para implementar as correções pendentes dos 25 erros.

---

## 🎯 Priorização

### 🔴 Fase 1: Críticos (✅ COMPLETO)
- ✅ ERRO-001, ERRO-002, ERRO-003, ERRO-004

### 🟡 Fase 2: Altos (Primeira Semana)

#### ERRO-010: Confirmação de Valor Total

**Arquivo:** `mobile-app/components/QuickPayModal.tsx`

**Implementação:**
```typescript
// Adicionar confirmação final antes de processar
const handleConfirm = async () => {
  if (processing) return;
  
  // ... validações existentes ...
  
  // ERRO-010 Fix: Confirmação final com valor destacado
  Alert.alert(
    'Confirmar Pagamento',
    `Valor total: €${grandTotal.toFixed(2)}\n${tipAmount > 0 ? `Gorjeta: €${tipAmount.toFixed(2)}\n` : ''}Método: ${PAYMENT_LABELS[selectedMethod]}`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: 'default',
        onPress: async () => {
          setProcessing(true);
          // ... processar pagamento ...
        }
      }
    ]
  );
};
```

**Critério de Aceite:** Garçom vê valor claramente antes de confirmar

---

#### ERRO-008: Contador de Ações Pendentes

**Arquivo:** `mobile-app/components/NowActionCard.tsx`

**Implementação:**
```typescript
// Adicionar prop para contador
interface NowActionCardProps {
  action: NowAction | null;
  onComplete: (actionId: string) => void;
  loading?: boolean;
  pendingCount?: number; // ERRO-008 Fix
}

// No footer
<View style={styles.footer}>
  <Text style={styles.footerText}>
    {roleConfig.emoji} {roleConfig.label} • {formatDuration(shiftStart)}
  </Text>
  {/* ERRO-008 Fix: Contador discreto */}
  {pendingCount !== undefined && pendingCount > 1 && (
    <Text style={styles.pendingCountText}>
      {pendingCount} ações pendentes
    </Text>
  )}
</View>
```

**Arquivo:** `mobile-app/services/NowEngine.ts`

**Implementação:**
```typescript
// Adicionar método para contar ações pendentes
public getPendingActionsCount(): number {
  if (!this.context) return 0;
  const allActions = this.calculateAllActions(this.context);
  return allActions.length;
}
```

**Critério de Aceite:** Garçom vê "3 ações pendentes" no footer

---

#### ERRO-007: Alertas Visuais no KDS

**Arquivo:** `mobile-app/app/(tabs)/kitchen.tsx`

**Implementação:**
```typescript
// ERRO-007 Fix: Flash visual para novos pedidos
const [flashNewOrder, setFlashNewOrder] = useState<string | null>(null);

useEffect(() => {
  // Detectar novos pedidos
  const newOrders = orders.filter(o => {
    const timeSinceCreated = Date.now() - o.createdAt.getTime();
    return timeSinceCreated < 5000; // Últimos 5 segundos
  });
  
  if (newOrders.length > 0) {
    setFlashNewOrder(newOrders[0].id);
    // Flash por 5 segundos
    setTimeout(() => setFlashNewOrder(null), 5000);
  }
}, [orders]);

// No render do pedido
{flashNewOrder === order.id && (
  <Animated.View style={styles.flashBorder}>
    {/* Borda piscando */}
  </Animated.View>
)}
```

**Critério de Aceite:** Cozinheiro vê flash visual quando novo pedido chega

---

#### ERRO-018: Mensagens Específicas para "check"

**Arquivo:** `mobile-app/services/NowEngine.ts`

**Implementação:**
```typescript
// ERRO-018 Fix: Mensagem específica para "check"
if (attentionTable) {
  const elapsedMinutes = attentionTable.elapsedMinutes;
  const lastAction = getLastActionForTable(attentionTable.id); // Implementar helper
  
  actions.push({
    id: `attention-table-${attentionTable.id}`,
    type: 'attention',
    title: `Mesa ${orderData.tableNumber}`,
    // ERRO-018 Fix: Mensagem específica
    message: `Sem ação há ${elapsedMinutes} min${lastAction ? `, última ação: ${lastAction}` : ''}, verificar se precisa algo`,
    action: 'check',
    tableId: attentionTable.id,
    priority: 400,
    timestamp: Date.now()
  });
}
```

**Critério de Aceite:** Garçom vê "Mesa 7 - Sem ação há 15 min, verificar se precisa algo"

---

#### ERRO-025: Mensagem Específica para "prioritize_drinks"

**Arquivo:** `mobile-app/services/NowEngine.ts`

**Implementação:**
```typescript
// ERRO-025 Fix: Mensagem específica
if (context.kitchen.pressure === 'high') {
  const preparingCount = context.kitchen.preparingCount;
  actions.push({
    id: 'urgent-kitchen-pressure',
    type: 'urgent',
    title: 'Cozinha',
    // ERRO-025 Fix: Mensagem específica
    message: `Cozinha saturada (${preparingCount} itens) - Priorizar bebidas para liberar espaço`,
    action: 'prioritize_drinks',
    priority: 550,
    timestamp: Date.now()
  });
}
```

**Critério de Aceite:** Garçom vê "Cozinha saturada (12 itens) - Priorizar bebidas para liberar espaço"

---

#### ERRO-023: Valor Total Maior

**Arquivo:** `mobile-app/components/QuickPayModal.tsx`

**Implementação:**
```typescript
// ERRO-023 Fix: Valor total maior e destacado
<View style={styles.orderInfo}>
  <Text style={styles.orderLabel}>Pedido #{orderId.slice(0, 6)}</Text>
  <Text style={[styles.orderTotal, { fontSize: 32, fontWeight: 'bold', color: '#d4a574' }]}>
    €{total.toFixed(2)}
  </Text>
</View>
```

**Critério de Aceite:** Valor é claramente visível (fonte 32px, cor destacada)

---

### 🟢 Fase 3: Médios (Semanas 2-4)

#### ERRO-005: Página de Status do Pedido (Web)

**Arquivo:** `merchant-portal/src/public/pages/OrderStatus.tsx` (NOVO)

**Implementação:**
```typescript
// Nova página para status do pedido
export function OrderStatusPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  
  // Buscar pedido e atualizar em tempo real
  useEffect(() => {
    const channel = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'gm_orders',
        filter: `id=eq.${orderId}`
      }, (payload) => {
        setOrder(payload.new as Order);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);
  
  // Renderizar status visual
  return (
    <div>
      <h1>Status do Pedido</h1>
      <StatusBadge status={order?.status} />
      <Timer startTime={order?.createdAt} />
    </div>
  );
}
```

**Critério de Aceite:** Cliente vê status atualizado em tempo real

---

#### ERRO-011: Salvar Carrinho Automaticamente

**Arquivo:** `merchant-portal/src/public/context/CartContext.tsx`

**Implementação:**
```typescript
// ERRO-011 Fix: Salvar automaticamente
useEffect(() => {
  // Salvar no localStorage
  if (items.length > 0) {
    localStorage.setItem(`cart-${slug}`, JSON.stringify({
      items,
      timestamp: Date.now()
    }));
  }
}, [items, slug]);

// Restaurar ao carregar
useEffect(() => {
  const saved = localStorage.getItem(`cart-${slug}`);
  if (saved) {
    const { items: savedItems, timestamp } = JSON.parse(saved);
    // TTL: 24 horas
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
      setItems(savedItems);
      // Mostrar banner: "Você tinha itens no carrinho. Continuar?"
    }
  }
}, [slug]);
```

**Critério de Aceite:** Cliente não perde itens ao fechar página

---

#### ERRO-015: Confirmação ao Mudar Status (KDS)

**Arquivo:** `mobile-app/app/(tabs)/kitchen.tsx`

**Implementação:**
```typescript
// ERRO-015 Fix: Toque duplo para mudar status
const [lastTap, setLastTap] = useState<{ itemId: string; time: number } | null>(null);

const handleStatusChange = (itemId: string, newStatus: string) => {
  const now = Date.now();
  
  if (lastTap?.itemId === itemId && now - lastTap.time < 500) {
    // Toque duplo confirmado
    updateItemStatus(itemId, newStatus);
    setLastTap(null);
  } else {
    // Primeiro toque
    setLastTap({ itemId, time: now });
    // Mostrar feedback: "Toque novamente para confirmar"
  }
};
```

**Critério de Aceite:** Cozinheiro precisa tocar duas vezes para mudar status

---

## 📊 Checklist de Implementação

### Fase 2: Altos (Primeira Semana)

- [ ] ERRO-010: Confirmação de valor total
- [ ] ERRO-008: Contador de ações pendentes
- [ ] ERRO-007: Alertas visuais no KDS
- [ ] ERRO-018: Mensagens específicas para "check"
- [ ] ERRO-025: Mensagem específica para "prioritize_drinks"
- [ ] ERRO-023: Valor total maior

### Fase 3: Médios (Semanas 2-4)

- [ ] ERRO-005: Página de status do pedido
- [ ] ERRO-011: Salvar carrinho automaticamente
- [ ] ERRO-012: Tempo estimado de preparo
- [ ] ERRO-013: Botão remover item
- [ ] ERRO-014: Indicador de urgência no KDS
- [ ] ERRO-015: Confirmação ao mudar status
- [ ] ERRO-016: Lista de itens na entrega
- [ ] ERRO-017: Cancelar pedido após confirmação

### Fase 4: Baixos (Opcional)

- [ ] ERRO-021: Banner de mesa
- [ ] ERRO-022: Verificar pedido pendente
- [ ] ERRO-024: Indicação de itens entregues

---

**Versão:** 2.0.0-RC1  
**Data:** 2026-01-24  
**Status:** 🔄 **GUIA PRONTO - IMPLEMENTAÇÃO PENDENTE**
