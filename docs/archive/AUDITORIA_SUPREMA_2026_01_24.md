# 🔍 AUDITORIA SUPREMA DO SISTEMA
## ChefIApp POS Core - Análise Arquitetural Completa

**Data:** 2026-01-24  
**Auditor:** Sistema de Auditoria Automatizada  
**Escopo:** Arquitetura completa, fluxos E2E, bugs críticos, loops, riscos operacionais

---

## 📐 1. MAPA DO SISTEMA

### 1.1 Hierarquia de Identidade (Camadas Fundamentais)

```
┌─────────────────────────────────────────────────────────────┐
│                    IDENTIDADE & TENANCY                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. IDENTITY (Supabase Auth)                                │
│     └─ User (profiles.id)                                   │
│        └─ Email, OAuth tokens                                │
│                                                              │
│  2. TENANT RESOLUTION (TenantResolver.ts)                    │
│     └─ gm_restaurant_members (VIEW)                         │
│        └─ user_id → restaurant_id → role                    │
│                                                              │
│  3. RESTAURANT CONTEXT (TenantContext.tsx)                  │
│     └─ restaurant.id (fonte de verdade)                     │
│        └─ Permissions (baseado em role)                      │
│                                                              │
│  4. FLOW GATE (FlowGate.tsx)                                │
│     └─ Autoridade única de navegação                        │
│        └─ Decisão: /login | /onboarding | /dashboard        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Dependências:**
- Identity → Tenant → Restaurant → FlowGate
- **CRÍTICO:** Se qualquer camada falhar, sistema não inicia

---

### 1.2 Lifecycle do Pedido (Order Contract)

```
┌─────────────────────────────────────────────────────────────┐
│                    ORDER LIFECYCLE                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ESTADOS (State Machine):                                   │
│                                                              │
│  OPEN → LOCKED → PAID → CLOSED                              │
│    ↓                                                         │
│  CANCELED (terminal)                                         │
│                                                              │
│  TRANSIÇÕES:                                                │
│  - OPEN → LOCKED: Finalizar (calculateTotal, lockItems)    │
│  - LOCKED → PAID: Pagamento confirmado                      │
│  - PAID → CLOSED: Operação terminada                        │
│  - OPEN → CANCELED: Cancelar antes de finalizar             │
│                                                              │
│  ENTIDADES:                                                 │
│  - gm_orders (header)                                       │
│  - gm_order_items (snapshot imutável)                       │
│  - gm_payments (transações financeiras)                     │
│                                                              │
│  ROTEAMENTO:                                                │
│  - Station routing (cozinha) via station_id                │
│  - KDS recebe via realtime subscription                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Regras Críticas:**
1. Mesa não pode ter 2 pedidos OPEN simultâneos (constraint DB)
2. LOCKED = imutável (não pode adicionar itens)
3. PAID = fiscal emitido (se configurado)

---

### 1.3 Interfaces do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERFACES                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  A) TPV (Garçom)                                            │
│     └─ merchant-portal/src/pages/TPV/                      │
│        └─ OrderContextReal.tsx (realtime + polling)          │
│        └─ OrderEngine.createOrder()                          │
│        └─ PaymentEngine.processPayment()                     │
│                                                              │
│  B) App Staff (Mobile)                                      │
│     └─ merchant-portal/src/pages/AppStaff/                 │
│        └─ StaffContext.tsx                                    │
│        └─ Tasks (operacionais)                                │
│        └─ IntegrationBridge (eventos de pedidos)             │
│                                                              │
│  C) Web Order Page (Cliente)                                │
│     └─ server/web-module-api-server.ts                      │
│        └─ POST /api/web-orders                              │
│        └─ OrderProcessingService.acceptRequest()             │
│                                                              │
│  D) KDS (Cozinha)                                           │
│     └─ merchant-portal/src/pages/TPV/KDS/                  │
│        └─ OrderContextReal.tsx (mesma subscription)          │
│        └─ Filtro: status IN ('new', 'preparing')             │
│                                                              │
│  E) Owner Dashboard                                         │
│     └─ merchant-portal/src/pages/Dashboard/                 │
│        └─ DashboardZero.tsx                                  │
│        └─ Realtime via OrderContextReal                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.4 Realtime & Offline

