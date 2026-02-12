# MULTI_TENANT_ROLES_CONTRACT — Roles e isolamento multi‑tenant/multi‑unidade

> Resumo contratual de como TenantContext, RestaurantRuntime e permissões
> devem comportar‑se em cenários com múltiplos restaurantes/unidades.

---

## 1. Objetivo

- Garantir que:
  - **nenhum dado de restaurante** vaza para outro;
  - queries seguem o `QUERY_DISCIPLINE_CONTRACT.md`;
  - dashboards multi‑unidade respeitam permissões de grupo.

---

## 2. Fontes de verdade

- `TenantContext` (`core/tenant/TenantContext.tsx`)
  - Resolve `tenantId` ativo e `memberships` via Docker Core (`gm_restaurant_members`, `gm_restaurants`).
  - Não faz auto‑seleção de tenant quando há mais de um restaurante (exige seleção explícita).
- `RestaurantRuntimeContext`
  - Resolve `restaurant_id` operacional usado por TPV/KDS/Menu/Public Web.
  - Usa `getOrCreateRestaurantId` apenas para bootstrap quando ainda não há Contexto de tenant.

**Lei:** UI/admin deve usar `TenantContext` para saber **quem o utilizador é / onde pode entrar** e `RestaurantRuntimeContext` para saber **como esse restaurante está configurado**.

---

## 3. Roles canónicos (multi‑tenant)

Representados em `gm_restaurant_members.role` e refletidos em `TenantMembership`:

- `group_owner`
  - Dono de grupo com acesso a múltiplos restaurantes.
  - Pode ver dashboards multi‑unidade e relatórios de grupo.
- `ops_director`
  - Responsável de operações de grupo; acesso semelhante ao `group_owner`, mas sem certas ações administrativas globais.
- `local_owner`
  - Dono de um único restaurante/unidade.
  - Acede a relatórios e dashboards apenas do seu `restaurant_id`.
- `local_manager`
  - Gestão operacional local (escala staff, cardápio, turnos).
  - Acede a TPV/KDS/config local; relatórios limitados.
- `staff` / `waiter` / `kitchen`
  - Perfis operacionais; acesso via AppStaff/TPV/KDS, **nunca** a dashboards de grupo.

> Nota: roles antigos (`owner`, `manager`, `staff`, `waiter`, `kitchen`) podem
> ser mapeados para estes perfis em migrações futuras.

---

## 4. Regras de isolamento

### 4.1. Queries ao Core

- Toda query de listagem deve:
  - ser filtrada por `restaurant_id` ou `tenant_id` ativo;
  - nunca fazer `SELECT` “global” sem filtro quando user é multi‑tenant.
- `useRestaurantId` e `useRestaurantIdentity` devem ser usados
  exclusivamente como fonte de `restaurant_id` para:
  - relatórios (`SalesSummary`, `OperationalActivity`, `GamificationImpact`);
  - dashboards (`DashboardHomePage`, `AdminReportsOverview`);
  - páginas operacionais.

### 4.2. Multi‑unidade

- Dashboards multi‑unidade (`MultiUnitOverviewReportPage`) devem:
  - usar APIs/views que respeitem roles de grupo (`group_owner`, `ops_director`);
  - nunca mostrar restaurantes fora da lista de `memberships` do utilizador.

---

## 5. Implicações práticas para hardening

- Ao criar novos readers/report hooks:
  - obrigar `restaurantId`/`tenantId` como argumento;
  - recusar chamadas sem contexto explícito em modo multi‑tenant.
- Ao criar novos dashboards de grupo:
  - usar sempre listas de `restaurant_id` vindas de `TenantContext`
    (e não de tabelas globais sem filtro).

Este contrato complementa `CORE_SCHEMA_MIN_CONTRACT.md`,
`MULTIUNIT_OWNER_DASHBOARD_CONTRACT.md` e `QUERY_DISCIPLINE_CONTRACT.md` e
serve como referência para futuras features enterprise/multi‑unidade.

