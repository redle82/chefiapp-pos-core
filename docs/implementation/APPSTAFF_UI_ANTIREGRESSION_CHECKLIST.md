# AppStaff UI — Checklist de anti-regressão

**Status:** Ativo
**Tipo:** Checklist de verificação visual e estrutural
**Subordinado a:** [APPSTAFF_VISUAL_CANON.md](../architecture/APPSTAFF_VISUAL_CANON.md) (Lei Final) e [APPSTAFF_APPROOT_SURFACE_CONTRACT.md](../architecture/APPSTAFF_APPROOT_SURFACE_CONTRACT.md) (secção 5. Visual Canon).

Este documento lista asserts que impedem regressões de layout e identidade do AppStaff. Usar em code review, QA manual ou testes visuais.

---

## Resultado da auditoria (Tarefa A)

| Ficheiro | Problema | Ação |
|----------|----------|------|
| `StaffAppShellLayout.tsx` | — | Único dono de scroll: root 100dvh/100vh, overflow hidden; content scroller com overflow auto. OK. |
| `OwnerDashboard.tsx` | Loading: minHeight 100vh quando variant !== "app". Variante web (linha 492): minHeight 100vh. Feed (linha 911): overflowY auto em lista com maxHeight 320. | Loading já condicional (flex:1 minHeight:0 quando variant===app). Web variant fora do Shell: manter 100vh. Feed: scroll interno contido; opcional remover para um único scroll. |
| `PulseList.tsx` | minHeight 100vh no root. | Remover; usar flex: 1, minHeight: 0 quando dentro do Shell. |
| `AppStaff.tsx` | height 100vh no estado de booting. | Legacy; componente fora do Shell (Wrapper monta o Shell). Manter. |
| `MiniTPVMinimal.tsx` | overflowY auto no content div (linha 244). | Segundo scroll. Remover overflowY do content; usar flex:1 minHeight:0 para o Shell ser o único scroller. |
| `MiniKDSMinimal.tsx` | overflowY auto no content div (linha 144). | Idem. |
| `AppStaffLanding.tsx`, `LocationSelectView.tsx`, `NoLocationsView.tsx` | — | Já usam flex:1 minHeight:0; sem 100vh. OK. |
| `WorkerTaskFocus.tsx` | — | Já usa flex:1 minHeight:0 no root. OK. |
| `WorkerCheckInView.tsx` | — | Sem 100vh no root. OK. |
| `StaffLauncherPage.tsx` | overflowY auto no wrapper. | Removido; scroll apenas do Shell. |

---

## Asserts obrigatórios

| #   | Assert                                                                                                                                                        | Onde verificar                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | Existe apenas **um scroll visível** — o content scroller do Shell. Nenhuma página /mode/\* nem o Home criam scroll próprio no root.                           | Shell (`StaffAppShellLayout`), páginas em `pages/`, views, OwnerDashboard/ManagerDashboard |
| 2   | O **root do Shell** usa `height: 100dvh` (e opcionalmente `minHeight: 100vh`) e `overflow: hidden`. A área central é o único elemento com `overflow: auto`.   | `StaffAppShellLayout.tsx`                                                                  |
| 3   | **AppStaffHome** não tem banners "Fluxo operacional", "AppStaff Launcher" nem barras informativas no topo.                                                    | `AppStaffHome.tsx`, `StaffLauncherPage.tsx`                                                |
| 4   | **AppStaffHome** não tem textos explicativos como "Modos do AppStaff", "Toque num modo para abrir" ou frases longas.                                          | `AppStaffHome.tsx`                                                                         |
| 5   | O **Launcher** apresenta tiles em hierarquia clara: um modo primário, 1–2 secundários, resto contextual (tamanho/contraste distintos).                        | `AppStaffHome.tsx`, CSS/estilos dos tiles                                                  |
| 6   | Páginas **/mode/\*** não definem `minHeight: 100vh` nem `height: 100vh` no root. Usam `flex: 1`, `minHeight: 0` quando dentro do Shell.                       | Todas as páginas em `pages/`, OwnerDashboard (variant app), ManagerDashboard, views        |
| 7   | Páginas **/mode/\*** não definem `overflow: auto` no root. Scroll é exclusivo do Shell.                                                                       | Mesmas páginas                                                                             |
| 8   | A **Top Bar** mostra apenas: nome do app, local ativo, estado sintético (ex.: "TURNO ATIVO", "A ENCERRAR", "SEM TURNO"). Sem textos explicativos nem banners. | `StaffAppShellLayout.tsx`                                                                  |
| 9   | A **Bottom Nav** é fixa e única; não é duplicada dentro de nenhuma página.                                                                                    | Shell + todas as rotas /mode/\*                                                            |
| 10  | Nenhum modo usa layout de **dashboard web** (grid administrativo denso, fundo branco de portal, múltiplas colunas iguais). Modos devem "parecer app".         | OwnerDashboard (variant app), ManagerDashboard, restantes modos                            |

---

## Frase-lei (contrato)

> _Se o AppStaff não impõe presença imediata como ferramenta ativa, está em violação de produto._ (Lei Final: [APPSTAFF_VISUAL_CANON.md](../architecture/APPSTAFF_VISUAL_CANON.md))

---

## Comentários no código

Os seguintes ficheiros incluem no docblock a frase **"Scroll é do Shell; sem duplicar layout"** (ou equivalente) para reforçar a regra em alterações futuras:

- `StaffAppShellLayout.tsx` — "Shell manda no scroll. Único content scroller. Sem duplicar layout."
- `AppStaffHome.tsx` — "Shell manda no scroll. Home = tiles. Sem dashboard/portal."
- `StaffLauncherPage.tsx` — "Wrapper neutro. Scroll é do Shell. Sem layout próprio."
- `OperationModePage.tsx`
- `ManagerTurnoPage.tsx`
- `ManagerTarefasPage.tsx`
- `StaffTpvPage.tsx`
- `ManagerDashboard.tsx`
- `OwnerDashboard.tsx` (variant app)

---

## Modo debug (inspeção visual)

Em **debug** (`?debug=1` ou `sessionStorage chefiapp_debug=1`), o **StaffAppGate** pode fazer bypass e renderizar `<Outlet />` directamente, permitindo ver o AppRootSurface (AppStaffHome) sem satisfazer Location / Contract / Worker. Isto serve apenas para validar UI; não quebra contrato. **Não remover** o bypass sem garantir que mocks ou runtime de demo preenchem `activeLocation`, `operationalContract` e `activeWorkerId`, para que em demo se caia sempre no launcher real.

- Ficheiro: `merchant-portal/src/pages/AppStaff/routing/StaffAppGate.tsx`
- Condição: `if (isDebugMode()) return <Outlet />`

---

## Referências

- [APPSTAFF_ROUTE_MAP.md](../architecture/APPSTAFF_ROUTE_MAP.md) — Secção 0: entrypoint real = AppStaffWrapper; launcher = StaffLauncherPage → AppStaffHome; AppStaff.tsx = legado.
- [APPSTAFF_APPROOT_SURFACE_CONTRACT.md](../architecture/APPSTAFF_APPROOT_SURFACE_CONTRACT.md) — Contrato congelado e secção 5. Visual Canon
- [APPSTAFF_LAUNCHER_CONTRACT.md](../architecture/APPSTAFF_LAUNCHER_CONTRACT.md) — Contrato do launcher
- [APPSTAFF_HOME_LAUNCHER_CONTRACT.md](../architecture/APPSTAFF_HOME_LAUNCHER_CONTRACT.md) — Home como AppRootSurface
