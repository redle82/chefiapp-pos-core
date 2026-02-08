# Arquitetura UI v2 - Core Adapter

**Data:** 2026-01-25  
**Objetivo:** Definir arquitetura técnica da UI v2 como adapter consciente do Core

---

## Estrutura de Diretórios

```
merchant-portal-v2/
├── src/
│   ├── core-adapter/          # Camada de adaptação do Core
│   │   ├── OrderAdapter.ts     # Adapter para pedidos
│   │   ├── TableAdapter.ts     # Adapter para mesas
│   │   ├── StateAdapter.ts     # Adapter para estado
│   │   └── EventListener.ts    # Escuta eventos do Core
│   │
│   ├── components/             # Componentes visuais mínimos
│   │   ├── tpv/               # TPV mínimo
│   │   │   ├── TPVMinimal.tsx
│   │   │   ├── TableSelector.tsx
│   │   │   ├── ItemSelector.tsx
│   │   │   └── OrderDisplay.tsx
│   │   │
│   │   ├── kds/               # KDS mínimo
│   │   │   ├── KDSMinimal.tsx
│   │   │   └── OrderCard.tsx
│   │   │
│   │   └── observability/    # Observabilidade humana
│   │       ├── StatePanel.tsx
│   │       ├── IssuesList.tsx
│   │       └── HealthIndicator.tsx
│   │
│   └── hooks/                 # Hooks de adaptação
│       ├── useCoreState.ts    # Estado do Core
│       ├── useCoreEvents.ts   # Eventos do Core
│       └── useCoreActions.ts  # Ações no Core
│
└── README.md
```

---

## Core Adapter Layer

### Responsabilidades

1. **Chamar RPCs do Core**
   - `create_order_atomic`
   - `start_turn`
   - Outros RPCs autorizados

2. **Escutar Eventos do Core**
   - Realtime subscriptions
   - State changes
   - Error events

3. **Mapear Erros para Mensagens**
   - Códigos de erro → Mensagens claras
   - Constraints → Explicações
   - Regras → Ações sugeridas

4. **Projetar Estado Visualmente**
   - Core state → UI state
   - Sem lógica de negócio
   - Apenas transformação de dados

---

## Exemplo: OrderAdapter

```typescript
/**
 * OrderAdapter - Adapter para pedidos
 * 
 * Responsabilidades:
 * - Chamar RPC create_order_atomic
 * - Capturar erros com código
 * - Mapear para mensagens claras
 * - Projetar estado visualmente
 */

export class OrderAdapter {
  /**
   * Criar pedido via Core
   */
  static async createOrder(params: {
    restaurantId: string;
    tableId: string;
    items: Array<{ productId: string; quantity: number }>;
  }): Promise<{ success: boolean; orderId?: string; error?: string; errorCode?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_order_atomic', {
        p_restaurant_id: params.restaurantId,
        p_items: params.items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          // ... outros campos
        })),
        p_payment_method: 'cash',
      });

      if (error) {
        // Mapear erro para mensagem clara
        return {
          success: false,
          error: this.mapErrorToMessage(error),
          errorCode: error.code,
        };
      }

      return {
        success: true,
        orderId: data.id,
      };
    } catch (err) {
      return {
        success: false,
        error: 'Erro inesperado ao criar pedido',
      };
    }
  }

  /**
   * Mapear erro do Core para mensagem clara
   */
  private static mapErrorToMessage(error: any): string {
    // Constraint: uma mesa = um pedido aberto
    if (error.code === '23505' && error.message?.includes('idx_one_open_order_per_table')) {
      return 'Esta mesa já possui um pedido aberto. Feche ou pague o pedido existente antes de criar um novo.';
    }

    // Outros erros...
    return error.message || 'Erro ao criar pedido';
  }
}
```

---

## Componente Mínimo: TPV

```typescript
/**
 * TPVMinimal - TPV mínimo como adapter do Core
 * 
 * Princípios:
 * - Não decide regras
 * - Não valida negócio
 * - Só chama Core e mostra resultado
 */

export function TPVMinimal() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrder = async () => {
    if (!selectedTable || items.length === 0) {
      setError('Selecione uma mesa e adicione itens');
      return;
    }

    // Chamar Core via Adapter
    const result = await OrderAdapter.createOrder({
      restaurantId: restaurantId!,
      tableId: selectedTable,
      items: items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    });

    if (result.success) {
      // Sucesso: limpar estado e mostrar feedback
      setItems([]);
      setError(null);
      // Mostrar toast de sucesso
    } else {
      // Erro: mostrar mensagem clara do Core
      setError(result.error || 'Erro ao criar pedido');
    }
  };

  return (
    <div>
      {/* Seleção de mesa */}
      <TableSelector 
        selected={selectedTable}
        onSelect={setSelectedTable}
      />

      {/* Seleção de itens */}
      <ItemSelector 
        items={items}
        onAdd={addItem}
        onRemove={removeItem}
      />

      {/* Feedback de erro */}
      {error && (
        <ErrorDisplay message={error} />
      )}

      {/* Botão criar pedido */}
      <Button 
        onClick={handleCreateOrder}
        disabled={!selectedTable || items.length === 0}
      >
        Criar Pedido
      </Button>
    </div>
  );
}
```

---

