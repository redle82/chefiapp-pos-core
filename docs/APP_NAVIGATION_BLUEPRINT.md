# 📱 Blueprint de Navegação - ChefIApp

**Status:** 📋 **BLUEPRINT DEFINIDO**  
**Stack:** React Native + Expo + TypeScript  
**Arquitetura:** Feature-based, modular

---

## 🎯 PRINCÍPIOS

### 1 App, 3 Perfis
- **Funcionário:** Foco operacional, tarefas, mentoria
- **Gerente:** Controle operacional, escala, reservas
- **Dono:** Visão estratégica, pessoas, compras

### Regra de Ouro
**Central de Comando existe para Gerente/Dono. Funcionário vê só "alertas pessoais".**

---

## 📱 NAVEGAÇÃO-MÃE

### Funcionário (Bottom Tabs)
1. **Início** - Status do turno + foco do dia
2. **Tarefas** - Tasks + SLA
3. **Operação** - Depende do cargo (Garçom/Bar/Cozinha/Limpeza)
4. **Mentor IA** - Mentoria contextual
5. **Perfil** - Streak, XP, conquistas

### Gerente (Bottom Tabs)
1. **Painel** - Saúde do turno
2. **Escala** - Horários/turnos
3. **Reservas** - Previsão de demanda
4. **Operação** - KDS/Salão/Bar em modo controle
5. **Central** - Alertas + progresso + "o que fazer agora"

### Dono (Bottom Tabs)
1. **Visão** - KPIs de negócio
2. **Central** - Observabilidade + alertas
3. **Pessoas** - Escala + performance
4. **Compras** - Estoque/fornecedores/lista de compras
5. **Config** - Restaurantes, políticas, constituição

---

## 🗂️ ESTRUTURA DE PASTAS

```
merchant-portal/src/
├── app/                          # Expo Router (app directory)
│   ├── (auth)/                   # Auth stack
│   │   ├── login.tsx
│   │   └── _layout.tsx
│   │
│   ├── (employee)/               # Funcionário stack
│   │   ├── _layout.tsx           # Bottom tabs
│   │   ├── home/                 # Tab 1: Início
│   │   │   ├── index.tsx
│   │   │   └── shift-status.tsx
│   │   ├── tasks/                # Tab 2: Tarefas
│   │   │   ├── index.tsx
│   │   │   └── [taskId].tsx
│   │   ├── operation/            # Tab 3: Operação
│   │   │   ├── index.tsx         # Seleção de função
│   │   │   ├── waiter/           # Garçom
│   │   │   │   ├── tables.tsx
│   │   │   │   ├── orders.tsx
│   │   │   │   └── payment.tsx
│   │   │   ├── kitchen/          # Cozinha (KDS)
│   │   │   │   ├── stations.tsx
│   │   │   │   └── [orderId].tsx
│   │   │   ├── bar/              # Bar (KDS)
│   │   │   │   └── stations.tsx
│   │   │   └── cleaning/        # Limpeza
│   │   │       └── checklist.tsx
│   │   ├── mentor/               # Tab 4: Mentor IA
│   │   │   ├── index.tsx         # Mentor Agora
│   │   │   ├── training.tsx      # Treino rápido
│   │   │   └── feedback.tsx      # Feedback do Turno
│   │   └── profile/              # Tab 5: Perfil
│   │       ├── index.tsx
│   │       ├── achievements.tsx
│   │       └── stats.tsx
│   │
│   ├── (manager)/                # Gerente stack
│   │   ├── _layout.tsx           # Bottom tabs
│   │   ├── dashboard/            # Tab 1: Painel
│   │   │   └── index.tsx
│   │   ├── schedule/             # Tab 2: Escala
│   │   │   ├── index.tsx         # Escala do Dia
│   │   │   ├── create.tsx        # Criar/Editar Turno
│   │   │   ├── coverage.tsx      # Cobertura & Troca
│   │   │   └── report.tsx        # Relatório do Turno
│   │   ├── reservations/         # Tab 3: Reservas
│   │   │   ├── index.tsx         # Agenda
│   │   │   ├── create.tsx        # Nova Reserva
│   │   │   ├── map.tsx           # Mapa de Mesas
│   │   │   ├── queue.tsx         # Fila/Walk-ins
│   │   │   └── forecast.tsx      # Previsão Operacional
│   │   ├── operation/            # Tab 4: Operação
│   │   │   ├── index.tsx         # Visão geral
│   │   │   ├── kds.tsx           # KDS supervisão
│   │   │   ├── floor.tsx         # Salão
│   │   │   └── bar.tsx           # Bar
│   │   └── central/              # Tab 5: Central
│   │       ├── index.tsx         # Resumo
│   │       ├── actions.tsx       # O que fazer agora
│   │       ├── explorer.tsx     # Explorer por runId
│   │       ├── sla.tsx           # SLA Explorer
│   │       └── incidents.tsx     # Incidentes
│   │
│   └── (owner)/                  # Dono stack
│       ├── _layout.tsx           # Bottom tabs
│       ├── vision/               # Tab 1: Visão
│       │   └── index.tsx
│       ├── central/              # Tab 2: Central
│       │   ├── index.tsx
│       │   ├── explorer.tsx
│       │   └── sla.tsx
│       ├── people/               # Tab 3: Pessoas
│       │   ├── index.tsx
│       │   ├── schedule.tsx      # Escala
│       │   └── performance.tsx   # Performance
│       ├── purchases/            # Tab 4: Compras
│       │   ├── index.tsx         # Lista de Compras (auto)
│       │   ├── suppliers.tsx     # Fornecedores
│       │   ├── create.tsx        # Pedido de Compra
│       │   ├── receiving.tsx     # Recebimento
│       │   └── costs.tsx         # Custos & Margem
│       └── config/               # Tab 5: Config
│           ├── index.tsx
│           ├── restaurants.tsx
│           ├── policies.tsx
│           └── constitution.tsx
│
├── components/                   # Componentes reutilizáveis
│   ├── ui/                       # UI base
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── EmptyState.tsx
│   ├── navigation/               # Navegação
│   │   ├── BottomTabs.tsx
│   │   └── Header.tsx
│   ├── operation/                # Operação
│   │   ├── TableCard.tsx
│   │   ├── OrderCard.tsx
│   │   └── KDSItem.tsx
│   ├── schedule/                 # Escala
│   │   ├── ShiftCard.tsx
│   │   └── CoverageView.tsx
│   ├── reservations/             # Reservas
│   │   ├── ReservationCard.tsx
│   │   └── TableMap.tsx
│   ├── purchases/                # Compras
│   │   ├── ShoppingListCard.tsx
│   │   └── SupplierCard.tsx
│   └── mentor/                   # Mentoria
│       ├── MentorCard.tsx
│       └── ActionCard.tsx
│
├── features/                     # Features (lógica de negócio)
│   ├── schedule/                 # Employee Time Engine
│   │   ├── hooks/
│   │   │   ├── useShifts.ts
│   │   │   └── useAttendance.ts
│   │   └── services/
│   │       └── scheduleService.ts
│   ├── reservations/             # Reservation Engine
│   │   ├── hooks/
│   │   │   └── useReservations.ts
│   │   └── services/
│   │       └── reservationService.ts
│   ├── purchases/                # Supply Loop
│   │   ├── hooks/
│   │   │   └── usePurchases.ts
│   │   └── services/
│   │       └── purchaseService.ts
│   ├── operation/                # Operação
│   │   ├── hooks/
│   │   │   └── useOperation.ts
│   │   └── services/
│   │       └── operationService.ts
│   ├── mentor/                   # Mentoria IA
│   │   ├── hooks/
│   │   │   └── useMentorship.ts
│   │   └── services/
│   │       └── mentorshipService.ts
│   └── central/                  # Central de Comando
│       ├── hooks/
│       │   └── useCentral.ts
│       └── services/
│           └── centralService.ts
│
├── types/                        # TypeScript types
│   ├── user.ts                   # Perfis
│   ├── schedule.ts               # Turnos
│   ├── reservations.ts           # Reservas
│   ├── purchases.ts              # Compras
│   ├── operation.ts              # Operação
│   └── mentor.ts                 # Mentoria
│
└── lib/                          # Utilitários
    ├── supabase.ts              # Cliente Supabase
    └── utils.ts                 # Helpers
```

