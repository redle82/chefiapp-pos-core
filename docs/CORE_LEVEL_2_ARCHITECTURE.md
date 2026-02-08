# 🧠 Core Level 2 - Arquitetura de Interpretação

**Data:** 2026-01-27  
**Status:** 📋 **ARQUITETURA DEFINIDA**  
**Objetivo:** Transformar telemetria em decisão acionável

---

## 🎯 FILOSOFIA

> "O Core não precisa fazer mais coisas. Ele precisa explicar melhor o que já sabe."

**Mudança fundamental:**
- ❌ De: Evento → Métrica → Alerta (telemetria crua)
- ✅ Para: Evento → Métrica → Padrão → Sugestão → Ação (decisão acionável)

---

## 🏗️ ARQUITETURA EM CAMADAS

### Camada 0: Core Base (v1.0) ✅
**Status:** Congelado e validado

- Aplica regras
- Bloqueia estados ilegais
- Processa pedidos, KDS, estoque, tasks, SLA
- Registra tudo
- Aguenta caos

**O que faz:** Registra a verdade

---

### Camada 1: Métricas Derivadas 🧠
**Status:** 📋 A definir

**Objetivo:** Medir relações, não apenas eventos

#### Exemplos de Métricas Derivadas

**Root Cause Distribution**
- SLA violado por causa de quê?
- Atraso por estação?
- Pedidos atrasam antes ou depois do KDS?
- Estoque acaba por consumo real ou má compra?

**Bottleneck Frequency**
- Qual estação é gargalo recorrente?
- Em que horários?
- Com que frequência?

**Time-to-Recover**
- Quanto tempo leva para resolver?
- Qual a causa mais comum?
- Onde demora mais?

**Stock Turnover Stress**
- Estoque acaba por demanda real?
- Ou por planejamento inadequado?

**👉 Isso não muda o Core — ele usa os dados do Core.**

---

### Camada 2: Rule Engine (Loop de Decisão) 🔁
**Status:** 📋 A definir

**Objetivo:** Transformar padrões em sugestões acionáveis

#### Fluxo

```
Evento → Métrica → Padrão → Sugestão → Ação
```

#### Exemplo Real

```
"BAR atrasou 5x nesta semana"
  ↓
Regra detecta padrão: "Gargalo recorrente em estação"
  ↓
Sugestão: "+1 pessoa / reduzir cardápio / mudar fluxo"
  ↓
Ação: Gerente decide e implementa
```

**👉 Aqui nasce o Core que pensa, não só registra.**

---

### Camada 3: Métricas de Qualidade do Sistema 📊
**Status:** 📋 A definir

**Objetivo:** Medir se o Core está ajudando ou só gritando

#### Métricas de Qualidade

**Decisões Tomadas a Tempo**
- Quantas decisões foram tomadas antes do problema escalar?
- Taxa de sucesso preventivo

**Alertas Ignorados**
- Quantos alertas foram ignorados?
- Por quê? (falsos positivos, timing errado, etc.)

**Ações Resolveram o Problema**
- Quantas ações realmente resolveram?
- Taxa de eficácia das sugestões

**Avisos Tardios**
- Onde o sistema avisou tarde demais?
- O que poderia ter sido previsto?

**👉 Isso mede se o Core está ajudando ou só gritando.**

---

## 🕒 MOTOR 1: Employee Time Engine

### Problema Identificado

**O que o Core hoje não consegue dizer (mas deveria):**

❌ "BAR atrasou"  
✅ "BAR atrasou porque tinha 1 funcionário a menos no turno das 20h"

### O Que Falta Formalmente

Um **Employee Time Engine** que saiba:
- Horários planejados
- Turnos reais (check-in/check-out)
- Faltas
- Sobrecarga
- Correlação direta com:
  - Atraso
  - SLA violado
  - Gargalo

### Integração com Core Existente

**Dados que já existem:**
- `gm_users` (funcionários)
- `gm_tasks` (tarefas com SLA)
- `gm_order_items` (itens com atrasos)
- Eventos de KDS

**O que falta:**
- `gm_shifts` (turnos planejados)
- `gm_attendance` (check-in/check-out real)
- `gm_schedule` (escala)

### Métricas Derivadas Possíveis

**Staff Coverage vs Demand**
- "Turno tinha X pessoas, mas precisava de Y"
- Correlação direta com atrasos

**Absenteeism Impact**
- "Falta de 1 pessoa causou atraso em N pedidos"
- Impacto quantificado

**Overstaffing Detection**
- "Turno tinha pessoas demais (custo desnecessário)"

**Skill Mismatch**
- "Estação precisa de skill X, mas tinha pessoa com skill Y"

### Exemplo de Decisão Acionável

```
Padrão detectado:
  "BAR atrasou 5x nesta semana, sempre no turno das 20h"
  +
  "Turno das 20h tem 1 pessoa a menos que o necessário"
  ↓
Sugestão:
  "Adicionar 1 pessoa no turno das 20h"
  OU
  "Reduzir cardápio de bebidas no horário de pico"
  OU
  "Mudar fluxo: preparar drinks com antecedência"
```

