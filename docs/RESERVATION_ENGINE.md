# 📅 Reservation Engine - Especificação Técnica

**Status:** 📋 **A IMPLEMENTAR**  
**Objetivo:** Antecipar demanda e prever carga operacional

---

## 🎯 PROBLEMA QUE RESOLVE

**O que o Core hoje não consegue dizer (mas deveria):**

❌ "21h está caótico"  
✅ "21h estava previsto (12 reservas grandes)"

---

## 📊 DADOS NECESSÁRIOS

### Tabelas Novas

#### `gm_reservations` (Reservas)
```sql
CREATE TABLE public.gm_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id),
  table_id UUID REFERENCES public.gm_tables(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  party_size INTEGER NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED', -- 'CONFIRMED', 'CANCELLED', 'NO_SHOW', 'COMPLETED'
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_reservations_restaurant_date ON public.gm_reservations(restaurant_id, reservation_date, reservation_time);
CREATE INDEX idx_reservations_status ON public.gm_reservations(status);
CREATE INDEX idx_reservations_table ON public.gm_reservations(table_id);
```

#### `gm_reservation_slots` (Horários Disponíveis)
```sql
CREATE TABLE public.gm_reservation_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id),
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  available_tables INTEGER NOT NULL,
  reserved_tables INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL, -- Total de pessoas que cabem
  blocked_tables INTEGER NOT NULL DEFAULT 0, -- Mesas bloqueadas (manutenção, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(restaurant_id, slot_date, slot_time)
);

CREATE INDEX idx_slots_restaurant_date ON public.gm_reservation_slots(restaurant_id, slot_date, slot_time);
```

---

## 🔗 INTEGRAÇÃO COM CORE EXISTENTE

### Dados que Já Existem

**`gm_tables`**
- Mesas disponíveis
- Capacidade por mesa
- Status (disponível, ocupada, bloqueada)

**`gm_orders`**
- Pedidos reais
- Timestamps
- Status

**`gm_restaurants`**
- Restaurantes
- Capacidade total
- Horários de funcionamento

### Como Conectar

**Previsão de Demanda:**
```sql
-- Demanda prevista baseada em reservas
SELECT 
  r.restaurant_id,
  r.reservation_date,
  r.reservation_time,
  COUNT(*) as total_reservations,
  SUM(r.party_size) as total_people,
  COUNT(*) FILTER (WHERE r.status = 'CONFIRMED') as confirmed_reservations,
  SUM(r.party_size) FILTER (WHERE r.status = 'CONFIRMED') as confirmed_people
FROM public.gm_reservations r
WHERE r.reservation_date = CURRENT_DATE
  AND r.status = 'CONFIRMED'
GROUP BY r.restaurant_id, r.reservation_date, r.reservation_time
ORDER BY r.reservation_time;
```

**Correlação: Reservas vs Pedidos Reais**
```sql
-- Comparar reservas com pedidos reais
SELECT 
  r.reservation_date,
  r.reservation_time,
  COUNT(DISTINCT r.id) as reservations_count,
  SUM(r.party_size) as reserved_people,
  COUNT(DISTINCT o.id) as actual_orders,
  COUNT(DISTINCT oi.id) as actual_items
FROM public.gm_reservations r
LEFT JOIN public.gm_orders o ON 
  o.restaurant_id = r.restaurant_id AND
  o.created_at::date = r.reservation_date AND
  EXTRACT(HOUR FROM o.created_at) = EXTRACT(HOUR FROM r.reservation_time)
LEFT JOIN public.gm_order_items oi ON oi.order_id = o.id
WHERE r.status = 'CONFIRMED'
GROUP BY r.reservation_date, r.reservation_time;
```

---

## 📈 MÉTRICAS DERIVADAS

### 1. Demand Forecasting

**Pergunta:** Quantas pessoas virão em cada horário?

