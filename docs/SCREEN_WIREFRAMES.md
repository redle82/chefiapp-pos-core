# 📐 Wireframes Textuais - ChefIApp

**Status:** 📋 **WIREFRAMES DEFINIDOS**  
**Objetivo:** Especificação completa de cada tela

---

## 🎯 FORMATO

Cada tela terá:
- **Componentes:** Lista de componentes
- **Cards:** Elementos principais
- **Ações:** Botões e interações
- **Estados Vazios:** Quando não há dados
- **TODOs:** Integração futura

---

## 👤 FUNCIONÁRIO

### 1. Início (home/index.tsx)

**Componentes:**
- Header (nome, cargo, restaurante)
- ShiftStatusCard (status do turno atual)
- FocusCard (foco do dia: "3 tarefas pendentes")
- QuickActions (botões rápidos: Check-in, Ver tarefas)

**Cards:**
- ShiftStatusCard
  - Status: "Em turno" / "Fora do turno"
  - Horário: "08:00 - 16:00"
  - Tempo restante: "4h 30min"
- FocusCard
  - Título: "Foco do dia"
  - Lista: 3 tarefas prioritárias
  - Ação: "Ver todas"

**Ações:**
- Check-in/Check-out (se fora do turno)
- Ver tarefas
- Ver operação

**Estado Vazio:**
- "Você não está em turno hoje"
- Botão: "Ver próximos turnos"

**TODOs:**
- [ ] Integrar com Employee Time Engine
- [ ] Buscar turno atual do usuário
- [ ] Calcular tempo restante

---

### 2. Tarefas (tasks/index.tsx)

**Componentes:**
- Header (filtros: Todas, Pendentes, Em andamento)
- TaskList (lista de tarefas)
- TaskCard (card de tarefa)

**Cards:**
- TaskCard
  - Título da tarefa
  - Tipo: "LIMPEZA", "ESTOQUE", etc.
  - SLA: "2h restantes" / "Atrasado"
  - Status: Badge (Pendente, Em andamento, Concluída)
  - Ação: "Iniciar" / "Concluir"

**Ações:**
- Filtrar tarefas
- Iniciar tarefa
- Concluir tarefa
- Ver detalhe

**Estado Vazio:**
- "Nenhuma tarefa pendente"
- "Parabéns! Você está em dia"

**TODOs:**
- [ ] Integrar com Task Engine
- [ ] Buscar tasks do usuário
- [ ] Atualizar status em tempo real

---

### 3. Operação - Garçom (operation/waiter/tables.tsx)

**Componentes:**
- Header (filtros: Ocupadas, Livres, Reservadas)
- TableGrid (grid de mesas)
- TableCard (card de mesa)

**Cards:**
- TableCard
  - Número da mesa
  - Status: "Livre" / "Ocupada" / "Reservada"
  - Pedido atual (se houver)
  - Tempo na mesa: "45min"
  - Ação: "Abrir pedido" / "Ver pedido"

**Ações:**
- Abrir novo pedido
- Ver pedido existente
- Fechar pedido
- Filtrar mesas

**Estado Vazio:**
- "Nenhuma mesa disponível"
- (Todas ocupadas ou fechado)

**TODOs:**
- [ ] Integrar com gm_tables
- [ ] Buscar mesas do restaurante
- [ ] Integrar com create_order_atomic

---

### 4. Operação - Cozinha (operation/kitchen/stations.tsx)

**Componentes:**
- Header (estações: KITCHEN, BAR)
- StationTabs (abas por estação)
- KDSItemList (lista de itens)
- KDSItemCard (card de item)

**Cards:**
- KDSItemCard
  - Número do pedido
  - Item: "Hambúrguer"
  - Mesa: "Mesa 5"
  - Tempo: "12min" / "Atrasado"
  - Status: Badge (Pendente, Em preparo, Pronto)
  - Ação: "Iniciar" / "Marcar pronto"

**Ações:**
- Filtrar por estação
- Iniciar preparo
- Marcar como pronto
- Bloquear item (falta ingrediente)

**Estado Vazio:**
- "Nenhum item pendente"
- "Cozinha em dia!"

**TODOs:**
- [ ] Integrar com KDS
- [ ] Buscar itens por estação
- [ ] Integrar com mark_item_ready

---

### 5. Mentor IA - Agora (mentor/index.tsx)

**Componentes:**
- Header
- MentorCard (card principal)
- ActionButton (botão de ação)

**Cards:**
- MentorCard
  - Título: "O que fazer agora"
  - Mensagem: Texto da mentoria
  - Contexto: "Baseado em: 3 atrasos hoje"
  - Ação sugerida: Botão claro
  - Feedback: "Foi útil?" (sim/não)

