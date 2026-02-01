# 🕒 Employee Time Engine - Especificação Técnica

**Status:** 📋 **A IMPLEMENTAR**  
**Objetivo:** Correlacionar horários/turnos com performance operacional

---

## 🎯 PROBLEMA QUE RESOLVE

**O que o Core hoje não consegue dizer (mas deveria):**

❌ "BAR atrasou"  
✅ "BAR atrasou porque tinha 1 funcionário a menos no turno das 20h"

---

## 📊 DADOS NECESSÁRIOS

### Tabelas Novas

#### `gm_shifts` (Turnos Planejados)
```sql
CREATE TABLE public.gm_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id),
  user_id UUID NOT NULL REFERENCES public.gm_users(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  role TEXT NOT NULL, -- 'WAITER', 'KITCHEN', 'BAR', 'MANAGER'
  station_id UUID REFERENCES public.gm_stations(id),
  status TEXT NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'CONFIRMED', 'CANCELLED'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shifts_restaurant_time ON public.gm_shifts(restaurant_id, start_time, end_time);
CREATE INDEX idx_shifts_user_time ON public.gm_shifts(user_id, start_time, end_time);
```

#### `gm_attendance` (Check-in/Check-out Real)
```sql
CREATE TABLE public.gm_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES public.gm_shifts(id),
  user_id UUID NOT NULL REFERENCES public.gm_users(id),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id),
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  status TEXT NOT NULL, -- 'PRESENT', 'ABSENT', 'LATE', 'EARLY_LEAVE'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attendance_shift ON public.gm_attendance(shift_id);
CREATE INDEX idx_attendance_restaurant_time ON public.gm_attendance(restaurant_id, check_in_at);
```

#### `gm_schedule` (Escala Semanal)
```sql
CREATE TABLE public.gm_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  shifts JSONB NOT NULL, -- Array de turnos planejados
  status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'PUBLISHED', 'ARCHIVED'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(restaurant_id, week_start_date)
);

CREATE INDEX idx_schedule_restaurant_week ON public.gm_schedule(restaurant_id, week_start_date);
```

---

## 🔗 INTEGRAÇÃO COM CORE EXISTENTE

### Dados que Já Existem

**`gm_users`**
- Funcionários cadastrados
- Roles (WAITER, KITCHEN, BAR, MANAGER)
- Skills

**`gm_tasks`**
- Tarefas com SLA
- Atrasos
- Resoluções

**`gm_order_items`**
- Itens com atrasos
- Estações
- Timestamps

**`gm_kds_stations`**
- Estações (KITCHEN, BAR, etc.)
- Capacidade
- Performance

### Como Conectar

**Correlação 1: SLA Violado + Staff Coverage**
```sql
-- Quantos funcionários estavam escalados quando SLA foi violado?
SELECT 
  t.id as task_id,
  t.restaurant_id,
  t.station,
  t.sla_violated_at,
  COUNT(DISTINCT s.user_id) as staff_scheduled,
  COUNT(DISTINCT a.user_id) FILTER (WHERE a.status = 'PRESENT') as staff_present
FROM public.gm_tasks t
LEFT JOIN public.gm_shifts s ON 
  s.restaurant_id = t.restaurant_id AND
  s.station_id = t.station_id AND
  s.start_time <= t.sla_violated_at AND
  s.end_time >= t.sla_violated_at
LEFT JOIN public.gm_attendance a ON 
  a.shift_id = s.id AND
  a.status = 'PRESENT'
WHERE t.status = 'SLA_VIOLATED'
GROUP BY t.id, t.restaurant_id, t.station, t.sla_violated_at;
```

