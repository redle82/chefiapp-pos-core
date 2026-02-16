# Mapa de Rotas 2026

Extraído de `merchant-portal/src/routes/OperationalRoutes.tsx` e `merchant-portal/src/routes/MarketingRoutes.tsx`.
Classificação: **Funcional** (página real e utilizada), **Parcial** (redirect ou esqueleto), **Não implementado** (placeholder/404).

---

## Marketing (MarketingRoutes)

| Rota                              | Componente                     | Status    |
| --------------------------------- | ------------------------------ | --------- |
| `/`                               | LandingV2Page                  | Funcional |
| `/landing`                        | → /auth/phone                  | Parcial   |
| `/v2`, `/landing-v2`              | LandingV2Page                  | Funcional |
| `/app/trial-tpv`                  | ProductFirstLandingPage        | Funcional |
| `/pricing`                        | PricingPage                    | Funcional |
| `/features`                       | FeaturesPage                   | Funcional |
| `/blog`, `/blog/tpv-restaurantes` | BlogTPVRestaurantesPage        | Funcional |
| `/blog/tpv-vs-pos-fiscal`         | BlogTPVVsPOSFiscalPage         | Funcional |
| `/blog/quando-abrir-fechar-caixa` | BlogQuandoAbrirFecharCaixaPage | Funcional |
| `/changelog`                      | ChangelogPage                  | Funcional |
| `/security`                       | SecurityPage                   | Funcional |
| `/status`                         | StatusPage                     | Funcional |
| `/legal/terms`                    | LegalTermsPage                 | Funcional |
| `/legal/privacy`                  | LegalPrivacyPage               | Funcional |
| `/legal/dpa`                      | LegalDPAPage                   | Funcional |
| `/trial`, `/trial-guide`          | → /op/tpv?mode=trial           | Parcial   |
| `/login`, `/register`, `/signup`  | → /auth/phone                  | Parcial   |
| `/forgot`, `/forgot-password`     | → /auth/email                  | Parcial   |
| `/auth`                           | → /auth/phone                  | Parcial   |
| `/auth/phone`                     | PhoneLoginPage                 | Funcional |
| `/auth/verify`                    | VerifyCodePage                 | Funcional |
| `/auth/email`                     | AuthPage                       | Funcional |
| `/bootstrap`                      | BootstrapPage                  | Funcional |
| `/billing/success`                | BillingSuccessPage             | Funcional |
| `/help/start-local`               | HelpStartLocalPage             | Funcional |
| `/menu`                           | MenuCatalogPage                | Funcional |
| `/menu-v2`                        | MenuCatalogPageV2              | Funcional |
| `/mentor`                         | MentorPage                     | Funcional |

---

## Público / Public (OperationalRoutes)

| Rota                           | Componente              | Status    |
| ------------------------------ | ----------------------- | --------- |
| `/public/:slug`                | PublicWebPage           | Funcional |
| `/public/:slug/mesa/:number`   | TablePage               | Funcional |
| `/public/:slug/order/:orderId` | CustomerOrderStatusView | Funcional |
| `/public/:slug/kds`            | PublicKDS               | Funcional |

---

## Entrada App / Onboarding (OperationalRoutes)

| Rota                        | Componente              | Status    |
| --------------------------- | ----------------------- | --------- |
| `/welcome`                  | WelcomePage             | Funcional |
| `/onboarding`               | OnboardingAssistantPage | Funcional |
| `/app/onboarding`           | → /onboarding           | Parcial   |
| `/app/activation`           | ActivationCenterPage    | Funcional |
| `/app/select-tenant`        | SelectTenantPage        | Funcional |
| `/app`                      | → /app/staff/home       | Parcial   |
| `/setup/restaurant-minimal` | → /app/activation       | Parcial   |

---

## Operacional (/op/\*)

| Rota                                           | Componente                                          | Status    |
| ---------------------------------------------- | --------------------------------------------------- | --------- |
| `/op/tpv`                                      | TPVLayout (ShiftGate, OperationalFullscreenWrapper) | Funcional |
| `/op/tpv/orders`                               | TPVOrdersPage                                       | Funcional |
| `/op/tpv/settings`                             | TPVSettingsPage                                     | Funcional |
| `/op/kds`                                      | KDSMinimal                                          | Funcional |
| `/op/cash`, `/op/pos`, `/op/pos/*`             | → /op/tpv                                           | Parcial   |
| `/op/staff`                                    | AppStaffMobileOnlyPage                              | Funcional |
| `/op/owner`                                    | → /app/staff/home/owner                             | Parcial   |
| `/tpv`, `/tpv-minimal`, `/kds`, `/kds-minimal` | → /op/tpv ou /op/kds                                | Parcial   |

