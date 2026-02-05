# ROTAS E CONTRATOS — Índice canónico (rota → contrato MD)

**Status:** CANONICAL
**Tipo:** Índice — cada rota oficial mapeada para o contrato que a governa
**Local:** docs/architecture/ROTAS_E_CONTRATOS.md
**Hierarquia:** Subordinado a [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md) e [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md)

---

## Regra

**Toda a rota oficial tem um contrato MD.** Este documento é o índice: rota → contrato. Não inferir rotas nem contratos fora desta lista.

---

## Tabela canónica: rota → contrato → superfície → gate

| Rota                                                                                                                                                                                                                                                                                                 | Contrato                                                 | Superfície                     | Gate                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| `/`                                                                                                                                                                                                                                                                                                  | PUBLIC_SITE_CONTRACT                                     | Pública                        | Nenhum                                                                  |
| `/landing`                                                                                                                                                                                                                                                                                           | PUBLIC_SITE_CONTRACT                                     | Pública                        | Nenhum (redirect → /)                                                   |
| `/demo`                                                                                                                                                                                                                                                                                              | AUTH_AND_ENTRY_CONTRACT                                  | Pública                        | Nenhum (redirect → /auth)                                               |
| `/demo-guiado`                                                                                                                                                                                                                                                                                       | AUTH_AND_ENTRY_CONTRACT                                  | Pública                        | Nenhum (página de demo guiado ligada a AUTH; tour dentro do trial real) |
| `/pricing`, `/features`                                                                                                                                                                                                                                                                              | PUBLIC_SITE_CONTRACT                                     | Pública                        | Nenhum                                                                  |
| `/login`, `/signup`, `/forgot-password`                                                                                                                                                                                                                                                              | AUTH_AND_ENTRY_CONTRACT                                  | Pública                        | Nenhum (redirect → /auth)                                               |
| `/auth`                                                                                                                                                                                                                                                                                              | AUTH_AND_ENTRY_CONTRACT                                  | Pública                        | Nenhum                                                                  |
| `/bootstrap`                                                                                                                                                                                                                                                                                         | RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT               | Portal                         | FlowGate                                                                |
| `/billing/success`, `/help/start-local`                                                                                                                                                                                                                                                              | CORE_BILLING / OPERATIONAL                               | Portal                         | FlowGate (dentro de /\*)                                                |
| `/*` (resto)                                                                                                                                                                                                                                                                                         | Ver secções abaixo                                       | Portal / Operacional / Pública | FlowGate + ShiftGuard + RoleGate onde aplicável                         |
| `/public/:slug`, `/public/:slug/mesa/:number`, `/public/:slug/order/:orderId`, `/public/:slug/kds`                                                                                                                                                                                                   | CORE_PUBLIC_WEB_CONTRACT                                 | Pública                        | ORE (surface WEB)                                                       |
| `/op/tpv/*`, `/op/kds`, `/op/cash`, `/op/staff`                                                                                                                                                                                                                                                      | OPERATIONAL_ROUTES_CONTRACT + OPERATIONAL_GATES_CONTRACT | Operacional                    | FlowGate + ShiftGate + ORE                                              |
| `/dashboard`, `/app/dashboard`, `/config/*`, `/app/*`, `/employee/*`, `/manager/*`, `/owner/*`, `/tasks`, `/people`, `/health`, `/alerts`, `/app/reports/*`, `/inventory-stock`, `/task-system`, `/shopping-list`, `/system-tree`, `/mentor`, `/purchases`, `/financial`, `/reservations`, `/groups` | PORTAL_MANAGEMENT_CONTRACT                               | Portal                         | FlowGate (não usam ORE como gate bloqueante)                            |

**Nota sobre /demo:** Não é página; é redirect explícito para `/auth`. Demonstração real é TRIAL autenticado. Ver App.tsx: `<Route path="/demo" element={<Navigate to="/auth" replace />} />`.

---

## 1. Marketing público (sem Runtime/Core)

| Rota           | Contrato MD                                                | Nota                                                                             |
| -------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `/`            | [PUBLIC_SITE_CONTRACT.md](./PUBLIC_SITE_CONTRACT.md)       | Landing; CTAs /signup, /auth                                                     |
| `/demo`        | [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) | **Redirect para /auth** (não é página de demonstração)                           |
| `/demo-guiado` | [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) | Página de demo guiado (`DemoGuiadoPage`); tour guiado ligado à camada AUTH/trial |
| `/pricing`     | [PUBLIC_SITE_CONTRACT.md](./PUBLIC_SITE_CONTRACT.md)       | Página pública                                                                   |
| `/features`    | [PUBLIC_SITE_CONTRACT.md](./PUBLIC_SITE_CONTRACT.md)       | Página pública                                                                   |