**Correlação 2: Atraso + Faltas**
```sql
-- Atrasos correlacionados com faltas
SELECT 
  oi.order_id,
  oi.station,
  oi.delayed_at,
  COUNT(DISTINCT s.user_id) as staff_scheduled,
  COUNT(DISTINCT a.user_id) FILTER (WHERE a.status = 'ABSENT') as staff_absent
FROM public.gm_order_items oi
LEFT JOIN public.gm_shifts s ON 
  s.restaurant_id = oi.restaurant_id AND
  s.station_id = oi.station_id AND
  s.start_time <= oi.delayed_at AND
  s.end_time >= oi.delayed_at
LEFT JOIN public.gm_attendance a ON 
  a.shift_id = s.id AND
  a.status = 'ABSENT'
WHERE oi.delayed_at IS NOT NULL
GROUP BY oi.order_id, oi.station, oi.delayed_at;
```

---

## 📈 MÉTRICAS DERIVADAS

### 1. Staff Coverage vs Demand

**Pergunta:** Turno tinha pessoas suficientes?

**Métrica:**
```sql
SELECT 
  s.restaurant_id,
  s.start_time::date as shift_date,
  EXTRACT(HOUR FROM s.start_time) as shift_hour,
  s.station_id,
  COUNT(DISTINCT s.user_id) as staff_scheduled,
  COUNT(DISTINCT a.user_id) FILTER (WHERE a.status = 'PRESENT') as staff_present,
  COUNT(DISTINCT oi.id) FILTER (WHERE oi.delayed_at IS NOT NULL) as delayed_items,
  CASE 
    WHEN COUNT(DISTINCT a.user_id) FILTER (WHERE a.status = 'PRESENT') < 
         (SELECT required_staff FROM public.gm_stations WHERE id = s.station_id)
    THEN 'UNDERSTAFFED'
    ELSE 'ADEQUATE'
  END as coverage_status
FROM public.gm_shifts s
LEFT JOIN public.gm_attendance a ON a.shift_id = s.id
LEFT JOIN public.gm_order_items oi ON 
  oi.restaurant_id = s.restaurant_id AND
  oi.station_id = s.station_id AND
  oi.created_at BETWEEN s.start_time AND s.end_time
GROUP BY s.restaurant_id, s.start_time::date, EXTRACT(HOUR FROM s.start_time), s.station_id;
```

### 2. Absenteeism Impact

**Pergunta:** Falta causou quantos atrasos?

**Métrica:**
```sql
SELECT 
  a.shift_id,
  a.user_id,
  s.station_id,
  COUNT(DISTINCT oi.id) FILTER (WHERE oi.delayed_at IS NOT NULL) as delayed_items_caused,
  SUM(oi.delay_minutes) FILTER (WHERE oi.delayed_at IS NOT NULL) as total_delay_minutes
FROM public.gm_attendance a
JOIN public.gm_shifts s ON s.id = a.shift_id
LEFT JOIN public.gm_order_items oi ON 
  oi.restaurant_id = s.restaurant_id AND
  oi.station_id = s.station_id AND
  oi.created_at BETWEEN s.start_time AND s.end_time
WHERE a.status = 'ABSENT'
GROUP BY a.shift_id, a.user_id, s.station_id;
```

### 3. Overstaffing Detection

**Pergunta:** Turno tinha pessoas demais?

**Métrica:**
```sql
SELECT 
  s.restaurant_id,
  s.start_time::date as shift_date,
  s.station_id,
  COUNT(DISTINCT a.user_id) FILTER (WHERE a.status = 'PRESENT') as staff_present,
  (SELECT required_staff FROM public.gm_stations WHERE id = s.station_id) as required_staff,
  COUNT(DISTINCT oi.id) as items_processed,
  CASE 
    WHEN COUNT(DISTINCT a.user_id) FILTER (WHERE a.status = 'PRESENT') > 
         (SELECT required_staff FROM public.gm_stations WHERE id = s.station_id) * 1.5
    THEN 'OVERSTAFFED'
    ELSE 'ADEQUATE'
  END as staffing_status
FROM public.gm_shifts s
LEFT JOIN public.gm_attendance a ON a.shift_id = s.id
LEFT JOIN public.gm_order_items oi ON 
  oi.restaurant_id = s.restaurant_id AND
  oi.station_id = s.station_id AND
  oi.created_at BETWEEN s.start_time AND s.end_time
GROUP BY s.restaurant_id, s.start_time::date, s.station_id;
```

