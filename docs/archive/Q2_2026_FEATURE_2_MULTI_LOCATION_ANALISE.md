# 🔱 PROTOCOLO CANÔNICO — FEATURE 2: MULTI-LOCATION UI

**Data:** 2026-01-10  
**Feature:** Multi-location UI — Q2 2026  
**Método:** Protocolo Canônico (Verificar → Analisar → Corrigir → Testar → Validar)

---

## 1️⃣ VERIFICAR SE JÁ FOI FEITO

### ✅ O Que Existe:

**Backend/Types:**
- ✅ **`phase2/multi-location/types.ts`** — Types e contratos definidos
  - `RestaurantGroup` — Interface para grupos de restaurantes
  - `RestaurantGroupMembership` — Interface para membros do grupo
  - `CreateRestaurantGroupInput` — Input para criar grupo
  - `GetGroupDashboardOutput` — Output do dashboard consolidado
  - `SyncMenuAcrossGroupInput` — Input para sincronizar menu

**Backend/Manager:**
- ✅ **`server/reputation-hub/multi-location-manager.ts`** — Manager para localizações
  - `addLocation()` — Adiciona nova localização
  - `getLocations()` — Busca todas as localizações de um restaurante
  - `updateLocationRating()` — Atualiza rating da localização
  - **Nota:** Este é para ReputationHub (múltiplas localizações físicas), não para grupos de restaurantes

**UI/Components:**
- ✅ **`TenantSelector.tsx`** — Seletor de tenant (multi-restaurant)
  - Mostra dropdown com lista de restaurantes
  - Permite trocar entre restaurantes
  - Suporta multi-tenant
- ✅ **`TenantContext.tsx`** — Context para gerenciar tenants
  - `useTenant()` — Hook para acessar tenant atual
  - `switchTenant()` — Trocar entre restaurantes
  - `isMultiTenant` — Flag indicando se usuário tem múltiplos restaurantes
- ✅ **`ReputationHubDashboard.tsx`** — Dashboard que mostra localizações
  - Lista localizações do restaurante
  - Mostra rating e reviews por localização
  - **Nota:** Este é para ReputationHub (localizações físicas), não para grupos de restaurantes

**API Endpoints:**
- ✅ **`/api/reputation-hub/locations`** — GET locations para um restaurante
- ⚠️ **Não existe endpoint para RestaurantGroup** — Criar grupos, adicionar restaurantes, etc.

**Schema:**
- ⚠️ **Não existe tabela `restaurant_groups`** — Precisa ser criada
- ⚠️ **Não existe tabela `restaurant_group_memberships`** — Precisa ser criada
- ✅ **Tabela `reputation_hub_locations`** existe (para localizações físicas)

**Arquivos Envolvidos:**
- `phase2/multi-location/types.ts`
- `server/reputation-hub/multi-location-manager.ts`
- `merchant-portal/src/core/tenant/TenantSelector.tsx`
- `merchant-portal/src/core/tenant/TenantContext.tsx`
- `merchant-portal/src/pages/ReputationHub/ReputationHubDashboard.tsx`

---

## 2️⃣ ANALISAR SE O QUE EXISTE ESTÁ CORRETO

### ⚠️ ANÁLISE:

**Types (phase2/multi-location/types.ts):**
- ✅ **CORRETO** — Types bem definidos e validados
- ✅ Contratos claros para criar grupos, adicionar restaurantes, sincronizar menu
- ⚠️ **FALTA IMPLEMENTAÇÃO** — Types existem mas não há implementação

**Multi-location Manager (reputation-hub):**
- ⚠️ **CONFUSÃO DE CONCEITOS** — Este manager é para **localizações físicas** (ReputationHub)
- ⚠️ **NÃO É PARA GRUPOS** — Não gerencia grupos de restaurantes
- ⚠️ **DIFERENTE DO REQUERIDO** — Feature Q2 precisa de **RestaurantGroup** (um dono, múltiplos restaurantes)

**TenantSelector/TenantContext:**
- ✅ **CORRETO** — Permite trocar entre restaurantes
- ✅ **FUNCIONAL** — Já funciona para multi-tenant
- ⚠️ **FALTA UI DE GRUPOS** — Não há UI para criar/gerenciar grupos de restaurantes
- ⚠️ **FALTA DASHBOARD CONSOLIDADO** — Não há dashboard que mostre todos os restaurantes de um grupo

