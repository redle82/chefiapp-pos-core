# Catálogo — Ações e Endpoints do Fluxo de Criação de Restaurante

**Propósito:** Onde cada ação ocorre. Sem ambiguidade. Não inventar endpoints.

---

## A) Criar restaurante

| Campo | Valor |
|-------|--------|
| **Onde** | [BootstrapPage](merchant-portal/src/pages/BootstrapPage.tsx) (rota `/bootstrap`) |
| **Ação** | INSERT `gm_restaurants` + INSERT `gm_restaurant_members` (owner) |
| **Via** | DbWriteGate.insert (BootstrapPage) — não existe RPC no Core |
| **Estado inicial** | Hoje: `status: "active"`; contrato espera `draft` (alinhamento pendente) |
| **Contrato** | [RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md](./RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT.md) |

---

## B) Selecionar tenant

| Campo | Valor |
|-------|--------|
| **Onde** | [SelectTenantPage](merchant-portal/src/pages/SelectTenantPage.tsx) (rota `/app/select-tenant`) + [TenantContext](merchant-portal/src/core/tenant/TenantContext.tsx) |
| **Ação** | switchTenant(id) → setActiveTenant (TenantResolver); persistência localStorage + estado |
| **Casos** | 0 memberships → redirect /bootstrap; 1 → auto-select + /dashboard; >1 → lista + escolha |
| **Contrato** | [TENANT_SELECTION_CONTRACT.md](./TENANT_SELECTION_CONTRACT.md) |

---

## C) Publicar restaurante

| Campo | Valor |
|-------|--------|
| **Onde** | [RestaurantRuntimeContext](merchant-portal/src/context/RestaurantRuntimeContext.tsx).publishRestaurant + [PublishPage](merchant-portal/src/pages/PublishPage.tsx) (rota `/app/publish`) |
| **Ação** | PATCH `gm_restaurants` (status → active) + INSERT `installed_modules` via [RuntimeWriter](merchant-portal/src/core-boundary/writers/RuntimeWriter.ts) |
| **Contrato** | [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md), [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) |

---

## D) Operar (TPV/KDS)

| Campo | Valor |
|-------|--------|
| **Rotas** | `/op/tpv`, `/op/kds` |
| **Gate** | [RequireOperational](merchant-portal/src/components/operational/RequireOperational.tsx) — hoje só verifica `isPublished`; billing não aplicado ainda |
| **Contrato** | [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md), [BILLING_SUSPENSION_CONTRACT.md](./BILLING_SUSPENSION_CONTRACT.md) (preparado) |

---

**Regra:** Não mover criação de restaurante para Core nesta fase; manter em BootstrapPage + DbWriteGate. Contratos governam comportamento.
