# ⚙️ NOW ENGINE - Motor de Decisão Única

**Sistema que decide "o que fazer AGORA" - uma coisa por vez**

---

## 🎯 Premissa Inegociável

**O AppStaff mostra APENAS UMA COISA POR VEZ.**

Se mostrar 2, falhou.

---

## 🧠 Arquitetura do NOW ENGINE

### 1. Conceito Central

```
NOW ENGINE = Motor que:
1. Observa contexto (tempo, mesa, KDS, vendas, pressão)
2. Calcula prioridade única
3. Emite 1 ação
4. Bloqueia qualquer outra coisa
```

### 2. Fluxo de Decisão

```
[Eventos Operacionais]
    ↓
[NOW ENGINE]
    ↓
[Contexto Atual]
    ↓
[Regras de Priorização]
    ↓
[1 Ação Única]
    ↓
[AppStaff UI]
```

---

## 📊 Contexto Observado

### Fontes de Dados

```typescript
interface OperationalContext {
  // Tempo
  currentTime: number;
  shiftDuration: number;
  
  // Mesas
  tables: {
    id: string;
    status: 'free' | 'occupied' | 'needs_attention';
    lastEventTime: number;
    orderStatus: 'pending' | 'preparing' | 'ready' | 'delivered' | 'wants_pay';
    elapsedMinutes: number;
  }[];
  
  // KDS
  kitchen: {
    pressure: 'low' | 'medium' | 'high';
    preparingCount: number;
    readyItems: { orderId: string; tableId: string; item: string }[];
  };
  
  // Vendas
  sales: {
    pendingPayments: { orderId: string; tableId: string; amount: number; elapsed: number }[];
    activeOrders: number;
  };
  
  // Staff
  staff: {
    role: StaffRole;
    currentAction: string | null;
    idleTime: number; // segundos desde última ação
  };
  
  // Pressão Operacional
  pressure: {
    overall: 'low' | 'medium' | 'high';
    factors: string[]; // ['many_tables', 'kitchen_saturated', 'pending_payments']
  };
}
```

---

## 🎯 Regras de Priorização

### Hierarquia Absoluta (Nunca Quebrar)

```
1. CRÍTICO (Vermelho, Bloqueia Tudo)
   - Cliente reclamando (últimos 2min)
   - Mesa quer pagar há > 5min
   - Item pronto há > 3min sem entregar
   - Erro de sistema crítico

2. URGENTE (Laranja, Alta Prioridade)
   - Mesa quer pagar há 2-5min
   - Item pronto há 1-3min
   - Mesa ocupada há > 30min sem ação
   - KDS saturado (pressão alta)

3. ATENÇÃO (Amarelo, Prioridade Normal)
   - Mesa ocupada há 15-30min
   - Pedido novo (< 2min)
   - Item em preparação há > 10min
   - Tarefa de rotina (se ocioso)

4. SILÊNCIO (Nada)
   - Nada urgente
   - Sistema fica neutro
   - App mostra estado "tudo ok"
```

### Regras de Decisão

```typescript
function calculateNowAction(context: OperationalContext): NowAction | null {
  // 1. CRÍTICO - Sempre primeiro
  const critical = findCritical(context);
  if (critical) return critical;
  
  // 2. URGENTE - Se não há crítico
  const urgent = findUrgent(context);
  if (urgent) return urgent;
  
  // 3. ATENÇÃO - Se não há urgente
  const attention = findAttention(context);
  if (attention) return attention;
  
  // 4. SILÊNCIO - Nada para fazer
  return null;
}
```

---

## 🔴 Ação Crítica

### Detecção

```typescript
function findCritical(context: OperationalContext): NowAction | null {
  // Cliente reclamando (últimos 2min)
  const complaint = context.tables.find(t => 
    t.status === 'needs_attention' && 
    t.lastEventTime > Date.now() - 2 * 60 * 1000
  );
  if (complaint) {
    return {
      type: 'critical',
      title: `Mesa ${complaint.id}`,
      message: 'Cliente precisa de atenção',
      action: 'resolve',
      tableId: complaint.id,
      priority: 1000
    };
  }
  
  // Mesa quer pagar há > 5min
  const wantsPay = context.tables.find(t => 
    t.orderStatus === 'wants_pay' && 
    t.elapsedMinutes > 5
  );
  if (wantsPay) {
    return {
      type: 'critical',
      title: `Mesa ${wantsPay.id}`,
      message: 'Quer pagar há 5+ min',
      action: 'collect_payment',
      tableId: wantsPay.id,
      priority: 900
    };
  }
  
  // Item pronto há > 3min sem entregar
  const readyItem = context.kitchen.readyItems.find(item => {
    const elapsed = (Date.now() - item.readyTime) / 60000;
    return elapsed > 3;
  });
  if (readyItem) {
    return {
      type: 'critical',
      title: `Mesa ${readyItem.tableId}`,
      message: 'Item pronto há 3+ min',
      action: 'deliver',
      tableId: readyItem.tableId,
      orderId: readyItem.orderId,
      priority: 800
    };
  }
  
  return null;
}
```

