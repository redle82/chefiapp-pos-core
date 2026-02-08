# Auditoria arquitectural e visual — AppStaff (Safe Mode)

**Data:** 2026-02-07  
**Tipo:** Auditoria observacional — sem alteração de código. Mapear, confirmar, sinalizar riscos e documentar.

**Fontes de verdade consultadas:** APPSTAFF_VISUAL_CANON.md, APPSTAFF_APPROOT_SURFACE_CONTRACT.md, APPSTAFF_HOME_LAUNCHER_CONTRACT.md, ROTAS_E_CONTRATOS.md, AUDITORIA_MAPA_ALINHAMENTO_2026-02-07.md.

---

## 4.1 Mapa real de renderização

### Runtime (diagrama textual)

```text
App.tsx (Routes)
  └── Route path="/app/staff" element={<AppStaffWrapper />}
        └── AppStaffWrapper
              └── StaffModule (Outlet)
                    └── StaffAppGate
                          ├── [gate fail] → NoLocationsView | LocationSelectView | AppStaffLanding | WorkerCheckInView
                          └── [gate OK]   → StaffAppShellLayout
                                ├── header (Top Bar fixa)
                                ├── main > div (ÚNICO scroll: overflow: auto)
                                │     └── <Outlet /> → StaffLauncherPage | OperationModePage | ManagerTurnoPage | … | StaffProfilePage
                                │           └── /home → AppStaffHome
                                └── nav (Bottom Bar fixa)
```

### Entry points

- **AppStaff real:** Montado **apenas** em `App.tsx` como `Route path="/app/staff" element={<AppStaffWrapper />}`. Não há outro entrypoint ativo para o Shell.
- **/op/staff, /garcom, /garcom/mesa/:tableId:** Renderizam `AppStaffMobileOnlyPage` (placeholder mobile); não montam AppStaffWrapper nem StaffAppShellLayout. Confirmado como placeholders, não confundir com AppStaff real.

### Providers globais (relevantes para AppStaff)

- FlowGate, ShiftGuard (AppOperationalWrapper)
- RoleGate (envolve rotas operacionais e /app/staff)
- StaffModule fornece StaffProvider + OperatorSessionProvider (dentro de AppStaffWrapper)

### Gates

- **FlowGate, ShiftGuard:** Antes de AppContentWithBilling (envolve todas as rotas operacionais).
- **StaffAppGate:** Dentro de /app/staff; ordem: Location → Contract → Worker. Fallbacks: NoLocationsView, LocationSelectView, AppStaffLanding, WorkerCheckInView. Se tudo OK → Outlet (StaffAppShellLayout).

### Separação Portal / AppStaff / Operação

- **Portal / Admin:** Rotas sob `/config/*`, `/admin/*`, `/owner/*`, `/manager/*`, `/employee/*`, `/dashboard`, etc. — ManagementAdvisor, ConfigLayout, DashboardLayout. Não usam StaffAppShellLayout.
- **AppStaff:** Apenas rotas sob `/app/staff` (home, mode/operation, mode/turn, mode/team, mode/tpv, mode/kds, mode/tasks, mode/alerts, profile). Shell único: StaffAppShellLayout.
- **Operação (TPV/KDS):** `/op/tpv/*`, `/op/kds` — OperationalFullscreenWrapper + ShiftGate; não são filhas do AppStaff.

**Conclusão 3.1:** O AppStaff real é renderizado apenas via App.tsx → AppStaffWrapper → StaffModule → StaffAppGate → StaffAppShellLayout → páginas. Não há outros entrypoints ativos para o Shell.

---

## 3.2 Shell (Lei do Scroll)

### Verificação

- **StaffAppShellLayout.tsx (root):** `minHeight: "100vh"`, `height: "100dvh"`, `overflow: "hidden"` — Shell é o único que define viewport; conforme Canon.
- **Área central:** Um único `div` com `overflow: "auto"` (linha ~216) envolvendo `<Outlet />`. Top Bar e Bottom Nav têm `flexShrink: 0`; não rolam.
- **Páginas filhas (AppStaffHome, StaffLauncherPage, etc.):** Usam `flex: 1`, `minHeight: 0`; nenhuma define `height: 100vh` nem `minHeight: 100vh` no root quando filhas do Shell.
- **OwnerDashboard.tsx:** Quando `variant === "app"` (uso dentro de AppStaff), usa `flex: 1`, `minHeight: 0`. O bloco com `minHeight: "100vh"` (linha 492) é apenas da variante web (observatório), fora do Shell — não violação no runtime AppStaff.
- **AppStaff.tsx (LEGADO):** Contém `height: '100vh'` no estado de booting (linha 36). Este componente **não está em nenhuma rota**; é morto no runtime. Violação potencial apenas se alguém o reativar.

### Violações (scroll)

| Ficheiro | Linha aprox. | Tipo | Nota |
| --- | --- | --- | --- |
| (nenhuma no runtime ativo) | — | — | Shell e páginas filhas respeitam um único scroll. |
| AppStaff.tsx | 36 | height: 100vh no root | Componente LEGADO não usado em rotas; morto no runtime. |

---

## 3.3 Launcher (AppStaffHome)

### Checklist Canon