---

## 📅 MOTOR 2: Reservation Engine

### Problema Identificado

**O que o Core hoje não consegue dizer (mas deveria):**

❌ "21h está caótico"  
✅ "21h estava previsto (12 reservas grandes)"

### O Que Falta Formalmente

Um **Reservation Engine** integrado ao Core que permita:
- Saber:
  - Quantas mesas estarão ocupadas
  - Em que horário
  - Com quantas pessoas
- Prever:
  - Carga futura
  - Estoque necessário
  - Staff necessário

### Integração com Core Existente

**Dados que já existem:**
- `gm_tables` (mesas)
- `gm_orders` (pedidos)
- `gm_restaurants` (restaurantes)

**O que falta:**
- `gm_reservations` (reservas)
- `gm_reservation_slots` (horários disponíveis)
- Previsão de demanda baseada em reservas

### Métricas Derivadas Possíveis

**Demand Forecasting**
- "Hoje às 21h teremos pico por causa de 12 reservas grandes"
- Previsão baseada em reservas confirmadas

**Capacity Planning**
- "Restaurante tem capacidade para X, mas reservou Y"
- Detecção de overbooking

**Resource Preparation**
- "Preparar estoque para reserva de 20 pessoas às 20h"
- Antecipação de necessidade

**No-Show Impact**
- "Reserva não compareceu: impacto em preparação e estoque"

### Exemplo de Decisão Acionável

```
Reserva detectada:
  "12 reservas grandes confirmadas para hoje às 21h"
  +
  "Estoque atual não cobre demanda prevista"
  ↓
Sugestão:
  "Aumentar estoque para cobrir reservas"
  OU
  "Adicionar staff no turno das 21h"
  OU
  "Preparar pratos com antecedência"
```

---

## 🔗 COMO OS MOTORES SE CONECTAM

### Fluxo Integrado

```
Reservation Engine
  ↓
"12 reservas às 21h"
  ↓
Employee Time Engine
  ↓
"Turno das 21h tem staff suficiente?"
  ↓
Core Base
  ↓
"Processar pedidos"
  ↓
Métricas Derivadas
  ↓
"BAR atrasou por causa de escala ou demanda?"
  ↓
Rule Engine
  ↓
Sugestão acionável
```

### Exemplo Completo

**Cenário:**
1. 12 reservas confirmadas para hoje às 21h
2. Turno das 21h tem 2 pessoas (normalmente suficiente)
3. Mas com 12 reservas grandes, precisa de 3
4. Sistema detecta padrão: "BAR sempre atrasa com reservas grandes"
5. Sugestão: "Adicionar 1 pessoa no turno das 21h hoje"

**Resultado:**
- Sistema não só reage (quando atrasa)
- Sistema antecipa (antes de atrasar)

---

## 📊 MAPEAMENTO DE MÉTRICAS DERIVADAS

### 1. Root Cause Distribution

**Pergunta:** SLA violado por causa de quê?

**Métricas necessárias:**
- SLA violado + Estação
- SLA violado + Staff coverage
- SLA violado + Demanda (reservas)
- SLA violado + Estoque

**Fonte de dados:**
- `gm_tasks` (SLA)
- `gm_shifts` (staff)
- `gm_reservations` (demanda)
- `gm_stock` (estoque)

### 2. Bottleneck Frequency

**Pergunta:** Qual estação é gargalo recorrente?

**Métricas necessárias:**
- Atrasos por estação
- Frequência de atrasos
- Horários de pico por estação

**Fonte de dados:**
- `gm_order_items` (atrasos)
- `gm_kds_stations` (estações)
- `gm_reservations` (horários de pico)

### 3. Time-to-Recover

**Pergunta:** Quanto tempo leva para resolver?

**Métricas necessárias:**
- Tempo entre problema e resolução
- Causa mais comum
- Onde demora mais

**Fonte de dados:**
- `gm_tasks` (criação → resolução)
- `gm_order_items` (atraso → pronto)

### 4. Stock Turnover Stress

**Pergunta:** Estoque acaba por demanda real ou planejamento?

**Métricas necessárias:**
- Consumo real vs previsto
- Reservas vs estoque disponível
- Compras vs consumo

**Fonte de dados:**
- `gm_stock` (estoque)
- `gm_reservations` (demanda prevista)
- `gm_purchases` (compras)

---

## 🔁 RULE ENGINE - REGRAS DE INTERPRETAÇÃO

### Estrutura de Regra

```typescript
interface Rule {
  id: string;
  name: string;
  condition: (metrics: DerivedMetrics) => boolean;
  pattern: string; // Padrão detectado
  suggestion: {
    title: string;
    actions: string[];
    priority: 'high' | 'medium' | 'low';
    confidence: number; // 0-1
  };
}
```

### Exemplos de Regras