---

## 🟠 Ação Urgente

### Detecção

```typescript
function findUrgent(context: OperationalContext): NowAction | null {
  // Mesa quer pagar há 2-5min
  const wantsPay = context.tables.find(t => 
    t.orderStatus === 'wants_pay' && 
    t.elapsedMinutes >= 2 && 
    t.elapsedMinutes <= 5
  );
  if (wantsPay) {
    return {
      type: 'urgent',
      title: `Mesa ${wantsPay.id}`,
      message: 'Quer pagar',
      action: 'collect_payment',
      tableId: wantsPay.id,
      priority: 700
    };
  }
  
  // Item pronto há 1-3min
  const readyItem = context.kitchen.readyItems.find(item => {
    const elapsed = (Date.now() - item.readyTime) / 60000;
    return elapsed >= 1 && elapsed <= 3;
  });
  if (readyItem) {
    return {
      type: 'urgent',
      title: `Mesa ${readyItem.tableId}`,
      message: 'Item pronto',
      action: 'deliver',
      tableId: readyItem.tableId,
      orderId: readyItem.orderId,
      priority: 600
    };
  }
  
  // Mesa ocupada há > 30min sem ação
  const staleTable = context.tables.find(t => 
    t.status === 'occupied' && 
    t.elapsedMinutes > 30 &&
    t.orderStatus !== 'wants_pay'
  );
  if (staleTable) {
    return {
      type: 'urgent',
      title: `Mesa ${staleTable.id}`,
      message: 'Sem ação há 30+ min',
      action: 'check',
      tableId: staleTable.id,
      priority: 500
    };
  }
  
  return null;
}
```

---

## 🟡 Ação de Atenção

### Detecção

```typescript
function findAttention(context: OperationalContext): NowAction | null {
  // Mesa ocupada há 15-30min
  const attentionTable = context.tables.find(t => 
    t.status === 'occupied' && 
    t.elapsedMinutes >= 15 && 
    t.elapsedMinutes <= 30
  );
  if (attentionTable) {
    return {
      type: 'attention',
      title: `Mesa ${attentionTable.id}`,
      message: 'Verificar',
      action: 'check',
      tableId: attentionTable.id,
      priority: 400
    };
  }
  
  // Pedido novo (< 2min)
  const newOrder = context.tables.find(t => 
    t.orderStatus === 'pending' && 
    t.elapsedMinutes < 2
  );
  if (newOrder) {
    return {
      type: 'attention',
      title: `Mesa ${newOrder.id}`,
      message: 'Novo pedido',
      action: 'acknowledge',
      tableId: newOrder.id,
      priority: 300
    };
  }
  
  // Tarefa de rotina (se ocioso há > 5min)
  if (context.staff.idleTime > 5 * 60) {
    const routineTask = findRoutineTask(context);
    if (routineTask) {
      return {
        type: 'attention',
        title: routineTask.title,
        message: routineTask.message,
        action: routineTask.action,
        priority: 200
      };
    }
  }
  
  return null;
}
```

---

## 🔇 Estado Silencioso

### Quando Não Há Ação

```typescript
function getSilentState(context: OperationalContext): NowAction {
  return {
    type: 'silent',
    title: 'Tudo em ordem',
    message: null,
    action: null,
    priority: 0
  };
}
```

**UI:**
- Tela neutra
- Sem botões
- Apenas status "tudo ok"
- App fica quieto

---

## 🎨 Interface de Ação

### Estrutura de Dados

```typescript
interface NowAction {
  type: 'critical' | 'urgent' | 'attention' | 'silent';
  title: string; // Máximo 2 palavras
  message: string | null; // Máximo 1 frase curta
  action: string | null; // 'collect_payment' | 'deliver' | 'check' | 'acknowledge'
  tableId?: string;
  orderId?: string;
  priority: number; // 0-1000
  timestamp: number;
}
```

