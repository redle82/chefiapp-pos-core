# Checklist de Polimento — FASE 5 (VPC/OUC)

**Propósito:** Revisar consistência visual e comportamental em todos os pontos de contacto operacionais, sem adicionar novas features. Referência: [SCOPE_FREEZE.md](./SCOPE_FREEZE.md) FASE 5, [CORE_OPERATIONAL_UI_CONTRACT.md](../architecture/CORE_OPERATIONAL_UI_CONTRACT.md), [VISUAL_PATCH_COMMERCIAL.md](../Commercial/VISUAL_PATCH_COMMERCIAL.md).

---

## Regras de verificação (VPC + OUC)

| Regra | O que verificar |
|-------|------------------|
| **VPC — Fonte** | Inter em todo o conteúdo operacional (KDS, TPV, Staff, Billing). |
| **VPC — Modo escuro** | Fundo `#0a0a0a` / superfície `#141414`; texto `#fafafa`; sem fundo claro em telas operacionais. |
| **VPC — Paleta** | Máximo 3 cores: fundo, texto, accent (verde ou laranja). Sem gradientes complexos nas superfícies principais. |
| **VPC — Botões** | Mín. 48px altura, padding generoso, bordas arredondadas; cor de acção sólida. |
| **VPC — Espaçamento** | Entre blocos 24–32px; line-height 1.5–1.6; evitar densidade “técnica”. |
| **OUC — Shell manda** | Telas dentro do OS não definem `backgroundColor`/`minHeight: 100vh` no root como se fossem “a página”; o Shell já é a página. |
| **OUC — Estado dominante** | Primeira coisa que o olho vê é o estado principal (lista de tarefas, pedidos do dia, menu); não ecrã vazio à espera de clique. |
| **OUC — PanelRoot** | Conteúdo de painéis dentro do Dashboard usa `PanelRoot`; não duplicar layout de página. |

---

## Pontos de contacto (por rota / componente)

| # | Ponto | Rota / uso | O que verificar |
|---|--------|------------|------------------|
| 5.1 | **OperationalShell** | Usado por DashboardPortal | Aplica VPC (fundo, superfície, tipografia); injecta contexto operacional. |
| 5.2 | **PanelRoot** | Conteúdo dentro do Dashboard | Padding/spacing consistente; sem fundo ou max-width de página. |
| 5.3 | **DashboardPortal** | `/dashboard`, `/app/dashboard` | Envolve conteúdo em `<OperationalShell><PanelRoot>`. |
| 5.4 | **BillingPage** | `/app/billing` | Standalone; usa tokens VPC locais; botões grandes; sem layout de “página inteira” conflituante; estado dominante = estado da subscrição. |
| 5.5 | **AppStaffMinimal** | `/garcom` | Modo escuro; botões grandes; estado dominante = tarefas / fila / métricas visíveis; tabs (Tarefas, Pontos, etc.) consistentes. |
| 5.6 | **KDSMinimal** | `/kds-minimal` | Modo escuro; pedidos/estado dominante; transições suaves; sem opções de admin em vista operacional. |
| 5.7 | **TPVMinimal** | `/tpv` | Modo escuro; botões de acção grandes; total e itens visíveis; modais de caixa alinhados com VPC. |
| 5.8 | **ConfigLayout** | `/config` | Consistência com Shell se dentro do Dashboard; ou VPC se standalone; sem densidade excessiva. |
| 5.9 | **MenuBuilderPanel** | Dentro do Dashboard (menu) | Usa PanelRoot; sem fundo/maxWidth de página. |

---

## Auditoria de código (referência)

**Estado das rotas:** `/dashboard` e `/app/dashboard` redirecionam para `/admin/reports/overview`. O layout admin é `DashboardLayout` (minHeight 100vh no root = shell admin; OK). Não existe componente "DashboardPortal" no código; referência no checklist = conteúdo admin (OwnerDashboardWithMapLayout / reports).

**OUC — root `minHeight: 100vh` / `backgroundColor`:**

- **Shell/layout (OK):** StaffAppShellLayout, DashboardLayout, OperationalFullscreenWrapper, ConfigSidebar/SetupSidebar (sidebar fixa), AuthPage, Landing, RequireAuth/RequireSession — são a “página” ou o shell.
- **Fullscreen por design (OK):** TPVMinimal, KDSMinimal, KitchenDisplay quando usados como rota operacional — o root 100vh é o próprio shell daquele ecrã.
- **Rotas standalone = shell da rota (OK):** ConfigLayout (`/config`), TaskDashboardPage (`/tasks`), WaiterHomePage (quando rota própria) — são a página inteira para essa rota; 100vh no root é correcto. Não remover sem motivo.
- **Conteúdo dentro do Shell:** Páginas que renderizam como filhas de StaffAppShellLayout (OwnerGlobalDashboard, ManagerHome, AppStaffHome, WorkerHome, etc.) já usam `flex: 1; minHeight: 0` no content area; WorkerTaskFocus documenta a regra em comentário. Nada a alterar.

**PanelRoot:** Apenas `MenuBuilderPanel` usa `PanelRoot`. Outros painéis (admin/reports, config) não usam; possível melhoria futura para consistência de padding/spacing.

**Ao executar o checklist:** Usar a tabela 5.1–5.9; para cada ponto, verificar visualmente VPC (Inter, modo escuro, botões ≥48px) e OUC (estado dominante visível, sem root 100vh duplicado quando dentro do Shell). Corrigir apenas o que quebrar sensação de controle ou hierarquia.

---

## Como usar

1. Percorrer cada ponto 5.1–5.9 na aplicação.
2. Para cada um: assinalar ✅ conforme / ⚠️ pequeno desvio / ❌ violação (anotar qual regra).
3. Corrigir apenas desvios que quebrem sensação de controle ou hierarquia; não adicionar features.
4. Documentar exceções conhecidas (ex.: página pública com estilo diferente por decisão) em CORE_DECISION_LOG ou neste doc.

**Próximo após FASE 5:** FASE 6 (impressão) quando houver cliente real ou ambiente com impressora.