**Ações:**
- Ver ação sugerida
- Marcar como útil/não útil
- Ver treino rápido relacionado

**Estado Vazio:**
- "Nada para agora"
- "Continue assim!"

**TODOs:**
- [ ] Integrar com Mentoria IA
- [ ] Buscar mentoria contextual
- [ ] Coletar feedback

---

## 👔 GERENTE

### 1. Escala do Dia (schedule/index.tsx)

**Componentes:**
- Header (data, filtros: Hoje, Semana)
- ShiftList (lista de turnos)
- ShiftCard (card de turno)
- CoverageAlert (alertas de cobertura)

**Cards:**
- ShiftCard
  - Função: "Garçom", "Cozinha", "Bar"
  - Pessoa: Nome
  - Horário: "08:00 - 16:00"
  - Status: Badge (Confirmado, Ausente, Atrasado)
  - Check-in: "08:05" (se atrasado)
  - Ação: "Ver detalhes" / "Substituir"

**Ações:**
- Criar novo turno
- Editar turno
- Substituir pessoa
- Ver relatório

**Estado Vazio:**
- "Nenhum turno hoje"
- Botão: "Criar turno"

**TODOs:**
- [ ] Integrar com Employee Time Engine
- [ ] Buscar turnos do dia
- [ ] Integrar check-in/check-out

---

### 2. Criar/Editar Turno (schedule/create.tsx)

**Componentes:**
- Header (título: "Novo Turno" / "Editar Turno")
- Form (formulário)
- PersonSelector (seletor de pessoa)
- TimePicker (seletor de horário)

**Campos:**
- Pessoa (dropdown)
- Função (dropdown: Garçom, Cozinha, Bar, Limpeza)
- Data (date picker)
- Hora início (time picker)
- Hora fim (time picker)
- Estação (opcional, se aplicável)

**Ações:**
- Salvar turno
- Cancelar
- Validar conflitos

**TODOs:**
- [ ] Integrar com gm_shifts
- [ ] Validar conflitos de horário
- [ ] Criar/atualizar turno

---

### 3. Agenda de Reservas (reservations/index.tsx)

**Componentes:**
- Header (filtros: Hoje, Semana, Mês)
- CalendarView (calendário)
- ReservationList (lista de reservas)
- ReservationCard (card de reserva)

**Cards:**
- ReservationCard
  - Nome do cliente
  - Pessoas: "4 pessoas"
  - Horário: "20:00"
  - Mesa: "Mesa 12" (se alocada)
  - Status: Badge (Confirmada, Pendente, Cancelada)
  - Ação: "Ver detalhes" / "Alocar mesa"

**Ações:**
- Nova reserva
- Filtrar por data
- Alocar mesa
- Cancelar reserva

**Estado Vazio:**
- "Nenhuma reserva hoje"
- Botão: "Nova reserva"

**TODOs:**
- [ ] Integrar com Reservation Engine
- [ ] Buscar reservas
- [ ] Integrar com gm_reservations

---

### 4. Nova Reserva (reservations/create.tsx)

**Componentes:**
- Header ("Nova Reserva")
- Form (formulário)
- TableSelector (seletor de mesa)
- TimeSlotSelector (seletor de horário)

**Campos:**
- Nome do cliente (text)
- Telefone (text)
- Email (text, opcional)
- Número de pessoas (number)
- Data (date picker)
- Horário (time picker)
- Preferências (text, opcional)
- Alergias (text, opcional)

**Ações:**
- Verificar disponibilidade
- Criar reserva
- Cancelar

**TODOs:**
- [ ] Integrar com Reservation Engine
- [ ] Validar disponibilidade
- [ ] Criar reserva

---

### 5. Central - O Que Fazer Agora (central/actions.tsx)

**Componentes:**
- Header
- ActionList (lista de ações)
- ActionCard (card de ação)

**Cards:**
- ActionCard
  - Prioridade: Badge (Alta, Média, Baixa)
  - Título: "Adicionar 1 pessoa no turno das 20h"
  - Contexto: "BAR atrasou 5x esta semana"
  - Impacto: "Evitar 3 SLAs violados"
  - Ação: Botão claro
  - Origem: "Mentoria IA" / "Sistema"

**Ações:**
- Executar ação
- Adiar ação
- Ver mais detalhes

**Estado Vazio:**
- "Nada para fazer agora"
- "Tudo sob controle!"

**TODOs:**
- [ ] Integrar com Rule Engine
- [ ] Buscar ações sugeridas
- [ ] Integrar com Mentoria IA

---

## 🏠 DONO

### 1. Visão (vision/index.tsx)

