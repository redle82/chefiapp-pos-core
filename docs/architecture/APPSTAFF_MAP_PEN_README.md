# Mapa visual executável AppStaff + Projeto (.pen)

**Ficheiro:** `appstaff-map.pen`  
**Objetivo:** Mapa canónico navegável do ChefIApp: três setores fixos (CORE/INFRA, MERCHANT PORTAL, APPSTAFF) no mesmo plano. Responde “de onde vem este ecrã e para onde leva?” e serve de fonte de verdade para onboarding, auditoria e defesa técnica.

**Regra de ouro:** 1 nó = 1 página ou componente real (rota em `App.tsx` ou componente em `pages/AppStaff`). Não há páginas genéricas nem fictícias. Setas = fluxo real de navegação ou dependência.

**Extensão:** Editar o mapa com a extensão Pencil no Cursor (abrir `appstaff-map.pen`). O HTML `appstaff-map.html` carrega este ficheiro e mostra os placeholders por nome; se o .pen não estiver disponível, usa um blueprint inline com a mesma estrutura em três setores.

---

## Três setores (estrutura fixa)

### 1. CORE / INFRA (coluna esquerda, x 0–320)

Nós técnicos apenas (sem telas): Docker Core (container), PostgreSQL, Migrations (schema/migrations), gm_restaurants, gm_restaurant_people, gm_staff, Auth/Session, Runtime Context, Feature Flags, Billing/Plans.  
**Conexão:** Core → Merchant Portal (dados/serviços).

### 2. MERCHANT PORTAL (WEB) (coluna central)

Um nó por página/rota real, alinhado a `App.tsx`:

- **Auth:** `/auth/phone`, `/auth/verify`, `/auth/email`
- **Setup:** `/bootstrap`, `/setup/*`
- **Config:** `/config/general`, `/config/identity`, `/config/location`, **/config/people**
- **Dashboard:** `/dashboard`, `/app/dashboard`
- **Admin:** `/app/backoffice`, `/admin/*`
- **Owner central:** `/app/control-room` (redirect para `/app/staff/mode/operation`)
- TPV (op/tpv), KDS (op/kds), Setup (menu, mesas, equipe)

O nó **/config/people** tem a nota: *“Cria dados que desbloqueiam AppStaff”* (RestaurantPeopleSection → gm_restaurant_people → WorkerCheckInView).  
**Conexões:** Portal → AppStaff (entrada `/app/staff`); Config/people → WorkerCheckInView (dados).

### 3. APPSTAFF (APP REAL) (coluna direita)

- **Entry + Gates:** `/app/staff`, StaffAppGate, LocationSelectView, AppStaffLanding, WorkerCheckInView, NoLocationsView. Fluxo: Portal → Gate → Shell.
- **Shell:** StaffAppShellLayout — *“DONO DA ALTURA E DO SCROLL”* (Canon).
- **Launcher (Home):** `/app/staff/home`, StaffLauncherPage, AppStaffHome — *AppRootSurface; sem dashboard, sem texto explicativo*.
- **Modos operacionais** (rota + componente reais):
  - TPV: `/app/staff/mode/tpv` — StaffTpvPage, MiniPOS
  - KDS: `/app/staff/mode/kds` — KitchenDisplay
  - Turno: `/app/staff/mode/turn` — ManagerTurnoPage
  - Tarefas: `/app/staff/mode/tasks` — ManagerTarefasPage, WorkerTaskFocus
  - Alertas: `/app/staff/mode/alerts` — ManagerExcecoesPage
  - Operação: `/app/staff/mode/operation` — OperationModePage, ManagerDashboard, OwnerDashboard (variant=app)

Setas: Shell → Launcher; Shell → cada Modo; Launcher (tiles) → Modos conforme navegação real.

---

## Regras do mapa

- **1 nó = 1 página ou componente real.** Nenhuma página genérica ou fictícia; não duplicar AppStaff (ex. V1/V2); não misturar nós do Portal com nós do AppStaff (setores distintos).
- **Setas** = fluxo real: Core → Portal → AppStaff; Config/people → WorkerCheckInView; Gate → Shell → Launcher/Modos.
- **IDs/nomes estáveis** para índice “Mapa → Código” e README vivo.
- Papéis: owner, manager, waiter, kitchen, cleaning (contratos em `docs/architecture`).
- Canon e contratos: `APPSTAFF_VISUAL_CANON.md`, `APPSTAFF_HOME_LAUNCHER_CONTRACT.md`.

