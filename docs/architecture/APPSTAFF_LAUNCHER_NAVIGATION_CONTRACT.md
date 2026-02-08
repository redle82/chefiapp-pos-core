# Contrato — Navegação Launcher ↔ Modos (sem loop)

**Status:** CONTRATUAL  
**Objetivo:** Garantir que o launcher e os modos do AppStaff não entrem em loop: tap no modo abre o modo; "Início" volta ao launcher. Nenhum redirect automático para `/app/staff/home` exceto ação explícita do utilizador.

**Subordinado a:** [APPSTAFF_HOME_LAUNCHER_CONTRACT.md](APPSTAFF_HOME_LAUNCHER_CONTRACT.md), [ROTAS_E_CONTRATOS.md](ROTAS_E_CONTRATOS.md).

---

## 1. Regras de navegação

| Ação | Resultado obrigatório |
|------|------------------------|
| Utilizador em `/app/staff/home` e **tap num card de modo** (TPV, KDS, etc.) | `navigate(mode.path)` — ex.: `/app/staff/mode/tpv`. O ecrã deve mudar para o modo; **nunca** ficar no launcher nem redirecionar de volta para home. |
| Utilizador em modo (ex.: `/app/staff/mode/tpv`) e **tap "Início"** na bottom bar do shell | `navigate("/app/staff/home")`. Volta ao launcher. |
| Utilizador em modo e **tap "Sair"** dentro do modo (ex.: MiniPOS) | Se estiver no contexto **Staff** (`/app/staff/*`): `navigate("/app/staff/home")`. Não redirecionar para `/app/dashboard` (evita sensação de loop ao voltar ao staff). |
| **StaffAppGate** | Só pode renderizar: `NoLocationsView`, `LocationSelectView`, `AppStaffLanding`, `WorkerCheckInView`, ou `<Outlet />`. **Proibido:** redirect para `/app/staff/home` ou qualquer lógica que force o utilizador de volta ao launcher sem ação explícita. |

---

## 2. Anti-patterns (causas de loop)

| Anti-pattern | Correção |
|-------------|----------|
| Tap no card do modo não navega | Garantir que `handleCardClick` chama `navigate(mode.path)` sem `preventDefault` / bloqueio. |
| Modo (ex.: TPV) redireciona para dashboard em "Sair" | Dentro de `/app/staff/*`, "Sair" deve ir para `/app/staff/home`, não `/app/dashboard`. |
| Gate ou efeito redireciona para home ao mudar de rota | Remover qualquer `useEffect` ou condição que faça `navigate("/app/staff/home")` quando o utilizador está num modo. |
| Duas bottom bars (shell + modo) com comportamentos diferentes | Shell é a única navegação entre modos; o modo pode ter tabs internos, mas "Sair" do modo = voltar ao launcher no contexto staff. |

---

## 3. Pontos de enforcement no código

- **AppStaffHome.tsx:** `handleCardClick(modePath, state)` → `navigate(modePath)` quando `state !== "disabled"`.
- **StaffAppShellLayout.tsx:** "Início" → `<Link to="/app/staff/home">`.
- **StaffAppGate.tsx:** Sem `navigate`; apenas render condicional (Location, Contract, Worker) ou `<Outlet />`.
- **MiniPOS.tsx (e outros modos com "Sair"):** Se `location.pathname.startsWith("/app/staff")` → `navigate("/app/staff/home")`; caso contrário → `navigate("/app/dashboard")`.

---

## 4. Declaração

Qualquer alteração que faça o utilizador voltar ao launcher sem ter clicado em "Início" ou "Sair" (para launcher) é **violação** deste contrato. O launcher é destino explícito, não fallback nem redirect automático.
