# 📋 GovernManage Decisions — Documentação

**Data**: 2025-01-02  
**Status**: ✅ Implementado  
**Objetivo**: Decision History (Audit) + Rule Simulator (Dry-run)

---

## 🎯 Visão Geral

Duas funcionalidades essenciais para tornar o GovernManage "produto vendável":

1. **Decision History (Audit Log)**: Histórico completo de todas as decisões tomadas pelo sistema
2. **Rule Simulator (Dry-run)**: Simular regras antes de ativá-las

---

## 📊 Decision History

### Database Schema

**Tabela**: `govern_decision_log`

- `id` — UUID
- `restaurant_id` — FK para `gm_restaurants`
- `event_id` — FK para `operational_events`
- `event_type` — Tipo do evento
- `event_priority` — Prioridade (P0-P3)
- `rule_id` — FK para `operational_event_routing_rules` (nullable)
- `rule_name` — Nome da regra (nullable)
- `action_type` — Tipo de ação executada
- `action_target` — Alvo da ação (appstaff, manager, etc.)
- `payload` — JSONB com snapshot completo
- `dedupe_key` — Chave de deduplicação (nullable)
- `dedupe_count` — Quantidade de eventos deduplicados
- `status` — Status (pending, executed, failed, ignored)
- `executed_at` — Quando foi executado
- `resolved_at` — Quando foi resolvido (nullable)
- `resolved_by` — Quem resolveu (nullable)
- `created_at` — Data de criação

### Integração com Event Bus

**Modificado**: `server/operational-event-bus/event-bus.ts`

- Função `logDecision()` criada
- Chamada após cada ação executada:
  - `create_task` → Log com task_id
  - `send_notification` → Log com notification details
  - `update_dashboard` → Log com update details
  - Sem regras → Log como "ignore"

### API Endpoints

#### GET `/api/govern-manage/decisions`
- Query params: `restaurant_id`, `event_type`, `priority`, `action_type`, `limit`
- Retorna: Lista de decisões ordenada por data (desc)

#### GET `/api/govern-manage/decisions/:id`
- Retorna: Detalhes completos da decisão (incluindo payload e contexto do evento)

### UI

**Seção "Decision Timeline"** no `GovernManageDashboard`:

- Lista de decisões em formato feed
- Filtros: Prioridade (P0/P1/P2/P3) + Tipo de evento
- Cards compactos com:
  - Resumo legível (gerado por `generateDecisionSummary()`)
  - Badge de prioridade
  - Badge "Tarefa" se task_id presente
  - Data/hora
- Click no card → Abre Drawer com detalhes completos

### Resumo Legível

**Função**: `generateDecisionSummary(decision)`

Exemplos:
- "3 eventos similares → Regra: Waiter Call → Tarefa criada → Prioridade: Crítica"
- "Evento: stock_low → Regra: Stock Alert → Tarefa criada"
- "Evento: review_negative → Ação: Ignorado (sem regras correspondentes)"

---

## 🧪 Rule Simulator

### Funcionalidade

Simula regras contra eventos históricos para prever impacto antes de ativar.

### API Endpoint

#### GET `/api/govern-manage/rules/:id/simulate`
- Query params: `restaurant_id`, `days` (default: 7)
- Retorna: `SimulationResult` com métricas

### SimulationResult

```typescript
{
  rule_id: string;
  rule_name: string;
  simulation_period_days: number;
  total_events_matched: number;
  total_actions_generated: number;
  actions_by_type: Record<string, number>;
  tasks_created: number;
  escalations: number;
  affected_roles: string[];
  priority_breakdown: {
    P0: number;
    P1: number;
    P2: number;
    P3: number;
  };
  estimated_impact: {
    high_priority_tasks: number;
    notifications: number;
    feature_changes: number;
  };
}
```

### UI

**Botão "Simular"** em cada regra:

- Click → Chama API de simulação
- Abre Modal com resultados:
  - Período simulado
  - Eventos correspondentes
  - Ações geradas
  - Impacto estimado (tarefas, notificações, escalações)
  - Roles afetados
  - Breakdown por prioridade
- CTA: "Ativar Regra" (se simulação satisfatória)

---

## 🔄 Fluxo Completo

### Exemplo: Simular Regra → Ativar → Ver Decisões

1. **Usuário** clica "Simular" em uma regra
2. **Sistema** busca eventos históricos (últimos 7 dias)
3. **Sistema** simula ações que seriam geradas
4. **Usuário** vê métricas e decide ativar
5. **Usuário** ativa regra
6. **Sistema** começa a processar eventos reais
7. **Usuário** vê decisões na Timeline
8. **Usuário** clica em decisão → vê detalhes completos

---

## 📊 Benefícios

1. ✅ **Transparência Total**: Todas as decisões são registradas
2. ✅ **Audit Trail**: Histórico completo para compliance
3. ✅ **Previsibilidade**: Simular antes de ativar
4. ✅ **Confiança**: Usuário vê exatamente o que aconteceu
5. ✅ **Debugging**: Fácil identificar problemas em regras

---

## 🚀 Próximos Passos

1. ✅ Decision History implementado
2. ✅ Rule Simulator implementado
3. ⏳ Export de decisões (CSV/JSON)
4. ⏳ Alertas quando decisões falham
5. ⏳ Dashboard de métricas de decisões

---

**Mensagem**: "Todas as decisões são registradas. Todas as regras podem ser simuladas. Zero caos. Controle total."

