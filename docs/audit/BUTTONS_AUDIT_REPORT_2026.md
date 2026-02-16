# Relatório de Auditoria — Botões e Rotas (2026)

Ref: plano auditoria botões e rotas. Ficheiros gerados: `docs/audit/ROUTES_MAP_2026.md`, `merchant-portal/tests/e2e/products-routing.spec.ts`.

---

## 1. Botões OK (Mis productos — /admin/config/productos → /admin/modules)

| Produto             | Botão      | Destino                      | Resultado do teste                    |
| ------------------- | ---------- | ---------------------------- | ------------------------------------- |
| Software TPV        | Abrir      | `/op/tpv`                    | URL muda; TPV carrega                 |
| Sistema de fichaje  | Activar    | `/app/staff`                 | URL muda; AppStaff home               |
| Stock               | Activar    | `/inventory-stock`           | URL muda; InventoryStockMinimal       |
| Tienda online       | Activar    | `/admin/config/integrations` | URL muda; IntegracionesConfigPage     |
| QR Ordering         | Configurar | `/admin/config/delivery`     | URL muda; DeliveryConfigPage          |
| Reservas            | Configurar | `/admin/reservations`        | URL muda; ReservationsOperationalPage |
| Integrador delivery | Configurar | `/admin/config/integrations` | URL muda; IntegracionesConfigPage     |

Nenhum botão fica na mesma URL nem abre `about:blank`. Ação primária de cada card chama `getModulePrimaryPath(id)` e `navigate(path)`.

---

## 2. Botões que estavam quebrados e correção aplicada

Antes do plano, os módulos **fichaje**, **stock** e **tienda-online** tinham `break` em `handlePrimaryAction` (sem navegação). A correção já estava implementada em `ModulesPage.tsx` via `getModulePrimaryPath`:

- **fichaje** → `/app/staff` (Upper Staff; fichaje = tarefas/turnos)
- **stock** → `/inventory-stock`
- **tienda-online** → `/admin/config/integrations`

Não foi necessário criar rotas placeholder: todas apontam para rotas existentes em `OperationalRoutes.tsx`.

---

## 3. Botões que precisaram de redirecionamento alterado

Nenhum. Os destinos atuais são os definidos no plano:

- TPV → `/op/tpv`
- QR Ordering → `/admin/config/delivery`
- Reservas → `/admin/reservations`
- Delivery integrator → `/admin/config/integraciones` (rota canónica: `/admin/config/integrations`)

---

## 4. Rotas criadas (placeholders)

Nenhuma. Não foi criada rota nova nem `ModulePlaceholderPage`: todos os botões de Mis productos usam rotas já existentes.

---

## 5. TPV / KDS e Software TPV

- **Abrir TPV** em Mis productos: botão principal do card TPV chama `handlePrimaryAction("tpv")` → `navigate("/op/tpv")`. OK.
- **Página Software TPV** (`/admin/config/software-tpv`): já contém link “Abrir TPV →” para `/op/tpv` em `SoftwareTpvPage.tsx`. OK.
- **KDS**: se o utilizador tiver “Abrir KDS” (card ou outro entrypoint), o destino é `/op/kds`; sem ativação, o FlowGate redireciona para `/app/activation`. Comportamento mantido.

---

## 6. AppStaff (bottom nav)

Itens da bottom nav (por papel) têm rota real em `staffModeConfig.ts` e em `OperationalRoutes.tsx`:

| Modo     | Rota                        | Componente          |
| -------- | --------------------------- | ------------------- |
| Início   | `/app/staff/home`           | StaffHomeRedirect   |
| Operação | `/app/staff/mode/operation` | OperationModePage   |
| TPV      | `/app/staff/mode/tpv`       | StaffTpvPage        |
| KDS      | `/app/staff/mode/kds`       | KitchenDisplay      |
| Tarefas  | `/app/staff/mode/tasks`     | ManagerTarefasPage  |
| Alertas  | `/app/staff/mode/alerts`    | ManagerExcecoesPage |
| Perfil   | `/app/staff/profile`        | StaffProfilePage    |

Turno e Equipa: `/app/staff/mode/turn`, `/app/staff/mode/team`. Todas as rotas existem; nenhum item da bottom nav resulta em 404 ou tela em branco.

---

## 7. E2E — products-routing.spec.ts

Ficheiro: `merchant-portal/tests/e2e/products-routing.spec.ts`.

Cenários:

- Autenticação em modo pilot (cookie consent, bypass health, pilot mode).
- Navegação para `/admin/modules`.
- Para cada módulo (tpv, fichaje, stock, tienda-online, qr-ordering, reservas, delivery-integrator):
  - Clicar no botão principal (Abrir / Activar / Configurar).
  - Afirmar que a URL mudou e contém o segmento esperado.
  - Afirmar que não permanece na mesma URL nem abre `about:blank`.
- Módulos locked (disabled) são ignorados no assert de navegação.

Destinos esperados no spec alinhados com `getModulePrimaryPath`: `/op/tpv`, `/app/staff`, `/admin/config`, `/admin/reservations`, etc.

---

## 8. Resumo

- **Nenhum botão morto** em `/admin/config/productos` (acessível via `/admin/modules`).
- Cada módulo (TPV, Fichaje, Stock, Tienda online, QR Ordering, Reservas, Integrador delivery) tem destino de navegação definido e coerente com o mapa de rotas.
- **ROUTES_MAP_2026.md** e **BUTTONS_AUDIT_REPORT_2026.md** gerados; E2E de produtos implementado e alinhado com o plano.

---

## 9. “Ativar” com consequência real (Passo 3 — melhoria futura)

Hoje, **handleSecondaryAction** está vazio e o botão “Activar” para módulos inativos apenas chama a ação primária (navegação). Não há persistência em backend (ex.: `installed_modules`, flags por módulo).

- **Opção A (atual):** “Activar” leva à página de setup ou à app do módulo (navegação). Implementado.
- **Opção B (futura):** Se existir API ou Core (ex.: tabela `installed_modules`, endpoints por módulo), em ModulesPage: ao clicar “Activar”, chamar API para persistir `enabled: true`, atualizar estado local/UI e depois navegar. Exige verificação em RestaurantRuntimeContext / Core se há contrato para “módulo ativo” antes de implementar.

Recomendação: manter apenas navegação; documentar no relatório que “Ativar” tem destino real. Persistência em BD apenas quando o produto tiver endpoint/contrato (verificar antes).
