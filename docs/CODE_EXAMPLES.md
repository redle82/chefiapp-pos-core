# 💻 Code Examples - ChefIApp

**Exemplos práticos de código para desenvolvedores**

---

## 🚀 Fast Pay - Implementação Completa

### Componente FastPayButton
```typescript
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Alert } from 'react-native';
import { useOrder } from '@/context/OrderContext';
import { useAppStaff } from '@/context/AppStaffContext';
import { HapticFeedback } from '@/services/haptics';

interface FastPayButtonProps {
  orderId: string;
  total: number;
  tableId: string;
  onSuccess?: () => void;
}

export function FastPayButton({ 
  orderId, 
  total, 
  tableId, 
  onSuccess 
}: FastPayButtonProps) {
  const { quickPay, updateOrderStatus } = useOrder();
  const { financialState } = useAppStaff();
  const [processing, setProcessing] = useState(false);

  const getDefaultMethod = () => {
    // Lógica para pegar método mais usado
    // Por enquanto, default: 'cash'
    return 'cash';
  };

  const handleFastPay = async () => {
    if (processing) return;
    
    const defaultMethod = getDefaultMethod();
    
    // Validação: caixa fechado
    if (defaultMethod === 'cash' && financialState === 'drawer_closed') {
      Alert.alert(
        'Caixa Fechado',
        'Abra o cofre antes de receber dinheiro.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Confirmação
    Alert.alert(
      'Cobrar Tudo',
      `€${total.toFixed(2)} - ${
        defaultMethod === 'cash' ? 'Dinheiro' : 
        defaultMethod === 'card' ? 'Cartão' : 'PIX'
      }`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            setProcessing(true);
            try {
              const success = await quickPay(orderId, defaultMethod);
              if (success) {
                await updateOrderStatus(orderId, 'paid');
                HapticFeedback.success();
                onSuccess?.();
              } else {
                Alert.alert('Erro', 'Falha ao processar pagamento.');
              }
            } catch (error) {
              Alert.alert('Erro', 'Falha ao processar pagamento.');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={handleFastPay}
      disabled={processing}
      style={{
        backgroundColor: '#10B981',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center'
      }}
    >
      <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
        {processing ? 'Processando...' : 'Cobrar Tudo'}
      </Text>
    </TouchableOpacity>
  );
}
```

---

## 🗺️ Mapa Vivo - Timer e Urgência

### Implementação no TableCard
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

interface TableCardProps {
  table: Table;
  order: Order | null;
}