```
┌─────────────────────────────────────────────────────────────┐
│              REALTIME & OFFLINE                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  REALTIME (Supabase):                                       │
│  - Channel: orders_realtime_{restaurantId}                  │
│  - Event: postgres_changes (gm_orders)                       │
│  - Debounce: 500ms (evita refetch storm)                    │
│  - Auto-reconnect: exponential backoff                       │
│                                                              │
│  POLLING DEFENSIVO:                                         │
│  - Interval: 30s                                            │
│  - Fallback se realtime falhar                              │
│                                                              │
│  OFFLINE QUEUE:                                             │
│  - useOfflineReconciler.ts                                  │
│  - localStorage (⚠️ pode perder dados)                      │
│  - Sync quando online                                       │
│                                                              │
│  RECONCILIAÇÃO:                                             │
│  - Idempotência via sync_metadata                            │
│  - Deduplicação por localId                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.5 TaskOps (Sistema de Tarefas Operacionais)

```
┌─────────────────────────────────────────────────────────────┐
│                    TASKOPS                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  EVENT BUS (Operational Event Bus):                         │
│  - server/operational-event-bus/event-bus.ts                │
│  - Tabela: operational_events                               │
│  - Tipos: 30+ tipos (stock_low, waiter_call, etc.)         │
│                                                              │
│  ROUTING RULES:                                            │
│  - operational_event_routing_rules                           │
│  - Target roles: ['waiter', 'kitchen', 'manager']           │
│  - Action: create_task, send_notification                   │
│                                                              │
│  TASK CREATION:                                            │
│  - createTaskFromEvent()                                    │
│  - appstaff_tasks (tabela)                                  │
│  - Link: operational_event_tasks                            │
│                                                              │
│  TRIGGERS POR EVENTO:                                      │
│  - order.created → delivery task                            │
│  - table.closed → limpeza task                              │
│  - kitchen.delay → alerta manager                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 2. SEQUÊNCIA DE EXECUÇÃO TUM-TUM (E2E)

### 2.1 Login até Dashboard

```
1. Usuário acessa /app
   └─ FlowGate intercepta
      └─ Verifica auth (Supabase)
         ├─ !auth → /login
         └─ auth → próximo passo

2. FlowGate verifica organização
   └─ Consulta gm_restaurant_members
      ├─ !membership → /onboarding/identity
      └─ membership → próximo passo

3. FlowGate verifica setup
   └─ Consulta gm_restaurants.onboarding_completed_at
      ├─ !completed → /onboarding/{status}
      └─ completed → /app/dashboard

4. Dashboard carrega
   └─ TenantContext.resolve()
      └─ useRestaurantIdentity()
         └─ Carrega restaurant.id
            └─ Renderiza DashboardZero
```

**Pontos de Falha:**
- ❌ `gm_restaurant_members` VIEW não existe ou retorna null
- ❌ `restaurant.id` null após resolução
- ❌ Loop se FlowGate redireciona para mesma rota

---

### 2.2 Criar Pedido (TPV)

```
1. Garçom abre TPV
   └─ OrderContextReal monta
      └─ setupRealtimeSubscription()
         └─ Channel: orders_realtime_{restaurantId}
            └─ Subscribe postgres_changes (gm_orders)

2. Garçom seleciona mesa
   └─ Verifica se mesa tem pedido ativo
      ├─ Tem → Abre pedido existente
      └─ Não tem → Cria novo

3. Garçom adiciona itens
   └─ OrderEngine.createOrder()
      └─ RPC: create_order_atomic()
         └─ Validações:
            ├─ Caixa aberto? (se source=TPV)
            ├─ Mesa livre? (constraint DB)
            └─ Tem itens? (min 1)

4. Pedido criado no DB
   └─ gm_orders.insert()
      └─ gm_order_items.insert() (snapshot)
         └─ Realtime event dispara
            └─ KDS recebe (filtro: status='new')
            └─ Dashboard atualiza
```

**Pontos de Falha:**
- ❌ Realtime não conecta → polling de 30s cobre
- ❌ Constraint violation (mesa duplicada) → erro tratado
- ❌ Caixa fechado → erro claro

---

### 2.3 Criar Pedido (Web Page)

```
1. Cliente acessa página web
   └─ GET /public/{slug}
      └─ Renderiza menu

2. Cliente faz pedido
   └─ POST /api/web-orders
      └─ OrderProcessingService.acceptRequest()
         └─ gm_order_requests.insert()
            └─ Status: PENDING

3. Restaurante aceita pedido
   └─ POST /api/web-orders/{id}/accept
      └─ OrderProcessingService.acceptRequest()
         └─ gm_orders.insert()
            └─ gm_order_items.insert()
               └─ Realtime event dispara
                  └─ KDS recebe
                  └─ App Staff recebe (via IntegrationBridge)
                     └─ Task criada (delivery)
```

