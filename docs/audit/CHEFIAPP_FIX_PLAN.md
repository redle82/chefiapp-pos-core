# 🔧 ChefIApp - Plano de Correções

**Correções prioritárias baseadas na auditoria QA**

**Data:** 2026-01-24  
**Prioridade:** CRÍTICA

---

## 🎯 Bugs Críticos - Correções Imediatas

### Bug #1: Garçom vê todos os pedidos

**Localização:** `mobile-app/app/(tabs)/orders.tsx`  
**Severidade:** Crítica (Privacidade)  
**Impacto:** Garçom vê pedidos de outros garçons

**Correção:**

```typescript
// Adicionar filtro por role no início do componente
export default function OrdersScreen() {
    const { orders, updateOrderStatus, ... } = useOrder();
    const { activeRole, shiftId, canAccess } = useAppStaff();
    
    // Filtrar pedidos por role
    const filteredOrders = useMemo(() => {
        // Manager, Owner, Admin veem todos
        if (canAccess('order:view_all')) {
            return orders;
        }
        
        // Garçom vê apenas seus pedidos (mesmo shift)
        if (activeRole === 'waiter') {
            return orders.filter(o => o.shiftId === shiftId);
        }
        
        // Outros roles veem apenas pedidos do turno atual
        return orders.filter(o => o.shiftId === shiftId);
    }, [orders, activeRole, shiftId, canAccess]);
    
    return (
        <ShiftGate>
            <View style={styles.container}>
                <FlatList
                    data={filteredOrders}  // ← Usar filteredOrders
                    renderItem={renderOrder}
                    // ...
                />
            </View>
        </ShiftGate>
    );
}
```

**Arquivo:** `mobile-app/app/(tabs)/orders.tsx`  
**Linha:** ~43 e ~270

---

### Bug #4: Pedido pode ser pago sem estar entregue

**Localização:** `mobile-app/components/QuickPayModal.tsx` e `mobile-app/app/(tabs)/orders.tsx`  
**Severidade:** Crítica (Operacional)  
**Impacto:** Cliente pode pagar antes de receber pedido

**Correção:**

```typescript
// Em QuickPayModal.tsx ou FastPayButton.tsx
const canPay = (order: Order): boolean => {
    // Validar que todos os itens foram entregues
    const allItemsDelivered = order.items.every(item => 
        item.status === 'delivered' || item.status === 'cancelled'
    );
    
    // Validar que pedido está no status correto
    const isDelivered = order.status === 'delivered';
    
    return allItemsDelivered && isDelivered;
};

// No componente
{selectedOrder && canPay(selectedOrder) && (
    <FastPayButton
        orderId={selectedOrder.id}
        // ...
    />
)}

// Se não pode pagar, mostrar mensagem
{selectedOrder && !canPay(selectedOrder) && (
    <View style={styles.warningContainer}>
        <Text style={styles.warningText}>
            ⚠️ Todos os itens devem ser entregues antes de pagar
        </Text>
    </View>
)}
```

**Arquivos:**
- `mobile-app/components/QuickPayModal.tsx`
- `mobile-app/components/FastPayButton.tsx`
- `mobile-app/app/(tabs)/orders.tsx`

---

### Bug #9: Estado pode quebrar ao recarregar

**Localização:** `mobile-app/context/AppStaffContext.tsx`  
**Severidade:** Crítica (Funcionalidade)  
**Impacto:** App fica inutilizável se businessId não carrega

**Correção:**

```typescript
// Em AppStaffContext.tsx, no useEffect de load
useEffect(() => {
    const load = async () => {
        try {
            // ... código existente ...
            
            // 2. Load Cloud Identity (Restaurant)
            try {
                const { data: restData } = await supabase
                    .from('gm_restaurants')
                    .select('id, name')
                    .limit(1)
                    .single();

                if (restData) {
                    setOperationalContextState(prev => ({
                        ...prev,
                        businessName: restData.name,
                        businessId: restData.id
                    }));
                } else {
                    // FALLBACK: Usar dados locais ou criar restaurante padrão
                    console.warn('[AppStaff] No restaurant found, using fallback');
                    setOperationalContextState(prev => ({
                        ...prev,
                        businessId: prev.businessId || 'fallback-restaurant-id',
                        businessName: prev.businessName || 'Restaurante'
                    }));
                }
            } catch (e) {
                console.error('[AppStaff] Error loading restaurant:', e);
                // FALLBACK: Usar dados locais
                setOperationalContextState(prev => ({
                    ...prev,
                    businessId: prev.businessId || 'fallback-restaurant-id',
                    businessName: prev.businessName || 'Restaurante'
                }));
            }
            
            // ... resto do código ...
        } catch (error) {
            console.error('[AppStaff] Critical error loading context:', error);
            // Garantir que sempre temos um estado válido
            setOperationalContextState(prev => ({
                ...prev,
                businessId: prev.businessId || 'fallback-restaurant-id',
                businessName: prev.businessName || 'Restaurante'
            }));
        }
    };
    
    load();
}, []);
```