### UI Mínima

```
┌─────────────────────────┐
│  [ 🔴 ]                 │  ← Cor por tipo
│                         │
│  Mesa 7                 │  ← Título (2 palavras)
│                         │
│  Quer pagar há 5+ min   │  ← Mensagem (1 frase)
│                         │
│  ┌───────────────────┐  │
│  │  COBRAR           │  │  ← Botão único
│  └───────────────────┘  │
└─────────────────────────┘
```

**Regras de UI:**
- Máximo 2 palavras no título
- Máximo 1 frase na mensagem
- 1 botão único
- Cor por tipo (vermelho/laranja/amarelo/cinza)
- Sem scroll
- Sem lista
- Sem configuração

---

## ⚡ Eventos que Disparam NOW ENGINE

### Eventos em Tempo Real

```typescript
// Eventos que disparam recálculo
const TRIGGER_EVENTS = [
  'order:created',
  'order:status_changed',
  'order:item_ready',
  'order:wants_pay',
  'table:status_changed',
  'table:needs_attention',
  'kitchen:pressure_changed',
  'kitchen:item_ready',
  'payment:pending',
  'staff:action_completed',
  'time:elapsed' // A cada 30 segundos
];
```

### Sincronização

```typescript
// NOW ENGINE escuta eventos
supabase
  .channel('now_engine')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'gm_orders' 
  }, () => {
    recalculateNowAction();
  })
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'gm_tables' 
  }, () => {
    recalculateNowAction();
  })
  .subscribe();
```

---

## 🔄 Ciclo de Vida

### 1. Observação Contínua

```typescript
// NOW ENGINE observa contexto a cada 30s
setInterval(() => {
  const context = gatherContext();
  const action = calculateNowAction(context);
  emitAction(action);
}, 30000);
```

### 2. Reação a Eventos

```typescript
// NOW ENGINE reage imediatamente a eventos
onEvent('order:created', () => {
  const context = gatherContext();
  const action = calculateNowAction(context);
  emitAction(action);
});
```

### 3. Resolução de Ação

```typescript
// Quando funcionário completa ação
onActionCompleted(actionId, () => {
  // Marca como resolvido
  markActionResolved(actionId);
  
  // Recalcula próxima ação
  const context = gatherContext();
  const nextAction = calculateNowAction(context);
  emitAction(nextAction);
});
```

---

## 🧠 Regras de Contexto

### Pressão Operacional

```typescript
function calculatePressure(context: OperationalContext): 'low' | 'medium' | 'high' {
  let score = 0;
  
  // Mesas ocupadas
  const occupiedTables = context.tables.filter(t => t.status === 'occupied').length;
  if (occupiedTables > 10) score += 3;
  else if (occupiedTables > 5) score += 2;
  else if (occupiedTables > 0) score += 1;
  
  // KDS saturado
  if (context.kitchen.pressure === 'high') score += 3;
  else if (context.kitchen.pressure === 'medium') score += 2;
  
  // Pagamentos pendentes
  if (context.sales.pendingPayments.length > 3) score += 2;
  else if (context.sales.pendingPayments.length > 0) score += 1;
  
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}
```

### Adaptação por Pressão

```typescript
// Em alta pressão: só mostra crítico e urgente
if (context.pressure.overall === 'high') {
  return findCritical(context) || findUrgent(context) || null;
}

// Em pressão média: mostra até atenção
if (context.pressure.overall === 'medium') {
  return findCritical(context) || findUrgent(context) || findAttention(context) || null;
}

// Em baixa pressão: mostra tudo
return findCritical(context) || findUrgent(context) || findAttention(context) || null;
```

---

## 🎯 Integração com AppStaff

### AppStaff vira Terminal do NOW ENGINE

```typescript
// AppStaff apenas exibe ação do NOW ENGINE
function AppStaffScreen() {
  const { nowAction } = useNowEngine();
  
  if (!nowAction || nowAction.type === 'silent') {
    return <SilentState />;
  }
  
  return (
    <NowActionCard 
      action={nowAction}
      onComplete={() => markActionCompleted(nowAction.id)}
    />
  );
}
```

### Sem Lógica no AppStaff