export function TableCard({ table, order }: TableCardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizar tempo a cada segundo
  useEffect(() => {
    if (!order || order.status === 'paid') return;
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);

  if (!order) return null;

  // Calcular minutos desde último evento
  const lastEventTime = new Date(order.lastEventTime || order.createdAt);
  const elapsedMinutes = Math.floor(
    (currentTime.getTime() - lastEventTime.getTime()) / 60000
  );

  // Cor de urgência
  const getUrgencyColor = (minutes: number) => {
    if (minutes < 15) return '#10B981'; // verde
    if (minutes < 30) return '#F59E0B'; // amarelo
    return '#EF4444'; // vermelho
  };

  const urgencyColor = getUrgencyColor(elapsedMinutes);

  // Flags contextuais
  const wantsToPay = order.status === 'delivered';
  const waitingForDrink = order.items.some(
    item => item.category === 'drink' && item.status === 'preparing'
  );

  return (
    <View
      style={{
        borderWidth: 2,
        borderColor: urgencyColor,
        borderRadius: 8,
        padding: 12
      }}
    >
      <Text>Mesa {table.number}</Text>
      <Text style={{ color: urgencyColor }}>
        {elapsedMinutes} min
      </Text>
      
      {wantsToPay && (
        <Text>💰 Quer pagar</Text>
      )}
      
      {waitingForDrink && (
        <Text>🍷 Esperando bebida</Text>
      )}
    </View>
  );
}
```

---

## 🍽️ KDS - Hook de Pressão

### useKitchenPressure Hook
```typescript
import { useState, useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';

type KitchenPressure = 'low' | 'medium' | 'high';

interface KitchenPressureState {
  pressure: KitchenPressure;
  preparingCount: number;
  slowItemsActive: boolean;
  shouldHideSlowItems: boolean;
}

const PREP_TIME: Record<string, number> = {
  'drink': 2,
  'appetizer': 5,
  'main': 15,
  'dessert': 10
};

const SLOW_THRESHOLD = 10; // minutos

export function useKitchenPressure(): KitchenPressureState {
  const { orders } = useOrder();
  const [pressure, setPressure] = useState<KitchenPressure>('low');
  const [preparingCount, setPreparingCount] = useState(0);
  const [slowItemsActive, setSlowItemsActive] = useState(false);

  useEffect(() => {
    // Filtrar pedidos em preparação
    const preparing = orders.filter(
      o => o.status === 'preparing' || o.status === 'pending'
    );
    
    const count = preparing.length;
    setPreparingCount(count);

    // Determinar pressão
    let newPressure: KitchenPressure = 'low';
    if (count > 10) {
      newPressure = 'high';
    } else if (count > 5) {
      newPressure = 'medium';
    }
    setPressure(newPressure);

    // Verificar se há itens lentos ativos
    const hasSlowItems = preparing.some(order =>
      order.items.some(item => {
        const prepTime = PREP_TIME[item.category] || 10;
        return prepTime > SLOW_THRESHOLD;
      })
    );
    setSlowItemsActive(hasSlowItems);
  }, [orders]);

  const shouldHideSlowItems = 
    pressure === 'high' || 
    (pressure === 'medium' && slowItemsActive);

  return {
    pressure,
    preparingCount,
    slowItemsActive,
    shouldHideSlowItems
  };
}
```

### Uso no Menu
```typescript
import { useMemo } from 'react';
import { useKitchenPressure } from '@/hooks/useKitchenPressure';

export function MenuScreen() {
  const { shouldHideSlowItems } = useKitchenPressure();
  const [menuItems] = useState([...]); // seus itens

  const filteredMenuItems = useMemo(() => {
    if (shouldHideSlowItems) {
      return menuItems.filter(item => {
        const prepTime = PREP_TIME[item.category] || 10;
        return prepTime <= SLOW_THRESHOLD;
      });
    }
    return menuItems;
  }, [menuItems, shouldHideSlowItems]);

  return (
    <FlatList
      data={filteredMenuItems}
      renderItem={({ item }) => <MenuItemCard item={item} />}
    />
  );
}
```

---

## 📋 Waitlist - Componente Completo

### WaitlistBoard Component
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { PersistenceService } from '@/services/persistence';

interface WaitlistEntry {
  id: string;
  name: string;
  time: string;
  status: 'waiting' | 'seated' | 'cancelled';
}

interface WaitlistBoardProps {
  visible: boolean;
  onClose: () => void;
  onAssignTable: (entry: WaitlistEntry, tableId: string) => void;
}

export function WaitlistBoard({ 
  visible, 
  onClose, 
  onAssignTable 
}: WaitlistBoardProps) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [name, setName] = useState('');

  // Carregar ao abrir
  useEffect(() => {
    if (visible) {
      loadWaitlist();
    }
  }, [visible]);

  // Salvar ao mudar
  useEffect(() => {
    if (entries.length > 0) {
      saveWaitlist();
    }
  }, [entries]);

  const loadWaitlist = async () => {
    const data = await PersistenceService.loadWaitlist();
    if (data) {
      setEntries(data);
    }
  };

  const saveWaitlist = async () => {
    await PersistenceService.saveWaitlist(entries);
  };

  const addEntry = () => {
    if (!name.trim()) return;
    
    const newEntry: WaitlistEntry = {
      id: Date.now().toString(),
      name: name.trim(),
      time: new Date().toISOString(),
      status: 'waiting'
    };
    
    setEntries([...entries, newEntry]);
    setName('');
  };

  const seatEntry = (entry: WaitlistEntry) => {
    // Implementar lógica de atribuir mesa
    onAssignTable(entry, 'table-id');
    setEntries(entries.filter(e => e.id !== entry.id));
  };

  const cancelEntry = (entryId: string) => {
    setEntries(entries.filter(e => e.id !== entryId));
  };

  if (!visible) return null;

  return (
    <View style={{ padding: 16 }}>
      <Text>Lista de Espera</Text>
      
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nome do cliente"
        onSubmitEditing={addEntry}
      />
      
      <TouchableOpacity onPress={addEntry}>
        <Text>Adicionar</Text>
      </TouchableOpacity>

      <FlatList
        data={entries.filter(e => e.status === 'waiting')}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            <Text>{new Date(item.time).toLocaleTimeString()}</Text>
            <TouchableOpacity onPress={() => seatEntry(item)}>
              <Text>Atribuir Mesa</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => cancelEntry(item.id)}>
              <Text>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
```

---

## 💾 Persistência - Service Completo

### PersistenceService
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  WAITLIST: '@chefiapp_waitlist_v1',
  // outros keys...
};

class PersistenceService {
  static async saveWaitlist(data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.WAITLIST, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar waitlist:', error);
    }
  }

  static async loadWaitlist(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.WAITLIST);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Erro ao carregar waitlist:', error);
      return null;
    }
  }

  static async clearWaitlist(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.WAITLIST);
    } catch (error) {
      console.error('Erro ao limpar waitlist:', error);
    }
  }
}

