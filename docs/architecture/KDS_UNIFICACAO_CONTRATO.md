# KDS — Contrato único e superfícies

## Fonte de verdade

- **Projeção de dados**: `gm_orders` + `gm_order_items` (via `OrderReader.readActiveOrders/readOrderItems`).
- **Identidade**:
  - `restaurantId` (pivot).
  - `station` por item (`KITCHEN`/`BAR`).
- **Estados de pedido** (Core):
  - `OPEN` → `IN_PREP` → `READY` → `CLOSED` (e variantes já existentes).

## Domínio KDS no frontend

- Módulo: `merchant-portal/src/core/kds/kdsDomain.ts`.
- Responsabilidades:
  - `KDS_LATE_THRESHOLD_MINUTES = 15`.
  - `resolveOrderOrigin` → `DELIVERY | WEB | APP | QR | OTHER` (normaliza `origin/source`).
  - `isLateOrder(createdAt)` → usa o threshold partilhado.
  - `filterOrdersByStation(orders, "ALL" | "BAR" | "KITCHEN")` — KDS_BAR_COZINHA_STATION_CONTRACT §5.

Todas as superfícies devem usar estes helpers em vez de reimplementar thresholds ou mapeamentos.

## Superfícies ligadas ao contrato

- **TPV / Painéis Electron**
  - Página: `KDSMinimal` (`merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx`).
  - Perfis/painéis: `merchant-portal/src/features/kds-desktop/kdsPanelProfiles.ts`.
  - Filtros:
    - `station` (cozinha/bar) → tabs + `filterOrdersByStation`.
    - Preset `delivery` → `sources: ["DELIVERY", "WEB", "APP"]` + `resolveOrderOrigin`.
    - Preset `late` → `onlyLate: true` + `isLateOrder(..., KDS_LATE_THRESHOLD_MINUTES)`.

- **Mini KDS no AppStaff**
  - Componente: `merchant-portal/src/pages/AppStaff/components/MiniKDSMinimal.tsx`.
  - Dados: `readActiveOrders/readOrderItems` (mesma projeção do TPV).
  - Usa `calculateOrderStatus` (layout) e `resolveOrderOrigin` (badge de origem canónica).

- **KDS Mobile (rota `/app/staff/kds`)**
  - Hook: `merchant-portal/src/features/kds-mobile/hooks/useMobileKDS.ts`.
  - Dados: `gm_orders` via REST, filtrado por `status in (OPEN, IN_PREP, READY)`.
  - Mapeia:
    - `OPEN` → `pending`.
    - `IN_PREP` → `preparing`.
    - `READY` → `ready`.
  - Continua a usar a mesma fonte (`gm_orders`) e respeita os mesmos estados Core.

## Admin > Módulos — comportamento alinhado

- Página: `merchant-portal/src/features/admin/modules/pages/ModulesPage.tsx`.
- Decisões:
  - O módulo **KDS (Cozinha)** não tenta mais abrir um KDS “próprio” a partir do Admin.
  - `handlePrimaryAction("kds")` passa a encaminhar para o TPV:
    - `navigate(getModulePrimaryPath("tpv"))` → operador entra no TPV e, daí, abre **Painéis KDS**.
  - Desktop Launch (handshake + deep link) continua apenas para o módulo `tpv`.
  - CTA secundário de TPV/KDS leva sempre para `/admin/devices` (instalação/configuração de Desktop).

## Telemetria leve (DEV)

- `KDSMinimal`:
  - Ao montar, em `DEV`, emite `window.dispatchEvent(new CustomEvent("kds_open_panel", { detail: { origin: "tpv-desktop", restaurantId } }))`.
- `MiniKDSMinimal`:
  - Ao montar, em `DEV`, emite o mesmo evento com `origin: "appstaff-mini"`.
- Objectivo: inspecionar rapidamente, em DEV, de onde vêm aberturas de KDS sem acoplar a um provider de analytics específico.
