# C4 Model — Component (Nível 3)

**Propósito:** Diagrama C4 **Component** do ChefIApp — componentes significativos **dentro do Merchant Portal** (onde faz mais sentido detalhar). Opcional para Core e AppStaff.  
**Público:** Dev.  
**Referência:** [C4_CONTAINER.md](./C4_CONTAINER.md) · [BOUNDARY_CONTEXTS.md](./BOUNDARY_CONTEXTS.md) · [ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md](./ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md)

---

## 1. Descrição do nível Component

O nível Component mostra os **componentes** dentro de um container. Este documento foca o **Merchant Portal**: camadas de UI, boundary e gates. O Core (Docker) e o AppStaff podem ser detalhados noutro momento.

---

## 2. Componentes principais (Merchant Portal)

| Componente | Responsabilidade | Onde |
|------------|------------------|------|
| **Rotas públicas** | Landing, pricing, features, demo; sem Runtime nem Core. | PublicPages, rotas `/`, `/pricing`, `/demo`, `/auth` |
| **Auth** | Login, signup; destino pós-auth (dashboard / select-tenant). | AuthPage, Supabase Auth |
| **TenantContext / SelectTenantPage** | Resolução 0/1/N restaurantes; redirect /bootstrap ou /dashboard. | TenantContext, SelectTenantPage |
| **BootstrapPage** | Criação do primeiro restaurante + owner; INSERT gm_restaurants, gm_restaurant_members. | BootstrapPage, boundary |
| **RestaurantRuntimeContext** | Espelho do Core: restaurant_id, isPublished, lifecycle, setup_status. | RestaurantRuntimeContext, RuntimeReader, RuntimeWriter |
| **RoleGate** | Controlo por papel; redireciona staff → /garcom, outros → /dashboard. | RoleGate (App.tsx) |
| **RequireOperational** | Bloqueia /op/tpv e /op/kds se !isPublished; futuro: billingStatus. | RequireOperational |
| **DashboardPortal** | Hub: árvore de módulos (TPV, KDS, Menu, Config, Billing, etc.); painel central. | DashboardPortal, OperationalShell, PanelRoot |
| **TPVMinimal / KDSMinimal** | TPV e KDS operacionais; leitura/escrita via boundary; ErrorBoundary em /op/. | TPVMinimal, KDSMinimal |
| **MenuBuilder** | Cardápio; ProductReader, MenuWriter; fallback conforme MENU_FALLBACK_CONTRACT. | MenuBuilderCore, ProductReader, MenuWriter |
| **BillingPage** | Planos, assinatura, Stripe Checkout/Portal. | BillingPage |
| **PublishPage** | Publicar restaurante (isPublished = true). | PublishPage |
| **Core boundary** | RuntimeReader, RuntimeWriter, DbWriteGate; RPC (create_order_atomic, etc.). | core-boundary |

---

## 3. Diagrama C4 Component — Merchant Portal (simplificado)

```mermaid
C4Component
    title Component Diagram - Merchant Portal (simplificado)

    Container_Boundary(portal, "Merchant Portal") {
        Component(public_routes, "Rotas Públicas", "React", "Landing, auth, demo")
        Component(auth, "Auth", "React", "Login, signup, destino pós-auth")
        Component(tenant, "Tenant / Bootstrap", "React", "SelectTenantPage, BootstrapPage")
        Component(runtime, "Runtime Context", "React", "RestaurantRuntimeContext, RuntimeReader/Writer")
        Component(gates, "Gates", "React", "RoleGate, RequireOperational")
        Component(dashboard, "Dashboard", "React", "DashboardPortal, Shell, painéis")
        Component(tpv_kds, "TPV / KDS", "React", "TPVMinimal, KDSMinimal, ErrorBoundary")
        Component(menu, "Menu Builder", "React", "MenuBuilderCore, ProductReader, MenuWriter")
        Component(billing, "Billing / Publish", "React", "BillingPage, PublishPage")
        Component(boundary, "Core Boundary", "TS", "RuntimeReader, RuntimeWriter, DbWriteGate, RPC")
    }

    Rel(public_routes, auth, "Navega")
    Rel(auth, tenant, "Pós-login")
    Rel(tenant, runtime, "Tenant selado")
    Rel(runtime, gates, "Estado")
    Rel(gates, dashboard, "Libera gestão")
    Rel(gates, tpv_kds, "Libera /op/ se published")
    Rel(dashboard, menu, "Painel Menu")
    Rel(dashboard, billing, "Painel Billing/Publish")
    Rel(menu, boundary, "Leitura/escrita menu")
    Rel(tpv_kds, boundary, "Pedidos, produtos, estado")
    Rel(billing, boundary, "Estado billing (futuro)")
    Rel(boundary, core, "API REST / RPC")
```

*Nota: a relação `boundary → core` referencia o container Core (fora deste diagrama de componentes).*

---

## 4. Onde não detalhamos (por agora)

- **Core (Docker):** Schema, migrations, RPCs — descritos em CORE_SYSTEM_OVERVIEW e contratos; diagrama de componentes do Core pode ser adicionado depois.
- **AppStaff (Mobile):** Estrutura de ecrãs e serviços — pode ser documentada num C4_COMPONENT separado para mobile-app.

---

## 5. Referências

- [BOUNDARY_CONTEXTS.md](./BOUNDARY_CONTEXTS.md) — Contextos e contratos por boundary.
- [ROTAS_E_CONTRATOS.md](./ROTAS_E_CONTRATOS.md) — Rota → contrato.
- [ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md](./ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md) — Mapa de rotas e gates AS-IS.

---

*Documento vivo. Novos componentes significativos no portal devem ser reflectidos aqui.*