**Arquivo:** `mobile-app/context/AppStaffContext.tsx`  
**Linha:** ~328-366

---

### Bug #12: Ações críticas sem validação de permissão

**Localização:** Múltiplas telas  
**Severidade:** Crítica (Segurança)  
**Impacto:** Ações podem ser executadas sem permissão

**Correções:**

#### 12.1: Void Item

```typescript
// Em orders.tsx
const handleVoidItem = (item: OrderItem) => {
    if (!selectedOrder) return;
    
    // VALIDAÇÃO DE PERMISSÃO
    if (!canAccess('order:void')) {
        Alert.alert('Sem Permissão', 'Você não tem permissão para cancelar itens.');
        return;
    }
    
    Alert.prompt(
        "Cancelar Item",
        // ... resto do código ...
    );
};
```

#### 12.2: Discount

```typescript
// Em orders.tsx ou QuickPayModal
const handleDiscount = () => {
    if (!canAccess('order:discount')) {
        Alert.alert('Sem Permissão', 'Você não tem permissão para aplicar descontos.');
        return;
    }
    // ... resto do código ...
};
```

#### 12.3: Split Order

```typescript
// Em orders.tsx
const handleSplitOrder = () => {
    if (!canAccess('order:split')) {
        Alert.alert('Sem Permissão', 'Você não tem permissão para dividir pedidos.');
        return;
    }
    // ... resto do código ...
};
```

**Arquivos:**
- `mobile-app/app/(tabs)/orders.tsx`
- `mobile-app/components/QuickPayModal.tsx`
- `mobile-app/app/(tabs)/manager.tsx`

---

## ⚠️ Bugs Médios - Correções Importantes

### Bug #2: Dono pode acessar gestão sem validação

**Correção:**

```typescript
// Em manager.tsx, no início do componente
export default function ManagerScreen() {
    const { activeRole, canAccess } = useAppStaff();
    
    // GUARD: Verificar permissão
    if (!canAccess('business:view_reports') && activeRole !== 'owner' && activeRole !== 'manager') {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>
                    Você não tem permissão para acessar esta tela.
                </Text>
            </View>
        );
    }
    
    // ... resto do código ...
}
```

**Arquivo:** `mobile-app/app/(tabs)/manager.tsx`  
**Linha:** ~21

---

### Bug #3: Tabs acessíveis via navegação direta

**Correção:**

```typescript
// Criar hook useRouteGuard.ts
export function useRouteGuard(requiredPermission?: Permission) {
    const { canAccess, activeRole } = useAppStaff();
    const router = useRouter();
    
    useEffect(() => {
        if (requiredPermission && !canAccess(requiredPermission)) {
            // Redirecionar para tela permitida
            router.replace('/(tabs)/staff');
        }
    }, [requiredPermission, canAccess, router]);
    
    return { canAccess, activeRole };
}

// Usar em cada tela protegida
export default function ManagerScreen() {
    useRouteGuard('business:view_reports');
    // ... resto do código ...
}
```

**Arquivo:** `mobile-app/hooks/useRouteGuard.ts` (criar novo)

---

### Bug #5: Fechamento de caixa sem validação

**Correção:**