**Componentes:**
- Header
- KPICards (cards de KPIs)
- ForecastCard (previsão)
- AlertCard (alertas críticos)

**Cards:**
- KPICard
  - Título: "Pedidos Hoje"
  - Valor: "156"
  - Variação: "+12% vs ontem"
  - Gráfico: Mini gráfico (opcional)
- ForecastCard
  - Título: "Previsão de Hoje"
  - Reservas: "12 reservas confirmadas"
  - Pico previsto: "21:00"
  - Sugestão: "Adicionar 1 pessoa no turno"
- AlertCard
  - Severidade: Badge (Crítico, Aviso)
  - Mensagem: "3 itens com estoque crítico"
  - Ação: "Ver estoque"

**Ações:**
- Ver detalhes de KPI
- Ver previsão completa
- Resolver alerta

**TODOs:**
- [ ] Integrar com métricas do Core
- [ ] Buscar KPIs do restaurante
- [ ] Integrar com Reservation Engine (previsão)

---

### 2. Lista de Compras (purchases/index.tsx)

**Componentes:**
- Header (filtros: Auto, Manual, Todas)
- ShoppingList (lista de compras)
- ShoppingListItem (item da lista)

**Cards:**
- ShoppingListItem
  - Item: "Tomate"
  - Quantidade: "10kg"
  - Motivo: "Estoque crítico" / "Previsão de demanda"
  - Fornecedor: "Fornecedor X"
  - Lead time: "2 dias"
  - Ação: "Criar pedido"

**Ações:**
- Gerar lista automática
- Adicionar item manual
- Criar pedido de compra
- Ver fornecedores

**Estado Vazio:**
- "Nenhum item na lista"
- Botão: "Gerar lista automática"

**TODOs:**
- [ ] Integrar com generate_shopping_list
- [ ] Buscar lista de compras
- [ ] Integrar com estoque crítico

---

### 3. Fornecedores (purchases/suppliers.tsx)

**Componentes:**
- Header (busca, filtros)
- SupplierList (lista de fornecedores)
- SupplierCard (card de fornecedor)

**Cards:**
- SupplierCard
  - Nome do fornecedor
  - Categoria: "Hortifruti", "Carnes", etc.
  - Lead time médio: "2 dias"
  - Última compra: "3 dias atrás"
  - Status: Badge (Ativo, Inativo)
  - Ação: "Ver histórico" / "Criar pedido"

**Ações:**
- Novo fornecedor
- Editar fornecedor
- Criar pedido
- Ver histórico

**Estado Vazio:**
- "Nenhum fornecedor cadastrado"
- Botão: "Adicionar fornecedor"

**TODOs:**
- [ ] Integrar com gm_suppliers
- [ ] Buscar fornecedores
- [ ] Calcular lead time médio

---

### 4. Pessoas - Escala (people/schedule.tsx)

**Componentes:**
- Header (filtros: Semana, Mês)
- ScheduleView (visão da escala)
- PersonCard (card de pessoa)
- ShiftTimeline (linha do tempo de turnos)

**Cards:**
- PersonCard
  - Nome
  - Função: "Garçom", "Cozinha", etc.
  - Turnos esta semana: "5 turnos"
  - Horas trabalhadas: "40h"
  - Status: Badge (Ativo, Férias, Licença)
  - Ação: "Ver turnos" / "Ver performance"

**Ações:**
- Ver escala da pessoa
- Ver performance
- Editar turnos

**TODOs:**
- [ ] Integrar com Employee Time Engine
- [ ] Buscar pessoas e turnos
- [ ] Calcular horas trabalhadas

---

## 🎨 COMPONENTES REUTILIZÁVEIS

### Button.tsx
```typescript
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}
```

### Card.tsx
```typescript
interface CardProps {
  title?: string;
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'highlighted' | 'alert';
}
```

### Badge.tsx
```typescript
interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'medium';
}
```

### EmptyState.tsx
```typescript
interface EmptyStateProps {
  title: string;
  message?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Estrutura
- [ ] Criar estrutura de pastas
- [ ] Configurar Expo Router
- [ ] Criar tipos TypeScript
- [ ] Configurar Supabase client

### Fase 2: Componentes Base
- [ ] Button, Card, Badge, EmptyState
- [ ] Header, BottomTabs
- [ ] Componentes de operação
- [ ] Componentes de escala
- [ ] Componentes de reservas

### Fase 3: Telas
- [ ] Telas de Funcionário
- [ ] Telas de Gerente
- [ ] Telas de Dono
- [ ] Placeholders funcionais

### Fase 4: Integração
- [ ] Integrar com Supabase
- [ ] Conectar com Core
- [ ] Implementar lógica de negócio

---

**Última atualização:** 2026-01-27
