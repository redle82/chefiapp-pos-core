# ⚡ Quick Reference - ChefIApp

**Cheat sheet rápido para desenvolvedores e operadores**

---

## 🎯 Componentes Principais

### FastPayButton
```typescript
<FastPayButton 
  orderId={order.id} 
  total={order.total} 
  tableId={order.tableId}
  onSuccess={() => {/* ação após pagamento */}}
/>
```

### KitchenPressureIndicator
```typescript
<KitchenPressureIndicator />
// Auto-detecta pressão e mostra banner
```

### WaitlistBoard
```typescript
<WaitlistBoard 
  visible={showWaitlist}
  onClose={() => setShowWaitlist(false)}
  onAssignTable={(entry, tableId) => {/* atribuir mesa */}}
/>
```

---

## 🪝 Hooks Essenciais

### useKitchenPressure
```typescript
const { 
  pressure,           // 'low' | 'medium' | 'high'
  preparingCount,     // número de pedidos
  slowItemsActive,    // boolean
  shouldHideSlowItems // boolean
} = useKitchenPressure();
```

### useOrder
```typescript
const { 
  orders, 
  quickPay, 
  updateOrderStatus 
} = useOrder();
```

### useAppStaff
```typescript
const { 
  financialState,  // 'drawer_open' | 'drawer_closed'
  currentStaff 
} = useAppStaff();
```

---

## 🗺️ Mapa Vivo - Cores de Urgência

```typescript
const getUrgencyColor = (elapsedMinutes: number) => {
  if (elapsedMinutes < 15) return '#10B981'; // verde
  if (elapsedMinutes < 30) return '#F59E0B'; // amarelo
  return '#EF4444'; // vermelho
};
```

### Ícones Contextuais
- 💰 "Quer pagar" → `order.status === 'delivered'`
- 🍷 "Esperando bebida" → `order.items.some(i => i.category === 'drink' && i.status === 'preparing')`

---

## 🍽️ KDS - Filtragem de Menu

```typescript
const filteredMenu = useMemo(() => {
  if (shouldHideSlowItems) {
    return menuItems.filter(item => 
      (PREP_TIME[item.category] || 10) <= SLOW_THRESHOLD
    );
  }
  return menuItems;
}, [menuItems, shouldHideSlowItems]);
```

### Thresholds
- **SLOW_THRESHOLD:** 10 minutos
- **LOW:** < 5 pedidos
- **MEDIUM:** 5-10 pedidos
- **HIGH:** > 10 pedidos

---

## 💾 Persistência Local

### Waitlist
```typescript
import { PersistenceService } from '@/services/persistence';

// Salvar
await PersistenceService.saveWaitlist(entries);

// Carregar
const entries = await PersistenceService.loadWaitlist();
```

---

## ⚡ Fast Pay - Fluxo

1. **Botão único:** "Cobrar Tudo"
2. **Auto-seleção:** método mais usado (default: 'cash')
3. **Validação:** caixa aberto se cash
4. **Confirmação:** alert simples
5. **Processamento:** `quickPay()` → `updateOrderStatus('paid')`
6. **Resultado:** mesa fecha automaticamente

---

## 🎨 Cores do Sistema

### Urgência
- Verde: `#10B981` (< 15min)
- Amarelo: `#F59E0B` (15-30min)
- Vermelho: `#EF4444` (> 30min)

### Pressão Cozinha
- Baixa: sem indicador
- Média: `#FEF3C7` (fundo amarelo claro)
- Alta: `#FEE2E2` (fundo vermelho claro)

---

## 📊 KPIs Rápidos

### Fast Pay
- **Meta:** < 5 segundos
- **Método:** tempo entre toque e confirmação

### Mapa Vivo
- **Meta:** 0 mesas sem contexto temporal
- **Método:** todas ocupadas têm timer

### KDS
- **Meta:** +25% vendas bebidas em pico
- **Método:** comparação antes/depois

### Reservas
- **Meta:** +15% conversão
- **Método:** reservas → mesas ocupadas

---

## 🔧 Comandos Úteis

### Validação
```bash
./scripts/validate-system.sh
```

### Testes
```bash
# Ver: docs/VALIDACAO_RAPIDA.md
```

### Deploy
```bash
# Ver: docs/SETUP_DEPLOY.md
```

---

## 🐛 Debug Rápido

### Fast Pay não funciona
1. Verificar `financialState` (caixa aberto?)
2. Verificar `order.status` (deve ser 'delivered')
3. Verificar conexão Supabase
4. Ver logs: `console.log` em `quickPay()`

### Mapa não atualiza
1. Verificar `currentTime` state (atualiza a cada 1s?)
2. Verificar `order.lastEventTime`
3. Verificar cores: `getUrgencyColor()`

### KDS não filtra
1. Verificar `useKitchenPressure()` retorna valores
2. Verificar `shouldHideSlowItems` está sendo usado
3. Verificar `PREP_TIME` tem valores corretos

### Waitlist não persiste
1. Verificar `AsyncStorage` permissions
2. Verificar `PersistenceService.saveWaitlist()` chamado
3. Verificar formato dos dados

---

## 📱 Telas Principais

### `/app/(tabs)/tables.tsx`
- Mapa de mesas
- Fast Pay
- Waitlist
- Timer e urgência

### `/app/(tabs)/index.tsx`
- Menu principal
- Kitchen Pressure Indicator
- Filtragem inteligente

### `/app/(tabs)/orders.tsx`
- Lista de pedidos
- Fast Pay para entregues

---

## 🔗 Links Rápidos

- **Documentação completa:** `docs/INDICE_COMPLETO.md`
- **Troubleshooting:** `docs/TROUBLESHOOTING.md`
- **FAQ:** `docs/FAQ.md`
- **Validação:** `docs/VALIDACAO_RAPIDA.md`
- **Referência:** `REFERENCIA_DEFINITIVA.md`

---

## ⚙️ Configurações Importantes

### PREP_TIME (minutos)
```typescript
const PREP_TIME = {
  'drink': 2,
  'appetizer': 5,
  'main': 15,
  'dessert': 10
};
```

### SLOW_THRESHOLD
```typescript
const SLOW_THRESHOLD = 10; // minutos
```

### Payment Methods
```typescript
const METHODS = ['cash', 'card', 'pix'];
const DEFAULT_METHOD = 'cash';
```

---

## 🎯 Regras de Negócio

1. **Fast Pay:** sempre fecha mesa após pagamento
2. **Mapa Vivo:** nenhuma mesa ocupada sem timer
3. **KDS:** menu adapta automaticamente
4. **Reservas:** simples, sem overengineering
5. **Offline-first:** tudo funciona offline

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-24