## Todo o aplicativo no mapa (Pencil)

O .pen contém o fluxo completo em três setores:

- **Entrada:** /app/staff (AppStaffWrapper) → StaffAppGate
- **Gates (fallbacks):** NoLocationsView, LocationSelectView, AppStaffLanding, WorkerCheckInView
- **Shell:** StaffAppShellLayout (DONO DA ALTURA E DO SCROLL) → Launcher e modos
- **Modos (rotas reais):** /app/staff/mode/operation, turn, tpv, kds, tasks, alerts + StaffProfilePage
- **Launcher:** /app/staff/home (StaffLauncherPage, AppStaffHome) → tiles por papel
- **Telas funcionais:** tarefas-lista/detalhe, turno-atual, dispositivos, alertas, saude

As conexões entre frames são do tipo `connection` (source/target). O `appstaff-map.html` usa placeholders por `node.name` (ou prefixo) quando o mapa vem do .pen.

## Conteúdo desenhado (todos os passos executados)

### 1. AppShell (comum a todos os papéis)

- **TopBar:** estado do turno, saúde, perfil.
- **Área central:** conteúdo por rota (placeholder).
- **Navegação:** bottom (Home, Tarefas, Perfil).

### 2. Telas base

- **Login / Entrada por código** — código operação → contrato.
- **Seleção de Local** — STAFF_SESSION_LOCATION_CONTRACT; lista locais.
- **Home (genérica)** — gates → redirect por papel.
- **Perfil (abas)** — Dados, Papel, Histórico, Sessão.

### 3. Homes por papel (um frame por papel)

- **Owner** — Visão Geral; links Saúde, Alertas, Dispositivos & Turnos.
- **Manager** — Turno / Equipe; links Turno actual, Equipe, Dispositivos.
- **Waiter** — Tarefas / Mesas; links Minhas tarefas, Mesas, Checklists.
- **Kitchen** — KDS (fluxo directo).
- **Cleaning** — Checklists do turno.

### 4. Telas funcionais

- **Tarefas (lista)** — lista → toque para detalhe.
- **Tarefas (detalhe)** — título, estado, acções.
- **Turno Atual** — DEVICE_TURN_SHIFT_TASK; estado turno, equipa.
- **Dispositivos & Operação** — dispositivos, turnos.
- **Alertas** — lista alertas.
- **Saúde do Sistema** — estado core, dispositivo.

### 5. Navegação (conexões no .pen)

- Login → Seleção Local → Home genérica.
- Home genérica → Owner / Manager / Waiter (entrada por papel).
- AppShell ↔ Perfil.
- Manager → Turno Atual, Dispositivos.
- Waiter → Tarefas lista → Tarefas detalhe.
- Owner → Saúde, Alertas.

## Mapa por trabalhador (Pencil)

Para desenhar ou melhorar o mapa **por papel** (cada tela por trabalhador):

1. **Referência canónica:** `APPSTAFF_MAPA_TELAS_POR_TRABALHADOR.md` — lista, por papel (owner, manager, waiter, kitchen, cleaning), a Home + todas as rotas e telas que esse papel usa.
2. **No Pencil:** criar uma coluna/secção por papel; dentro de cada uma, 1 frame "Home" + setas para os modos (Operation, TPV, KDS, Team, Tasks, Alerts, Profile, Turn) conforme a tabela do doc.
3. **Melhorar telas:** usar a extensão Pencil para refinar cada frame (Owner Home, Manager Home, Waiter Home, Kitchen Home, Cleaning Home) e as telas partilhadas (TPV, KDS, Tasks, Alerts, Team, Profile).

## Como usar

1. Abrir `appstaff-map.pen` no Pencil (Cursor integrado ou Pencil app).
2. Cada frame pode virar uma rota React (`/app/staff/...`).
3. Agrupar frames por papel conforme `APPSTAFF_MAPA_TELAS_POR_TRABALHADOR.md`, `APPSTAFF_APPSHELL_MAP.md` e `APPSTAFF_ROUTE_MAP.md`.

## Referências

- **`APPSTAFF_MAPA_TELAS_POR_TRABALHADOR.md`** — Mapa de telas por trabalhador (checklist para Pencil).
- `APPSTAFF_APPSHELL_MAP.md` — Shell, áreas por papel.
- `APPSTAFF_ROUTE_MAP.md` — Rotas e paths.
- `DEVICE_TURN_SHIFT_TASK_CONTRACT.md` — Dispositivo, turno, tarefa.
