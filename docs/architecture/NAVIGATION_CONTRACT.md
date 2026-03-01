# Contrato de Navegação (fluxo canónico)

**Status:** LEGACY (SUPERSEDED)
**Autoridade vigente:** [CHEFIAPP_OS_ARCHITECTURE_V1.md](./CHEFIAPP_OS_ARCHITECTURE_V1.md) + [CORE_RUNTIME_AND_ROUTES_CONTRACT.md](./CORE_RUNTIME_AND_ROUTES_CONTRACT.md)
**Política:** este documento permanece apenas para contexto histórico/operacional e não pode sobrepor contratos canônicos.

**Objetivo:** Fonte única de verdade para a jornada Auth → welcome → activation → dashboard. Nenhum bypass do Centro de Ativação; rotas antigas redirecionam; nenhum botão morto.

**Fonte de verdade (código):** [CoreFlow.ts](../../merchant-portal/src/core/flow/CoreFlow.ts) (`resolveNextRoute`), [FlowGate.tsx](../../merchant-portal/src/core/flow/FlowGate.tsx) (aplica o redirect). Testes: [CoreFlow.test.ts](../../merchant-portal/src/core/flow/CoreFlow.test.ts), [routeGuards.test.ts](../../merchant-portal/src/core/navigation/routeGuards.test.ts). API nomeada: [routeGuards.ts](../../merchant-portal/src/core/navigation/routeGuards.ts). E2E: [navigation-contract.spec.ts](../../merchant-portal/tests/e2e/navigation-contract.spec.ts).

---

## 1. Fluxo canónico

```
Auth → (sem org) /welcome → (com org, não ativado) /app/activation → (ativado) /app/dashboard
```

- **Sem organização:** destino pós-auth = `/welcome` (Bem-vindo, primeira tela pós-auth).
- **Com organização mas não ativado:** destino = `/app/activation` (Centro de Ativação, checklist).
- **Ativado:** destino = `/app/dashboard` (última área; na prática redirect para `/admin/reports/overview`).
- **Acesso direto a /op/tpv ou /op/kds sem ativação:** redirect para `/app/activation` com motivo "Complete o setup no Centro de Ativação para aceder ao TPV/KDS".

---

## 2. Motivos de redirect (tabela)

| Condição                                             | Destino           | Motivo                                                        |
| ---------------------------------------------------- | ----------------- | ------------------------------------------------------------- |
| Não autenticado em rota protegida                    | `/auth/phone`     | Auth required                                                 |
| Sem org (hasOrganization = false)                    | `/welcome`        | No org → Bem-vindo (primeira tela pós-auth)                   |
| Com org, não ativado, entrada (/auth, /, /app)       | `/app/activation` | Not activated → Centro de Ativação (checklist)                |
| Ativado, entrada (/auth, /, /app)                    | `/app/dashboard`  | Activated → última área (default dashboard)                   |
| systemState = SETUP e path em /op/tpv, /op/kds, etc. | `/app/activation` | Complete o setup no Centro de Ativação para aceder ao TPV/KDS |

---

## 3. Rotas permitidas por status

| Status                   | Rotas permitidas (resumo)                                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Sem org**              | `/welcome`, `/onboarding`, `/bootstrap`, `/app/select-tenant`, `/app/access-denied`; rotas públicas (/auth, /, /public/\*). |
| **Com org, não ativado** | Acima + `/app/activation` e camada de ativação. Rotas de operação (/op/\*) **não** permitidas → redirect /app/activation.   |
| **Ativado**              | Todas as rotas de app: `/app/dashboard`, `/op/*`, `/admin/*`, `/config/*`, etc.                                             |

Detalhe em [LifecycleState.ts](../../merchant-portal/src/core/lifecycle/LifecycleState.ts) (`ROUTES_BY_STATE`, `BOOTSTRAP_ALLOWED_ROUTES`) e em [CoreFlow.ts](../../merchant-portal/src/core/flow/CoreFlow.ts) (barreiras e `isActivationLayerPath`, `isOperationalPath`).

---

## 4. Por role (owner / manager / staff / kitchen)

O **RoleGate** ([RoleGate.tsx](../../merchant-portal/src/core/roles/RoleGate.tsx)) aplica-se **depois** do FlowGate. Redireciona por papel quando o utilizador não tem permissão para a path atual:

- Staff sem permissão → `/garcom` (mobile) ou `/dashboard` (desktop).
- Owner/Manager → `/dashboard` (desktop) ou `/garcom` (mobile ops).

Paths permitidos por role: [rolePermissions.ts](../../merchant-portal/src/core/roles/rolePermissions.ts). O contrato de **ativado** (welcome / activation / dashboard / op/\*) é aplicado pelo FlowGate; o RoleGate só restringe por papel dentro da app.

---

## 5. Aliases e redirects (rotas antigas)

- `/dashboard`, `/app/dashboard` → redirect para `/admin/reports/overview`.
- `/setup/restaurant-minimal` (no app) → redirect para `/app/activation`.
- `/op/pos`, `/op/pos/*` → redirect para `/op/tpv`.
- `/admin/config/productos` → redirect para `/admin/modules` (Hub de Módulos).

Nenhuma rota antiga deve renderizar 404 nem tela vazia.

---

## 6. Hub de Módulos (/admin/modules)

Cada card tem ação primária com destino válido. Mapeamento: [ModulesPage.tsx](../../merchant-portal/src/features/admin/modules/pages/ModulesPage.tsx) (`getModulePrimaryPath`). Id desconhecido → `/app/activation`. Teste: [ModulesPage.navigation.test.tsx](../../merchant-portal/src/features/admin/modules/pages/ModulesPage.navigation.test.tsx).

---

## 7. Referências

- [NAVIGATION_OPERATIONAL_CONTRACT.md](./NAVIGATION_OPERATIONAL_CONTRACT.md) — demo/landing e estados visitante/demo/operação.
- [CoreFlow.test.ts](../../merchant-portal/src/core/flow/CoreFlow.test.ts) — testes que travam o contrato.
- [routeGuards.test.ts](../../merchant-portal/src/core/navigation/routeGuards.test.ts) — testes da API nomeada (resolveEntryRoute, guardOpsRoutes, guardDashboard).
- [navigation-contract.spec.ts](../../merchant-portal/tests/e2e/navigation-contract.spec.ts) — E2E: auth → welcome/activation/dashboard; /setup/restaurant-minimal → /app/activation; sem org → /welcome; com org mas não ativado → /op/tpv redireciona para /app/activation.
- [docs/audit/NAVIGATION_CONTRACT.md](../audit/NAVIGATION_CONTRACT.md) — auditoria e zonas (complementar).
