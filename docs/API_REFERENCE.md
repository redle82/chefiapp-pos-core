# 📚 API Reference - ChefIApp

**Referência completa de APIs e serviços**

---

## 🎯 Componentes

### FastPayButton

```typescript
interface FastPayButtonProps {
  orderId: string;
  total: number;
  tableId: string;
  onSuccess?: () => void;
}

<FastPayButton 
  orderId="order-123"
  total={50.00}
  tableId="table-1"
  onSuccess={() => console.log('Pagamento concluído')}
/>
```

**Comportamento:**
- Auto-seleciona método mais usado (default: 'cash')
- Valida caixa aberto se cash
- Processa pagamento via `quickPay()`
- Atualiza status para 'paid'
- Fecha mesa automaticamente

---

### KitchenPressureIndicator

```typescript
<KitchenPressureIndicator />
```

**Retorna:**
- Banner visual quando pressão > 'low'
- Mostra contagem de pedidos
- Indica se priorizando bebidas

**Estados:**
- `low`: Não renderiza
- `medium`: Banner amarelo
- `high`: Banner vermelho

---

### WaitlistBoard

```typescript
interface WaitlistBoardProps {
  visible: boolean;
  onClose: () => void;
  onAssignTable: (entry: WaitlistEntry, tableId: string) => void;
}

<WaitlistBoard 
  visible={showWaitlist}
  onClose={() => setShowWaitlist(false)}
  onAssignTable={(entry, tableId) => {
    // Atribuir mesa
  }}
/>
```

**Funcionalidades:**
- Adicionar entrada
- Listar esperando
- Atribuir mesa
- Cancelar entrada
- Persistência local

---

## 🪝 Hooks

### useKitchenPressure

```typescript
const {
  pressure: 'low' | 'medium' | 'high',
  preparingCount: number,
  slowItemsActive: boolean,
  shouldHideSlowItems: boolean
} = useKitchenPressure();
```

**Exemplo:**
```typescript
const { shouldHideSlowItems } = useKitchenPressure();

const filteredMenu = useMemo(() => {
  if (shouldHideSlowItems) {
    return menuItems.filter(item => 
      (PREP_TIME[item.category] || 10) <= SLOW_THRESHOLD
    );
  }
  return menuItems;
}, [menuItems, shouldHideSlowItems]);
```

**Thresholds:**
- `low`: < 5 pedidos
- `medium`: 5-10 pedidos
- `high`: > 10 pedidos

---

### useOrder

```typescript
const {
  orders: Order[],
  quickPay: (orderId: string, method: string) => Promise<boolean>,
  updateOrderStatus: (orderId: string, status: string) => Promise<void>,
  createOrder: (order: CreateOrderInput) => Promise<Order>,
  fetchOrders: () => Promise<void>
} = useOrder();
```

**Exemplo:**
```typescript
const { quickPay, updateOrderStatus } = useOrder();

// Processar pagamento
const success = await quickPay('order-123', 'cash');
if (success) {
  await updateOrderStatus('order-123', 'paid');
}
```

---

### useAppStaff

```typescript
const {
  currentStaff: Staff | null,
  financialState: 'drawer_open' | 'drawer_closed',
  role: 'waiter' | 'manager' | 'owner',
  restaurantId: string
} = useAppStaff();
```

**Exemplo:**
```typescript
const { financialState } = useAppStaff();

if (method === 'cash' && financialState === 'drawer_closed') {
  Alert.alert('Caixa Fechado', 'Abra o cofre antes.');
}
```

---

## 🔧 Services

### PersistenceService

```typescript
class PersistenceService {
  // Waitlist
  static async saveWaitlist(data: WaitlistEntry[]): Promise<void>;
  static async loadWaitlist(): Promise<WaitlistEntry[] | null>;
  static async clearWaitlist(): Promise<void>;
  
  // Config
  static async saveConfig(data: any): Promise<void>;
  static async loadConfig(): Promise<any | null>;
  
  // Limpar tudo
  static async clearAll(): Promise<void>;
}
```

**Exemplo:**
```typescript
// Salvar
await PersistenceService.saveWaitlist(entries);

// Carregar
const entries = await PersistenceService.loadWaitlist();
```

---

### InventoryService

```typescript
class InventoryService {
  static async deductStockForOrder(order: Order): Promise<void>;
  static async checkAvailability(itemId: string): Promise<boolean>;
  static async getStock(itemId: string): Promise<number>;
}
```

**Exemplo:**
```typescript
// Deduzir estoque
await InventoryService.deductStockForOrder(order);
```

---

### PrinterService