export { PersistenceService };
```

---

## 🎨 Kitchen Pressure Indicator

### Componente Visual
```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { useKitchenPressure } from '@/hooks/useKitchenPressure';

export function KitchenPressureIndicator() {
  const { pressure, preparingCount, shouldHideSlowItems } = useKitchenPressure();

  if (pressure === 'low') return null;

  const config = {
    medium: {
      emoji: '⚠️',
      text: 'Moderada',
      bgColor: '#FEF3C7'
    },
    high: {
      emoji: '🔥',
      text: 'Saturada',
      bgColor: '#FEE2E2'
    }
  }[pressure];

  return (
    <View
      style={{
        backgroundColor: config.bgColor,
        padding: 12,
        borderRadius: 8,
        marginBottom: 8
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: '600' }}>
        {config.emoji} Cozinha {config.text} ({preparingCount} pedidos)
        {shouldHideSlowItems && ' • Priorizando Bebidas'}
      </Text>
    </View>
  );
}
```

---

## 🔄 OrderContext - quickPay Implementation

### Função quickPay Completa
```typescript
const quickPay = async (
  orderId: string, 
  method: string
): Promise<boolean> => {
  try {
    // Buscar pedido
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      console.error('Pedido não encontrado:', orderId);
      return false;
    }

    // Preparar payload
    const updatePayload: any = {
      status: 'PAID',
      payment_status: 'paid',
      payment_method: method
    };

    // Processar lealdade
    if (order.customerId) {
      const points = Math.floor(order.total);
      await supabase.rpc('earn_loyalty_points', {
        p_customer_id: order.customerId,
        p_points: points
      });
    }

    // Processar inventário
    await InventoryService.deductStockForOrder(order);

    // Imprimir recibo
    await printerService.printReceipt(order);

    // Abrir gaveta se cash
    if (method === 'cash') {
      await printerService.kickDrawer();
    }

    // Atualizar no Supabase
    const { error } = await supabase
      .from('gm_orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (error) {
      console.error('Erro ao atualizar pedido:', error);
      // Fallback offline
      await OfflineQueueService.enqueue({
        type: 'update_order',
        payload: { orderId, ...updatePayload }
      });
    }

    // Atualizar UI otimisticamente
    setOrders(prev => 
      prev.map(o => 
        o.id === orderId 
          ? { ...o, ...updatePayload }
          : o
      )
    );

    return true;
  } catch (error) {
    console.error('Erro em quickPay:', error);
    return false;
  }
};
```

---

## 📱 Integração Completa - tables.tsx

### Exemplo de Uso Completo
```typescript
import React, { useState } from 'react';
import { FastPayButton } from '@/components/FastPayButton';
import { WaitlistBoard } from '@/components/WaitlistBoard';
import { TableCard } from '@/components/TableCard';

export default function TablesScreen() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const { orders } = useOrder();

  const tableOrder = selectedTable 
    ? orders.find(o => o.tableId === selectedTable.id && o.status !== 'paid')
    : null;

  return (
    <View>
      {/* Mapa de mesas */}
      <FlatList
        data={tables}
        renderItem={({ item }) => (
          <TableCard 
            table={item}
            order={orders.find(o => o.tableId === item.id)}
          />
        )}
      />

      {/* Bottom Sheet com detalhes */}
      {selectedTable && tableOrder && (
        <View>
          <Text>Mesa {selectedTable.number}</Text>
          <FastPayButton
            orderId={tableOrder.id}
            total={tableOrder.total}
            tableId={selectedTable.id}
            onSuccess={() => {
              setSelectedTable(null);
              // Atualizar UI
            }}
          />
        </View>
      )}

      {/* Waitlist */}
      <WaitlistBoard
        visible={showWaitlist}
        onClose={() => setShowWaitlist(false)}
        onAssignTable={(entry, tableId) => {
          // Lógica de atribuição
        }}
      />
    </View>
  );
}
```

---

## 🎯 Padrões de Código

### 1. Offline-First
```typescript
try {
  await supabase.from('table').update(data);
} catch (error) {
  // Fallback offline
  await OfflineQueueService.enqueue({
    type: 'update',
    payload: data
  });
}
```

### 2. Otimistic UI
```typescript
// Atualizar UI imediatamente
setOrders(prev => prev.map(o => 
  o.id === id ? { ...o, status: 'paid' } : o
));

// Depois sincronizar
await syncWithServer();
```

### 3. Haptic Feedback
```typescript
import { HapticFeedback } from '@/services/haptics';

// Sucesso
HapticFeedback.success();

// Erro
HapticFeedback.error();

// Seleção
HapticFeedback.selection();
```

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-24
