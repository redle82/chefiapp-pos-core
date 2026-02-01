# Rotas apenas online (sem KDS, AppStaff, terminais)

**Uso:** Ver só o que é “online” (web): landing, onboarding, billing, dashboard, config, backoffice. **Excluído:** KDS, AppStaff (/garcom), TPV, operação mesas, task-system, etc.

---

## O que abrir no navegador (base: http://localhost:5175)

| Página                            | URL                            | Nota                                                                   |
| --------------------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| **Landing**                       | `/`                            | Página inicial pública                                                 |
| **Demo**                          | `/demo`                        | Tour demo                                                              |
| **Onboarding**                    | `/onboarding`                  | Setup inicial                                                          |
| **Billing (sucesso)**             | `/billing/success`             | Confirmação pagamento                                                  |
| **Billing (gestão)**              | `/app/billing`                 | Subscrição / Stripe (requer login)                                     |
| **Dashboard (Comando)**           | `/dashboard`                   | Painel principal (requer login)                                        |
| **Configuração**                  | `/config`                      | Identidade, local, horários, pessoas, pagamentos, integrações, módulos |
| **Backoffice**                    | `/app/backoffice`              | Backoffice (requer onboarding)                                         |
| **Manager Dashboard**             | `/manager/dashboard`           | Dashboard do gestor                                                    |
| **Manager Central**               | `/manager/central`             | Central de comando                                                     |
| **Página pública do restaurante** | `/public/:slug`                | Menu/presença (trocar `:slug` pelo slug real)                          |
| **Mesa (cliente)**                | `/public/:slug/mesa/:number`   | Pedir à mesa                                                           |
| **Estado do pedido (cliente)**    | `/public/:slug/order/:orderId` | Ver pedido                                                             |

---

## O que NÃO usar quando quiser “só online”

| Excluído                  | URL                                                                |
| ------------------------- | ------------------------------------------------------------------ |
| KDS (cozinha)             | `/kds-minimal`, `/public/:slug/kds`, `/employee/operation/kitchen` |
| AppStaff (garçom)         | `/garcom`, `/garcom/mesa/:tableId` — no web mostram apenas «Disponível apenas no app mobile»; terminal real em `mobile-app` (iOS/Android). |
| TPV (caixa)               | `/tpv`, `/tpv-test`                                                |
| Operação (mesas internas) | `/operacao`                                                        |
| Task system               | `/task-system`                                                     |
| Shopping list             | `/shopping-list`                                                   |
| Inventory                 | `/inventory-stock`                                                 |
| Menu builder (setup)      | `/menu-builder`                                                    |

---

**Resumo:** Para “ver tudo que será online” sem terminais: usar **`/`**, **`/dashboard`**, **`/config`**, **`/app/billing`**, **`/manager/central`**, **`/app/backoffice`** e as rotas **`/public/...`** (com slug real). Não abrir `/garcom` nem `/kds-minimal` nem `/tpv`.
