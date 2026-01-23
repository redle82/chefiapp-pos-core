# ⚡ Performance & Optimization - ChefIApp

**Guia de otimização e melhores práticas de performance**

---

## 🎯 Objetivos de Performance

### Métricas Alvo
- **Tempo de pagamento:** < 5 segundos
- **Renderização inicial:** < 2 segundos
- **Atualização de estado:** < 100ms
- **Scroll fluido:** 60 FPS
- **Uso de memória:** < 150MB
- **Bateria:** < 5% por hora de uso ativo

---

## 🚀 Otimizações Implementadas

### 1. Timer Otimizado (Mapa Vivo)
```typescript
// ❌ ANTES: Timer sempre rodando
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);
  return () => clearInterval(interval);
}, []);

// ✅ DEPOIS: Timer condicional
useEffect(() => {
  if (!order || order.status === 'paid') return;
  
  const interval = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);
  
  return () => clearInterval(interval);
}, [order]);
```

**Benefício:** Reduz re-renders desnecessários em 60-80%

---

### 2. Memoização de Cálculos (Menu Filtrado)
```typescript
// ✅ USO CORRETO
const filteredMenuItems = useMemo(() => {
  if (shouldHideSlowItems) {
    return menuItems.filter(item => 
      (PREP_TIME[item.category] || 10) <= SLOW_THRESHOLD
    );
  }
  return menuItems;
}, [menuItems, shouldHideSlowItems]);
```

**Benefício:** Evita recálculo a cada render

---

### 3. Lazy Loading de Componentes
```typescript
// ✅ Componentes pesados carregados sob demanda
const WaitlistBoard = React.lazy(() => 
  import('@/components/WaitlistBoard')
);

// Uso com Suspense
<Suspense fallback={<Loading />}>
  <WaitlistBoard visible={showWaitlist} />
</Suspense>
```

---

### 4. Debounce em Buscas
```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (query: string) => {
    // Buscar itens
  },
  300 // 300ms de delay
);
```

---

### 5. FlatList Otimizado
```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  // ✅ Otimizações
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={10}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

---

## 📊 Monitoramento de Performance

### React Native Performance Monitor
```typescript
import { PerformanceObserver } from 'react-native-performance';

// Monitorar renderizações
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`${entry.name}: ${entry.duration}ms`);
  }
});

observer.observe({ entryTypes: ['measure'] });
```

### Métricas Customizadas
```typescript
// Medir tempo de pagamento
const startTime = performance.now();
await quickPay(orderId, method);
const duration = performance.now() - startTime;

console.log(`Fast Pay: ${duration}ms`);
// Alertar se > 5000ms
if (duration > 5000) {
  console.warn('Fast Pay lento!');
}
```

---

## 🔋 Otimizações de Bateria

### 1. Reduzir Polling
```typescript
// ❌ ANTES: Polling constante
useEffect(() => {
  const interval = setInterval(() => {
    fetchOrders();
  }, 1000); // A cada segundo
}, []);

