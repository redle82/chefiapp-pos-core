# AppStaff — Mapa por trabalhador

**1 frame Home por papel + setas para modos.** Referência canónica para Pencil e implementação.

**Regra:** 1 nó no mapa = 1 página/componente real. Setas = navegação real.

---

## 🔒 REGRA DO SISTEMA (LEI)

**Perfil ≠ Ferramenta.** Perfil define **prioridade**, NÃO exclusão. Ferramentas são capacidade do sistema, não privilégio artificial.

**TODOS os papéis têm acesso a (nunca opcional, nunca “só gestor”):**
- ✅ Tarefas (`/mode/tasks`)
- ✅ Alertas (`/mode/alerts`)
- ✅ Turno (`/mode/turn`)

**Nenhum perfil é “capado”.** Se o restaurante só tiver UMA pessoa, essa pessoa NÃO PODE FICAR BLOQUEADA.

---

## Entrada comum (todos os papéis)

| Rota | Componente |
|------|------------|
| `/app/staff/home` | StaffHomeRedirect → `/app/staff/home/:role` |
| `/app/staff/home/owner` | OwnerHome |
| `/app/staff/home/manager` | ManagerHome |
| `/app/staff/home/waiter` | WaiterHome |
| `/app/staff/home/kitchen` | KitchenHome |
| `/app/staff/home/cleaning` | CleaningHome |

**Shell (todos):** TopBar ⋯ + Bottom bar (Início, Operação, TPV, KDS, Mais). Rotas existem para todos; cada Home expõe botões conforme o papel (prioridade), sem excluir ferramentas.

---

## Modos partilhados (rotas reais)

`/mode/operation` · `/mode/turn` · `/mode/team` · `/mode/tpv` · `/mode/kds` · `/mode/tasks` · `/mode/alerts` · `/profile`

---

## 1. Dono (owner) — SUPER-OPERADOR

**Owner — Home** (`/app/staff/home/owner`)

Owner **NÃO é um dashboard**. Owner é **super-operador**: pode ser operador, garçom, cozinheiro, gestor, limpeza, tudo ao mesmo tempo.

**Acesso total (todos os botões):**
- 📊 Operação → `/mode/operation`
- 🧾 TPV → `/mode/tpv`
- 🍳 KDS → `/mode/kds`
- 👥 Equipe → `/mode/team`
- 🧹 Tarefas → `/mode/tasks`
- ⚠️ Alertas → `/mode/alerts`
- ⏱️ Turno → `/mode/turn`

---

## 2. Gerente (manager)

**Manager — Home** (`/app/staff/home/manager`)

**Foco principal + obrigatórios para todos:**
- 🧾 TPV · 🍳 KDS · 👥 Equipe · ⚠️ Alertas
- 🧹 Tarefas · ⏱️ Turno (obrigatórios, como em todos)

---

## 3. Garçom (waiter)

**Waiter — Home** (`/app/staff/home/waiter`)

**Foco:** grid mesas, toque → TPV com essa mesa.  
**Obrigatórios (todos):** 🧹 Tarefas, ⚠️ Alertas, ⏱️ Turno.  
**Mais:** 🧾 Pedidos (TPV), 🍽️ Mesas.

---

## 4. Cozinha (kitchen)

**Kitchen — Home** (`/app/staff/home/kitchen`)

**Foco principal:** 🍳 KDS (Pedidos, Atrasos).  
**Obrigatórios (todos):** 🧹 Tarefas, ⚠️ Alertas, ⏱️ Turno.

Cozinha também recebe tarefas, gera alertas e opera exceções.

---

## 5. Limpeza (cleaning)

**Cleaning — Home** (`/app/staff/home/cleaning`)

**Foco principal:** 🧹 Tarefas.  
**Obrigatórios (todos):** ⚠️ Alertas, ⏱️ Turno.

Limpeza também recebe tarefas, gera alertas e opera exceções.

---

## Resumo por papel (o que a Home mostra)

| Papel | Foco principal | + Obrigatório em todos (Tarefas, Alertas, Turno) | + Específico |
|-------|----------------|--------------------------------------------------|--------------|
| Owner | — | ✅ | Operação, TPV, KDS, Equipe (acesso total) |
| Manager | TPV, KDS, Equipe, Alertas | ✅ | — |
| Waiter | Mesas, Pedidos (TPV), Chamados (Alertas) | ✅ Tarefas, Turno | — |
| Kitchen | KDS (Pedidos, Atrasos) | ✅ Tarefas, Alertas, Turno | — |
| Cleaning | Tarefas | ✅ Alertas, Turno | — |

---

## Bottom bar / Shell

Início · Operação · TPV · KDS · Mais (Tasks, Alerts, Team, Perfil, Turno). Rotas existem para todos; cada Home expõe os botões conforme prioridade do papel.
