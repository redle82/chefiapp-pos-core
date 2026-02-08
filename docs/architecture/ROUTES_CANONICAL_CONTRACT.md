# Routes Canonical Contract

> Source of truth: `merchant-portal/src/App.tsx`
> Last verified: 2026-02-07 against branch `core/frozen-v1` (commit `34b1a9b1`)

Any route added to `App.tsx` MUST be listed here.
Any route listed here MUST exist in `App.tsx`.
CI validation: `grep -c 'path=' merchant-portal/src/App.tsx` should match
the count of entries in this document.

---

## Public (no auth)

| Path                           | Component               | Purpose                |
| ------------------------------ | ----------------------- | ---------------------- |
| `/`                            | LandingPage             | Marketing landing      |
| `/pricing`                     | PricingPage             | Pricing page           |
| `/features`                    | FeaturesPage            | Feature showcase       |
| `/app/demo-tpv`                | ProductFirstLandingPage | Demo TPV               |
| `/public/:slug`                | PublicWebPage           | Restaurant public page |
| `/public/:slug/mesa/:number`   | TablePage               | QR table order         |
| `/public/:slug/order/:orderId` | OrderStatusPage         | Order tracking         |
| `/public/:slug/kds`            | PublicKDS               | Public kitchen display |

## Redirects (legacy compatibility)

| Path               | Target            |
| ------------------ | ----------------- |
| `/landing`         | `/`               |
| `/demo`            | `/auth`           |
| `/demo-guiado`     | `/auth`           |
| `/login`           | `/auth/phone`     |
| `/signup`          | `/auth/phone`     |
| `/forgot-password` | `/auth/phone`     |
| `/auth`            | `/auth/phone`     |
| `/app`             | `/app/staff/home` |
| `/op/cash`         | `/op/tpv`         |
| `/tpv`             | `/op/tpv`         |
| `/kds`             | `/op/kds`         |

## Auth

| Path           | Component      | Purpose              |
| -------------- | -------------- | -------------------- |
| `/auth/phone`  | PhoneLoginPage | Phone OTP login      |
| `/auth/verify` | VerifyCodePage | OTP verification     |
| `/auth/email`  | AuthPage       | Email/password login |

## Bootstrap & Onboarding

| Path                        | Component              | Purpose                     |
| --------------------------- | ---------------------- | --------------------------- |
| `/bootstrap`                | BootstrapPage          | First-time setup            |
| `/setup/restaurant-minimal` | RestaurantMinimalSetup | Minimal restaurant creation |
| `/app/select-tenant`        | SelectTenantPage       | Multi-tenant selector       |
| `/billing/success`          | BillingSuccessPage     | Post-payment success        |
| `/help/start-local`         | HelpStartLocalPage     | Local dev help              |

## Menu (public-ish, auth optional)

| Path       | Component         | Purpose         |
| ---------- | ----------------- | --------------- |
| `/menu`    | MenuCatalogPage   | Menu catalog v1 |
| `/menu-v2` | MenuCatalogPageV2 | Menu catalog v2 |

## Operational (auth + tenant required)

| Path                    | Component              | Purpose                       |
| ----------------------- | ---------------------- | ----------------------------- |
| `/op/tpv/*`             | TPVMinimal             | Point of sale terminal        |
| `/op/kds`               | KDSMinimal             | Kitchen display system        |
| `/op/staff`             | AppStaffMobileOnlyPage | Staff redirect (mobile)       |
| `/dashboard`            | DashboardPage          | Main dashboard                |
| `/app/dashboard`        | DashboardPage          | Dashboard alias               |
| `/app/runbook-core`     | RunbookCorePage        | Core runbook                  |
| `/menu-builder`         | MenuBuilderMinimal     | Menu builder                  |
| `/operacao`             | OperacaoPage           | Operations hub                |
| `/inventory-stock`      | InventoryStockMinimal  | Inventory management          |
| `/task-system`          | TaskSystemMinimal      | Task management               |
| `/shopping-list`        | ShoppingListMinimal    | Shopping list                 |
| `/garcom`               | AppStaffMobileOnlyPage | Waiter redirect (mobile only) |
| `/garcom/mesa/:tableId` | WaiterTablePage        | Waiter table view             |
| `/kds-minimal`          | KDSMinimalPage         | KDS standalone                |
| `/tpv-minimal`          | TPVMinimalPage         | TPV standalone                |
| `/system-tree`          | SystemTreePage         | System config tree            |