```typescript
class PrinterService {
  static async printReceipt(order: Order): Promise<void>;
  static async kickDrawer(): Promise<void>;
  static async printKitchenTicket(order: Order): Promise<void>;
}
```

**Exemplo:**
```typescript
// Imprimir recibo
await PrinterService.printReceipt(order);

// Abrir gaveta
if (method === 'cash') {
  await PrinterService.kickDrawer();
}
```

---

## 🌐 Supabase RPCs

### process_order_payment

```typescript
const { data, error } = await supabase.rpc('process_order_payment', {
  p_order_id: string,
  p_amount: number,
  p_method: 'cash' | 'card' | 'pix',
  p_idempotency_key: string
});
```

**Retorna:**
```typescript
{
  success: boolean,
  transaction_id: string,
  message: string
}
```

---

### earn_loyalty_points

```typescript
const { data, error } = await supabase.rpc('earn_loyalty_points', {
  p_customer_id: string,
  p_points: number
});
```

**Retorna:**
```typescript
{
  success: boolean,
  total_points: number
}
```

---

## 🎨 Utils

### getUrgencyColor

```typescript
function getUrgencyColor(elapsedMinutes: number): string;
```

**Retorna:**
- `#10B981` (verde) se < 15 minutos
- `#F59E0B` (amarelo) se 15-30 minutos
- `#EF4444` (vermelho) se > 30 minutos

**Exemplo:**
```typescript
const elapsedMinutes = 20;
const color = getUrgencyColor(elapsedMinutes); // '#F59E0B'
```

---

### PREP_TIME

```typescript
const PREP_TIME: Record<string, number> = {
  'drink': 2,
  'appetizer': 5,
  'main': 15,
  'dessert': 10
};
```

**Uso:**
```typescript
const prepTime = PREP_TIME[item.category] || 10;
```

---

### SLOW_THRESHOLD

```typescript
const SLOW_THRESHOLD = 10; // minutos
```

**Uso:**
```typescript
const isSlow = (PREP_TIME[item.category] || 10) > SLOW_THRESHOLD;
```

---

## 📱 Contexts

### OrderContext

```typescript
interface OrderContextValue {
  orders: Order[];
  quickPay: (orderId: string, method: string) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  createOrder: (order: CreateOrderInput) => Promise<Order>;
  fetchOrders: () => Promise<void>;
}

const { orders, quickPay } = useOrder();
```

---

### AppStaffContext

```typescript
interface AppStaffContextValue {
  currentStaff: Staff | null;
  financialState: 'drawer_open' | 'drawer_closed';
  role: 'waiter' | 'manager' | 'owner';
  restaurantId: string;
}

const { financialState, role } = useAppStaff();
```

---

## 🔔 Haptic Feedback

```typescript
import { HapticFeedback } from '@/services/haptics';

// Sucesso
HapticFeedback.success();

// Erro
HapticFeedback.error();

// Seleção
HapticFeedback.selection();

// Impacto leve
HapticFeedback.light();

// Impacto médio
HapticFeedback.medium();

// Impacto pesado
HapticFeedback.heavy();
```

---

## 📊 Types

### Order

```typescript
interface Order {
  id: string;
  tableId: string;
  customerId?: string;
  status: 'pending' | 'preparing' | 'delivered' | 'paid';
  payment_status: 'pending' | 'paid';
  payment_method?: 'cash' | 'card' | 'pix';
  total: number;
  items: OrderItem[];
  createdAt: string;
  lastEventTime?: string;
}
```

### WaitlistEntry

```typescript
interface WaitlistEntry {
  id: string;
  name: string;
  time: string;
  status: 'waiting' | 'seated' | 'cancelled';
}
```

### KitchenPressure

```typescript
type KitchenPressure = 'low' | 'medium' | 'high';

interface KitchenPressureState {
  pressure: KitchenPressure;
  preparingCount: number;
  slowItemsActive: boolean;
  shouldHideSlowItems: boolean;
}
```

---

## 🚨 Error Handling

### Padrão de Erro

```typescript
try {
  await quickPay(orderId, method);
} catch (error) {
  console.error('Payment error:', error);
  Alert.alert('Erro', 'Falha ao processar pagamento.');
  // Fallback offline
  await OfflineQueueService.enqueue({
    type: 'payment',
    payload: { orderId, method }
  });
}
```

---

## 📚 Recursos Adicionais

- **Code Examples:** `docs/CODE_EXAMPLES.md`
- **Quick Reference:** `QUICK_REFERENCE.md`
- **Troubleshooting:** `docs/TROUBLESHOOTING.md`

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-24