## Componente Mínimo: KDS

```typescript
/**
 * KDSMinimal - KDS mínimo como adapter do Core
 * 
 * Princípios:
 * - Escuta eventos do Core (Realtime)
 * - Mostra estado do Core
 * - Permite ações no Core (via RPC)
 */

export function KDSMinimal({ restaurantId }: { restaurantId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);

  // Escutar eventos do Core via Realtime
  useEffect(() => {
    const channel = supabase
      .channel('orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'gm_orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      }, (payload) => {
        // Novo pedido: adicionar à lista
        setOrders(prev => [...prev, payload.new as Order]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    // Chamar Core via RPC para mudar status
    const { error } = await supabase.rpc('update_order_status', {
      p_order_id: orderId,
      p_status: newStatus,
    });

    if (error) {
      // Mostrar erro claro
      console.error('Erro ao atualizar status:', error);
    }
  };

  return (
    <div>
      {orders.map(order => (
        <OrderCard
          key={order.id}
          order={order}
          onStatusChange={(status) => handleStatusChange(order.id, status)}
        />
      ))}
    </div>
  );
}
```

---

## Componente: Painel de Estado

```typescript
/**
 * StatePanel - Observabilidade humana
 * 
 * Mostra:
 * - O que está errado agora
 * - Quem está atrasando
 * - Restaurante está saudável?
 */

export function StatePanel({ restaurantId }: { restaurantId: string }) {
  const [issues, setIssues] = useState<ActiveIssue[]>([]);
  const [health, setHealth] = useState<'healthy' | 'warning' | 'error'>('healthy');

  useEffect(() => {
    const checkState = async () => {
      // Buscar estado do Core
      const { data: orders } = await supabase
        .from('gm_orders')
        .select('id, status, created_at')
        .eq('restaurant_id', restaurantId)
        .in('status', ['OPEN', 'PREPARING']);

      // Identificar problemas
      const now = new Date();
      const delayedOrders = (orders || []).filter(order => {
        const age = now.getTime() - new Date(order.created_at).getTime();
        return age > 30 * 60 * 1000; // 30 minutos
      });

      setIssues([
        ...delayedOrders.map(o => ({
          type: 'delayed',
          message: `Pedido #${o.id.slice(0, 8)} atrasado (mais de 30 min)`,
        })),
      ]);

      setHealth(delayedOrders.length > 0 ? 'warning' : 'healthy');
    };

    checkState();
    const interval = setInterval(checkState, 30000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  return (
    <div>
      <h3>Estado Atual</h3>
      <HealthIndicator status={health} />
      <IssuesList issues={issues} />
    </div>
  );
}
```

---

## Hooks de Adaptação

### useCoreState

```typescript
/**
 * Hook para acessar estado do Core
 */
export function useCoreState(restaurantId: string) {
  const [state, setState] = useState<CoreState | null>(null);

  useEffect(() => {
    // Buscar estado do Core
    const fetchState = async () => {
      // Buscar pedidos ativos
      // Buscar mesas ocupadas
      // Buscar problemas ativos
      // ...
    };

    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  return state;
}
```

### useCoreEvents

```typescript
/**
 * Hook para escutar eventos do Core
 */
export function useCoreEvents(restaurantId: string, onEvent: (event: CoreEvent) => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`core-events-${restaurantId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gm_orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      }, (payload) => {
        onEvent({
          type: payload.eventType,
          table: payload.table,
          data: payload.new || payload.old,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, onEvent]);
}
```

### useCoreActions

```typescript
/**
 * Hook para ações no Core
 */
export function useCoreActions() {
  const createOrder = async (params: CreateOrderParams) => {
    return OrderAdapter.createOrder(params);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    // Chamar RPC do Core
    const { error } = await supabase.rpc('update_order_status', {
      p_order_id: orderId,
      p_status: status,
    });
    return { success: !error, error };
  };

  return {
    createOrder,
    updateOrderStatus,
    // ... outras ações
  };
}
```

---

## Princípios de Implementação

### 1. Sem Lógica de Negócio na UI
- UI não valida regras
- UI não decide o que fazer
- UI só mostra o que o Core decidiu

### 2. Erros Claros
- Sempre mostrar código de erro
- Sempre explicar por quê
- Sempre sugerir ação

### 3. Estado como Fonte de Verdade
- UI sempre busca estado do Core
- UI não assume estado
- UI valida visualmente

### 4. Feedback Humano
- Mensagens claras
- Contexto completo
- Ações sugeridas

---

## Migração da UI Atual

### Estratégia

1. **Congelar UI atual**
   - Marcar como LEGACY
   - Parar de adicionar features
   - Só corrigir bugs críticos

2. **Criar UI v2 em paralelo**
   - Novo package/app
   - Componentes mínimos
   - Testar com piloto

3. **Decidir após validação**
   - Manter v2
   - Evoluir v2
   - Ou refazer

---

## Não Fazer

- ❌ Não refatorar UI antiga
- ❌ Não adicionar lógica de negócio na UI
- ❌ Não esconder erros do Core
- ❌ Não permitir bypass de regras
- ❌ Não assumir estado
- ❌ Não "melhorar" regras do Core

---

*"UI como adapter, Core como lei. Feia mas honesta, clara mas rígida."*
