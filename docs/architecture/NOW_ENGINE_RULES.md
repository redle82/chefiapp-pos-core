# 📐 NOW ENGINE - Regras de Decisão Detalhadas

**Regras completas de priorização e seleção de ação única**

---

## 🎯 Princípio Fundamental

**SEMPRE retornar 1 ação ou null (silêncio).**

Nunca retornar 2+ ações.

---

## 🔴 Nível 1: CRÍTICO (Prioridade 800-1000)

### Regra 1.1: Cliente Reclamando

**Condição:**
- Mesa com `status = 'needs_attention'`
- `lastEventTime` < 2 minutos atrás
- `orderStatus` != 'paid'

**Ação:**
```typescript
{
  type: 'critical',
  title: `Mesa ${tableId}`,
  message: 'Cliente precisa de atenção',
  action: 'resolve',
  tableId: tableId,
  priority: 1000
}
```

**UI:**
- Cor: Vermelho (#ff4444)
- Ícone: ⚠️
- Botão: "RESOLVER"

---

### Regra 1.2: Mesa Quer Pagar Há > 5 Minutos

**Condição:**
- Mesa com `orderStatus = 'wants_pay'`
- `elapsedMinutes` > 5
- `status` = 'occupied'

**Ação:**
```typescript
{
  type: 'critical',
  title: `Mesa ${tableId}`,
  message: 'Quer pagar há 5+ min',
  action: 'collect_payment',
  tableId: tableId,
  priority: 900
}
```

**UI:**
- Cor: Vermelho (#ff4444)
- Ícone: 💰
- Botão: "COBRAR"

---

### Regra 1.3: Item Pronto Há > 3 Minutos

**Condição:**
- Item em `kitchen.readyItems`
- `readyTime` < 3 minutos atrás
- Item não foi entregue

**Ação:**
```typescript
{
  type: 'critical',
  title: `Mesa ${tableId}`,
  message: 'Item pronto há 3+ min',
  action: 'deliver',
  tableId: tableId,
  orderId: orderId,
  priority: 850
}
```

**UI:**
- Cor: Vermelho (#ff4444)
- Ícone: 🍽️
- Botão: "ENTREGAR"

---

### Regra 1.4: Erro de Sistema Crítico

**Condição:**
- Erro de sistema que impede operação
- Ex: caixa fechado quando precisa abrir
- Ex: KDS offline quando cozinha precisa

**Ação:**
```typescript
{
  type: 'critical',
  title: 'Sistema',
  message: 'Erro crítico detectado',
  action: 'resolve_error',
  priority: 950
}
```

**UI:**
- Cor: Vermelho (#ff4444)
- Ícone: ⚠️
- Botão: "RESOLVER"

---

## 🟠 Nível 2: URGENTE (Prioridade 500-799)

### Regra 2.1: Mesa Quer Pagar Há 2-5 Minutos

**Condição:**
- Mesa com `orderStatus = 'wants_pay'`
- `elapsedMinutes` >= 2 && <= 5
- `status` = 'occupied'

**Ação:**
```typescript
{
  type: 'urgent',
  title: `Mesa ${tableId}`,
  message: 'Quer pagar',
  action: 'collect_payment',
  tableId: tableId,
  priority: 700
}
```

**UI:**
- Cor: Laranja (#ff8800)
- Ícone: 💰
- Botão: "COBRAR"

---

### Regra 2.2: Item Pronto Há 1-3 Minutos

**Condição:**
- Item em `kitchen.readyItems`
- `readyTime` >= 1 minuto && <= 3 minutos atrás
- Item não foi entregue

**Ação:**
```typescript
{
  type: 'urgent',
  title: `Mesa ${tableId}`,
  message: 'Item pronto',
  action: 'deliver',
  tableId: tableId,
  orderId: orderId,
  priority: 600
}
```

**UI:**
- Cor: Laranja (#ff8800)
- Ícone: 🍽️
- Botão: "ENTREGAR"

---

### Regra 2.3: Mesa Ocupada Há > 30 Minutos Sem Ação

**Condição:**
- Mesa com `status = 'occupied'`
- `elapsedMinutes` > 30
- `orderStatus` != 'wants_pay'
- Última ação há > 30 minutos

**Ação:**
```typescript
{
  type: 'urgent',
  title: `Mesa ${tableId}`,
  message: 'Sem ação há 30+ min',
  action: 'check',
  tableId: tableId,
  priority: 500
}
```

**UI:**
- Cor: Laranja (#ff8800)
- Ícone: 👀
- Botão: "VERIFICAR"

---

### Regra 2.4: KDS Saturado (Pressão Alta)

**Condição:**
- `kitchen.pressure = 'high'`
- `kitchen.preparingCount` > 10
- Role do staff = 'waiter' ou 'bartender'

**Ação:**
```typescript
{
  type: 'urgent',
  title: 'Cozinha',
  message: 'Pressão alta - priorizar bebidas',
  action: 'prioritize_drinks',
  priority: 550
}
```

**UI:**
- Cor: Laranja (#ff8800)
- Ícone: 🔥
- Botão: "PRIORIZAR"

---

## 🟡 Nível 3: ATENÇÃO (Prioridade 200-499)

### Regra 3.1: Mesa Ocupada Há 15-30 Minutos

**Condição:**
- Mesa com `status = 'occupied'`
- `elapsedMinutes` >= 15 && <= 30
- `orderStatus` != 'wants_pay'

**Ação:**
```typescript
{
  type: 'attention',
  title: `Mesa ${tableId}`,
  message: 'Verificar',
  action: 'check',
  tableId: tableId,
  priority: 400
}
```

**UI:**
- Cor: Amarelo (#ffcc00)
- Ícone: 👀
- Botão: "VERIFICAR"

---

### Regra 3.2: Pedido Novo (< 2 Minutos)

**Condição:**
- Mesa com `orderStatus = 'pending'`
- `elapsedMinutes` < 2
- `status` = 'occupied'

**Ação:**
```typescript
{
  type: 'attention',
  title: `Mesa ${tableId}`,
  message: 'Novo pedido',
  action: 'acknowledge',
  tableId: tableId,
  priority: 300
}
```

**UI:**
- Cor: Amarelo (#ffcc00)
- Ícone: 📋
- Botão: "CONFIRMAR"

---

### Regra 3.3: Item em Preparação Há > 10 Minutos

**Condição:**
- Item em `kitchen.preparingItems`
- `preparingTime` > 10 minutos
- Item não está pronto

**Ação:**
```typescript
{
  type: 'attention',
  title: `Mesa ${tableId}`,
  message: 'Pedido demorando',
  action: 'check_kitchen',
  tableId: tableId,
  orderId: orderId,
  priority: 350
}
```

**UI:**
- Cor: Amarelo (#ffcc00)
- Ícone: ⏱️
- Botão: "VERIFICAR"

---

### Regra 3.4: Tarefa de Rotina (Se Ocioso)

**Condição:**
- `staff.idleTime` > 5 minutos
- `pressure.overall` = 'low'
- Há tarefas de rotina disponíveis

**Ação:**
```typescript
{
  type: 'attention',
  title: 'Rotina',
  message: 'Limpar mesa livre',
  action: 'routine_clean',
  priority: 200
}
```

**UI:**
- Cor: Amarelo (#ffcc00)
- Ícone: 🧹
- Botão: "FAZER"

**Nota:** Tarefas de rotina só aparecem se funcionário está ocioso.

---

## 🔇 Nível 4: SILÊNCIO (Prioridade 0)

### Regra 4.1: Nada Urgente

**Condição:**
- Não há ações críticas
- Não há ações urgentes
- Não há ações de atenção (ou funcionário não está ocioso)

**Ação:**
```typescript
{
  type: 'silent',
  title: 'Tudo em ordem',
  message: null,
  action: null,
  priority: 0
}
```

**UI:**
- Cor: Cinza (#888888)
- Ícone: ✅
- Sem botão
- Tela neutra

---

## 🎯 Regras de Seleção

### Hierarquia Absoluta

```typescript
function selectAction(context: OperationalContext): NowAction | null {
  // 1. SEMPRE verificar crítico primeiro
  const critical = findCritical(context);
  if (critical) return critical; // Para aqui
  
  // 2. Só verificar urgente se não há crítico
  const urgent = findUrgent(context);
  if (urgent) return urgent; // Para aqui
  
  // 3. Só verificar atenção se não há urgente/crítico
  const attention = findAttention(context);
  if (attention) return attention; // Para aqui
  
  // 4. Silêncio se não há nada
  return getSilentState(context);
}
```

### Desempate por Prioridade Numérica

```typescript
// Se múltiplas ações do mesmo nível, escolher maior prioridade
function findCritical(context: OperationalContext): NowAction | null {
  const criticals = [
    findCriticalComplaint(context),      // 1000
    findCriticalWantsPay(context),        // 900
    findCriticalReadyItem(context),       // 850
    findCriticalSystemError(context)      // 950
  ].filter(Boolean);
  
  if (criticals.length === 0) return null;
  
  // Retornar maior prioridade
  return criticals.reduce((max, curr) => 
    curr.priority > max.priority ? curr : max
  );
}
```

### Desempate por Tempo

```typescript
// Se mesma prioridade, escolher mais antigo
function findCriticalWantsPay(context: OperationalContext): NowAction | null {
  const wantsPay = context.tables
    .filter(t => t.orderStatus === 'wants_pay' && t.elapsedMinutes > 5)
    .sort((a, b) => a.elapsedMinutes - b.elapsedMinutes); // Mais antigo primeiro
  
  if (wantsPay.length === 0) return null;
  
  const oldest = wantsPay[0];
  return {
    type: 'critical',
    title: `Mesa ${oldest.id}`,
    message: 'Quer pagar há 5+ min',
    action: 'collect_payment',
    tableId: oldest.id,
    priority: 900
  };
}
```

---

## 🔄 Adaptação por Pressão

### Regra de Filtro por Pressão

```typescript
// Em alta pressão: só mostrar crítico e urgente
if (context.pressure.overall === 'high') {
  return findCritical(context) || findUrgent(context) || null;
}

// Em pressão média: mostrar até atenção
if (context.pressure.overall === 'medium') {
  return findCritical(context) || findUrgent(context) || findAttention(context) || null;
}

// Em baixa pressão: mostrar tudo
return findCritical(context) || findUrgent(context) || findAttention(context) || null;
```

### Cálculo de Pressão

```typescript
function calculatePressure(context: OperationalContext): 'low' | 'medium' | 'high' {
  let score = 0;
  
  // Mesas ocupadas
  const occupied = context.tables.filter(t => t.status === 'occupied').length;
  if (occupied > 10) score += 3;
  else if (occupied > 5) score += 2;
  else if (occupied > 0) score += 1;
  
  // KDS saturado
  if (context.kitchen.pressure === 'high') score += 3;
  else if (context.kitchen.pressure === 'medium') score += 2;
  
  // Pagamentos pendentes
  const pending = context.sales.pendingPayments.length;
  if (pending > 3) score += 2;
  else if (pending > 0) score += 1;
  
  // Staff ocupado
  if (context.staff.currentAction) score += 1;
  
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}
```

---

## 🎯 Regras por Role

### Waiter (Garçom)

**Ações disponíveis:**
- ✅ Todas as ações de mesa
- ✅ Coletar pagamento
- ✅ Entregar itens
- ✅ Verificar mesas
- ❌ Não vê ações de cozinha (exceto itens prontos)
- ❌ Não vê ações de bar (exceto bebidas prontas)

**Filtro:**
```typescript
if (context.staff.role === 'waiter') {
  // Filtrar apenas ações de mesa
  return actions.filter(a => 
    a.tableId || 
    a.action === 'collect_payment' || 
    a.action === 'deliver'
  );
}
```

### Cook (Cozinheiro)

**Ações disponíveis:**
- ✅ Itens prontos para entregar
- ✅ Pressão de cozinha
- ✅ Itens demorando
- ❌ Não vê ações de mesa (exceto itens prontos)
- ❌ Não vê pagamentos

**Filtro:**
```typescript
if (context.staff.role === 'cook') {
  // Filtrar apenas ações de cozinha
  return actions.filter(a => 
    a.action === 'deliver' || 
    a.action === 'check_kitchen' ||
    a.action === 'prioritize_drinks'
  );
}
```

### Bartender (Barman)

**Ações disponíveis:**
- ✅ Bebidas prontas
- ✅ Pressão de bar
- ✅ Reabastecer estoque
- ❌ Não vê ações de mesa (exceto bebidas prontas)
- ❌ Não vê pagamentos

**Filtro:**
```typescript
if (context.staff.role === 'bartender') {
  // Filtrar apenas ações de bar
  return actions.filter(a => 
    a.action === 'deliver' && a.itemCategory === 'drink' ||
    a.action === 'restock' ||
    a.action === 'prioritize_drinks'
  );
}
```

---

## ⏱️ Regras Temporais

### Janelas de Tempo

```typescript
// Crítico: > 5min
const CRITICAL_THRESHOLD = 5 * 60 * 1000; // 5 minutos

// Urgente: 2-5min
const URGENT_MIN = 2 * 60 * 1000; // 2 minutos
const URGENT_MAX = 5 * 60 * 1000; // 5 minutos

// Atenção: < 2min ou 15-30min
const ATTENTION_NEW = 2 * 60 * 1000; // 2 minutos
const ATTENTION_STALE_MIN = 15 * 60 * 1000; // 15 minutos
const ATTENTION_STALE_MAX = 30 * 60 * 1000; // 30 minutos
```

### Atualização Contínua

```typescript
// Recalcular a cada 30 segundos
setInterval(() => {
  const context = gatherContext();
  const action = calculateNowAction(context);
  emitAction(action);
}, 30000);

// Recalcular imediatamente em eventos
onEvent('order:created', () => {
  const context = gatherContext();
  const action = calculateNowAction(context);
  emitAction(action);
});
```

---

## 🔒 Garantias

### 1. Sempre 1 Ação ou Null

```typescript
// Garantia: função sempre retorna 1 ou null
function calculateNowAction(context: OperationalContext): NowAction | null {
  // Nunca retorna array
  // Nunca retorna múltiplas ações
  // Sempre retorna 1 ou null
}
```

### 2. Prioridade Absoluta

```typescript
// Crítico sempre vence
if (critical) return critical; // Para aqui, não verifica mais nada
if (urgent) return urgent; // Só se não há crítico
if (attention) return attention; // Só se não há urgente/crítico
return null; // Silêncio
```

### 3. Sempre Atualizado

```typescript
// Ação sempre reflete estado atual
function calculateNowAction(context: OperationalContext): NowAction | null {
  // Contexto sempre atualizado
  // Ação sempre reflete estado real
  // Nunca mostra ação obsoleta
}
```

---

**Versão:** 1.0.0  
**Data:** 2026-01-24  
**Status:** ✅ Regras Definidas