## AppStaff (`/app/staff/*`)

### Role homes

| Path       | Component     | Role      |
| ---------- | ------------- | --------- |
| `home`     | StaffHomePage | All roles |
| `owner`    | OwnerHome     | Owner     |
| `manager`  | ManagerHome   | Manager   |
| `waiter`   | WaiterHome    | Waiter    |
| `kitchen`  | KitchenHome   | Kitchen   |
| `cleaning` | CleaningHome  | Cleaning  |

### Mode views

| Path             | Component     | Purpose               |
| ---------------- | ------------- | --------------------- |
| `mode/operation` | OperationMode | Operational overview  |
| `mode/turn`      | TurnMode      | Shift/turn management |
| `mode/team`      | TeamMode      | Team overview         |
| `mode/tpv`       | TPVMode       | TPV mode              |
| `mode/kds`       | KDSMode       | KDS mode              |
| `mode/tasks`     | TasksMode     | Task tracking         |
| `mode/alerts`    | AlertsMode    | Alert center          |

## Employee routes

| Path                          | Component         | Purpose            |
| ----------------------------- | ----------------- | ------------------ |
| `/employee/home`              | EmployeeHome      | Employee dashboard |
| `/employee/tasks`             | EmployeeTasks     | Employee tasks     |
| `/employee/mentor`            | EmployeeMentor    | AI mentor          |
| `/employee/operation`         | EmployeeOperation | Operations view    |
| `/employee/operation/kitchen` | KitchenOperation  | Kitchen operations |

## Manager routes

| Path                       | Component           | Purpose            |
| -------------------------- | ------------------- | ------------------ |
| `/manager/dashboard`       | ManagerDashboard    | Manager dashboard  |
| `/manager/central`         | ManagerCentral      | Central management |
| `/manager/analysis`        | ManagerAnalysis     | Analytics          |
| `/manager/schedule`        | ManagerSchedule     | Schedule           |
| `/manager/schedule/create` | ScheduleCreate      | Create schedule    |
| `/manager/reservations`    | ManagerReservations | Reservations       |

## Owner routes

| Path                | Component       | Purpose             |
| ------------------- | --------------- | ------------------- |
| `/owner/dashboard`  | OwnerDashboard  | Owner dashboard     |
| `/owner/vision`     | OwnerVision     | Strategic vision    |
| `/owner/stock`      | OwnerStock      | Stock overview      |
| `/owner/simulation` | OwnerSimulation | Business simulation |
| `/owner/purchases`  | OwnerPurchases  | Purchases           |

## Admin routes (`/admin/*`)

| Path                               | Component          | Purpose             |
| ---------------------------------- | ------------------ | ------------------- |
| `/admin/home`                      | AdminHome          | Admin hub           |
| `/admin/config`                    | AdminConfig        | System config       |
| `/admin/products`                  | AdminProducts      | Product management  |
| `/admin/catalogs`                  | AdminCatalogs      | Catalog management  |
| `/admin/catalog-assignments`       | CatalogAssignments | Catalog assignments |
| `/admin/catalog/products`          | CatalogProducts    | Catalog products    |
| `/admin/combos`                    | AdminCombos        | Combo products      |
| `/admin/modifiers`                 | AdminModifiers     | Product modifiers   |
| `/admin/promotions`                | AdminPromotions    | Promotions          |
| `/admin/customers`                 | AdminCustomers     | Customer CRM        |
| `/admin/customers/:id`             | CustomerDetail     | Customer detail     |
| `/admin/clients`                   | AdminClients       | Client list         |
| `/admin/devices`                   | AdminDevices       | Device management   |
| `/admin/modules`                   | AdminModules       | Module config       |
| `/admin/settings`                  | AdminSettings      | Settings            |
| `/admin/translations`              | AdminTranslations  | i18n management     |
| `/admin/closures`                  | AdminClosures      | Cash closures       |
| `/admin/reservations`              | AdminReservations  | Reservations        |
| `/admin/payments`                  | AdminPayments      | Payment overview    |
| `/admin/payments/list`             | PaymentsList       | Payment list        |
| `/admin/payments/pending`          | PendingPayments    | Pending payments    |
| `/admin/payments/refunds`          | Refunds            | Refund management   |
| `/admin/reports`                   | AdminReports       | Reports hub         |
| `/admin/reports/overview`          | ReportsOverview    | Overview            |
| `/admin/reports/sales`             | SalesReport        | Sales               |
| `/admin/reports/operations`        | OperationsReport   | Operations          |
| `/admin/reports/staff`             | StaffReport        | Staff performance   |
| `/admin/reports/human-performance` | HumanPerformance   | Human KPIs          |