**Métrica:**
```sql
SELECT 
  r.restaurant_id,
  r.reservation_date,
  r.reservation_time,
  COUNT(*) as reservations_count,
  SUM(r.party_size) as total_people,
  COUNT(*) FILTER (WHERE r.party_size >= 6) as large_parties,
  (SELECT COUNT(*) FROM public.gm_tables WHERE restaurant_id = r.restaurant_id) as total_tables,
  (SELECT SUM(capacity) FROM public.gm_tables WHERE restaurant_id = r.restaurant_id) as total_capacity
FROM public.gm_reservations r
WHERE r.reservation_date >= CURRENT_DATE
  AND r.status = 'CONFIRMED'
GROUP BY r.restaurant_id, r.reservation_date, r.reservation_time
ORDER BY r.reservation_date, r.reservation_time;
```

### 2. Capacity Planning

**Pergunta:** Restaurante tem capacidade para as reservas?

**Métrica:**
```sql
SELECT 
  rs.restaurant_id,
  rs.slot_date,
  rs.slot_time,
  rs.available_tables,
  rs.reserved_tables,
  rs.capacity,
  COUNT(DISTINCT r.id) as actual_reservations,
  SUM(r.party_size) as reserved_people,
  CASE 
    WHEN rs.reserved_tables >= rs.available_tables THEN 'FULL'
    WHEN rs.reserved_tables >= rs.available_tables * 0.8 THEN 'NEAR_FULL'
    ELSE 'AVAILABLE'
  END as capacity_status
FROM public.gm_reservation_slots rs
LEFT JOIN public.gm_reservations r ON 
  r.restaurant_id = rs.restaurant_id AND
  r.reservation_date = rs.slot_date AND
  r.reservation_time = rs.slot_time AND
  r.status = 'CONFIRMED'
GROUP BY rs.restaurant_id, rs.slot_date, rs.slot_time, rs.available_tables, rs.reserved_tables, rs.capacity;
```

### 3. Resource Preparation

**Pergunta:** O que precisa ser preparado para as reservas?

**Métrica:**
```sql
-- Estoque necessário baseado em reservas
SELECT 
  r.restaurant_id,
  r.reservation_date,
  r.reservation_time,
  SUM(r.party_size) as total_people,
  -- Estimar consumo baseado em histórico
  SUM(r.party_size) * (
    SELECT AVG(items_per_person) 
    FROM (
      SELECT 
        o.id,
        COUNT(oi.id)::float / NULLIF(SUM(DISTINCT o.party_size), 0) as items_per_person
      FROM public.gm_orders o
      JOIN public.gm_order_items oi ON oi.order_id = o.id
      WHERE o.restaurant_id = r.restaurant_id
        AND o.created_at > NOW() - INTERVAL '30 days'
      GROUP BY o.id
    ) hist
  ) as estimated_items,
  -- Verificar estoque atual
  (SELECT COUNT(*) FROM public.gm_stock WHERE restaurant_id = r.restaurant_id AND current_level < minimum_level) as critical_stock_items
FROM public.gm_reservations r
WHERE r.reservation_date = CURRENT_DATE + INTERVAL '1 day'
  AND r.status = 'CONFIRMED'
GROUP BY r.restaurant_id, r.reservation_date, r.reservation_time;
```

### 4. No-Show Impact

**Pergunta:** Quantas reservas não compareceram?

**Métrica:**
```sql
SELECT 
  r.restaurant_id,
  r.reservation_date,
  COUNT(*) FILTER (WHERE r.status = 'NO_SHOW') as no_shows,
  COUNT(*) FILTER (WHERE r.status = 'CONFIRMED') as confirmed,
  COUNT(*) FILTER (WHERE r.status = 'COMPLETED') as completed,
  COUNT(*) FILTER (WHERE r.status = 'NO_SHOW')::float / 
    NULLIF(COUNT(*) FILTER (WHERE r.status IN ('CONFIRMED', 'NO_SHOW')), 0) * 100 as no_show_rate
FROM public.gm_reservations r
WHERE r.reservation_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY r.restaurant_id, r.reservation_date
ORDER BY r.reservation_date DESC;
```

---

## 🔁 REGRAS DE INTERPRETAÇÃO

### Regra: Pico Previsto