#### Regra 1: Gargalo Recorrente
```typescript
{
  id: 'bottleneck-recurring',
  name: 'Gargalo Recorrente em Estação',
  condition: (m) => 
    m.bottleneckFrequency[station] > 5 && 
    m.bottleneckFrequency[station] / m.totalDays > 0.7,
  pattern: 'Estação X atrasou Y vezes em Z dias',
  suggestion: {
    title: 'Gargalo recorrente detectado',
    actions: [
      'Adicionar staff na estação',
      'Reduzir cardápio da estação',
      'Mudar fluxo de preparação'
    ],
    priority: 'high',
    confidence: 0.8
  }
}
```

#### Regra 2: Staff Insuficiente
```typescript
{
  id: 'staff-insufficient',
  name: 'Staff Insuficiente para Demanda',
  condition: (m) => 
    m.staffCoverage[shift] < m.requiredStaff[shift] &&
    m.demandForecast[shift] > m.capacity[shift],
  pattern: 'Turno X tem Y pessoas, mas precisa de Z',
  suggestion: {
    title: 'Staff insuficiente para demanda prevista',
    actions: [
      'Adicionar pessoa no turno',
      'Reduzir reservas no horário',
      'Antecipar preparação'
    ],
    priority: 'high',
    confidence: 0.9
  }
}
```

#### Regra 3: Estoque Crítico Previsto
```typescript
{
  id: 'stock-critical-forecast',
  name: 'Estoque Crítico Previsto',
  condition: (m) => 
    m.stockCurrent[item] < m.stockMinimum[item] &&
    m.demandForecast[item] > m.stockCurrent[item],
  pattern: 'Item X está em Y, mas demanda prevista é Z',
  suggestion: {
    title: 'Estoque insuficiente para demanda prevista',
    actions: [
      'Fazer compra urgente',
      'Reduzir disponibilidade do item',
      'Substituir por item similar'
    ],
    priority: 'high',
    confidence: 0.85
  }
}
```

---

## 📈 MÉTRICAS DE QUALIDADE DO SISTEMA

### 1. Decisões Tomadas a Tempo

**Métrica:**
```
Taxa de Decisão Preventiva = 
  Decisões tomadas antes do problema / Total de problemas
```

**Objetivo:** > 70%

### 2. Alertas Ignorados

**Métrica:**
```
Taxa de Alerta Ignorado = 
  Alertas ignorados / Total de alertas
```

**Objetivo:** < 20%

**Análise:**
- Por que foram ignorados?
- Falsos positivos?
- Timing errado?
- Prioridade incorreta?

### 3. Ações Resolveram o Problema

**Métrica:**
```
Taxa de Eficácia = 
  Problemas resolvidos pela ação / Total de ações tomadas
```

**Objetivo:** > 60%

### 4. Avisos Tardios

**Métrica:**
```
Taxa de Aviso Tardio = 
  Avisos dados após problema escalar / Total de avisos
```

**Objetivo:** < 10%

---

## 🚫 O QUE NÃO PRECISA FAZER

### ❌ Não Precisa:
- Testar 10.000 restaurantes
- Complicar infra
- Refatorar Core
- Mudar Docker
- Mexer em regras constitucionais

**Tudo isso já está no ponto certo.**

---

## ✅ O QUE PRECISA FAZER

### ✅ Adicionar Camada, Não Reescrever

**Pensa assim:**
- Core atual = Sistema Nervoso
- Próximo nível = Córtex Pré-Frontal

**Ele não faz força. Ele interpreta.**

### Componentes Necessários

1. **Employee Time Engine**
   - Tabelas: `gm_shifts`, `gm_attendance`, `gm_schedule`
   - Integração com métricas existentes

2. **Reservation Engine**
   - Tabelas: `gm_reservations`, `gm_reservation_slots`
   - Integração com previsão de demanda

3. **Métricas Derivadas**
   - Queries que cruzam dados
   - Cálculos de relações

4. **Rule Engine**
   - Regras de interpretação
   - Geração de sugestões

5. **Métricas de Qualidade**
   - Feedback loop
   - Medição de eficácia

---

## 🎯 PRÓXIMO PASSO NATURAL

### Criar o Motor de Interpretação de Métricas

**Algo que:**
- Consome as métricas que já existem
- Gera:
  - Causas prováveis
  - Sugestões
  - Prioridades
- Alimenta a UI com respostas, não números

**Isso transforma o sistema de:**
- "observável"
- em
- "operável inteligentemente"

---

## 📝 RESUMO

### O Que Já Existe ✅
- Core base validado
- Métricas brutas
- Observabilidade

### O Que Falta 📋
- Métricas derivadas (relações)
- Rule Engine (interpretação)
- Employee Time Engine (horários)
- Reservation Engine (reservas)
- Métricas de qualidade (feedback)

### O Que Não Precisa ❌
- Mais stress
- Mais caos
- Refatoração do Core
- Mudanças estruturais

---

**Última atualização:** 2026-01-27
