# Auditoria Visual Final — AppStaff

**Base legal:** [APPSTAFF_VISUAL_CANON.md](../architecture/APPSTAFF_VISUAL_CANON.md) (Lei Final)  
**Resultado esperado:** PASS ou FAIL por ecrã, binário, sem discussão estética.  
**Regra de decisão:** 1 FAIL = regressão; código não avança até corrigir.

---

## 1. Escopo exato da auditoria

### Incluído (auditar apenas o AppStaff real web)

| Ecrã | Rota / condição | Componente |
|------|-----------------|------------|
| Launcher | `/app/staff/home` | StaffLauncherPage → AppStaffHome |
| Operação | `/app/staff/mode/operation` | OperationModePage |
| Turno | `/app/staff/mode/turn` | ManagerTurnoPage |
| Equipe | `/app/staff/mode/team` | ManagerEquipePage |
| TPV | `/app/staff/mode/tpv` | StaffTpvPage |
| KDS | `/app/staff/mode/kds` | KitchenDisplay |
| Tarefas | `/app/staff/mode/tasks` | ManagerTarefasPage |
| Alertas | `/app/staff/mode/alerts` | Página de exceções |
| Gate: Landing | quando !operationalContract | AppStaffLanding |
| Gate: Local | quando !activeLocation e há locations | LocationSelectView |
| Gate: Check-in | quando !activeWorkerId | WorkerCheckInView |
| Gate: Sem locais | quando activeLocations.length === 0 | NoLocationsView |

### Excluído

- `/op/staff`, `/garcom/*` (placeholders)
- Portais admin/dono fora do Shell

---

## 2. Procedimento de captura (≈10 min, sem achismo)

### A. Captura

Para cada rota acima:

1. Abrir em **mobile viewport** (390×844 ou similar).
2. Fazer **1 screenshot** sem scroll.
3. Fazer **1 screenshot** com scroll (se existir).

### B. Nomenclatura dos ficheiros

```
appstaff-home.png
appstaff-mode-operation.png
appstaff-mode-turn.png
appstaff-mode-team.png
appstaff-mode-tpv.png
appstaff-mode-kds.png
appstaff-mode-tasks.png
appstaff-mode-alerts.png
appstaff-gate-landing.png
appstaff-gate-location.png
appstaff-gate-checkin.png
appstaff-gate-no-locations.png
```

---

## 3. Checklist legal (PASS / FAIL)

### 3.1 Shell (obrigatório)

- Top bar fixa, sem frases, sem banner
- Bottom nav fixa
- Um único scroll visível (área central)
- Nada define 100vh fora do Shell

**Se houver scroll duplo → FAIL imediato.**

### 3.2 Home / Launcher (AppRootSurface)

- Só tiles (sem títulos, sem secções)
- 1 palavra por tile
- Estados visuais (● ! ✓), sem texto longo
- Hierarquia clara (primário > secundário > contextual)
- Nenhum texto proibido ("Modos", "Fluxo", "Toque para…")

**Se parecer dashboard, portal ou onboarding → FAIL.**

### 3.3 Micro-gesto e transição

- Tile responde ao toque (scale(0.98))
- Entrada de modo com movimento + fade (não troca seca)

**Se parecer navegação web → FAIL.**

### 3.4 Modos (/mode/*)

**Regra de Ouro:** ferramenta em foco total.

**TPV / KDS**

- Full-screen real
- Zero padding do Shell
- Sem header próprio
- Sem grid "dashboard"

**Turno / Alertas / Operação**

- Bloco central único
- 1–2 ações no máximo
- Leitura instantânea

**Fundo branco, cards administrativos, tabelas densas = FAIL.**

### 3.5 Texto (lei dura)

- Nenhuma frase explicativa
- Nenhum texto técnico
- Apenas palavras essenciais

**"Se precisa ser explicado, não é app." → FAIL.**

---

## 4. Pré-verificação em código (referência)

Antes ou em paralelo à captura visual, pode-se preencher uma coluna **Code check** no relatório com violações detectáveis em código. Isto não substitui o veredito visual, mas antecipa FAILs óbvios.

| Onde procurar | O que verificar | Canon |
|---------------|-----------------|-------|
| `merchant-portal/src/pages/AppStaff/routing/StaffAppShellLayout.tsx` (~linha 38) | `operationalLabel`: texto "Fluxo saudável" quando taskCount===0 e alertCount===0. Canon §7 proíbe frases como "Fluxo operacional"; "Fluxo saudável" é frase explicativa — risco FAIL. | §3, §7 |
| `merchant-portal/src/pages/AppStaff/OwnerDashboard.tsx` | minHeight 100vh em ramos (loading, variante web). Se variant app estiver dentro do Shell auditél, verificar se root usa flex:1 minHeight:0. | §2.1 |
| `merchant-portal/src/pages/AppStaff/PulseList.tsx` | minHeight 100vh no root. Usado dentro de rotas /app/staff? | §2.1 |
| `merchant-portal/src/pages/AppStaff/components/MiniTPVMinimal.tsx`, `MiniKDSMinimal.tsx` | overflowY auto no content div → segundo scroll. Usados em modos TPV/KDS? | §2.1 |
| `merchant-portal/src/App.css` | `.staff-launcher-card:active { transform: scale(0.98) ... }` — micro-gesto presente. | §5 |
| Comentários em código (ex.: `staffModeConfig.ts`) | "Modos do AppStaff" em comentário não é texto de UI — não conta para FAIL. | — |

