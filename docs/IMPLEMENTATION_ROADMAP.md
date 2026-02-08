# 🗺️ Roadmap de Implementação - ChefIApp

**Status:** 📋 **ROADMAP DEFINIDO**  
**Objetivo:** Implementação guiada das telas faltantes

---

## ✅ O QUE JÁ FOI CRIADO

### Estrutura Base
- ✅ Tipos TypeScript (navigation, schedule, reservations, purchases, mentor)
- ✅ Componentes base (BottomTabs, Header, EmptyState)
- ✅ Telas exemplo (Employee Home, Manager Schedule, etc.)
- ✅ Rotas adicionadas ao App.tsx

### Documentação
- ✅ Blueprint de navegação completo
- ✅ Wireframes textuais
- ✅ Mapa de rotas

---

## 📋 PRÓXIMAS ETAPAS

### Fase 1: Completar Telas de Funcionário
- [ ] `pages/Employee/OperationPage.tsx` (seleção de função)
- [ ] `pages/Employee/Operation/WaiterPage.tsx` (garçom)
- [ ] `pages/Employee/Operation/KitchenPage.tsx` (cozinha/KDS)
- [ ] `pages/Employee/Operation/BarPage.tsx` (bar/KDS)
- [ ] `pages/Employee/Operation/CleaningPage.tsx` (limpeza)
- [ ] `pages/Employee/ProfilePage.tsx` (perfil, streak, XP)
- [ ] `pages/Employee/Mentor/TrainingPage.tsx` (treino rápido)
- [ ] `pages/Employee/Mentor/FeedbackPage.tsx` (feedback do turno)

### Fase 2: Completar Telas de Gerente
- [ ] `pages/Manager/DashboardPage.tsx` (painel)
- [ ] `pages/Manager/Schedule/CoveragePage.tsx` (cobertura & troca)
- [ ] `pages/Manager/Schedule/ReportPage.tsx` (relatório do turno)
- [ ] `pages/Manager/Reservations/CreatePage.tsx` (nova reserva)
- [ ] `pages/Manager/Reservations/MapPage.tsx` (mapa de mesas)
- [ ] `pages/Manager/Reservations/QueuePage.tsx` (fila/walk-ins)
- [ ] `pages/Manager/Reservations/ForecastPage.tsx` (previsão operacional)
- [ ] `pages/Manager/OperationPage.tsx` (operação supervisão)
- [ ] `pages/Manager/CentralPage.tsx` (central resumo)
- [ ] `pages/Manager/Central/ActionsPage.tsx` (o que fazer agora)
- [ ] `pages/Manager/Central/ExplorerPage.tsx` (explorer por runId)
- [ ] `pages/Manager/Central/SLAPage.tsx` (SLA explorer)
- [ ] `pages/Manager/Central/IncidentsPage.tsx` (incidentes)

### Fase 3: Completar Telas de Dono
- [ ] `pages/Owner/VisionPage.tsx` (visão/KPIs)
- [ ] `pages/Owner/CentralPage.tsx` (central)
- [ ] `pages/Owner/PeoplePage.tsx` (pessoas)
- [ ] `pages/Owner/People/SchedulePage.tsx` (escala)
- [ ] `pages/Owner/People/PerformancePage.tsx` (performance)
- [ ] `pages/Owner/Purchases/SuppliersPage.tsx` (fornecedores)
- [ ] `pages/Owner/Purchases/CreatePage.tsx` (pedido de compra)
- [ ] `pages/Owner/Purchases/ReceivingPage.tsx` (recebimento)
- [ ] `pages/Owner/Purchases/CostsPage.tsx` (custos & margem)
- [ ] `pages/Owner/ConfigPage.tsx` (config)
- [ ] `pages/Owner/Config/RestaurantsPage.tsx` (restaurantes)
- [ ] `pages/Owner/Config/PoliciesPage.tsx` (políticas)
- [ ] `pages/Owner/Config/ConstitutionPage.tsx` (constituição)

### Fase 4: Features (Lógica de Negócio)
- [ ] `features/schedule/hooks/useShifts.ts`
- [ ] `features/schedule/hooks/useAttendance.ts`
- [ ] `features/schedule/services/scheduleService.ts`
- [ ] `features/reservations/hooks/useReservations.ts`
- [ ] `features/reservations/services/reservationService.ts`
- [ ] `features/purchases/hooks/usePurchases.ts`
- [ ] `features/purchases/services/purchaseService.ts`
- [ ] `features/mentor/hooks/useMentorship.ts`
- [ ] `features/mentor/services/mentorshipService.ts`
- [ ] `features/central/hooks/useCentral.ts`
- [ ] `features/central/services/centralService.ts`

### Fase 5: Integração com Supabase
- [ ] Configurar cliente Supabase
- [ ] Criar queries para cada feature
- [ ] Implementar mutations
- [ ] Integrar com Core (RPCs)

---

## 🎯 PRIORIZAÇÃO

### Alta Prioridade (MVP)
1. **Employee:**
   - Home (✅ feito)
   - Tasks (✅ feito)
   - Operation (garçom básico)
   - Mentor (✅ feito)

2. **Manager:**
   - Schedule (✅ feito)
   - Reservations (✅ feito)
   - Central (básico)

3. **Owner:**
   - Purchases (✅ feito)
   - Vision (básico)

### Média Prioridade
- Operação completa por função
- Central completo
- Configurações

### Baixa Prioridade
- Features avançadas
- Otimizações
- Polimento

---

## 📝 TEMPLATE DE TELA

Cada nova tela deve seguir este template:

```typescript
/**
 * [Nome da Tela]
 * 
 * [Descrição breve]
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/navigation/Header';
import { BottomTabs } from '../../components/navigation/BottomTabs';
import { EmptyState } from '../../components/ui/EmptyState';

export function [NomeDaTela]() {
  const navigate = useNavigate();

  // TODO: [Descrição do TODO]
  const data: any[] = []; // Placeholder

  return (
    <div style={{ paddingBottom: '80px' }}>
      <Header title="[Título]" />
      
      <div style={{ padding: '16px' }}>
        {data.length === 0 ? (
          <EmptyState title="[Título vazio]" />
        ) : (
          // Conteúdo
        )}
      </div>

      <BottomTabs role="[employee|manager|owner]" />
    </div>
  );
}
```

---

## 🔗 INTEGRAÇÃO COM CORE

### Employee Time Engine
- Tabelas: `gm_shifts`, `gm_attendance`, `gm_schedule`
- RPCs: (a definir)

### Reservation Engine
- Tabelas: `gm_reservations`, `gm_reservation_slots`
- RPCs: (a definir)

### Supply Loop
- Tabelas: `gm_suppliers`, `gm_shopping_list`, `gm_purchase_orders`
- RPCs: `generate_shopping_list`, `confirm_purchase`

### Mentoria IA
- Endpoint: (a definir)
- Integração com Core Level 2

---

**Última atualização:** 2026-01-27
