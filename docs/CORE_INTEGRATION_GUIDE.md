# 🔗 Guia de Integração com Core - ChefIApp UI

**Status:** 📋 **GUIA DE INTEGRAÇÃO**  
**Objetivo:** Conectar as telas implementadas com o Core do ChefIApp

---

## 🎯 VISÃO GERAL

Este guia mostra como integrar cada tela implementada com o Core do ChefIApp, respeitando:
- Regras constitucionais do Core
- Event Sourcing
- Task Engine
- Observabilidade
- Mentoria IA

---

## 📋 ESTRUTURA DE INTEGRAÇÃO

### 1. Hooks e Services

Cada módulo deve ter:
- `hooks/` - React hooks para buscar dados
- `services/` - Serviços para comunicação com Core

### 2. Integração com Supabase

Todas as integrações usam:
- PostgREST para queries
- RPCs para mutations
- Realtime subscriptions quando necessário

---

## 🔧 INTEGRAÇÕES POR TELA

### Employee Home (`pages/Employee/HomePage.tsx`)

**Integração:**
- Employee Time Engine (`gm_shifts`, `gm_attendance`)
- Task Engine (`gm_tasks`)

**Hooks necessários:**
```typescript
// features/schedule/hooks/useShifts.ts
export function useCurrentShift(userId: string) {
  // Buscar turno atual do usuário
  // SELECT * FROM gm_shifts WHERE user_id = $1 AND start_time <= NOW() AND end_time >= NOW()
}

// features/tasks/hooks/useTasks.ts
export function useEmployeeTasks(userId: string) {
  // Buscar tasks do funcionário
  // SELECT * FROM gm_tasks WHERE assigned_to = $1 AND status != 'COMPLETED'
}
```

**TODOs:**
- [ ] Criar `useCurrentShift` hook
- [ ] Criar `useEmployeeTasks` hook
- [ ] Integrar com Employee Time Engine
- [ ] Calcular tempo restante do turno

---

### Employee Tasks (`pages/Employee/TasksPage.tsx`)

**Integração:**
- Task Engine (`gm_tasks`)

**Hooks necessários:**
```typescript
// features/tasks/hooks/useTasks.ts
export function useTasks(filters: { userId?: string, status?: string }) {
  // Buscar tasks com filtros
  // SELECT * FROM gm_tasks WHERE ...
}

export function useUpdateTaskStatus(taskId: string, status: string) {
  // Atualizar status da task
  // RPC: update_task_status(task_id, status)
}
```

**TODOs:**
- [ ] Criar `useTasks` hook
- [ ] Criar `useUpdateTaskStatus` hook
- [ ] Integrar com Task Engine
- [ ] Atualizar status em tempo real

---

### Employee Operation (`pages/Employee/OperationPage.tsx`)

**Integração:**
- Orders (`gm_orders`)
- KDS (`gm_kds_items`)

**Hooks necessários:**
```typescript
// features/operation/hooks/useOperation.ts
export function useActiveOrders(restaurantId: string) {
  // Buscar pedidos ativos
  // SELECT * FROM gm_orders WHERE restaurant_id = $1 AND status IN ('OPEN', 'IN_PROGRESS')
}

export function useKDSByStation(restaurantId: string, station: string) {
  // Buscar itens KDS por estação
  // SELECT * FROM gm_kds_items WHERE restaurant_id = $1 AND station = $2 AND status != 'READY'
}
```

**TODOs:**
- [ ] Criar `useActiveOrders` hook
- [ ] Criar `useKDSByStation` hook
- [ ] Integrar com Orders
- [ ] Integrar com KDS
- [ ] Atualizar em tempo real

---

### Employee KDS Intelligent (`pages/Employee/KDSIntelligentPage.tsx`)

**Integração:**
- KDS (`gm_kds_items`)
- Estoque (`gm_stock`)

**Hooks necessários:**
```typescript
// features/operation/hooks/useKDS.ts
export function useKDSItems(station: string) {
  // Buscar itens KDS por estação
  // SELECT * FROM gm_kds_items WHERE station = $1 ORDER BY created_at ASC
}

export function useMarkItemReady(itemId: string) {
  // Marcar item como pronto
  // RPC: mark_item_ready(item_id)
}

export function useCheckStock(ingredientId: string) {
  // Verificar estoque do ingrediente
  // SELECT * FROM gm_stock WHERE ingredient_id = $1
}
```