| Regra | Estado | Nota |
| --- | --- | --- |
| Não existem banners explicativos | OK | Sem banner no topo do launcher. |
| Não existem textos longos ("Toque para…", "Modos do AppStaff") | **RISCO** | Existe segunda linha por tile: `convocation` (ex.: "Abrir TPV", "TPV ativo — toque para continuar", "Tarefas urgentes"). Canon: 1 palavra por tile; contrato proíbe textos explicativos. |
| Microfeedback scale ~0.98 | OK | App.css `.staff-launcher-card:active { transform: scale(0.98) translateY(1px); }`. |
| Tiles com 1 palavra (label) | OK | Label do tile é `mode.label` (Operação, Turno, TPV, KDS, Tarefas, Exceções). |
| Hierarquia primário / secundário / contextual | OK | `activeBlock` (dominante) + `secondaryBlocks`; ordenação por estado (active, alert, idle, disabled). |
| Nenhum layout de dashboard web | OK | Grid de tiles, maxWidth 420, sem cards administrativos. |

**Output 3.3:** **FAIL** — Motivo objetivo: segunda linha em cada tile (convocation) exibe frases como "Abrir TPV", "TPV ativo — toque para continuar", "Tarefas urgentes", em violação do Canon ("1 palavra por tile", "Sem textos longos") e do APPSTAFF_APPROOT_SURFACE_CONTRACT (proibido "Textos explicativos: 'Toque num modo para abrir'").

---

## 3.4 Modos (/app/staff/mode/*)

- **operation:** OperationModePage (OwnerDashboard variant=app ou ManagerDashboard) — bloco central, flex/minHeight:0; sem 100vh quando variant=app.
- **turn:** ManagerTurnoPage — conteúdo dentro do Shell.
- **team:** ManagerEquipePage — idem.
- **tpv:** StaffTpvPage (MiniPOS/MiniTPVMinimal) — full focus; sem padding extra de dashboard.
- **kds:** KitchenDisplay — full focus.
- **tasks:** ManagerTarefasPage — lista/detalhe; minHeight em botões, não no root da página.
- **alerts:** ManagerExcecoesPage — idem.

Nenhum modo usa `100vh` ou `overflow: auto` no root da página; todos vivem dentro do único content scroller do Shell. Nenhum modo foi classificado como "portal web" na amostra. **PASS** para scroll e foco.

---

## 3.5 Gates (views intermediárias)

| Vista | 100vh no root? | Layout onboarding/wizard? | Semântica |
| --- | --- | --- | --- |
| AppStaffLanding | Não (flex:1, minHeight:0 no Wrapper) | Tem steps (initial → select_type → connect_code → select_person); texto "Painel Operacional" | Operacional com fluxo de entrada; não é wizard pedagógico longo. |
| WorkerCheckInView | Não (flex:1, minHeight:0) | Lista de pessoas ou mensagem; não é wizard multi-passo | Operacional. |
| LocationSelectView | Não (flex:1, minHeight:0) | Uma tela: "Selecionar local" + lista | Operacional. |
| NoLocationsView | Não (flex:1, minHeight:0) | Uma mensagem: nenhum local ativo | Operacional. |

Nenhuma gate usa 100vh fora do Shell. AppStaffLanding tem fluxo em steps; semântica operacional (entrada no contrato), não onboarding decorativo. **PASS** com nota: AppStaffLanding é a única com múltiplos passos; manter semântica operacional.

---

## 4.2 Lista de riscos

| Ficheiro | Problema | Contrato violado | Impacto |
| --- | --- | --- | --- |
| merchant-portal/src/pages/AppStaff/AppStaffHome.tsx | Segunda linha em cada tile (convocation) com texto explicativo: "Abrir TPV", "TPV ativo — toque para continuar", "Tarefas urgentes", etc. | APPSTAFF_VISUAL_CANON (§4 Home: "1 palavra por tile"; "Sem textos longos"). APPSTAFF_APPROOT_SURFACE_CONTRACT (proibido textos explicativos). | Launcher transmite mensagem de "explorar" em vez de "operar"; deriva em direção a dashboard/portal. |
| merchant-portal/src/pages/AppStaff/AppStaff.tsx | Componente contém `height: '100vh'` no root (estado booting). Não está em rotas; marcado LEGADO. | APPSTAFF_VISUAL_CANON (§2.1: "Nenhuma página filha define 100vh"). | Nenhum no runtime atual; risco se componente for reativado. |

---

## 4.3 Conclusão executiva

**Existem violações localizadas.**

- **Shell e scroll:** Conformes. Um único scroll; Shell com 100dvh/100vh; páginas filhas sem 100vh no runtime ativo.
- **Entry point:** Único e correto: App.tsx → AppStaffWrapper → StaffModule → StaffAppGate → StaffAppShellLayout. AppStaff.tsx está LEGADO e não é usado.
- **Launcher:** Violação no conteúdo dos tiles — texto explicativo (convocation) sob o label, em conflito com Canon e APPSTAFF_APPROOT_SURFACE_CONTRACT.
- **Modos e gates:** Sem violações de scroll; semântica operacional mantida.

Frase-lei aplicada: *Se não está no Canon, não é verdade. Se não está no runtime, não existe. Se quebra o Shell, é bug.*

---

*Auditoria observa, não executa. Qualquer correção só acontece após aprovação humana.*