## Config routes (`/config/*`)

| Path               | Component              | Purpose                |
| ------------------ | ---------------------- | ---------------------- |
| `general`          | ConfigGeneralPage      | General settings       |
| `identity`         | ConfigIdentityPage     | Brand identity         |
| `location`         | ConfigLocationPage     | Location/address       |
| `location/address` | ConfigLocationPage     | Address detail         |
| `location/tables`  | ConfigLocationPage     | Table layout           |
| `schedule`         | ConfigSchedulePage     | Hours/schedule         |
| `schedule/hours`   | ConfigSchedulePage     | Operating hours        |
| `people`           | ConfigPeoplePage       | People management      |
| `people/employees` | ConfigPeoplePage       | Employee list          |
| `people/roles`     | ConfigPeoplePage       | Role config            |
| `payments`         | ConfigPaymentsPage     | Payment config         |
| `integrations`     | ConfigIntegrationsPage | Integration config     |
| `modules`          | ConfigModulesPage      | Module toggles         |
| `perception`       | ConfigPerceptionPage   | Operational perception |
| `status`           | ConfigStatusPage       | System status          |
| `ubicaciones`      | UbicacionesPage        | Locations (ES)         |
| `ubicaciones/nova` | UbicacionCreatePage    | New location           |
| `ubicaciones/:id`  | UbicacionEditPage      | Edit location          |

## Backoffice routes (`/app/backoffice/*`)

| Path                       | Component                  | Purpose         |
| -------------------------- | -------------------------- | --------------- |
| `productos`                | ProductosConfigPage        | Products (ES)   |
| `marcas`                   | MarcasConfigPage           | Brands          |
| `entidades-legales`        | EntidadesLegalesConfigPage | Legal entities  |
| `suscripcion`              | SuscripcionConfigPage      | Subscription    |
| `transactions`             | TransactionsConfigPage     | Transactions    |
| `payouts`                  | PayoutsConfigPage          | Payouts         |
| `usuarios`                 | UsuariosConfigPage         | Users           |
| `dispositivos`             | DispositivosConfigPage     | Devices         |
| `impresoras`               | ImpresorasConfigPage       | Printers        |
| `integraciones`            | IntegracionesConfigPage    | Integrations    |
| `delivery`                 | DeliveryConfigPage         | Delivery config |
| `delivery/plano-mesas`     | DeliveryConfigPage         | Table plan      |
| `delivery/horarios`        | DeliveryConfigPage         | Delivery hours  |
| `delivery/qr`              | DeliveryConfigPage         | QR codes        |
| `empleados`                | EmpleadosConfigPage        | Employees       |
| `empleados/employees`      | EmpleadosConfigPage        | Employee list   |
| `empleados/roles`          | EmpleadosConfigPage        | Role config     |
| `software-tpv`             | SoftwareTpvConfigPage      | TPV software    |
| `software-tpv/config`      | SoftwareTpvConfigPage      | TPV config      |
| `software-tpv/modo-rapido` | SoftwareTpvConfigPage      | Quick mode      |
| `reservas`                 | ReservasConfigPage         | Reservations    |
| `reservas/disponibilidad`  | ReservasConfigPage         | Availability    |
| `reservas/garantia`        | ReservasConfigPage         | Guarantees      |
| `reservas/turnos`          | ReservasConfigPage         | Turns           |
| `reservas/mensajes`        | ReservasConfigPage         | Messages        |

## Catch-all

| Path | Component     | Purpose              |
| ---- | ------------- | -------------------- |
| `*`  | CoreResetPage | 404 / reset fallback |

---

## PWA Manifest

```json
{
  "start_url": "/app/staff/home",
  "display": "standalone"
}
```

The PWA entry point is `/app/staff/home` which resolves to the StaffHomePage
component inside the AppStaffWrapper layout.

---

## Validation

To verify this contract matches the code:

```bash
# Count Route path= declarations in App.tsx
grep -c 'path=' merchant-portal/src/App.tsx

# Compare with this document's table rows (excluding headers and separators)
grep -c '| /' docs/architecture/ROUTES_CANONICAL_CONTRACT.md
```

Both counts should be approximately equal (exact match is hard due to
nested routes and redirect aliases).