---

## 🔁 REGRAS DE INTERPRETAÇÃO

### Regra: Staff Insuficiente Causa Atraso

```typescript
{
  id: 'staff-insufficient-delay',
  name: 'Atraso por Staff Insuficiente',
  condition: (m) => 
    m.staffPresent < m.requiredStaff &&
    m.delayedItems > 0 &&
    m.delayedItems / m.totalItems > 0.2, // Mais de 20% atrasados
  pattern: 'Estação X teve Y pessoas (precisava Z) e atrasou N itens',
  suggestion: {
    title: 'Atraso causado por staff insuficiente',
    actions: [
      `Adicionar ${m.requiredStaff - m.staffPresent} pessoa(s) no turno`,
      'Reduzir cardápio da estação no horário',
      'Mudar fluxo: preparar com antecedência'
    ],
    priority: 'high',
    confidence: 0.85
  }
}
```

### Regra: Falta Causa Impacto

```typescript
{
  id: 'absenteeism-impact',
  name: 'Impacto de Falta',
  condition: (m) => 
    m.staffAbsent > 0 &&
    m.delayedItemsCaused > 5,
  pattern: 'Falta de X pessoa(s) causou Y atrasos',
  suggestion: {
    title: 'Falta causou impacto operacional',
    actions: [
      'Substituir pessoa faltante',
      'Redistribuir staff entre estações',
      'Ajustar expectativa de tempo para clientes'
    ],
    priority: 'high',
    confidence: 0.9
  }
}
```

---

## 🎯 EXEMPLO DE DECISÃO ACIONÁVEL

### Cenário Real

**Dados:**
- BAR atrasou 5x nesta semana
- Sempre no turno das 20h
- Turno das 20h tem 1 pessoa (precisa de 2)
- 3 faltas registradas nesse turno

**Interpretação:**
```
Padrão detectado:
  "BAR atrasou 5x nesta semana, sempre no turno das 20h"
  +
  "Turno das 20h tem 1 pessoa a menos que o necessário"
  +
  "3 faltas registradas nesse turno"
  ↓
Sugestão:
  "Adicionar 1 pessoa no turno das 20h"
  OU
  "Reduzir cardápio de bebidas no horário de pico"
  OU
  "Mudar fluxo: preparar drinks com antecedência"
  OU
  "Implementar política de faltas (backup)"
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Schema
- [ ] Criar tabela `gm_shifts`
- [ ] Criar tabela `gm_attendance`
- [ ] Criar tabela `gm_schedule`
- [ ] Criar índices necessários
- [ ] Criar constraints

### Fase 2: Integração
- [ ] RPC para criar turnos
- [ ] RPC para check-in/check-out
- [ ] RPC para consultar staff coverage
- [ ] Integração com métricas existentes

### Fase 3: Métricas Derivadas
- [ ] Staff Coverage vs Demand
- [ ] Absenteeism Impact
- [ ] Overstaffing Detection
- [ ] Skill Mismatch

### Fase 4: Rule Engine
- [ ] Regra: Staff Insuficiente
- [ ] Regra: Falta Causa Impacto
- [ ] Regra: Overstaffing
- [ ] Geração de sugestões

---

## 🔗 DEPENDÊNCIAS

### Core Existente
- ✅ `gm_users` (funcionários)
- ✅ `gm_restaurants` (restaurantes)
- ✅ `gm_stations` (estações)
- ✅ `gm_tasks` (tarefas)
- ✅ `gm_order_items` (itens)

### Novos Componentes
- 📋 `gm_shifts` (turnos)
- 📋 `gm_attendance` (presença)
- 📋 `gm_schedule` (escala)

---

**Última atualização:** 2026-01-27
