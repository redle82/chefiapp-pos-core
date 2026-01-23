# 🎨 Common Patterns - ChefIApp

**Padrões comuns de código e soluções reutilizáveis**

---

## 🔄 Padrões de Estado

### 1. Loading State
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<Data | null>(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await api.fetch();
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### 2. Optimistic Update
```typescript
// Atualizar UI imediatamente
setOrders(prev => prev.map(o => 
  o.id === id ? { ...o, status: 'paid' } : o
));

// Sincronizar depois
try {
  await syncWithServer();
} catch (error) {
  // Reverter se falhar
  setOrders(prev => prev.map(o => 
    o.id === id ? { ...o, status: 'preparing' } : o
  ));
}
```

### 3. Debounced Search
```typescript
import { useDebouncedCallback } from 'use-debounce';

const [query, setQuery] = useState('');
const [results, setResults] = useState([]);

const debouncedSearch = useDebouncedCallback(
  async (searchQuery: string) => {
    const results = await search(searchQuery);
    setResults(results);
  },
  300
);

useEffect(() => {
  if (query) {
    debouncedSearch(query);
  }
}, [query]);
```

---

## 🎯 Padrões de Componentes

### 1. Conditional Rendering
```typescript
// ✅ Preferir early return
if (!order) return null;
if (order.status === 'paid') return <ClosedTable />;

return <ActiveTable order={order} />;
```

### 2. Props Destructuring
```typescript
// ✅ Destructuring no parâmetro
export function Component({ orderId, total, onSuccess }: Props) {
  // ...
}

// ❌ Evitar
export function Component(props: Props) {
  const { orderId, total } = props;
}
```

### 3. Memoization
```typescript
// ✅ Memoizar cálculos pesados
const filteredItems = useMemo(() => {
  return items.filter(item => item.active);
}, [items]);

// ✅ Memoizar callbacks
const handleClick = useCallback(() => {
  // ação
}, [dependencies]);
```

---

## 🔌 Padrões de Hooks

### 1. Custom Hook Pattern
```typescript
// hooks/useFeature.ts
export function useFeature(id: string) {
  const [state, setState] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFeature(id);
  }, [id]);

  return { state, loading };
}

// Uso
const { state, loading } = useFeature('123');
```

### 2. Hook com Cleanup
```typescript
export function useTimer(active: boolean) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [active]);

  return time;
}
```

### 3. Hook com Dependencies
```typescript
export function useData(fetchFn: () => Promise<Data>, deps: any[]) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFn().then(setData).finally(() => setLoading(false));
  }, deps);

  return { data, loading };
}
```

---

## 🌐 Padrões de API

### 1. Error Handling
```typescript
const fetchWithErrorHandling = async () => {
  try {
    const { data, error } = await supabase
      .from('table')
      .select('*');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('API Error:', error);
    // Fallback offline
    return getOfflineData();
  }
};
```

### 2. Retry Pattern
```typescript
const fetchWithRetry = async (
  fn: () => Promise<any>,
  retries = 3
): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(fn, retries - 1);
    }
    throw error;
  }
};
```

### 3. Batch Operations
```typescript
const batchUpdate = async (updates: Update[]) => {
  const chunks = chunk(updates, 10); // 10 por vez

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(update => 
        supabase.from('table').update(update.data).eq('id', update.id)
      )
    );
  }
};
```

---

## 💾 Padrões de Persistência

### 1. Local Storage Pattern
```typescript
const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = async (value: T) => {
    try {
      setStoredValue(value);
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage error:', error);
    }
  };

  return [storedValue, setValue] as const;
};
```

### 2. Sync Pattern
```typescript
const syncData = async () => {
  // 1. Carregar local
  const local = await loadLocal();
  
  // 2. Tentar sync
  try {
    const remote = await fetchRemote();
    // 3. Merge
    const merged = merge(local, remote);
    // 4. Salvar
    await saveLocal(merged);
    await saveRemote(merged);
  } catch (error) {
    // 5. Usar local se falhar
    return local;
  }
};
```

---

## 🎨 Padrões de UI

### 1. Loading States
```typescript
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;

return <DataView data={data} />;
```

### 2. Error Boundaries
```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 3. Conditional Styles
```typescript
const getStyle = (urgent: boolean) => ({
  borderColor: urgent ? '#EF4444' : '#10B981',
  borderWidth: urgent ? 2 : 1
});

<View style={getStyle(isUrgent)} />
```

---

## 🔐 Padrões de Segurança

### 1. Input Validation
```typescript
const validateInput = (input: string): boolean => {
  if (!input || input.trim().length === 0) return false;
  if (input.length > 100) return false;
  if (/[<>]/.test(input)) return false; // XSS
  return true;
};
```

### 2. Sanitization
```typescript
const sanitize = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 100);
};
```

### 3. Idempotency
```typescript
const processPayment = async (
  orderId: string,
  amount: number
) => {
  const idempotencyKey = `${orderId}-${Date.now()}`;
  
  // Verificar se já processado
  const existing = await checkIdempotency(idempotencyKey);
  if (existing) return existing;

  // Processar
  const result = await paymentGateway.process(amount, idempotencyKey);
  await saveIdempotency(idempotencyKey, result);
  return result;
};
```

---

## ⚡ Padrões de Performance

### 1. Lazy Loading
```typescript
const HeavyComponent = React.lazy(() => 
  import('./HeavyComponent')
);

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### 2. Virtualization
```typescript
<FlatList
  data={largeArray}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  // Otimizações
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

### 3. Debounce/Throttle
```typescript
// Debounce: aguardar parar de digitar
const debounced = useDebouncedCallback(fn, 300);

// Throttle: executar no máximo 1x por segundo
const throttled = useThrottledCallback(fn, 1000);
```

---

## 🧪 Padrões de Testes

### 1. Component Test
```typescript
describe('Component', () => {
  it('deve renderizar corretamente', () => {
    const { getByText } = render(<Component />);
    expect(getByText('Texto')).toBeTruthy();
  });

  it('deve responder a interações', () => {
    const { getByText } = render(<Component />);
    fireEvent.press(getByText('Botão'));
    expect(mockFn).toHaveBeenCalled();
  });
});
```

### 2. Hook Test
```typescript
describe('useHook', () => {
  it('deve retornar valores corretos', () => {
    const { result } = renderHook(() => useHook());
    expect(result.current.value).toBe(expected);
  });
});
```

---

## 📚 Recursos

- **Code Examples:** `docs/CODE_EXAMPLES.md`
- **Quick Reference:** `QUICK_REFERENCE.md`
- **API Reference:** `docs/API_REFERENCE.md`

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-24