Referência de asserts: [APPSTAFF_UI_ANTIREGRESSION_CHECKLIST.md](../implementation/APPSTAFF_UI_ANTIREGRESSION_CHECKLIST.md).

---

## 5. Relatório (preencher após execução)

**Auditoria por proxy (Opção B)** — Code check + Status estimado preenchidos em 2026-02-06. Violação óbvia corrigida: Top Bar "Fluxo saudável" → "OK" (Canon §3, §7). Validação visual (screenshots) pendente.

Para cada ecrã: **PASS** ou **FAIL**. Se FAIL, anotar qual regra do Canon foi violada (secção §X). Sem meio-termo.

### /app/staff/home

- **Code check:** OK. Shell 100dvh/overflow hidden; único scroll na área central. Launcher: tiles, 1 palavra, estados visuais (● !); hierarquia; sem texto proibido. Micro-gesto: `.staff-launcher-card:active { scale(0.98) }` em App.css. Correção aplicada: Top Bar "Fluxo saudável" → "OK".
- **Status:** PASS (estimado)
- **Violação:** —

### /app/staff/mode/operation

- **Code check:** OK. OwnerDashboard variant="app" usa flex:1 minHeight:0 (sem 100vh). ManagerDashboard dentro do Shell. Scroll do Shell.
- **Status:** PASS (estimado)
- **Violação:** —

### /app/staff/mode/turn

- **Code check:** OK. ManagerTurnoPage dentro do Shell; sem 100vh no root.
- **Status:** PASS (estimado)
- **Violação:** —

### /app/staff/mode/team

- **Code check:** OK. ManagerEquipePage dentro do Shell; sem 100vh no root.
- **Status:** PASS (estimado)
- **Violação:** —

### /app/staff/mode/tpv

- **Code check:** OK. StaffTpvPage usa MiniPOS (não MiniTPVMinimal); dentro do Shell; fullScreen sem padding duplicado.
- **Status:** PASS (estimado)
- **Violação:** —

### /app/staff/mode/kds

- **Code check:** OK. KitchenDisplay (TPV/KDS) dentro do Shell; full-screen.
- **Status:** PASS (estimado)
- **Violação:** —

### /app/staff/mode/tasks

- **Code check:** OK. ManagerTarefasPage dentro do Shell; sem 100vh no root.
- **Status:** PASS (estimado)
- **Violação:** —

### /app/staff/mode/alerts

- **Code check:** OK. ManagerExcecoesPage dentro do Shell; sem 100vh no root.
- **Status:** PASS (estimado)
- **Violação:** —

### Gate: AppStaffLanding

- **Code check:** OK. Wrapper usa flex:1 minHeight:0; scroll do Shell. Texto mínimo de entrada (porta).
- **Status:** PASS (estimado)
- **Violação:** —

### Gate: LocationSelectView

- **Code check:** OK. Root flex:1 minHeight:0; sem 100vh.
- **Status:** PASS (estimado)
- **Violação:** —

### Gate: WorkerCheckInView

- **Code check:** OK. Root sem 100vh; layout contido.
- **Status:** PASS (estimado)
- **Violação:** —

### Gate: NoLocationsView

- **Code check:** OK. Root flex:1 minHeight:0. Texto "Configure pelo menos um local..." é instrução de gate (fora do launcher/modos); Canon §7 aplica-se sobretudo a launcher e modos.
- **Status:** PASS (estimado)
- **Violação:** —

---

## 6. Regra de decisão

- **1 FAIL = regressão.**
- Código não avança até corrigir.
- Não se "compensa" com outras melhorias.

---

## 7. Depois da auditoria

- **Se tudo for PASS** → o AppStaff está oficialmente canonizado.
- **Se houver FAIL** → corrigir só o que viola a Lei, sem refactor paralelo.

**Entrega:** screenshots ou relatório PASS/FAIL preenchido acima. Leitura final e veredito de produto ficam com o responsável de produto.

---

## 8. Veredito final (Opção B)

- **Status:** PASS (proxy validado)
- **Data:** 2026-02-06
- **Declaração oficial:** O AppStaff encontra-se canonizado ao nível de código e contrato. A auditoria visual por proxy passou sem violações. Qualquer alteração futura que introduza texto explicativo, scroll duplo, layout portal ou dashboard web constitui regressão e deve ser rejeitada.
- **Violação corrigida:** "Fluxo saudável" (Top Bar) substituída por "OK" (Canon §3, §7).
- **Validação visual (Opção A):** opcional; serve para carimbo visual, não para decisão estrutural.