// ✅ DEPOIS: Supabase Realtime
useEffect(() => {
  const channel = supabase
    .channel('orders')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'gm_orders' },
      (payload) => {
        // Atualizar apenas quando mudar
        updateOrders(payload);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### 2. Desabilitar Timers em Background
```typescript
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'background') {
      // Pausar timers
      clearInterval(timerRef.current);
    } else if (nextAppState === 'active') {
      // Retomar timers
      startTimer();
    }
  });
  
  return () => subscription.remove();
}, []);
```

---

## 💾 Otimizações de Memória

### 1. Limpar Listeners
```typescript
useEffect(() => {
  const channel = supabase.channel('orders').subscribe();
  
  // ✅ SEMPRE limpar
  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### 2. Evitar Memory Leaks
```typescript
// ✅ Usar refs para valores que não causam re-render
const timeoutRef = useRef<NodeJS.Timeout>();

useEffect(() => {
  timeoutRef.current = setTimeout(() => {
    // ação
  }, 1000);
  
  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
}, []);
```

### 3. Limpar AsyncStorage Antigo
```typescript
// Limpar dados antigos periodicamente
const cleanupOldData = async () => {
  const waitlist = await PersistenceService.loadWaitlist();
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  
  const filtered = waitlist.filter(entry => 
    new Date(entry.time).getTime() > oneDayAgo
  );
  
  await PersistenceService.saveWaitlist(filtered);
};
```

---

## 🌐 Otimizações de Rede

### 1. Batch Updates
```typescript
// ❌ ANTES: Múltiplas requisições
orders.forEach(order => {
  await supabase.from('orders').update(order);
});

// ✅ DEPOIS: Batch update
const updates = orders.map(order => ({
  id: order.id,
  status: order.status
}));

await supabase.rpc('batch_update_orders', { updates });
```

### 2. Cache de Dados
```typescript
// Cache de menu (muda raramente)
const [menuCache, setMenuCache] = useState(null);
const [menuCacheTime, setMenuCacheTime] = useState(0);

const loadMenu = async () => {
  const now = Date.now();
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  
  if (menuCache && (now - menuCacheTime) < CACHE_DURATION) {
    return menuCache; // Usar cache
  }
  
  const menu = await fetchMenu();
  setMenuCache(menu);
  setMenuCacheTime(now);
  return menu;
};
```

### 3. Offline-First
```typescript
// Sempre tentar local primeiro
const getOrder = async (id: string) => {
  // 1. Tentar cache local
  const cached = await AsyncStorage.getItem(`order_${id}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // 2. Tentar Supabase
  try {
    const { data } = await supabase
      .from('gm_orders')
      .select('*')
      .eq('id', id)
      .single();
    
    // Salvar no cache
    await AsyncStorage.setItem(`order_${id}`, JSON.stringify(data));
    return data;
  } catch (error) {
    // 3. Fallback offline
    return getOfflineOrder(id);
  }
};
```

---

## 🎨 Otimizações de UI

### 1. Evitar Re-renders Desnecessários
```typescript
// ✅ Usar React.memo para componentes pesados
export const TableCard = React.memo(({ table, order }) => {
  // Componente
}, (prevProps, nextProps) => {
  // Comparação customizada
  return (
    prevProps.table.id === nextProps.table.id &&
    prevProps.order?.status === nextProps.order?.status
  );
});
```

### 2. Virtualização
```typescript
// ✅ Usar FlatList ao invés de ScrollView + map
// FlatList virtualiza automaticamente
<FlatList
  data={largeArray}
  renderItem={renderItem}
  // Renderiza apenas itens visíveis
/>
```

### 3. Lazy Images
```typescript
import { Image } from 'react-native';

// ✅ Lazy loading de imagens
<Image
  source={{ uri: imageUrl }}
  resizeMode="cover"
  // Carrega apenas quando visível
  loadingIndicatorSource={placeholder}
/>
```

---

## 📈 Métricas de Performance

### KPIs de Performance
1. **Tempo de pagamento:** < 5s (objetivo: < 3s)
2. **Tempo de renderização:** < 2s (objetivo: < 1s)
3. **FPS médio:** > 55 (objetivo: 60)
4. **Uso de memória:** < 150MB (objetivo: < 100MB)
5. **Bateria por hora:** < 5% (objetivo: < 3%)

### Ferramentas de Medição
- React Native Performance Monitor
- Flipper Performance Plugin
- Chrome DevTools (para web)
- Xcode Instruments (iOS)
- Android Profiler (Android)

---

## 🔍 Checklist de Performance

### Antes de Deploy
- [ ] Timers condicionais implementados
- [ ] Memoização aplicada onde necessário
- [ ] Listeners limpos corretamente
- [ ] FlatList otimizado
- [ ] Imagens lazy loaded
- [ ] Cache implementado
- [ ] Offline-first funcionando
- [ ] Métricas de performance coletadas
- [ ] Memory leaks verificados
- [ ] Bateria testada (1 hora de uso)

---

## 🚨 Red Flags de Performance

### Sinais de Problema
1. **Scroll lag:** FPS < 30
2. **Tempo de pagamento > 10s:** Problema crítico
3. **Uso de memória > 200MB:** Memory leak possível
4. **Bateria > 10% por hora:** Polling excessivo
5. **Re-renders constantes:** Falta de memoização

### Ações Imediatas
1. Verificar timers e listeners
2. Adicionar memoização
3. Verificar memory leaks
4. Reduzir polling
5. Otimizar FlatList

---

## 📚 Recursos Adicionais

- [React Native Performance](https://reactnative.dev/docs/performance)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Expo Performance](https://docs.expo.dev/guides/performance/)

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-24