**Pontos de Falha:**
- ❌ Web page não publicada → 404
- ❌ Payment não configurado → pedido não aceito
- ❌ Realtime não conecta → pedido fica invisível até polling

---

### 2.4 Visualizar na Cozinha (KDS)

```
1. KDS monta
   └─ OrderContextReal (mesma subscription)
      └─ Filtro: status IN ('new', 'preparing')
         └─ Renderiza pedidos

2. Cozinha marca "preparando"
   └─ PATCH /api/orders/{id}
      └─ Status: 'preparing'
         └─ Realtime event dispara
            └─ TPV atualiza
            └─ Dashboard atualiza

3. Cozinha marca "pronto"
   └─ PATCH /api/orders/{id}
      └─ Status: 'ready'
         └─ Realtime event dispara
            └─ TPV notifica garçom
            └─ TaskOps: task de entrega criada
```

**Pontos de Falha:**
- ❌ Realtime desconecta → KDS fica cego
- ❌ Polling de 30s não cobre → pedido perdido
- ❌ Status inválido → state machine rejeita

---

### 2.5 Acionar Tarefas (TaskOps)

```
1. Evento operacional dispara
   └─ emitEvent({ event_type, priority, context })
      └─ Deduplicação (dedupe_key)
         └─ operational_events.insert()

2. Event Bus roteia
   └─ routeEvent(eventId)
      └─ Busca regras (operational_event_routing_rules)
         └─ createTaskFromEvent()
            └─ appstaff_tasks.insert()
               └─ operational_event_tasks.insert()

3. App Staff recebe task
   └─ StaffContext.tsx
      └─ Realtime subscription (appstaff_tasks)
         └─ Renderiza task
            └─ Staff completa task
               └─ resolveEvent(eventId)
```

**Pontos de Falha:**
- ❌ Regra de roteamento não existe → evento ignorado
- ❌ Task não criada → evento fica "pending"
- ❌ Realtime não conecta → task invisível

---

## 🧪 3. CHECKLIST DE TESTE HUMANO

### 3.1 Teste Alpha (Desenvolvimento)

#### A) Login e Navegação
- [ ] Acessar `/app` sem auth → redireciona `/login`
- [ ] Login Google OAuth → redireciona `/app/dashboard`
- [ ] Usuário sem restaurant → redireciona `/onboarding/identity`
- [ ] Usuário com restaurant incompleto → redireciona `/onboarding/{status}`
- [ ] Usuário completo → acessa `/app/dashboard`

#### B) Criar Pedido (TPV)
- [ ] Abrir TPV → pedidos carregam
- [ ] Selecionar mesa → verifica se tem pedido ativo
- [ ] Adicionar itens → pedido criado
- [ ] Verificar KDS → pedido aparece
- [ ] Verificar Dashboard → pedido aparece

#### C) Criar Pedido (Web)
- [ ] Acessar `/public/{slug}` → menu renderiza
- [ ] Fazer pedido → pedido criado (PENDING)
- [ ] Aceitar pedido → pedido vira ORDER
- [ ] Verificar KDS → pedido aparece
- [ ] Verificar App Staff → task criada

#### D) Realtime
- [ ] Criar pedido em TPV → KDS atualiza em <1s
- [ ] Desligar Wi-Fi → sistema continua funcionando
- [ ] Ligar Wi-Fi → pedidos sincronizam
- [ ] Verificar console → sem loops de reconnect

---

### 3.2 Teste Beta (Pré-Produção)

#### A) Fluxo Completo
- [ ] Login → Dashboard → TPV → Criar pedido → KDS → Finalizar → Pagar → Fechar
- [ ] Web order → Aceitar → KDS → Finalizar → Pagar → Fechar
- [ ] App Staff → Ver tasks → Completar task → Evento resolvido

#### B) Cenários de Falha
- [ ] Mesa duplicada → erro claro
- [ ] Caixa fechado → erro claro
- [ ] Realtime desconecta → polling cobre
- [ ] Offline → pedidos salvos → sync quando online

