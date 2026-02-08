# AppStaff UI Surgery — Resumo

**Status:** Concluído  
**Tipo:** Resumo da refatoração layout/composição (uma tela = uma responsabilidade).  
**Subordinado a:** [APPSTAFF_APPSHELL_MAP.md](./APPSTAFF_APPSHELL_MAP.md), [APPSTAFF_ROUTE_MAP.md](./APPSTAFF_ROUTE_MAP.md).

---

## Objetivo

Converter o AppStaff em app com separação clara de contextos: sidebar só navegação, TPV/KDS em telas dedicadas, nenhuma tela a mostrar "tudo".

---

## Alterações realizadas

| Área | Antes | Depois |
|------|--------|--------|
| **Visão Operacional** (`/manager/home`) | ManagerDashboard com StaffLayout, ritual, LiveRoster, saúde, atalhos, Exportar PDF, Nova Tarefa, Sign Out no mesmo ecrã | Apenas: estado do turno, indicador de saúde, alertas resumidos, botões Abrir TPV / KDS / Ver Tarefas |
| **Turno** | Placeholder | ManagerTurnoPage: ritual "Antes de abrir", abrir turno, Exportar PDF, linha do tempo |
| **Equipe** | Placeholder | ManagerEquipePage: LiveRosterWidget (quem está em turno) |
| **Tarefas** | Placeholder | ManagerTarefasPage: lista de tarefas + Nova Tarefa (QuickTaskModal) |
| **Exceções** | Placeholder genérico | ManagerExcecoesPage: secções Falhas, Dispositivos offline, Bloqueios |
| **Sidebar** | Ordem: home, TPV, KDS, turno, equipe, tarefas, exceções | Ordem canónica: Visão operacional, Turno, Equipe, Tarefas, Exceções, TPV, KDS, depois Perfil/Histórico/Notificações/Ajuda |
| **TPV / KDS** | Conteúdo com padding no main | Main com `padding: 0` para rotas `/tpv` e `/kds` (tela cheia) |
| **Perfil** | Já tinha "Terminar sessão" na aba Sessão | Sem alteração |

---

## Ficheiros principais

- `merchant-portal/src/pages/AppStaff/ManagerDashboard.tsx` — reduzido a Visão Operacional.
- `merchant-portal/src/pages/AppStaff/pages/ManagerTurnoPage.tsx` — novo.
- `merchant-portal/src/pages/AppStaff/pages/ManagerEquipePage.tsx` — novo.
- `merchant-portal/src/pages/AppStaff/pages/ManagerTarefasPage.tsx` — novo.
- `merchant-portal/src/pages/AppStaff/pages/ManagerExcecoesPage.tsx` — novo.
- `merchant-portal/src/pages/AppStaff/routing/staffNavConfig.ts` — ordem manager ajustada.
- `merchant-portal/src/pages/AppStaff/routing/StaffAppShellLayout.tsx` — `isFullWidthRoute` para tpv/kds.
- `merchant-portal/src/App.tsx` — rotas manager/turno, manager/equipe, manager/tarefas, manager/excecoes apontam às novas páginas.

---

## Regras respeitadas

1. Nenhuma tela mostra "tudo".
2. TPV e KDS não ficam embutidos em dashboards; têm rotas dedicadas em tela cheia.
3. Sidebar serve apenas para navegação (sem botões operacionais).
4. Centro da tela responde: "O que faço agora?" por contexto (home = saúde + atalhos; turno = tempo; equipe = pessoas; tarefas = trabalho; exceções = problemas).

---

## Validação

- `npm run type-check` — OK.
- `npm run test` (unitários) — OK (125 passed).
- E2E que usam `/app/staff` (sovereign-navigation, etc.) não dependem de texto removido; continuam válidos.

---

## Referências

- [APPSTAFF_ROUTE_MAP.md](./APPSTAFF_ROUTE_MAP.md) — rotas e componentes implementados.
- [APPSTAFF_APPSHELL_MAP.md](./APPSTAFF_APPSHELL_MAP.md) — estrutura do Shell e sidebar.