```typescript
// Em FinancialVault.tsx
const handleCloseDrawer = async () => {
    const actualCash = parseFloat(amount.replace(',', '.'));
    if (isNaN(actualCash)) {
        Alert.alert('Erro', 'Valor inválido');
        return;
    }
    
    // VALIDAÇÃO: Verificar pedidos pendentes
    const { data: pendingOrders } = await supabase
        .from('gm_orders')
        .select('id, table_number, status')
        .eq('restaurant_id', operationalContext.businessId)
        .in('status', ['OPEN', 'IN_PREP', 'READY', 'DELIVERED'])
        .eq('payment_status', 'pending');
    
    if (pendingOrders && pendingOrders.length > 0) {
        Alert.alert(
            'Pedidos Pendentes',
            `Existem ${pendingOrders.length} pedido(s) pendente(s). Deseja fechar o caixa mesmo assim?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Fechar Mesmo Assim',
                    style: 'destructive',
                    onPress: async () => {
                        // Continuar com fechamento
                        await closeFinancialSession(actualCash, reason);
                    }
                }
            ]
        );
        return;
    }
    
    // Se não há pendências, fechar normalmente
    setLoading(true);
    await closeFinancialSession(actualCash, reason);
    setLoading(false);
    // ... resto do código ...
};
```

**Arquivo:** `mobile-app/components/FinancialVault.tsx`  
**Linha:** ~91

---

### Bug #6: Turno pode ser encerrado com ações pendentes

**Correção:**

```typescript
// Em staff.tsx
const handleRequestCloseShift = async () => {
    // VALIDAÇÃO: Verificar ações pendentes
    const { nowAction } = useNowEngine();
    
    if (nowAction && (nowAction.type === 'critical' || nowAction.type === 'urgent')) {
        Alert.alert(
            'Ações Pendentes',
            `Há uma ação ${nowAction.type === 'critical' ? 'crítica' : 'urgente'} pendente. Resolva antes de encerrar o turno.`,
            [{ text: 'OK' }]
        );
        return;
    }
    
    // Verificar pedidos pendentes
    const { data: pendingOrders } = await supabase
        .from('gm_orders')
        .select('id')
        .eq('shift_id', shiftId)
        .in('status', ['OPEN', 'IN_PREP', 'READY', 'DELIVERED']);
    
    if (pendingOrders && pendingOrders.length > 0) {
        Alert.alert(
            'Encerrar Turno',
            `Existem ${pendingOrders.length} pedido(s) pendente(s). Deseja encerrar o turno mesmo assim?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Encerrar',
                    style: 'destructive',
                    onPress: () => endShift(0, 0)
                }
            ]
        );
        return;
    }
    
    // Se não há pendências, encerrar normalmente
    Alert.alert(
        'Encerrar Turno',
        'Deseja realmente encerrar seu turno de trabalho?',
        [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Encerrar', style: 'destructive', onPress: () => endShift(0, 0) }
        ]
    );
};
```

**Arquivo:** `mobile-app/app/(tabs)/staff.tsx`  
**Linha:** ~76

---

### Bug #14: Validação de valores fraca

**Correção:**

```typescript
// Criar utilitário de validação
// mobile-app/utils/validation.ts
export const validateAmount = (value: string): { valid: boolean; error?: string } => {
    const num = parseFloat(value.replace(',', '.'));
    
    if (isNaN(num)) {
        return { valid: false, error: 'Valor inválido' };
    }
    
    if (num < 0) {
        return { valid: false, error: 'Valor não pode ser negativo' };
    }
    
    if (num > 100000) {
        return { valid: false, error: 'Valor muito alto (máximo: €100.000)' };
    }
    
    return { valid: true };
};

// Usar em FinancialVault.tsx
const handleOpenDrawer = async () => {
    const validation = validateAmount(amount);
    if (!validation.valid) {
        Alert.alert('Erro', validation.error);
        return;
    }
    
    const floatVal = parseFloat(amount.replace(',', '.'));
    // ... resto do código ...
};
```

**Arquivo:** `mobile-app/utils/validation.ts` (criar novo)  
**Usar em:** `mobile-app/components/FinancialVault.tsx`

---

## 📋 Checklist de Implementação

### Fase 1: Bugs Críticos (Prioridade Máxima)

- [ ] **Bug #1:** Filtrar pedidos por role em `orders.tsx`
- [ ] **Bug #4:** Validar entrega antes de pagamento
- [ ] **Bug #9:** Tratamento de erro no carregamento de contexto
- [ ] **Bug #12:** Validação de permissões em todas as ações críticas

### Fase 2: Bugs Médios de Segurança

- [ ] **Bug #2:** Guard na tela de gestão
- [ ] **Bug #3:** Guards nas rotas (criar `useRouteGuard`)
- [ ] **Bug #5:** Validação antes de fechar caixa
- [ ] **Bug #6:** Validação antes de encerrar turno
- [ ] **Bug #14:** Validação de valores (criar `validation.ts`)

### Fase 3: Testes

- [ ] Testar cada correção isoladamente
- [ ] Testar fluxo completo após correções
- [ ] Validar permissões em todas as telas
- [ ] Testar cenários de erro

---

## 🎯 Ordem de Implementação Recomendada

1. **Bug #9** (Estado quebra) - Mais crítico, afeta tudo
2. **Bug #1** (Pedidos por role) - Privacidade
3. **Bug #12** (Permissões) - Segurança
4. **Bug #4** (Validação pagamento) - Operacional
5. **Bug #2, #3** (Guards) - Segurança
6. **Bug #5, #6** (Validações) - Operacional
7. **Bug #14** (Validação valores) - Segurança

---

## 📝 Notas de Implementação

### Importações Necessárias

```typescript
// Para validações
import { useMemo } from 'react';
import { useAppStaff } from '@/context/AppStaffContext';
import { useOrder } from '@/context/OrderContext';
import { supabase } from '@/services/supabase';
```

### Testes Após Correção

Para cada bug corrigido:
1. Testar cenário que causava o bug
2. Verificar que bug não ocorre mais
3. Verificar que funcionalidade normal ainda funciona
4. Testar edge cases

---

**Versão:** 1.0.0  
**Data:** 2026-01-24  
**Status:** ✅ **PLANO DE CORREÇÕES COMPLETO**