- AppStaff não decide nada
- AppStaff não filtra nada
- AppStaff apenas exibe
- NOW ENGINE decide tudo

---

## 🔒 Garantias

### 1. Sempre 1 Ação ou Silêncio

```typescript
// Garantia: nunca retorna 2 ações
function calculateNowAction(context: OperationalContext): NowAction | null {
  // Sempre retorna 1 ou null
  // Nunca retorna array
  // Nunca retorna múltiplas ações
}
```

### 2. Prioridade Absoluta

```typescript
// Crítico sempre vence
if (critical) return critical; // Para aqui
if (urgent) return urgent; // Só se não há crítico
if (attention) return attention; // Só se não há urgente/crítico
return null; // Silêncio
```

### 3. Offline-First

```typescript
// NOW ENGINE funciona offline
function gatherContext(): OperationalContext {
  // 1. Tenta online
  try {
    return gatherContextOnline();
  } catch {
    // 2. Fallback offline
    return gatherContextOffline();
  }
}
```

---

## 📊 Exemplos de Ações

### Exemplo 1: Crítico

```
┌─────────────────────────┐
│  [ 🔴 ]                 │
│                         │
│  Mesa 7                 │
│                         │
│  Quer pagar há 5+ min   │
│                         │
│  ┌───────────────────┐  │
│  │  COBRAR           │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### Exemplo 2: Urgente

```
┌─────────────────────────┐
│  [ 🟠 ]                 │
│                         │
│  Mesa 3                 │
│                         │
│  Item pronto            │
│                         │
│  ┌───────────────────┐  │
│  │  ENTREGAR         │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### Exemplo 3: Atenção

```
┌─────────────────────────┐
│  [ 🟡 ]                 │
│                         │
│  Mesa 5                 │
│                         │
│  Verificar              │
│                         │
│  ┌───────────────────┐  │
│  │  VERIFICAR        │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### Exemplo 4: Silêncio

```
┌─────────────────────────┐
│                         │
│      ✅                 │
│                         │
│   Tudo em ordem         │
│                         │
│                         │
└─────────────────────────┘
```

---

## 🚀 Implementação

### Estrutura de Arquivos

```
mobile-app/
├── services/
│   └── NowEngine.ts          # Motor de decisão
├── hooks/
│   └── useNowEngine.ts       # Hook para AppStaff
└── components/
    └── NowActionCard.tsx     # UI única
```

### NOW ENGINE Service

```typescript
// services/NowEngine.ts
class NowEngine {
  private context: OperationalContext | null = null;
  private currentAction: NowAction | null = null;
  private listeners: ((action: NowAction | null) => void)[] = [];
  
  async start() {
    // Observa contexto continuamente
    setInterval(() => this.recalculate(), 30000);
    
    // Escuta eventos
    this.subscribeToEvents();
  }
  
  async recalculate() {
    const context = await this.gatherContext();
    const action = this.calculateNowAction(context);
    
    if (action?.id !== this.currentAction?.id) {
      this.currentAction = action;
      this.emit(action);
    }
  }
  
  private calculateNowAction(context: OperationalContext): NowAction | null {
    // Regras de priorização
    return findCritical(context) || 
           findUrgent(context) || 
           findAttention(context) || 
           null;
  }
  
  subscribe(listener: (action: NowAction | null) => void) {
    this.listeners.push(listener);
  }
  
  private emit(action: NowAction | null) {
    this.listeners.forEach(l => l(action));
  }
}

export const nowEngine = new NowEngine();
```

---

## ✅ Critérios de Sucesso

### Funcionário Novo Entende em 3 Segundos

- ✅ Tela mostra 1 coisa
- ✅ Título claro (2 palavras)
- ✅ Botão único
- ✅ Sem leitura longa

### Funcionário Velho Não Rejeita

- ✅ Não pede configuração
- ✅ Não pede aprendizado
- ✅ Apenas mostra ação
- ✅ Funciona offline

### Gerente Grita Menos

- ✅ Sistema guia funcionário
- ✅ Prioridades são claras
- ✅ Ações críticas aparecem primeiro
- ✅ Não há ruído

### Restaurante Sente Falta se Remover

- ✅ Sistema é essencial
- ✅ Substitui WhatsApp
- ✅ Substitui gritos
- ✅ Melhora operação

---

**Versão:** 1.0.0  
**Data:** 2026-01-24  
**Status:** ✅ Arquitetura Definida