Boot: PUBLIC. Não carrega Runtime nem Core. Ver [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md).

---

## 2. Auth e entrada

| Rota               | Contrato MD                                                | Nota                                     |
| ------------------ | ---------------------------------------------------------- | ---------------------------------------- |
| `/signup`          | [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) | Criação de conta → /app/dashboard        |
| `/auth`            | [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) | Login; destino: /app/dashboard           |
| `/login`           | [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) | Redirect para /auth                      |
| `/forgot-password` | [AUTH_AND_ENTRY_CONTRACT.md](./AUTH_AND_ENTRY_CONTRACT.md) | Redirect para /auth ou fluxo equivalente |

---

## 3. Portal de gestão (/app e rotas cobertas por PORTAL_MANAGEMENT_CONTRACT)

Todas as rotas abaixo são **portal não-operacional**, governadas por **PORTAL_MANAGEMENT_CONTRACT** + **FlowGate**. Não usam ORE como gate bloqueante.

| Rota                                                                                           | Contrato MD                                                                                                                                                                                                                | Nota                                                                  |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `/dashboard`, `/app/dashboard`                                                                 | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md)                                                                                                                                                           | Comando central                                                       |
| `/config`, `/config/*`                                                                         | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md)                                                                                                                                                           | Identidade, localização, horários, pessoas, pagamentos, módulos, etc. |
| `/app/select-tenant`                                                                           | TENANT_SELECTION_CONTRACT                                                                                                                                                                                                  | Seleção de tenant                                                     |
| `/app/setup/*`                                                                                 | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md)                                                                                                                                                           | Redirects para menu-builder, operacao, config                         |
| `/app/backoffice`, `/app/menu-builder`, `/menu-builder`                                        | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) + [MENU_CONTRACT.md](./MENU_CONTRACT.md)                                                                                                                  | Cardápio                                                              |
| `/app/people`, `/people`, `/people/time`                                                       | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md)                                                                                                                                                           | Equipe                                                                |
| `/app/payments` (via /config/payments)                                                         | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) + [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](./CORE_BILLING_AND_PAYMENTS_CONTRACT.md)                                                                        | Métodos de pagamento                                                  |
| `/app/billing`                                                                                 | [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](./CORE_BILLING_AND_PAYMENTS_CONTRACT.md) + [BILLING_SUSPENSION_CONTRACT.md](./BILLING_SUSPENSION_CONTRACT.md)                                                                      | Planos SaaS, assinatura                                               |
| `/app/publish`, `/app/install`                                                                 | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md) + [RESTAURANT_LIFECYCLE_CONTRACT.md](./RESTAURANT_LIFECYCLE_CONTRACT.md) / [OPERATIONAL_INSTALL_FLOW_CONTRACT.md](./OPERATIONAL_INSTALL_FLOW_CONTRACT.md) | Publicar; instalar Web App                                            |
| `/employee/*`, `/manager/*`, `/owner/*`                                                        | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md)                                                                                                                                                           | Áreas de colaborador/gestor/proprietário                              |
| `/tasks`, `/tasks/:taskId`, `/tasks/recurring`                                                 | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md)                                                                                                                                                           | Tarefas                                                               |
| `/health`, `/alerts`, `/app/reports/*`, `/financial`, `/purchases`, `/reservations`, `/groups` | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md)                                                                                                                                                           | Saúde, alertas, relatórios, financeiro                                |
| `/inventory-stock`, `/task-system`, `/shopping-list`, `/system-tree`, `/mentor`, `/operacao`   | [PORTAL_MANAGEMENT_CONTRACT.md](./PORTAL_MANAGEMENT_CONTRACT.md)                                                                                                                                                           | Estoque, tarefas, lista compras, árvore sistema                       |
| `/help/start-local`                                                                            | OPERATIONAL                                                                                                                                                                                                                | Ajuda local                                                           |

Boot: MANAGEMENT. Ver [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md).

---

## 4. Operação (/op)

| Rota        | Contrato MD                                                                                                                                                                                                                                                                                 | Nota                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `/op/tpv`   | [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) + [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) + [OPERATIONAL_INSTALLATION_CONTRACT.md](./OPERATIONAL_INSTALLATION_CONTRACT.md) + [CORE_TPV_BEHAVIOUR_CONTRACT.md](./CORE_TPV_BEHAVIOUR_CONTRACT.md) | TPV; gate published + billing; Web App Instalável |
| `/op/kds`   | [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) + [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) + [OPERATIONAL_INSTALLATION_CONTRACT.md](./OPERATIONAL_INSTALLATION_CONTRACT.md) + [CORE_KDS_CONTRACT.md](./CORE_KDS_CONTRACT.md)                     | KDS; mesmo gate; Web App Instalável               |
| `/op/cash`  | [OPERATIONAL_ROUTES_CONTRACT.md](./OPERATIONAL_ROUTES_CONTRACT.md) + [CASH_REGISTER_LIFECYCLE_CONTRACT.md](./CASH_REGISTER_LIFECYCLE_CONTRACT.md)                                                                                                                                           | Caixa; operational === true                       |
| `/op/staff` | [APP_STAFF_MOBILE_CONTRACT.md](./APP_STAFF_MOBILE_CONTRACT.md)                                                                                                                                                                                                                              | AppStaff Web (se existir)                         |

