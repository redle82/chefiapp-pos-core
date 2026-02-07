# Audit Suprema — 2026-02-07

> Auditor: automated (copilot)
> Branch: `core/frozen-v1`
> Commit: `34b1a9b1`

---

## 1. Module Map (Real vs Ghost)

### REAL — Active modules with code

| Module             | Path                  | Status     | Notes                                                                   |
| ------------------ | --------------------- | ---------- | ----------------------------------------------------------------------- |
| merchant-portal    | `merchant-portal/`    | **ACTIVE** | 1 061 TS/TSX files, ~148 K lines. React 19 + Vite 7 + Tailwind 4.       |
| core-engine        | `core-engine/`        | **ACTIVE** | 41 files, ~8 K lines. Event-sourcing executor, guards, effects, kernel. |
| mobile-app         | `mobile-app/`         | **ACTIVE** | Expo/React Native, ~22.8 K lines. NOT in npm workspaces.                |
| core-design-system | `core-design-system/` | **ACTIVE** | Shared tokens (colors, spacing, typography, motion).                    |
| fiscal-modules     | `fiscal-modules/`     | **ACTIVE** | FiscalEventStore, adapters, validators.                                 |
| docker-core        | `docker-core/`        | **ACTIVE** | Docker Compose infra (Postgres, PostgREST, Nginx, Keycloak, Realtime).  |
| tests              | `tests/`              | **ACTIVE** | 87 `.test.ts` files, ~22.7 K lines. Jest unit/integration/massive.      |
| scripts            | `scripts/`            | **ACTIVE** | 325 files. Automation, audit, seeds, validation.                        |
| docs               | `docs/`               | **ACTIVE** | 1 939 `.md` files across 43 subdirectories.                             |
| migrations         | `migrations/`         | **ACTIVE** | 19 SQL migration files.                                                 |

### GHOST — Declared but missing or empty