#### C) Performance
- [ ] 20 pedidos simultâneos → sistema não trava
- [ ] Realtime com 50 pedidos → performance OK
- [ ] Dashboard com 100 pedidos → renderiza em <2s

---

## 🐛 4. BUGS E RISCOS POR SEVERIDADE

### 🔴 BLOCKER (Impede Operação)

#### BUG-001: `getTabIsolated is not defined`
**Localização:** `merchant-portal/src/core/activation/useActivationAdvisor.ts:74`  
**Causa:** Import faltando  
**Sintoma:** `ReferenceError: getTabIsolated is not defined`  
**Correção:**
```typescript
// Adicionar import no topo do arquivo
import { getTabIsolated } from '../storage/TabIsolatedStorage';
```

**Impacto:** Dashboard não carrega, sistema não inicia

---

#### BUG-002: Endpoint `/api/fiscal/pending-external-ids` 404 em Dev
**Localização:** `server/web-module-api-server.ts:3186`  
**Causa:** Endpoint existe mas pode não estar registrado corretamente  
**Sintoma:** `404 NOT_FOUND` ao chamar endpoint  
**Correção:**
```typescript
// Verificar se endpoint está antes do catch-all
// Garantir que está dentro do bloco correto de routing
```

**Impacto:** Badge fiscal não funciona, alertas não aparecem

---

#### BUG-003: Loop de Realtime Reconnect
**Localização:** `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx:236-263`  
**Causa:** `setupRealtimeSubscription` no array de dependências do useEffect  
**Sintoma:** Loop infinito de subscribe/unsubscribe  
**Correção:**
```typescript
// Remover setupRealtimeSubscription do array de dependências
// Usar useRef para channel ao invés de recriar função
useEffect(() => {
    if (restaurantId) {
        const channel = setupRealtimeSubscription();
        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }
}, [restaurantId]); // Remover setupRealtimeSubscription
```

**Impacto:** Performance degradada, consumo excessivo de recursos

---

#### BUG-004: Identity Resolution Falha Silenciosamente
**Localização:** `merchant-portal/src/core/identity/useRestaurantIdentity.ts:100-104`  
**Causa:** `gm_restaurant_members` VIEW pode não existir ou retornar null  
**Sintoma:** "No restaurant membership found" → sistema não inicia  
**Correção:**
```typescript
// Adicionar fallback e log claro
if (memberError || !memberData?.restaurant_id) {
    console.error('[Identity] CRITICAL: No restaurant membership', {
        userId: user.id,
        memberError,
        memberData
    });
    // Tentar criar membership ou redirecionar para onboarding
    setIdentity(prev => ({ ...prev, name: 'Sem Restaurante', loading: false, error: 'NO_MEMBERSHIP' }));
    return;
}
```

**Impacto:** Usuário não consegue acessar sistema

---

### 🟠 HIGH (Quebra Funcionalidade Crítica)

#### BUG-005: `require is not defined` (Browser)
**Localização:** `merchant-portal/src/main.tsx:11`  
**Causa:** Import de `buffer` pode falhar em alguns builds  
**Sintoma:** `ReferenceError: require is not defined`  
**Correção:**
```typescript
// Já existe polyfill em index.html, mas verificar ordem
// Garantir que Buffer está disponível antes de usar
if (typeof window !== 'undefined' && !window.Buffer) {
    import('buffer').then(({ Buffer }) => {
        window.Buffer = Buffer;
    });
}
```

**Impacto:** TPV não funciona, Stripe não funciona

---

#### BUG-006: Buffer CDN Failed
**Localização:** `merchant-portal/index.html:14-45`  
**Causa:** Polyfill inline pode não ser suficiente  
**Sintoma:** `Buffer is not defined` em runtime  
**Correção:**
```typescript
// Verificar se polyfill está sendo executado antes de main.tsx
// Adicionar verificação mais robusta
```

**Impacto:** PDF não gera, TPV quebra

---

#### BUG-007: Idempotência Quebrada (409 Conflict)
**Localização:** `merchant-portal/src/core/tpv/OrderEngine.ts:156-167`  
**Causa:** Race condition em criação de pedidos  
**Sintoma:** `409 Conflict` em `app_logs` ou `gm_orders`  
**Correção:**
```typescript
// Já existe tratamento, mas verificar se cobre todos os casos
// Adicionar retry com backoff exponencial
```

**Impacto:** Pedidos duplicados, logs corrompidos

---