Legado: `/tpv` → `/op/tpv`, `/kds-minimal` → `/op/kds`. Boot: OPERATIONAL. Ver [APPLICATION_BOOT_CONTRACT.md](./APPLICATION_BOOT_CONTRACT.md).

---

## 5. Web pública do restaurante

| Rota            | Contrato MD                                                             | Nota                                               |
| --------------- | ----------------------------------------------------------------------- | -------------------------------------------------- |
| `/public/:slug` | [CORE_PUBLIC_WEB_CONTRACT.md](../contracts/CORE_PUBLIC_WEB_CONTRACT.md) | Site do restaurante; ativo se isPublished === true |

Canónico de produto: `/r/:slug` (ver [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md)). Implementação atual: `/public/:slug`.

---

## 6. Outros

| Rota                        | Contrato MD                                                                      | Nota                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `/billing/success`          | [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](./CORE_BILLING_AND_PAYMENTS_CONTRACT.md) | Callback pós-pagamento; sem Runtime                                                    |
| `/onboarding/first-product` | [MANAGEMENT_ADVISOR_CONTRACT.md](./MANAGEMENT_ADVISOR_CONTRACT.md)               | Passo canónico de onboarding inicial (primeiro produto); checklist/ajuda; não bloqueia |

---

## Resumo por contrato (quem governa o quê)

| Contrato MD                                                           | Rotas governadas                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PUBLIC_SITE_CONTRACT                                                  | /, /pricing, /features                                                                                                                                                                                                                                                                                      |
| AUTH_AND_ENTRY_CONTRACT                                               | /signup, /auth, /login, /forgot-password, **/demo** (redirect → /auth), **/demo-guiado** (página demo guiado ligada a AUTH)                                                                                                                                                                                 |
| RESTAURANT_CREATION_AND_BOOTSTRAP_CONTRACT                            | /bootstrap                                                                                                                                                                                                                                                                                                  |
| TENANT_SELECTION_CONTRACT                                             | /app/select-tenant                                                                                                                                                                                                                                                                                          |
| PORTAL_MANAGEMENT_CONTRACT                                            | /dashboard, /app/dashboard, /config/_, /app/setup/_, /app/backoffice, /menu-builder, /people, /tasks, /health, /alerts, /app/reports/_, /inventory-stock, /task-system, /shopping-list, /system-tree, /mentor, /employee/_, /manager/_, /owner/_, /purchases, /financial, /reservations, /groups, /operacao |
| CORE_BILLING_AND_PAYMENTS_CONTRACT                                    | /app/billing, /billing/success                                                                                                                                                                                                                                                                              |
| BILLING_SUSPENSION_CONTRACT                                           | Estados e bloqueio de /app/billing e /op/\*                                                                                                                                                                                                                                                                 |
| OPERATIONAL_ROUTES_CONTRACT + OPERATIONAL_GATES_CONTRACT              | /op/tpv, /op/kds, /op/cash, /op/staff (ORE obrigatório para TPV/KDS)                                                                                                                                                                                                                                        |
| OPERATIONAL_INSTALLATION_CONTRACT + OPERATIONAL_INSTALL_FLOW_CONTRACT | Instalação /app/install, /op/tpv, /op/kds                                                                                                                                                                                                                                                                   |
| RESTAURANT_LIFECYCLE_CONTRACT                                         | Ciclo configured → published → operational; /app/publish                                                                                                                                                                                                                                                    |
| CORE_PUBLIC_WEB_CONTRACT                                              | /public/:slug, /public/:slug/mesa/:number, /public/:slug/order/:orderId, /public/:slug/kds                                                                                                                                                                                                                  |

---

## Critério de conclusão (rota limpa)

- Toda rota em App.tsx aparece em ROTAS_E_CONTRATOS (ou é redirect documentado).
- Toda rota tem contrato e gate definido.
- /demo não é página de demonstração; é redirect para /auth.
- Rotas operacionais (/op/tpv, /op/kds) usam ORE; nenhuma rota operativa contorna ORE.

---

## Referências

- [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md) — lista oficial de rotas e runtime
- [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md) — fluxo do cliente (visão produto)
- [CORE_CONTRACT_INDEX.md](./CORE_CONTRACT_INDEX.md) — índice geral de contratos

**Violação = rota ou contrato fora do índice.**
