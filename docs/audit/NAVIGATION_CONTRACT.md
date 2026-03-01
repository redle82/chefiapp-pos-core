# Contrato de Navegação — 4 Zonas e Hub de Módulos

**Status:** LEGACY (SUPERSEDED)
**Autoridade vigente:** [../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md](../architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md) + [../architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md](../architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md)
**Política:** este artefato é complementar de auditoria histórica; conflitos devem ser resolvidos a favor dos contratos canônicos.

**Objetivo:** Eliminar dispersão entre Marketing, Configuração, Operação e Upper Staff. Rotas canónicas por módulo; nenhum botão morto; Centro de Ativação como ponte.

**Referências:** [CoreFlow.ts](../merchant-portal/src/core/flow/CoreFlow.ts), [ROUTES_MAP_2026.md](./ROUTES_MAP_2026.md), [BUTTONS_AUDIT_REPORT_2026.md](./BUTTONS_AUDIT_REPORT_2026.md).

---

## 1. Quatro zonas do sistema

| Zona                       | Rotas canónicas                                                                             | Uso                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **PUBLIC (Marketing)**     | `/`, `/pricing`, `/auth`, `/auth/phone`, `/auth/verify`, `/login`, `/register`, `/forgot`   | Landing, auth, trial. Sem auth.                                    |
| **APP (Ativação e conta)** | `/app`, `/welcome`, `/onboarding`, `/app/activation`, `/app/setup/*`, `/app/billing`        | Onboarding, Centro de Ativação, setup, billing.                    |
| **ADMIN CONFIG**           | `/admin`, `/admin/config/*`, `/admin/modules`, `/admin/catalog/*`, `/admin/reports/*`, etc. | Configuração do restaurante, Hub de Módulos, catálogo, relatórios. |
| **OPS (Operação)**         | `/op/tpv`, `/op/pos`, `/op/kds`, `/op/staff`, `/app/staff/*`                                | TPV, POS, KDS, Upper Staff.                                        |

**Aliases (compatibilidade):**

- `/admin/config/productos` → redirect para `/admin/modules`
- `/op/pos` e `/op/pos/*` → redirect para `/op/tpv` e `/op/tpv/*`
- `/admin/modules` = Hub de Módulos (canónico); `/admin/catalog/modules` também mostra o mesmo conteúdo.

---

## 2. Estado da conta e redirecionamento

**Tipos (alineados ao CoreFlow):**

- `AccountStatus` conceptual: **NEW** (sem org) → **ONBOARDING** (welcome/onboarding) → **SETUP** (checklist em /app/activation) → **ACTIVE** → **SUSPENDED**.
- No código: `hasOrganization`, `activated` (onboarding_completed_at), `systemState` (SETUP | TRIAL | ACTIVE | SUSPENDED).

**Regras após login:**

- Sem restaurante → `/welcome` ou `/setup/restaurant-minimal`.
- Com restaurante e `!activated` → `/app/activation` (Centro de Ativação).
- Com restaurante e `activated` → `/app/dashboard` (ou última área usada).
- Em SETUP, tentativa de aceder a `/op/tpv` ou `/op/kds` (ou `/op/pos`) → redirect para `/app/activation`.

**Fonte:** [CoreFlow.ts](../merchant-portal/src/core/flow/CoreFlow.ts) e [FlowGate.tsx](../merchant-portal/src/core/flow/FlowGate.tsx). Não duplicar lógica de fluxo fora destes.

---

## 3. Módulos e Hub (/admin/modules)

**Chave de módulos (conceptual):** POS, KDS, STAFF, INVENTORY, ONLINE_STORE, QR_ORDERING, RESERVATIONS, DELIVERY_HUB.

**Estado por módulo (conceptual):** `{ enabled: boolean; configured: boolean }`. Persistência: Core / runtime quando existir; até lá, UI e redirects sem botão morto.

**Hub de Módulos (tela “Mis productos” / Produtos):**

- Rota canónica: **`/admin/modules`** (também acessível via `/admin/catalog/modules`).
- Cada card: botão principal (Ativar / Configurar / Abrir) com `navigate()` para rota válida; botão secundário (Desativar) quando aplicável.
- Mapeamento canónico de ações (ver BUTTONS_AUDIT_REPORT_2026.md):
  - POS abrir → `/op/tpv` (ou `/op/pos` por alias)
  - KDS abrir → `/op/kds`
  - Fichaje/Staff → `/app/staff`
  - Stock → `/inventory-stock`
  - Tienda online → `/admin/config/tienda-online` (placeholder)
  - QR Ordering → `/admin/config/delivery`
  - Reservas → `/admin/reservations`
  - Integrador delivery → `/admin/config/integrations`

**Regra:** Nenhum botão sem destino; se não existir página real, usar placeholder navegável.

---

## 4. RBAC (quem vê o quê)

**Roles (existentes):** OWNER, MANAGER, STAFF (waiter), KITCHEN, etc. Definidos em [StaffContext](../merchant-portal/src/pages/AppStaff/context/StaffContext.tsx) e [RoleGate](../merchant-portal/src/core/roles).

**Guardas:**

- Rotas protegidas por auth: [FlowGate](../merchant-portal/src/core/flow/FlowGate.tsx).
- Rotas operacionais (TPV/KDS) em SETUP: CoreFlow redireciona para `/app/activation`.
- RoleGate para áreas admin/staff quando aplicável.

**Não criar lógica de fluxo fora de CoreFlow/FlowGate.**

---

## 5. Rotas operacionais canónicas

| Módulo      | Abrir / principal      | Configurar                                             |
| ----------- | ---------------------- | ------------------------------------------------------ |
| POS/TPV     | `/op/tpv` ou `/op/pos` | `/admin/config/software-tpv`                           |
| KDS         | `/op/kds`              | (integrado ou config)                                  |
| Upper Staff | `/app/staff`           | —                                                      |
| Inventário  | `/inventory-stock`     | —                                                      |
| Reservas    | —                      | `/admin/reservations` ou `/admin/config/reservas`      |
| Delivery/QR | —                      | `/admin/config/delivery`, `/admin/config/integrations` |

---

## 6. O que não fazer

- Não remover módulos da lista do Hub.
- Não alterar arquitetura core (FlowGate, CoreFlow, RestaurantRuntime) além do definido neste contrato.
- Não criar rotas que resultem em 404 para URLs antigas: usar redirects.
- Não ter botões “Ativar” ou “Abrir” sem `navigate()` para rota válida ou placeholder.

---

## 7. Auditoria e testes

- **Mapa de rotas:** [ROUTES_MAP_2026.md](./ROUTES_MAP_2026.md).
- **Relatório de botões:** [BUTTONS_AUDIT_REPORT_2026.md](./BUTTONS_AUDIT_REPORT_2026.md).
- **E2E Hub/Produtos:** [products-routing.spec.ts](../merchant-portal/tests/e2e/products-routing.spec.ts) — clica em cada botão do Hub e valida URL e conteúdo da página de destino.