#### BUG-008: State Machine Teleporte
**Localização:** `state-machines/order.state-machine.json`  
**Causa:** Transições inválidas não validadas  
**Sintoma:** Pedido pula de OPEN → PAID (sem LOCKED)  
**Correção:**
```typescript
// Adicionar validação no OrderEngine
// Garantir que todas as transições passam pelo executor
```

**Impacto:** Dados inconsistentes, fiscal quebrado

---

### 🟡 MEDIUM (Degrada Experiência)

#### BUG-009: Offline Queue usa localStorage
**Localização:** `merchant-portal/src/core/queue/useOfflineReconciler.ts`  
**Causa:** localStorage pode ser limpo pelo browser  
**Sintoma:** Pedidos offline perdidos  
**Correção:**
```typescript
// Migrar para IndexedDB
// Usar idb library (já está no package.json)
```

**Impacto:** Perda de dados em offline prolongado

---

#### BUG-010: TaskOps não dispara em alguns eventos
**Localização:** `server/operational-event-bus/event-bus.ts:316`  
**Causa:** Regras de roteamento podem não existir  
**Sintoma:** Eventos criados mas tasks não aparecem  
**Correção:**
```typescript
// Adicionar regras padrão no seed
// Log claro quando regra não existe
```

**Impacto:** Tarefas não criadas automaticamente

---

#### BUG-011: Realtime não reconecta após crash
**Localização:** `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx:265-280`  
**Causa:** Reconnect manager pode não resetar corretamente  
**Sintoma:** Realtime fica desconectado permanentemente  
**Correção:**
```typescript
// Verificar lógica de reset
// Adicionar health check periódico
```

**Impacto:** KDS fica cego, pedidos não atualizam

---

### 🟢 LOW (Melhorias)

#### BUG-012: Polling de 30s muito lento em pico
**Localização:** `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx:245`  
**Causa:** Intervalo fixo não adapta ao tráfego  
**Correção:**
```typescript
// Implementar polling adaptativo
// Reduzir para 15s em horário de pico
```

**Impacto:** Latência maior em pico

---

#### BUG-013: Dashboard não mostra tasks pendentes
**Localização:** `merchant-portal/src/pages/Dashboard/DashboardZero.tsx`  
**Causa:** Tasks não são carregadas no dashboard  
**Correção:**
```typescript
// Adicionar widget de tasks
// Integrar com StaffContext
```

**Impacto:** Owner não vê tasks operacionais

---

## 🛠️ 5. PLANO DE CORREÇÃO EM 3 ONDAS

### ONDA 1: Parar Loops, Estabilizar Realtime, Corrigir Identity

**Objetivo:** Sistema não trava, realtime funciona, identity resolve

#### Tarefas:

1. **Corrigir BUG-001 (getTabIsolated)**
   - Arquivo: `merchant-portal/src/core/activation/useActivationAdvisor.ts`
   - Ação: Adicionar import
   - Tempo: 5 min
   - Prioridade: 🔴 BLOCKER

2. **Corrigir BUG-003 (Loop Realtime)**
   - Arquivo: `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx`
   - Ação: Remover função do array de dependências, usar useRef
   - Tempo: 30 min
   - Prioridade: 🔴 BLOCKER

3. **Corrigir BUG-004 (Identity Resolution)**
   - Arquivo: `merchant-portal/src/core/identity/useRestaurantIdentity.ts`
   - Ação: Adicionar fallback e log claro
   - Tempo: 20 min
   - Prioridade: 🔴 BLOCKER

4. **Corrigir BUG-002 (Endpoint Fiscal)**
   - Arquivo: `server/web-module-api-server.ts`
   - Ação: Verificar registro do endpoint
   - Tempo: 15 min
   - Prioridade: 🔴 BLOCKER

5. **Testar Realtime Reconnect**
   - Ação: Simular desconexão e verificar reconexão
   - Tempo: 30 min
   - Prioridade: 🟠 HIGH

**Resultado Esperado:**
- ✅ Sistema inicia sem erros
- ✅ Realtime não entra em loop
- ✅ Identity resolve corretamente
- ✅ Endpoints funcionam

---

### ONDA 2: Garantir Criação/Atualização/Visualização de Pedidos

**Objetivo:** Todos os caminhos de pedido funcionam end-to-end

#### Tarefas:

1. **Corrigir BUG-005 e BUG-006 (Buffer)**
   - Arquivos: `merchant-portal/index.html`, `merchant-portal/src/main.tsx`
   - Ação: Garantir polyfill robusto
   - Tempo: 20 min
   - Prioridade: 🟠 HIGH

