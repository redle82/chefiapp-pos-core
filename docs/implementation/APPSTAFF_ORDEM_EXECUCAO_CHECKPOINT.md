# AppStaff — Checkpoint pós ordem de execução

**Referência:** Ordem de execução baseada no mapa (APPSTAFF_MAPA_TELAS_POR_TRABALHADOR.md).

---

## 1. Mapa congelado como verdade única

- **Arquivo canónico:** `docs/architecture/APPSTAFF_MAPA_TELAS_POR_TRABALHADOR.md`
- Nenhuma tela foi criada fora deste mapa.

---

## 2. Rotas Home por papel (implementadas)

| Rota | Componente |
|------|------------|
| `/app/staff/home` | Redirect → `/app/staff/home/:role` (StaffHomeRedirect por activeRole) |
| `/app/staff/home/owner` | OwnerHome |
| `/app/staff/home/manager` | ManagerHome |
| `/app/staff/home/waiter` | WaiterHome |
| `/app/staff/home/kitchen` | KitchenHome |
| `/app/staff/home/cleaning` | CleaningHome |

- **Redirect:** `/app/staff/home` → `/app/staff/home/owner` | manager | waiter | kitchen | cleaning conforme `activeRole` (worker → waiter, default → manager).

---

## 3. Botões principais por papel (visíveis, fixos)

- **DONO:** 📊 Operação → /mode/operation, 👥 Equipe → /mode/team.
- **GERENTE:** 🧾 TPV, 🍳 KDS, 👥 Equipe, ⚠️ Alertas (grid 2×2).
- **GARÇOM:** Grid de mesas + 🍽️ Mesas (ativo), 🧾 Pedidos → /mode/tpv, ⚠️ Chamados → /mode/alerts.
- **COZINHA:** 🍳 Pedidos (KDS) → /mode/kds, ⏱️ Atrasos → /mode/kds?filter=delay + KitchenDisplay.
- **LIMPEZA:** Lista tarefas + 🧹 Tarefas → /mode/tasks.

Nenhuma função principal em dropdown.

---

## 4. Dropdown superior (secundário apenas)

- **TopBar → botão ⋯**
- Conteúdo: Turno → /mode/turn, Tarefas → /mode/tasks, Perfil → /profile, (Dono/Gerente) Relatórios → /mode/operation.

---

## 5. Rotas de modo (existentes, shells mínimos)

| Rota | Componente |
|------|------------|
| `/app/staff/mode/operation` | OperationModePage |
| `/app/staff/mode/turn` | ManagerTurnoPage |
| `/app/staff/mode/team` | ManagerEquipePage |
| `/app/staff/mode/tpv` | StaffTpvPage |
| `/app/staff/mode/kds` | KitchenDisplay |
| `/app/staff/mode/tasks` | ManagerTarefasPage |
| `/app/staff/mode/alerts` | ManagerExcecoesPage |
| `/app/staff/profile` | StaffProfilePage |

Cada rota tem conteúdo (não tela branca). `AppModeShell` disponível em `routing/AppModeShell.tsx` para uso futuro.

---

## 6. Removido

- Launcher genérico: `/app/staff/home` index agora é redirect para home/role.
- Grid de modos único: cada papel tem a sua Home com apenas os botões do mapa.
- CTA duplicado: ManagerHome sem FOCO AGORA / secundários / nav duplicada.
- Navegação abstrata: todos os botões levam a rotas reais.

---

## 7. Regra final de UX

- 1 Home = 1 operador (rotas explícitas /home/owner, /home/manager, etc.).
- 1 clique = ação real (todos os botões com `to` ou `onClick` → navigate).
- Ícone + nome sempre visíveis nos botões principais.
- Nenhuma rota morta.
- Nenhuma tela “conceito”.

---

## 8. Checkpoint

- **Rotas funcionando:** Sim (TypeScript `tsc --noEmit` OK).
- **Console error:** Verificar no browser (abrir /app/staff, escolher papel, navegar por cada Home e modo).
- **Botão que não leva a lugar nenhum:** Nenhum; todos os botões têm destino definido.

**Ficheiros criados/alterados:**

- `merchant-portal/src/pages/AppStaff/routing/StaffHomeRedirect.tsx` (novo)
- `merchant-portal/src/pages/AppStaff/routing/AppModeShell.tsx` (novo)
- `merchant-portal/src/App.tsx` (rotas home/owner|manager|waiter|kitchen|cleaning, isStaffLauncher, remoção StaffLauncherPage)
- `merchant-portal/src/pages/AppStaff/routing/StaffAppShellLayout.tsx` (isLauncher com home/, dropdown ⋯, Link Início por role)
- `merchant-portal/src/pages/AppStaff/homes/OwnerHome.tsx` (apenas 2 botões)
- `merchant-portal/src/pages/AppStaff/homes/ManagerHome.tsx` (apenas 4 botões)
- `merchant-portal/src/pages/AppStaff/homes/WaiterHome.tsx` (grid + 3 botões: Mesas, Pedidos, Chamados)
- `merchant-portal/src/pages/AppStaff/homes/KitchenHome.tsx` (2 botões + KitchenDisplay)
- `merchant-portal/src/pages/AppStaff/homes/CleaningHome.tsx` (lista + 1 botão Tarefas)

**Próximo passo:** Abrir a app no browser, passar pelo Gate (localização/papel), confirmar que cada Home mostra apenas os botões do mapa e que cada botão navega para a rota correta. Capturar prints das Homes por operador para documentação.