**TODOs:**
- [ ] Criar `useKDSItems` hook
- [ ] Criar `useMarkItemReady` hook
- [ ] Criar `useCheckStock` hook
- [ ] Integrar sugestão IA (quando há falta de item)
- [ ] Implementar agrupamento inteligente

---

### Employee Mentor (`pages/Employee/MentorPage.tsx`)

**Integração:**
- Mentoria IA (endpoint a definir)

**Hooks necessários:**
```typescript
// features/mentor/hooks/useMentorship.ts
export function useMentorshipMessage(userId: string, role: 'employee') {
  // Buscar mensagem de mentoria contextual
  // Endpoint: /api/mentorship/message?userId=$1&role=$2
}

export function useMentorshipFeedback(messageId: string, helpful: boolean) {
  // Enviar feedback sobre mentoria
  // POST /api/mentorship/feedback
}
```

**TODOs:**
- [ ] Criar `useMentorshipMessage` hook
- [ ] Criar `useMentorshipFeedback` hook
- [ ] Integrar com Mentoria IA
- [ ] Coletar feedback

---

### Manager Dashboard (`pages/Manager/DashboardPage.tsx`)

**Integração:**
- Core metrics (múltiplas fontes)
- Mentoria IA (decisão recomendada)

**Hooks necessários:**
```typescript
// features/central/hooks/useCentral.ts
export function useSystemStatus(restaurantId: string) {
  // Buscar status geral do sistema
  // Agregar: KDS, Estoque, Staff, SLAs
}

export function usePriorityAlerts(restaurantId: string) {
  // Buscar alertas prioritários
  // SELECT * FROM alerts WHERE restaurant_id = $1 AND priority IN ('HIGH', 'CRITICAL')
}

export function useNextDecision(restaurantId: string) {
  // Buscar próxima decisão recomendada pela IA
  // Endpoint: /api/mentorship/decision?restaurantId=$1
}
```

**TODOs:**
- [ ] Criar `useSystemStatus` hook
- [ ] Criar `usePriorityAlerts` hook
- [ ] Criar `useNextDecision` hook
- [ ] Integrar com múltiplas fontes
- [ ] Integrar com Mentoria IA

---

### Manager Central (`pages/Manager/CentralPage.tsx`)

**Integração:**
- Central de Comando (já existe)
- Event Store
- Task Engine

**Hooks necessários:**
```typescript
// features/central/hooks/useCentral.ts
export function useOperationalProgress(restaurantId: string, runId?: string) {
  // Buscar progresso operacional
  // Endpoint: /api/central/progress?restaurantId=$1&runId=$2
}

export function useRelevantEvents(restaurantId: string, minutes: number = 30) {
  // Buscar eventos relevantes
  // SELECT * FROM events WHERE restaurant_id = $1 AND created_at > NOW() - INTERVAL '$2 minutes'
}

export function useSLAsAtRisk(restaurantId: string) {
  // Buscar SLAs em risco
  // SELECT * FROM gm_tasks WHERE restaurant_id = $1 AND sla_status = 'AT_RISK'
}
```

**TODOs:**
- [ ] Criar `useOperationalProgress` hook
- [ ] Criar `useRelevantEvents` hook
- [ ] Criar `useSLAsAtRisk` hook
- [ ] Integrar com Central de Comando existente
- [ ] Filtrar por runId

---

### Manager Schedule (`pages/Manager/SchedulePage.tsx`)

**Integração:**
- Employee Time Engine (`gm_shifts`, `gm_attendance`)

**Hooks necessários:**
```typescript
// features/schedule/hooks/useShifts.ts
export function useShiftsByDate(restaurantId: string, date: string) {
  // Buscar turnos por data
  // SELECT * FROM gm_shifts WHERE restaurant_id = $1 AND DATE(start_time) = $2
}

export function useCreateShift(shift: Shift) {
  // Criar turno
  // RPC: create_shift(...)
}

export function useUpdateShift(shiftId: string, updates: Partial<Shift>) {
  // Atualizar turno
  // RPC: update_shift(shift_id, ...)
}
```

**TODOs:**
- [ ] Criar `useShiftsByDate` hook
- [ ] Criar `useCreateShift` hook
- [ ] Criar `useUpdateShift` hook
- [ ] Integrar com Employee Time Engine
- [ ] Validar conflitos de horário

