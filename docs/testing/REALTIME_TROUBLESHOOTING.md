# Realtime + KDS — O Que Normalmente Quebra

**Baseado em:** Experiência com sistemas Realtime em produção  
**Foco:** Problemas comuns na fase de validação Realtime

---

## 🔴 Problemas Críticos (Bloqueiam Operação)

### 1. Pedido não aparece no KDS

**Sintomas:**
- Pedido criado via RPC ✅
- Pedido existe no banco ✅
- Pedido **não aparece** no KDS ❌

**Causas comuns:**
1. **Realtime não está rodando**
   ```bash
   docker compose -f docker-compose.core.yml ps realtime
   # Deve mostrar: "Up"
   ```

2. **Subscription não está ativa**
   - Verificar console do navegador
   - Deve mostrar: `SUBSCRIBED` para channel `orders`
   - Se mostrar `CHANNEL_ERROR` → problema de conexão

3. **RLS bloqueando eventos**
   - Realtime respeita RLS policies
   - Verificar se policies permitem `SELECT` na tabela `gm_orders`

4. **WebSocket desconectado**
   - Verificar Network tab → WebSocket connection
   - Deve estar `OPEN` (não `CLOSED`)

**Solução:**
```bash
# 1. Verificar Realtime
docker compose -f docker-compose.core.yml logs realtime

# 2. Verificar subscription no console
# No navegador, abrir DevTools → Console
# Deve mostrar: "Subscribed to channel: orders"

# 3. Verificar RLS
# Se necessário, temporariamente desabilitar RLS para testes:
# ALTER TABLE public.gm_orders DISABLE ROW LEVEL SECURITY;
```

---

### 2. Pedido aparece múltiplas vezes

**Sintomas:**
- Criar 1 pedido
- Pedido aparece **2, 3, ou mais vezes** no KDS

**Causas comuns:**
1. **Múltiplas subscriptions ativas**
   - Componente montando múltiplas vezes
   - Hook executando múltiplas vezes
   - Não está limpando subscription no unmount

2. **Evento sendo emitido múltiplas vezes**
   - Trigger no banco executando múltiplas vezes
   - RPC sendo chamado múltiplas vezes

3. **Re-render desnecessário**
   - Frontend re-renderizando e re-subscribindo
   - Estado sendo atualizado múltiplas vezes

**Solução:**
```typescript
// Verificar que há apenas 1 subscription
useEffect(() => {
  const channel = supabase
    .channel('orders')
    .on('postgres_changes', { ... }, handler)
    .subscribe();

  // CRÍTICO: Limpar no unmount
  return () => {
    supabase.removeChannel(channel);
  };
}, []); // Dependências vazias = monta apenas 1 vez
```

---

### 3. Ordem incorreta (pedidos aparecem fora de ordem)

**Sintomas:**
- Criar pedido A, depois B, depois C
- Aparecem no KDS como: B, A, C (ordem errada)

**Causas comuns:**
1. **Race condition no Realtime**
   - Eventos chegando fora de ordem
   - Network delay variável

2. **Frontend não ordenando corretamente**
   - Lista não está ordenada por `created_at`
   - Estado sendo atualizado fora de ordem

3. **Timing issues**
   - Pedidos criados muito rápido
   - Realtime não preserva ordem de eventos

**Solução:**
```typescript
// Sempre ordenar por created_at no frontend
const sortedOrders = orders.sort((a, b) => 
  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
);
```

---

### 4. Pedido "ressuscitado" (reabertura mostra pedido antigo)

**Sintomas:**
- Criar pedido A
- Fechar pedido A
- Criar novo pedido B na mesma mesa
- Pedido A aparece novamente no KDS (como se fosse novo)

**Causas comuns:**
1. **Subscription não filtrando por status**
   - Está escutando todos os INSERTs
   - Não está filtrando `status = 'OPEN'`

2. **Cache não sendo limpo**
   - Frontend mantém pedidos fechados em cache
   - Reabertura re-emite evento antigo

3. **Trigger no banco emitindo evento antigo**
   - Trigger executando em UPDATE (não só INSERT)
   - Não está verificando se status mudou