---

## AppStaff (/app/staff/\*)

| Rota                               | Componente                              | Status    |
| ---------------------------------- | --------------------------------------- | --------- |
| `/app/staff`                       | AppStaffWrapper                         | Funcional |
| `/app/staff/home`                  | StaffAppShellLayout + StaffHomeRedirect | Funcional |
| `/app/staff/home/owner`            | OwnerGlobalDashboard                    | Funcional |
| `/app/staff/home/manager`          | ManagerHome                             | Funcional |
| `/app/staff/home/waiter`           | AppStaffHome                            | Funcional |
| `/app/staff/home/kitchen`          | KitchenHome                             | Funcional |
| `/app/staff/home/cleaning`         | CleaningHome                            | Funcional |
| `/app/staff/home/worker`           | WorkerHome                              | Funcional |
| `/app/staff/home/sector/operation` | OperationSectorDashboard                | Funcional |
| `/app/staff/home/sector/tasks`     | TasksSectorDashboard                    | Funcional |
| `/app/staff/home/sector/team`      | TeamSectorDashboard                     | Funcional |
| `/app/staff/home/sector/kitchen`   | KitchenSectorDashboard                  | Funcional |
| `/app/staff/home/sector/cleaning`  | CleaningSectorDashboard                 | Funcional |
| `/app/staff/mode/operation`        | OperationModePage                       | Funcional |
| `/app/staff/mode/turn`             | ManagerTurnoPage                        | Funcional |
| `/app/staff/mode/team`             | ManagerEquipePage                       | Funcional |
| `/app/staff/mode/tpv`              | StaffTpvPage                            | Funcional |
| `/app/staff/mode/kds`              | KitchenDisplay                          | Funcional |
| `/app/staff/mode/tasks`            | ManagerTarefasPage                      | Funcional |
| `/app/staff/mode/alerts`           | ManagerExcecoesPage                     | Funcional |
| `/app/staff/profile`               | StaffProfilePage                        | Funcional |
| `/app/staff/config-desktop-only`   | ConfigDesktopOnlyPage                   | Funcional |

---

## Admin (/admin/\*)

