# ✅ ROADMAP — TASK SYSTEM OPERACIONAL COMPLETO
## Fase 1: Prioridade Máxima (4-6 semanas)

**Objetivo:** Completar o Task System para conectar tudo (pedidos, pessoas, tempo, estoque) e criar base para automação e mentoria.

---

## 🎯 POR QUE TASK SYSTEM É PRIORIDADE MÁXIMA

### Conecta Tudo

- ✅ Pedidos → Tarefas automáticas
- ✅ Pessoas → Tarefas por papel
- ✅ Tempo → Tarefas recorrentes
- ✅ Estoque → Tarefas de alerta

### Base para Automação

- ✅ Eventos geram tarefas
- ✅ Tarefas geram ações
- ✅ Ações geram eventos

### Base para Mentoria

- ✅ IA observa tarefas
- ✅ IA sugere otimizações
- ✅ IA alerta problemas

---

## 📋 TAREFAS A IMPLEMENTAR

### 1. Tarefas Recorrentes (1 semana)

**O que fazer:**
- Abertura (checklist diário)
- Fechamento (checklist diário)
- Limpeza (tarefas periódicas)
- HACCP / Higiene (tarefas obrigatórias)

**Arquivos:**
- `docker-core/schema/migrations/20260127_recurring_tasks.sql`
- `merchant-portal/src/core/tasks/RecurringTaskEngine.ts`
- `merchant-portal/src/pages/Tasks/RecurringTasksPage.tsx`

**Critério de Pronto:**
- ✅ Tarefas recorrentes criadas automaticamente
- ✅ Checklist de abertura/fechamento
- ✅ Tarefas de limpeza configuráveis
- ✅ Tarefas HACCP obrigatórias

---

### 2. Tarefas Automáticas por Eventos (1-2 semanas)

**O que fazer:**
- Pedido atrasado → tarefa
- Estoque baixo → tarefa
- Ausência de funcionário → tarefa
- Mesa sem atendimento → tarefa

**Arquivos:**
- `merchant-portal/src/core/tasks/EventTaskGenerator.ts`
- `merchant-portal/src/core/tasks/TaskRules.ts`

**Critério de Pronto:**
- ✅ Eventos geram tarefas automaticamente
- ✅ Regras configuráveis
- ✅ Prioridade automática
- ✅ Atribuição inteligente

---

### 3. Tarefas por Papel (1 semana)

**O que fazer:**
- Garçom vê tarefas de salão
- Cozinha vê tarefas de produção
- Gerente vê todas as tarefas
- Owner vê tarefas estratégicas

**Arquivos:**
- `merchant-portal/src/core/tasks/TaskFiltering.ts`
- `merchant-portal/src/pages/Tasks/TaskDashboard.tsx`

**Critério de Pronto:**
- ✅ Filtro por papel funcionando
- ✅ Dashboard personalizado
- ✅ Notificações por papel

---

### 4. Feedback da Tarefa (1 semana)

**O que fazer:**
- Feita / não feita
- Atraso registrado
- Impacto no SLA
- Comentários

**Arquivos:**
- `merchant-portal/src/core/tasks/TaskFeedback.ts`
- `merchant-portal/src/components/Tasks/TaskCard.tsx`

**Critério de Pronto:**
- ✅ Feedback completo
- ✅ Atraso calculado
- ✅ Impacto no SLA visível
- ✅ Histórico de feedback

---

### 5. Histórico de Tarefas (1 semana)

**O que fazer:**
- Quem sempre atrasa
- Quais tarefas são ignoradas
- Padrões de comportamento
- Análise de performance

**Arquivos:**
- `merchant-portal/src/core/tasks/TaskAnalytics.ts`
- `merchant-portal/src/pages/Tasks/TaskHistoryPage.tsx`

**Critério de Pronto:**
- ✅ Histórico completo
- ✅ Análise de padrões
- ✅ Relatórios de performance
- ✅ Alertas de problemas

---

### 6. Ligação Task ↔ Mentoria IA (1 semana)

**O que fazer:**
- IA observa tarefas
- IA identifica padrões
- IA sugere otimizações
- IA alerta problemas

**Arquivos:**
- `merchant-portal/src/core/intelligence/TaskMentor.ts`
- `merchant-portal/src/components/Tasks/TaskSuggestions.tsx`

**Critério de Pronto:**
- ✅ IA analisa tarefas
- ✅ Sugestões automáticas
- ✅ Alertas inteligentes
- ✅ Feedback loop

---

## 🏗️ ESTRUTURA TÉCNICA

### Schema no Core

```sql
-- Tarefas recorrentes
CREATE TABLE recurring_tasks (
  id UUID PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurant(id),
  name VARCHAR NOT NULL,
  description TEXT,
  frequency VARCHAR, -- daily, weekly, monthly
  time_of_day TIME,
  day_of_week INTEGER,
  assigned_role VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tarefas geradas
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  restaurant_id UUID REFERENCES restaurant(id),
  recurring_task_id UUID REFERENCES recurring_tasks(id),
  event_id UUID, -- Se gerada por evento
  title VARCHAR NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES employees(id),
  assigned_role VARCHAR,
  status VARCHAR DEFAULT 'pending',
  priority VARCHAR DEFAULT 'normal',
  due_at TIMESTAMP,
  completed_at TIMESTAMP,
  feedback TEXT,
  impact_sla JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Histórico de tarefas
CREATE TABLE task_history (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  action VARCHAR, -- created, assigned, completed, cancelled
  actor_id UUID REFERENCES employees(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ✅ CRITÉRIO DE SUCESSO

**Task System está completo quando:**
- ✅ Tarefas recorrentes funcionando
- ✅ Tarefas automáticas por eventos funcionando
- ✅ Tarefas por papel funcionando
- ✅ Feedback completo funcionando
- ✅ Histórico e análise funcionando
- ✅ Ligação com IA funcionando
- ✅ Sistema conecta tudo (pedidos, pessoas, tempo, estoque)

---

## 🚀 PRÓXIMO PASSO

**Após Task System completo:**
- ⏳ Fase 2: People + Time
- ⏳ Fase 3: TPV Instalável
- ⏳ Fase 4: Alert + Health

---

**Documento criado em:** 27/01/2026  
**Status:** ✅ Roadmap Definido — Pronto para Implementação