**Solução:**
```typescript
// Filtrar por status na subscription
.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'gm_orders',
  filter: `restaurant_id=eq.${restaurantId} AND status=eq.OPEN`,
}, handler)
```

---

## 🟡 Problemas Moderados (Afetam UX)

### 5. Latência alta (>500ms)

**Sintomas:**
- Criar pedido
- Demora >500ms para aparecer no KDS
- Perceptível para o usuário

**Causas comuns:**
1. **Realtime com delay**
   - Realtime service sobrecarregado
   - Network lag

2. **Frontend não otimizado**
   - Re-render desnecessário
   - Debounce/throttle muito agressivo

3. **Banco lento**
   - Queries demoradas
   - Índices faltando

**Solução:**
```bash
# Verificar latência do Realtime
docker compose -f docker-compose.core.yml logs realtime | grep latency

# Verificar network
# Testar em rede local (sem internet)
# Se melhorar → problema de rede
# Se não melhorar → problema de código
```

---

### 6. Flicker ou re-render desnecessário

**Sintomas:**
- Pedido aparece, desaparece, aparece novamente
- Lista "pula" ou "treme"
- Performance ruim

**Causas comuns:**
1. **Estado sendo atualizado múltiplas vezes**
   - Cada evento atualiza estado
   - Não está usando `useMemo` ou `useCallback`

2. **Chave incorreta no React**
   - Lista não tem `key` única
   - React não consegue identificar itens

3. **Subscription sendo recriada**
   - Dependências do `useEffect` mudando
   - Subscription sendo recriada a cada render

**Solução:**
```typescript
// Usar useMemo para evitar re-render
const sortedOrders = useMemo(() => 
  orders.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  ),
  [orders]
);

// Usar key única
{orders.map(order => (
  <OrderCard key={order.id} order={order} />
))}
```

---

## 🟢 Problemas Menores (Observação)

### 7. WebSocket desconecta frequentemente

**Sintomas:**
- Conexão cai e reconecta
- Pedidos não aparecem durante desconexão

**Causa:**
- Network instável
- Realtime com timeout muito curto

**Solução:**
- Implementar retry automático
- Mostrar indicador de conexão no UI

---

### 8. Eventos perdidos durante reconexão

**Sintomas:**
- WebSocket desconecta
- Pedidos criados durante desconexão não aparecem após reconexão

**Causa:**
- Realtime não está fazendo catch-up
- Frontend não está fazendo poll após reconexão

**Solução:**
```typescript
// Após reconexão, fazer poll para pegar eventos perdidos
channel.on('system', {}, (payload) => {
  if (payload.status === 'SUBSCRIBED') {
    // Reconectou → fazer poll
    fetchRecentOrders();
  }
});
```

---

## 📋 Checklist de Diagnóstico

Quando algo quebrar, verificar nesta ordem:

1. ✅ **Realtime está rodando?**
   ```bash
   docker compose -f docker-compose.core.yml ps realtime
   ```

2. ✅ **Subscription está ativa?**
   - Console do navegador → deve mostrar `SUBSCRIBED`

3. ✅ **WebSocket conectado?**
   - Network tab → WebSocket → status `OPEN`

4. ✅ **RLS permitindo acesso?**
   - Verificar policies na tabela `gm_orders`

5. ✅ **Eventos sendo emitidos?**
   - Verificar logs do Realtime
   - Verificar triggers no banco

6. ✅ **Frontend processando eventos?**
   - Console → verificar handlers sendo chamados
   - React DevTools → verificar estado sendo atualizado

---

## 🎯 Próximos Passos Após Diagnosticar

1. **Se problema é Realtime:**
   - Verificar logs
   - Verificar configuração
   - Verificar versão do container

2. **Se problema é Frontend:**
   - Verificar subscription
   - Verificar handlers
   - Verificar estado

3. **Se problema é Banco:**
   - Verificar triggers
   - Verificar RLS
   - Verificar índices

---

_Guia prático baseado em problemas reais de sistemas Realtime em produção._