| Module              | Path                 | Issue                                                                                                                                             |
| ------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **customer-portal** | `customer-portal/`   | Listed in `package.json` workspaces but **directory does not exist**. `npm install` silently ignores it.                                          |
| **server/**         | `server/`            | Referenced in 6 `package.json` scripts + `tsconfig.json` include. Directory **does not exist** at root. Was moved to `_legacy_isolation/server/`. |
| core-engine/core    | `core-engine/core/`  | Directory exists but is **empty**.                                                                                                                |
| core-engine/gates   | `core-engine/gates/` | Directory exists but is **empty**.                                                                                                                |

### Evidence (commands executed)

```
$ find . -maxdepth 2 -type d -name "server" -o -name "customer-portal"
./dist/server
./_legacy_isolation/server
./_legacy_isolation/customer-portal
```

Both `server/` and `customer-portal/` exist only under `_legacy_isolation/`.

---

## 2. Version Mismatch

| Source                         | Declared Version                | Notes                                                     |
| ------------------------------ | ------------------------------- | --------------------------------------------------------- |
| `VERSION`                      | `1.0.0-pilot`                   | Contains metadata: `STATUS: FASE_2_READY_PILOTO_PENDENTE` |
| `package.json` (root)          | `1.0.1`                         |                                                           |
| `merchant-portal/package.json` | `1.0.0`                         |                                                           |
| `README.md`                    | `1.2.0`                         | Claims "Production Ready"                                 |
| Git tags                       | up to `v1.3.0-stress-validated` | 16 tags total                                             |

**Verdict:** 4 different versions declared simultaneously. No single source of truth.

---

## 3. Ghost Script References

Scripts in root `package.json` that reference non-existent `server/` directory:

```
L37: "server:webhook": "npx ts-node server/webhook-server.ts"
L38: "server:billing": "npx ts-node server/billing-webhook-server.ts"
L39: "server:subscription-ui": "npx ts-node server/subscription-management-server.ts"
L40: "server:web-module": "npx ts-node server/web-module-api-server.ts"
L41: "seed:web-module": "npx ts-node server/seed-web-module.ts"
L42: "refresh:amazon": "npx ts-node server/amazon/refresh-catalog-cli.ts"
```

`tsconfig.json` include also references `server/**/*.ts`.

---

## 4. CI/CD State

### Workflows present (9 total)

| Workflow              | File                        | Runs E2E?               | Notes                                                                             |
| --------------------- | --------------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| ChefIApp CI           | `ci.yml`                    | **NO**                  | Runs Jest (ignores e2e/playwright/massive). Typecheck + build + sovereignty-gate. |
| Architecture Guardian | `architecture-guardian.yml` | NO                      |                                                                                   |
| Canon Enforcement     | `canon-enforcement.yml`     | NO                      | Has commented-out vitest line.                                                    |
| Check Screens         | `check-screens.yml`         | Playwright install only | Installs Chromium but unclear if runs specs.                                      |
| Contract Gate         | `contract-gate.yml`         | NO                      |                                                                                   |
| Core Validation       | `core-validation.yml`       | NO                      |                                                                                   |
| Deploy                | `deploy.yml`                | NO                      |                                                                                   |
| Truth Gate            | `truth-gate.yml`            | Playwright install      | Installs Chromium.                                                                |
| UI Guardrails         | `ui-guardrails.yml`         | NO                      |                                                                                   |

**Verdict:** No workflow currently runs Playwright E2E specs on PR. The `ci.yml` explicitly excludes them with `--testPathIgnorePatterns="e2e|playwright"`.

### Coverage

Coverage threshold configured in `jest.config.js` at 70% (branches, functions, lines, statements). No evidence of enforcement in CI — no coverage upload or gate step.

---

## 5. Route Inventory

### Public routes (no auth required)

| Path                           | Component               |
| ------------------------------ | ----------------------- |
| `/`                            | LandingPage             |
| `/pricing`                     | PricingPage             |
| `/features`                    | FeaturesPage            |
| `/app/demo-tpv`                | ProductFirstLandingPage |
| `/public/:slug`                | PublicWebPage           |
| `/public/:slug/mesa/:number`   | TablePage               |
| `/public/:slug/order/:orderId` | OrderStatusPage         |
| `/public/:slug/kds`            | PublicKDS               |

### Auth routes

| Path           | Component      |
| -------------- | -------------- |
| `/auth/phone`  | PhoneLoginPage |
| `/auth/verify` | VerifyCodePage |
| `/auth/email`  | AuthPage       |

### Operational routes (auth + tenant required)

| Path               | Component             | Domain          |
| ------------------ | --------------------- | --------------- |
| `/op/tpv/*`        | TPVMinimal            | Point of sale   |
| `/op/kds`          | KDSMinimal            | Kitchen display |
| `/dashboard`       | DashboardPage         | Dashboard       |
| `/menu-builder`    | MenuBuilderMinimal    | Menu            |
| `/operacao`        | OperacaoPage          | Operations      |
| `/inventory-stock` | InventoryStockMinimal | Inventory       |
| `/task-system`     | TaskSystemMinimal     | Tasks           |
| `/shopping-list`   | ShoppingListMinimal   | Purchases       |

### AppStaff routes (`/app/staff/*`)

| Path             | Component     | Role     |
| ---------------- | ------------- | -------- |
| `home`           | StaffHomePage | All      |
| `owner`          | OwnerHome     | Owner    |
| `manager`        | ManagerHome   | Manager  |
| `waiter`         | WaiterHome    | Waiter   |
| `kitchen`        | KitchenHome   | Kitchen  |
| `cleaning`       | CleaningHome  | Cleaning |
| `mode/operation` | OperationMode | All      |
| `mode/turn`      | TurnMode      | All      |
| `mode/team`      | TeamMode      | All      |
| `mode/tpv`       | TPVMode       | All      |
| `mode/kds`       | KDSMode       | All      |
| `mode/tasks`     | TasksMode     | All      |
| `mode/alerts`    | AlertsMode    | All      |

### Admin routes (`/admin/*`)

| Path                  | Component                                                            |
| --------------------- | -------------------------------------------------------------------- |
| `/admin/home`         | AdminHome                                                            |
| `/admin/config`       | AdminConfig                                                          |
| `/admin/products`     | AdminProducts                                                        |
| `/admin/catalogs`     | AdminCatalogs                                                        |
| `/admin/customers`    | AdminCustomers                                                       |
| `/admin/reports/*`    | AdminReports (overview, sales, operations, staff, human-performance) |
| `/admin/reservations` | AdminReservations                                                    |
| `/admin/payments/*`   | AdminPayments (list, pending, refunds)                               |
| `/admin/devices`      | AdminDevices                                                         |
| `/admin/modules`      | AdminModules                                                         |
| `/admin/settings`     | AdminSettings                                                        |

### Config routes (`/config/*`)

| Path           | Component              |
| -------------- | ---------------------- |
| `general`      | ConfigGeneralPage      |
| `identity`     | ConfigIdentityPage     |
| `location`     | ConfigLocationPage     |
| `schedule`     | ConfigSchedulePage     |
| `people`       | ConfigPeoplePage       |
| `payments`     | ConfigPaymentsPage     |
| `integrations` | ConfigIntegrationsPage |
| `modules`      | ConfigModulesPage      |
| `perception`   | ConfigPerceptionPage   |
| `status`       | ConfigStatusPage       |

### Backoffice/Config (Spanish locale — `/app/backoffice/*`)

| Path                | Component                  |
| ------------------- | -------------------------- |
| `productos`         | ProductosConfigPage        |
| `marcas`            | MarcasConfigPage           |
| `entidades-legales` | EntidadesLegalesConfigPage |
| `suscripcion`       | SuscripcionConfigPage      |
| `transactions`      | TransactionsConfigPage     |
| `payouts`           | PayoutsConfigPage          |
| `usuarios`          | UsuariosConfigPage         |
| `dispositivos`      | DispositivosConfigPage     |
| `impresoras`        | ImpresorasConfigPage       |
| `integraciones`     | IntegracionesConfigPage    |
| `delivery`          | DeliveryConfigPage         |
| `empleados`         | EmpleadosConfigPage        |
| `software-tpv`      | SoftwareTpvConfigPage      |
| `reservas`          | ReservasConfigPage         |

### PWA manifest

```json
"start_url": "/app/staff/home",
"display": "standalone"
```

---

## 6. Docker Infrastructure State (at audit time)

### Containers in crash-loop (STOPPED during audit)

| Container              | Error                            | Root Cause                       |
| ---------------------- | -------------------------------- | -------------------------------- |
| chefiapp-test-auth     | `schema "auth" does not exist`   | Test DB missing `auth` schema    |
| chefiapp-test-realtime | `SECRET_KEY_BASE is missing`     | Missing env var                  |
| chefiapp-core-minio    | `Invalid credentials`            | `MINIO_ROOT_USER` too short      |
| chefiapp-core-pgadmin  | `admin@gm.local not valid email` | `.local` domain fails validation |

These were causing `net::ERR_CONNECTION_CLOSED` errors due to resource exhaustion. Stopped during audit.

### Healthy containers (20)

Core stack: nginx (3001), postgrest, postgres (54320), keycloak (8080), realtime (4000), chefiapp-db (5432).
Supabase stack: kong, rest, realtime, auth, storage, studio, pg_meta, inbucket, vector, analytics.
Test stack: kong, rest, postgres.

---

## 7. Production Risks — Top 10

| #   | Severity  | Risk                                                                             | Evidence                                                       |
| --- | --------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | **CRIT**  | Ghost workspace `customer-portal` breaks `npm ci` in fresh clone                 | `package.json` L7 references non-existent directory            |
| 2   | **CRIT**  | 6 scripts reference non-existent `server/` directory                             | `package.json` L37-42, `tsconfig.json` include                 |
| 3   | **CRIT**  | No E2E tests run in CI                                                           | `ci.yml` explicitly ignores Playwright/e2e                     |
| 4   | **ALTO**  | 4 different version numbers declared                                             | VERSION, package.json, README, git tags                        |
| 5   | **ALTO**  | 4 Docker containers in crash-loop                                                | test-auth, test-realtime, minio, pgadmin — resource exhaustion |
| 6   | **ALTO**  | README claims "Production Ready" but VERSION says `FASE_2_READY_PILOTO_PENDENTE` | Misleading status                                              |
| 7   | **MEDIO** | 1 939 doc files — unmanageable volume                                            | Many redundant (5+ "RESUMO_EXECUTIVO", 3+ "STATUS_FINAL")      |
| 8   | **MEDIO** | Coverage threshold (70%) not enforced in CI                                      | `jest.config.js` threshold exists, no CI gate                  |
| 9   | **MEDIO** | Mobile app not in npm workspaces                                                 | `mobile-app/` disconnected from monorepo tooling               |
| 10  | **BAIXO** | Mixed language in docs (PT-BR + EN + ES routes)                                  | Despite `LANGUAGE_POLICY.md` declaring English-only            |

---

## 8. Corrections Applied in This Audit

| Fix                                      | File(s)                                          | Commit Message                                                               |
| ---------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Remove ghost `customer-portal` workspace | `package.json`                                   | `fix(workspace): remove ghost customer-portal from workspaces`               |
| Remove ghost `server/` script references | `package.json`, `tsconfig.json`                  | `fix(scripts): remove references to non-existent server/ directory`          |
| Create `scripts/sync-version.js`         | `scripts/sync-version.js`                        | `feat(version): add sync-version script with VERSION as source of truth`     |
| Add Playwright smoke to CI               | `.github/workflows/ci.yml`                       | `ci(e2e): add Playwright smoke tests (3 specs) to PR pipeline`               |
| Create canonical routes contract         | `docs/architecture/ROUTES_CANONICAL_CONTRACT.md` | `docs(routes): add ROUTES_CANONICAL_CONTRACT.md with all implemented routes` |
| Stop crashing Docker containers          | runtime only                                     | N/A (not committed)                                                          |

---

_Generated: 2026-02-07T16:30:00Z_