```typescript
{
  id: 'peak-forecast',
  name: 'Pico Previsto por Reservas',
  condition: (m) => 
    m.reservedPeople > m.averagePeople * 1.5 &&
    m.largeParties > 3,
  pattern: 'Horário X tem Y reservas grandes (Z pessoas) - pico previsto',
  suggestion: {
    title: 'Pico previsto por reservas',
    actions: [
      'Aumentar staff no horário',
      'Preparar estoque com antecedência',
      'Antecipar preparação de pratos',
      'Avisar cozinha sobre demanda'
    ],
    priority: 'high',
    confidence: 0.9
  }
}
```

### Regra: Capacidade Insuficiente

```typescript
{
  id: 'capacity-insufficient',
  name: 'Capacidade Insuficiente',
  condition: (m) => 
    m.reservedTables >= m.availableTables &&
    m.reservedPeople > m.totalCapacity,
  pattern: 'Restaurante está cheio - não há mesas disponíveis',
  suggestion: {
    title: 'Capacidade insuficiente',
    actions: [
      'Bloquear novas reservas no horário',
      'Oferecer horários alternativos',
      'Aumentar capacidade (mesas extras)',
      'Cancelar reservas duplicadas'
    ],
    priority: 'high',
    confidence: 1.0
  }
}
```

### Regra: Estoque Insuficiente para Reservas

```typescript
{
  id: 'stock-insufficient-reservations',
  name: 'Estoque Insuficiente para Reservas',
  condition: (m) => 
    m.estimatedItems > m.currentStock &&
    m.criticalStockItems > 0,
  pattern: 'Estoque atual não cobre demanda prevista das reservas',
  suggestion: {
    title: 'Estoque insuficiente para reservas',
    actions: [
      'Fazer compra urgente',
      'Reduzir disponibilidade de itens',
      'Substituir por itens similares',
      'Avisar clientes sobre limitações'
    ],
    priority: 'high',
    confidence: 0.85
  }
}
```

---

## 🎯 EXEMPLO DE DECISÃO ACIONÁVEL

### Cenário Real

**Dados:**
- 12 reservas grandes confirmadas para hoje às 21h
- Total: 80 pessoas
- Estoque atual não cobre demanda prevista
- Turno das 21h tem staff normal (não suficiente para pico)

**Interpretação:**
```
Reserva detectada:
  "12 reservas grandes confirmadas para hoje às 21h (80 pessoas)"
  +
  "Estoque atual não cobre demanda prevista"
  +
  "Turno das 21h tem staff normal"
  ↓
Sugestões:
  1. "Aumentar estoque para cobrir reservas"
  2. "Adicionar staff no turno das 21h"
  3. "Preparar pratos com antecedência"
  4. "Avisar cozinha sobre demanda às 21h"
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Schema
- [ ] Criar tabela `gm_reservations`
- [ ] Criar tabela `gm_reservation_slots`
- [ ] Criar índices necessários
- [ ] Criar constraints

### Fase 2: Integração
- [ ] RPC para criar reserva
- [ ] RPC para cancelar reserva
- [ ] RPC para consultar disponibilidade
- [ ] RPC para prever demanda
- [ ] Integração com `gm_tables`
- [ ] Integração com `gm_orders`

### Fase 3: Métricas Derivadas
- [ ] Demand Forecasting
- [ ] Capacity Planning
- [ ] Resource Preparation
- [ ] No-Show Impact

### Fase 4: Rule Engine
- [ ] Regra: Pico Previsto
- [ ] Regra: Capacidade Insuficiente
- [ ] Regra: Estoque Insuficiente
- [ ] Geração de sugestões

---

## 🔗 DEPENDÊNCIAS

### Core Existente
- ✅ `gm_restaurants` (restaurantes)
- ✅ `gm_tables` (mesas)
- ✅ `gm_orders` (pedidos)
- ✅ `gm_stock` (estoque)

### Novos Componentes
- 📋 `gm_reservations` (reservas)
- 📋 `gm_reservation_slots` (horários)

### Integração Futura
- 📋 Employee Time Engine (staff necessário)
- 📋 Métricas derivadas (correlação)

---

**Última atualização:** 2026-01-27