---

### Manager Reservations (`pages/Manager/ReservationsPage.tsx`)

**Integração:**
- Reservation Engine (`gm_reservations`, `gm_reservation_slots`)

**Hooks necessários:**
```typescript
// features/reservations/hooks/useReservations.ts
export function useReservations(restaurantId: string, date: string) {
  // Buscar reservas por data
  // SELECT * FROM gm_reservations WHERE restaurant_id = $1 AND reservation_date = $2
}

export function useCreateReservation(reservation: Reservation) {
  // Criar reserva
  // RPC: create_reservation(...)
}

export function useReservationForecast(restaurantId: string, date: string) {
  // Buscar previsão de reservas
  // RPC: get_reservation_forecast(restaurant_id, date)
}
```

**TODOs:**
- [ ] Criar `useReservations` hook
- [ ] Criar `useCreateReservation` hook
- [ ] Criar `useReservationForecast` hook
- [ ] Integrar com Reservation Engine
- [ ] Validar disponibilidade

---

### Manager Analysis (`pages/Manager/AnalysisPage.tsx`)

**Integração:**
- Core Level 2 (Rule Engine)
- Pattern Detector

**Hooks necessários:**
```typescript
// features/analysis/hooks/useAnalysis.ts
export function useDetectedPatterns(restaurantId: string, period: string) {
  // Buscar padrões detectados
  // Endpoint: /api/analysis/patterns?restaurantId=$1&period=$2
}

export function useRecurringBottlenecks(restaurantId: string) {
  // Buscar gargalos recorrentes
  // Endpoint: /api/analysis/bottlenecks?restaurantId=$1
}

export function useSuggestedActions(restaurantId: string) {
  // Buscar ações sugeridas
  // Endpoint: /api/analysis/actions?restaurantId=$1
}
```

**TODOs:**
- [ ] Criar `useDetectedPatterns` hook
- [ ] Criar `useRecurringBottlenecks` hook
- [ ] Criar `useSuggestedActions` hook
- [ ] Integrar com Core Level 2
- [ ] Integrar com Rule Engine

---

### Owner Vision (`pages/Owner/VisionPage.tsx`)

**Integração:**
- Core metrics (agregadas)
- Reservation Engine (previsão)

**Hooks necessários:**
```typescript
// features/vision/hooks/useVision.ts
export function useKPIs(restaurantId: string, period: string) {
  // Buscar KPIs
  // Agregar: Pedidos, Receita, SLAs, Estoque
}

export function useOperationalForecast(restaurantId: string) {
  // Buscar previsão operacional
  // Integrar: Reservas + Estoque + Staff
}
```

**TODOs:**
- [ ] Criar `useKPIs` hook
- [ ] Criar `useOperationalForecast` hook
- [ ] Agregar métricas do Core
- [ ] Integrar com Reservation Engine

---

### Owner Stock Real (`pages/Owner/StockRealPage.tsx`)

**Integração:**
- Estoque (`gm_stock`)
- Consumo real (calculado)

**Hooks necessários:**
```typescript
// features/stock/hooks/useStock.ts
export function useStockStatus(restaurantId: string) {
  // Buscar status do estoque
  // SELECT * FROM gm_stock WHERE restaurant_id = $1
}

export function useStockConsumption(ingredientId: string, period: string) {
  // Buscar consumo real
  // Calcular a partir de eventos de consumo
}

export function useRuptureForecast(restaurantId: string) {
  // Prever rupturas
  // RPC: forecast_stock_ruptures(restaurant_id)
}
```

**TODOs:**
- [ ] Criar `useStockStatus` hook
- [ ] Criar `useStockConsumption` hook
- [ ] Criar `useRuptureForecast` hook
- [ ] Integrar com Estoque
- [ ] Calcular consumo real

---

### Owner Purchases (`pages/Owner/PurchasesPage.tsx`)

**Integração:**
- Supply Loop (`gm_shopping_list`, `gm_suppliers`, `gm_purchase_orders`)

**Hooks necessários:**
```typescript
// features/purchases/hooks/usePurchases.ts
export function useShoppingList(restaurantId: string) {
  // Buscar lista de compras automática
  // RPC: generate_shopping_list(restaurant_id)
}

export function useSuppliers(restaurantId: string) {
  // Buscar fornecedores
  // SELECT * FROM gm_suppliers WHERE restaurant_id = $1
}

export function useCreatePurchaseOrder(order: PurchaseOrder) {
  // Criar pedido de compra
  // RPC: create_purchase_order(...)
}
```

