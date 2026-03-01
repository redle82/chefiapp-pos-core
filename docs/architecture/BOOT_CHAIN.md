# Boot Chain Architecture

> **The Deterministic Sequence of Life**

This document describes the exact sequence of events that occurs when a user enters the `/app` runtime.
This sequence is **immutable** and protects the domain from "Quantum State" (undefined tenant/user).

## The Pipeline

User hits `/app/*` -> `Routes` (App.tsx) executes the following nesting:

### 1. FlowGate (`core/flow/FlowGate`)

**Responsibility:** Runtime adapter and gate de execução.

- Consome `useBootPipeline()`.
- Exibe loading/fallback enquanto boot não termina.
- Executa navegação quando decisão é redirect.
- Injeta `LaunchContext` quando decisão é allow.

### 2. useBootPipeline (`core/boot/useBootPipeline`)

**Responsibility:** Autoridade única de startup (FSM determinística).

- Sequência canónica: `BOOT_START` → `AUTH_CHECKING` → `AUTH_RESOLVED` → `TENANT_LOADING` → `TENANT_RESOLVED` → `LIFECYCLE_DERIVED` → `ROUTE_DECIDING` → `BOOT_DONE`.
- Controla timeouts por etapa e timeout global.
- Resolve auth, tenant, billing e lifecycle num ponto único.

### 3. BootRuntimeEngine (`core/boot/runtime/BootRuntimeEngine`)

**Responsibility:** Helpers puros de runtime.

- Orçamentos de timeout.
- Guardas de navegação.
- Regras de reset por mudança de utilizador.
- Derivação de `deviceType` para `LaunchContext`.

### 4. resolveBootDestination (`core/boot/resolveBootDestination`)

**Responsibility:** Decisão final de lançamento.

- Produz `{ type, to, reasonCode }`.
- Define se runtime permite superfície (`ALLOW`) ou redireciona (`REDIRECT`).

### 5. UI Surface Mount

**State:** Só renderiza após decisão do runtime.

- Superfícies não recalculam auth/tenant/billing/lifecycle.
- Superfícies consomem contexto já resolvido.

## Allowable Side Effects

| Gate                | Allowed fetch?             | Allowed Subscription?      | Rebuild State?          |
| ------------------- | -------------------------- | -------------------------- | ----------------------- |
| **FlowGate**        | No (adapter only)          | No                         | No                      |
| **useBootPipeline** | **YES** (boot authority)   | No                         | **YES** (boot snapshot) |
| **Leaf Page**       | **YES** (surface-specific) | **YES** (surface-specific) | No (consumer)           |

## Legacy Note

References to chains such as `TenantProvider → AppDomainWrapper → RequireActivation → OperationGate`
are considered historical and must not be treated as runtime authority.

The canonical authority is documented in:

- `docs/architecture/CHEFIAPP_OS_ARCHITECTURE_V1.md`
- `docs/architecture/CORE_RUNTIME_AND_ROUTES_CONTRACT.md`
