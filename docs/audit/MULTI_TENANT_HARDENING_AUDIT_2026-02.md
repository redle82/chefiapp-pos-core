# Auditoria Multi-Tenant Hardening — 2026-02

**Objetivo:** Validar que TenantContext, RestaurantRuntimeContext e queries admin/report respeitam `restaurant_id` e permissões (gm_restaurant_members). Ref: Plano Enterprise Ready 2026, Eixo C1.

---

## 1. Fontes de verdade (validado)

- **TenantContext** (`merchant-portal/src/core/tenant/TenantContext.tsx`)
  - Resolve tenant ativo e memberships **apenas via Core**: `gm_restaurant_members`, `gm_restaurants`.
  - Não usa Supabase/GoTrue para dados de tenant.
- **RestaurantRuntimeContext** (`merchant-portal/src/context/RestaurantRuntimeContext.tsx`)
  - Expõe `restaurant_id` operacional para TPV/KDS/Menu/Public Web.
  - Usa `getOrCreateRestaurantId` apenas em bootstrap quando ainda não há tenant selecionado.
- **useRestaurantId** / **useRestaurantIdentity**
  - Única fonte de `restaurant_id` para relatórios e dashboards no frontend.

---

## 2. Queries admin/report (validado)

- **Relatórios** (DailyClosingReportPage, SalesByPeriodReportPage, etc.): usam `useRestaurantId()` e passam `restaurantId` a RPCs (`get_shift_history`, `get_operational_metrics`, `useFiscalReconciliation`).
- **Dashboard multi-unidade** (MultiUnitOverviewReportPage): usa RPC `get_multiunit_overview(p_period_date)` que, no Core, usa `current_user_restaurants()` — nenhum `restaurant_id` global; apenas restaurantes acessíveis ao utilizador (has_restaurant_access).
- **Core RPCs**: `get_shift_history`, `get_operational_metrics`, `get_multiunit_overview` recebem `p_restaurant_id` ou derivam lista de `current_user_restaurants()`; não existem endpoints “globais” sem filtro para utilizadores multi-tenant.

---

## 3. Regras de isolamento (em vigor)

- Toda listagem em tabelas de negócio deve ser filtrada por `restaurant_id` (frontend passa ID; Core aplica RLS ou parâmetro).
- Dashboards de grupo consomem apenas dados de restaurantes devolvidos por `current_user_restaurants()` (Core) ou pela lista de memberships (TenantContext).
- Contrato formal: `docs/architecture/MULTI_TENANT_ROLES_CONTRACT.md`.

---

## 4. Conclusão

- TenantContext e RestaurantRuntimeContext estão alinhados com o contrato.
- Queries admin/report usam `restaurant_id` (useRestaurantId) ou RPCs tenant-scoped (get_multiunit_overview).
- Nenhuma alteração crítica necessária; disciplina documentada e aplicada.