2. **Corrigir BUG-007 (Idempotência)**
   - Arquivo: `merchant-portal/src/core/tpv/OrderEngine.ts`
   - Ação: Adicionar retry com backoff
   - Tempo: 45 min
   - Prioridade: 🟠 HIGH

3. **Corrigir BUG-008 (State Machine)**
   - Arquivo: `merchant-portal/src/core/tpv/OrderEngine.ts`
   - Ação: Adicionar validação de transições
   - Tempo: 1h
   - Prioridade: 🟠 HIGH

4. **Testar Fluxo Completo E2E**
   - Ação: TPV → KDS → Dashboard → Web → App Staff
   - Tempo: 2h
   - Prioridade: 🟠 HIGH

**Resultado Esperado:**
- ✅ Pedidos criados em todas as interfaces
- ✅ Pedidos visualizados em KDS e Dashboard
- ✅ State machine valida transições
- ✅ Idempotência funciona

---

### ONDA 3: Acoplamento com Tarefas Operacionais

**Objetivo:** TaskOps dispara automaticamente em eventos

#### Tarefas:

1. **Corrigir BUG-010 (TaskOps não dispara)**
   - Arquivo: `server/operational-event-bus/event-bus.ts`
   - Ação: Adicionar regras padrão e logs
   - Tempo: 1h
   - Prioridade: 🟡 MEDIUM

2. **Corrigir BUG-009 (Offline Queue)**
   - Arquivo: `merchant-portal/src/core/queue/useOfflineReconciler.ts`
   - Ação: Migrar para IndexedDB
   - Tempo: 2h
   - Prioridade: 🟡 MEDIUM

3. **Corrigir BUG-011 (Reconnect após crash)**
   - Arquivo: `merchant-portal/src/pages/TPV/context/OrderContextReal.tsx`
   - Ação: Health check periódico
   - Tempo: 1h
   - Prioridade: 🟡 MEDIUM

4. **Adicionar Widget de Tasks no Dashboard**
   - Arquivo: `merchant-portal/src/pages/Dashboard/DashboardZero.tsx`
   - Ação: Integrar StaffContext
   - Tempo: 2h
   - Prioridade: 🟢 LOW

**Resultado Esperado:**
- ✅ Tasks criadas automaticamente
- ✅ Offline robusto (IndexedDB)
- ✅ Realtime resiliente
- ✅ Dashboard mostra tasks

---

## 📊 6. RESUMO EXECUTIVO

### Status Atual

**✅ Funciona:**
- Arquitetura bem definida (Identity → Tenant → Restaurant)
- Order lifecycle com state machine
- Realtime subscription (com fallback polling)
- TaskOps system (event bus + routing)

**❌ Quebra:**
- Loops de realtime reconnect
- Identity resolution falha silenciosamente
- Endpoints fiscais 404
- Buffer polyfill inconsistente

**⚠️ Fragilidades:**
- Offline queue usa localStorage (pode perder dados)
- Polling de 30s pode ser lento em pico
- TaskOps não dispara em alguns eventos

### Priorização

**URGENTE (Esta Semana):**
1. BUG-001: getTabIsolated
2. BUG-003: Loop Realtime
3. BUG-004: Identity Resolution
4. BUG-002: Endpoint Fiscal

**IMPORTANTE (Próxima Semana):**
5. BUG-005/006: Buffer
6. BUG-007: Idempotência
7. BUG-008: State Machine

**MELHORIAS (Backlog):**
8. BUG-009: Offline Queue
9. BUG-010: TaskOps
10. BUG-011: Reconnect

### Estimativa Total

- **Onda 1:** 2h (crítico)
- **Onda 2:** 4h (funcional)
- **Onda 3:** 6h (melhorias)

**Total:** 12h de desenvolvimento + 4h de teste = **16h**

---

## 🎯 7. CONCLUSÃO

O sistema tem **arquitetura sólida** mas **bugs críticos** que impedem operação estável. A correção em 3 ondas resolve os problemas mais urgentes primeiro, depois estabiliza funcionalidades, e por fim adiciona melhorias.

**Recomendação:** Executar Onda 1 imediatamente antes de qualquer deploy em produção.

---

**Última Atualização:** 2026-01-24  
**Próxima Revisão:** Após correção da Onda 1