---

## 🗺️ MAPA DE ROTAS

### Funcionário
```
(employee)/
├── home/                    # Início
│   └── shift-status         # Status do turno
├── tasks/                   # Tarefas
│   └── [taskId]             # Detalhe da tarefa
├── operation/               # Operação
│   ├── waiter/              # Garçom
│   ├── kitchen/             # Cozinha
│   ├── bar/                 # Bar
│   └── cleaning/            # Limpeza
├── mentor/                  # Mentor IA
│   ├── training             # Treino rápido
│   └── feedback             # Feedback do Turno
└── profile/                 # Perfil
```

### Gerente
```
(manager)/
├── dashboard/               # Painel
├── schedule/                # Escala
│   ├── create               # Criar/Editar Turno
│   ├── coverage             # Cobertura & Troca
│   └── report               # Relatório do Turno
├── reservations/            # Reservas
│   ├── create               # Nova Reserva
│   ├── map                  # Mapa de Mesas
│   ├── queue                # Fila/Walk-ins
│   └── forecast             # Previsão Operacional
├── operation/               # Operação
│   ├── kds                  # KDS supervisão
│   ├── floor                # Salão
│   └── bar                  # Bar
└── central/                 # Central
    ├── actions              # O que fazer agora
    ├── explorer             # Explorer por runId
    ├── sla                  # SLA Explorer
    └── incidents            # Incidentes
```

### Dono
```
(owner)/
├── vision/                  # Visão
├── central/                 # Central
│   ├── explorer             # Explorer
│   └── sla                  # SLA Explorer
├── people/                  # Pessoas
│   ├── schedule             # Escala
│   └── performance          # Performance
├── purchases/               # Compras
│   ├── suppliers            # Fornecedores
│   ├── create               # Pedido de Compra
│   ├── receiving            # Recebimento
│   └── costs                # Custos & Margem
└── config/                  # Config
    ├── restaurants          # Restaurantes
    ├── policies             # Políticas
    └── constitution         # Constituição
```

---

## 📋 RESUMO: ONDE FICA CADA COISA

| Módulo | Funcionário | Gerente | Dono |
|--------|-------------|---------|------|
| **Turnos/Horários** | Check-in/out | Escala | Pessoas → Escala |
| **Reservas** | - | Reservas | Visão (cards) |
| **Compras** | - | Atalho (crítico) | Compras |
| **Mentoria IA** | Mentor IA | Central → Ações | Central → Ações |
| **Operação** | Operação (por função) | Operação (supervisão) | - |
| **Central** | Alertas pessoais | Central | Central |

---

## 🎯 PRÓXIMOS PASSOS

1. Criar estrutura de pastas
2. Implementar rotas (Expo Router)
3. Criar componentes base
4. Implementar telas com placeholders
5. Integrar com Supabase (TODOs)

---

**Última atualização:** 2026-01-27