**TODOs:**
- [ ] Criar `useShoppingList` hook
- [ ] Criar `useSuppliers` hook
- [ ] Criar `useCreatePurchaseOrder` hook
- [ ] Integrar com Supply Loop
- [ ] Integrar com `generate_shopping_list` RPC

---

### Owner Simulation (`pages/Owner/SimulationPage.tsx`)

**Integração:**
- Time Warp Engine

**Hooks necessários:**
```typescript
// features/simulation/hooks/useSimulation.ts
export function useSimulateScenario(scenario: Scenario) {
  // Simular cenário
  // Endpoint: /api/simulation/run
}

export function useCompareScenarios(scenarios: Scenario[]) {
  // Comparar cenários
  // Endpoint: /api/simulation/compare
}
```

**TODOs:**
- [ ] Criar `useSimulateScenario` hook
- [ ] Criar `useCompareScenarios` hook
- [ ] Integrar com Time Warp Engine
- [ ] Implementar simulação real

---

## 🏗️ ESTRUTURA DE PASTAS RECOMENDADA

```
merchant-portal/src/features/
├── schedule/
│   ├── hooks/
│   │   ├── useShifts.ts
│   │   └── useAttendance.ts
│   └── services/
│       └── scheduleService.ts
├── reservations/
│   ├── hooks/
│   │   └── useReservations.ts
│   └── services/
│       └── reservationService.ts
├── purchases/
│   ├── hooks/
│   │   └── usePurchases.ts
│   └── services/
│       └── purchaseService.ts
├── operation/
│   ├── hooks/
│   │   └── useOperation.ts
│   └── services/
│       └── operationService.ts
├── mentor/
│   ├── hooks/
│   │   └── useMentorship.ts
│   └── services/
│       └── mentorshipService.ts
├── central/
│   ├── hooks/
│   │   └── useCentral.ts
│   └── services/
│       └── centralService.ts
├── analysis/
│   ├── hooks/
│   │   └── useAnalysis.ts
│   └── services/
│       └── analysisService.ts
└── stock/
    ├── hooks/
    │   └── useStock.ts
    └── services/
        └── stockService.ts
```

---

## 🔐 REGRAS DE INTEGRAÇÃO

### 1. Nunca Violar Regras Constitucionais
- ✅ Validar antes de criar/atualizar
- ✅ Bloquear ações ilegais na UI
- ✅ Mostrar erro claro quando violado

### 2. Usar RPCs Quando Disponível
- ✅ `create_order_atomic` para pedidos
- ✅ `generate_shopping_list` para compras
- ✅ `mark_item_ready` para KDS
- ✅ Outros RPCs conforme documentação

### 3. Respeitar Event Sourcing
- ✅ Não alterar eventos diretamente
- ✅ Criar novos eventos para mudanças
- ✅ Usar Event Store como fonte de verdade

### 4. Observabilidade
- ✅ Logar ações importantes
- ✅ Usar Central de Comando para monitoramento
- ✅ Filtrar por runId quando aplicável

---

## 📝 CHECKLIST DE INTEGRAÇÃO

Para cada tela:
- [ ] Criar hooks necessários
- [ ] Criar services necessários
- [ ] Integrar com Supabase
- [ ] Integrar com RPCs quando disponível
- [ ] Validar regras constitucionais
- [ ] Implementar tratamento de erros
- [ ] Adicionar loading states
- [ ] Adicionar error states
- [ ] Testar integração
- [ ] Documentar integração

---

## 🚀 PRÓXIMOS PASSOS

1. **Criar estrutura de features**
   - Criar pastas `features/` para cada módulo
   - Criar hooks base
   - Criar services base

2. **Integrar uma tela por vez**
   - Começar com Employee Home (mais simples)
   - Depois Employee Tasks
   - Depois Manager Dashboard
   - E assim por diante

3. **Testar integrações**
   - Testar cada integração isoladamente
   - Testar fluxos completos
   - Validar regras constitucionais

4. **Otimizar**
   - Cache quando apropriado
   - Realtime subscriptions quando necessário
   - Performance

---

**Última atualização:** 2026-01-27