**ReputationHubDashboard:**
- ⚠️ **CONFUSÃO DE CONCEITOS** — Mostra localizações físicas, não grupos de restaurantes
- ⚠️ **NÃO É O QUE PRECISA** — Feature Q2 precisa de UI para gerenciar grupos de restaurantes

**Schema:**
- ❌ **NÃO EXISTE** — Tabelas `restaurant_groups` e `restaurant_group_memberships` não existem
- ⚠️ **REQUER MIGRATION** — Precisa criar schema para suportar grupos

**API Endpoints:**
- ❌ **NÃO EXISTE** — Endpoints para criar grupos, adicionar restaurantes, sincronizar menu
- ⚠️ **REQUER IMPLEMENTAÇÃO** — Precisa criar endpoints no `web-module-api-server.ts`

**Classificação:**
- ✅ **Types:** CORRETO (mas falta implementação)
- ⚠️ **Backend:** PARCIAL (existe manager para localizações físicas, mas não para grupos)
- ⚠️ **UI:** PARCIAL (existe TenantSelector, mas falta UI de grupos)
- ❌ **Schema:** NÃO EXISTE (precisa criar)
- ❌ **API:** NÃO EXISTE (precisa criar)

---

## 3️⃣ CORRIGIR (SE NECESSÁRIO)

### Ação Necessária:

**Implementar Multi-Location UI completa:**

1. **Schema** — Criar tabelas para grupos
   - `restaurant_groups` — Grupos de restaurantes
   - `restaurant_group_memberships` — Membros do grupo
   - Migrations SQL

2. **Backend API** — Criar endpoints
   - `POST /api/restaurant-groups` — Criar grupo
   - `GET /api/restaurant-groups/:groupId` — Buscar grupo
   - `POST /api/restaurant-groups/:groupId/restaurants` — Adicionar restaurante
   - `GET /api/restaurant-groups/:groupId/dashboard` — Dashboard consolidado
   - `POST /api/restaurant-groups/:groupId/sync-menu` — Sincronizar menu

3. **Backend Service** — Implementar lógica
   - `RestaurantGroupService` — Criar, buscar, atualizar grupos
   - `MenuSyncService` — Sincronizar menu entre restaurantes
   - Validações de autorização (só dono pode gerenciar grupo)

4. **UI Components** — Criar componentes
   - `RestaurantGroupManager` — Gerenciar grupos
   - `LocationPicker` — Seletor de localização (dentro de um grupo)
   - `GroupDashboard` — Dashboard consolidado (todos os restaurantes do grupo)
   - `MenuSyncPanel` — Painel para sincronizar menu

5. **Integração** — Integrar com TenantContext
   - Atualizar `TenantContext` para suportar grupos
   - Mostrar grupos no `TenantSelector`
   - Permitir trocar entre restaurantes de um grupo

**Status:** ⚠️ **REQUER IMPLEMENTAÇÃO COMPLETA**

---

## 4️⃣ TESTAR O QUE EXISTE / FOI CORRIGIDO

**Testes Necessários:**
- [ ] Criar grupo de restaurantes
- [ ] Adicionar restaurante a grupo
- [ ] Dashboard consolidado mostra dados de todos os restaurantes
- [ ] Sincronizar menu entre restaurantes
- [ ] Autorização (só dono pode gerenciar grupo)
- [ ] UI de seleção de localização funciona

**Status:** ⚠️ **PENDENTE** (após implementação)

---

## 5️⃣ VALIDAR SE ESTÁ "BOM O SUFICIENTE"

**Pergunta:** "Isso sustenta uso real sem vergonha técnica?"

**Resposta:** ⚠️ **NÃO** (ainda)
- ⚠️ Schema não existe
- ⚠️ API não existe
- ⚠️ UI não existe
- ⚠️ Funcionalidade não implementada

**Status:** ⚠️ **REQUER IMPLEMENTAÇÃO COMPLETA**

---

## 6️⃣ PASSAR PARA O PRÓXIMO ITEM

**Status do Item:**
- ⚠️ **PARTIAL** — Types existem, mas falta implementação completa
- ⚠️ **REQUER IMPLEMENTAÇÃO** — Schema, API, UI, integração

**Próximo Item:** Implementar Multi-Location UI completa

---

**Última atualização:** 2026-01-10  
**Status:** ⚠️ **PARTIAL** — Requer implementação completa