| Rota                                                       | Componente                    | Status    |
| ---------------------------------------------------------- | ----------------------------- | --------- |
| `/admin`                                                   | → /admin/reports/overview     | Parcial   |
| `/admin/home`                                              | DashboardHomePage             | Funcional |
| `/admin/clients`                                           | → /admin/customers            | Parcial   |
| `/admin/customers`                                         | CustomersPage                 | Funcional |
| `/admin/customers/:id`                                     | CustomerDetailPage            | Funcional |
| `/admin/closures`                                          | ClosuresPage                  | Funcional |
| `/admin/reservations`                                      | ReservationsOperationalPage   | Funcional |
| `/admin/payments`                                          | PaymentsLayout                | Funcional |
| `/admin/payments/transactions`                             | TransactionsPage              | Funcional |
| `/admin/payments/payouts`                                  | PayoutsPage                   | Funcional |
| `/admin/promotions`                                        | PromotionsPage                | Funcional |
| `/admin/catalog/list`                                      | CatalogListPage               | Funcional |
| `/admin/catalog/assignments`                               | CatalogAssignmentsPage        | Funcional |
| `/admin/catalog/products`                                  | ProductsPage                  | Funcional |
| `/admin/catalog/modifiers`                                 | ModifiersPage                 | Funcional |
| `/admin/catalog/combos`                                    | CombosPage                    | Funcional |
| `/admin/catalog/translations`                              | TranslationsPage              | Funcional |
| `/admin/catalog`                                           | → /admin/catalog/products     | Parcial   |
| `/admin/modules`                                           | ModulesPage (Mis productos)   | Funcional |
| `/admin/config/productos`                                  | → /admin/modules              | Parcial   |
| `/admin/reports/overview`                                  | AdminReportsOverview          | Funcional |
| `/admin/reports/sales`                                     | SalesByPeriodReportPage       | Funcional |
| `/admin/reports/multiunit`                                 | MultiUnitOverviewReportPage   | Funcional |
| `/admin/reports/operations`                                | OperationalActivityReportPage | Funcional |
| `/admin/reports/human-performance`                         | GamificationImpactReportPage  | Funcional |
| `/admin/reports`                                           | → /admin/reports/overview     | Parcial   |
| `/admin/observability`                                     | ObservabilityPage             | Funcional |
| `/admin/devices`                                           | InstallPage                   | Funcional |
| `/admin/config`                                            | AdminConfigLayout             | Funcional |
| `/admin/config/general`                                    | GeneralConfigPage             | Funcional |
| `/admin/config/suscripcion`                                | SuscripcionConfigPage         | Funcional |
| `/admin/config/ubicaciones`                                | UbicacionesConfigPage         | Funcional |
| `/admin/config/entidades-legales`                          | EntidadesLegalesConfigPage    | Funcional |
| `/admin/config/marcas`                                     | MarcasConfigPage              | Funcional |
| `/admin/config/usuarios`                                   | UsuariosConfigPage            | Funcional |
| `/admin/config/dispositivos`                               | DispositivosConfigPage        | Funcional |
| `/admin/config/impresoras`                                 | ImpresorasConfigPage          | Funcional |
| `/admin/config/integrations`                               | IntegracionesConfigPage       | Funcional |
| `/admin/config/integraciones`                              | → integrations                | Parcial   |
| `/admin/config/delivery`                                   | DeliveryConfigPage            | Funcional |
| `/admin/config/delivery/plano-mesas`, `/delivery/qr`, etc. | DeliveryConfigPage            | Funcional |
| `/admin/config/empleados`                                  | EmpleadosConfigPage           | Funcional |
| `/admin/config/software-tpv`                               | SoftwareTpvConfigPage         | Funcional |
| `/admin/config/reservas`                                   | ReservasConfigPage            | Funcional |
| `/admin/config/tienda-online`                              | → /admin/config/integrations  | Parcial   |

---

## Outras rotas operacionais

| Rota                                        | Componente                  | Status    |
| ------------------------------------------- | --------------------------- | --------- |
| `/dashboard`, `/app/dashboard`              | → /admin/reports/overview   | Parcial   |
| `/menu-builder`                             | MenuBuilderMinimal          | Funcional |
| `/operacao`                                 | OperacaoMinimal             | Funcional |
| `/inventory-stock`                          | InventoryStockMinimal       | Funcional |
| `/task-system`                              | TaskSystemMinimal           | Funcional |
| `/shopping-list`                            | ShoppingListMinimal         | Funcional |
| `/app/waiter`, `/app/waiter/table/:tableId` | WaiterHomePage, TablePanel  | Funcional |
| `/app/backoffice`                           | BackofficePage              | Funcional |
| `/app/control-room`                         | → /app/staff/mode/operation | Parcial   |
| `/app/setup/estoque`                        | → /inventory-stock          | Parcial   |
| `/app/setup/tpv`                            | → /op/tpv                   | Parcial   |
| `/app/setup/kds`                            | → /op/kds                   | Parcial   |
| `/config`, `/config/*`                      | → /admin/config             | Parcial   |
| `/app/billing`                              | BillingPage                 | Funcional |
| `/app/help`                                 | HelpPage                    | Funcional |
| `/app/reports/daily-closing`                | DailyClosingReportPage      | Funcional |
| `*` (catch-all)                             | CoreResetPage               | Parcial   |

---

## Resumo

- **Funcional:** páginas com componente real e utilizadas no fluxo.
- **Parcial:** redirects (Navigate) ou rotas que delegam noutra; não são 404.
- **Não implementado:** nenhuma rota listada é explicitamente placeholder/404; o catch-all `*` mostra CoreResetPage (reset controlado).

Rotas críticas para a auditoria de botões (Mis productos): `/op/tpv`, `/app/staff`, `/inventory-stock`, `/admin/config/integrations`, `/admin/config/delivery`, `/admin/reservations` — todas existem e estão classificadas como Funcional ou Parcial (redirect para funcional).
