# ChefIApp — Sistema de Papéis (Role System) — SPEC

**Data:** 2026-01-29
**Objetivo:** Definir o ChefIApp como **sistema operacional por papéis**, não como lista de telas. O que muda não é o sistema, é o que cada pessoa pode ver, fazer e decidir. Papéis, permissões, ferramentas e UX por papel.

---

## 1. Visão-mãe

O ChefIApp **não é um app**. É um **sistema operacional** com interfaces diferentes para cada papel.

- **Papéis principais:** Dono, Gerente, Funcionário (garçom / cozinha / caixa).
- Cada papel tem: objetivos diferentes, nível de responsabilidade diferente, ferramentas diferentes, linguagem diferente.

---

## 2. Arquitetura de papéis (quem decide o quê)

| Camada                | Quem decide |
| --------------------- | ----------- |
| **Core / Regras**     | Sistema     |
| **IA / Sugestões**    | Sistema     |
| **Execução**          | Humanos     |
| **Visão estratégica** | Dono        |
| **Coordenação**       | Gerente     |
| **Ação**              | Funcionário |

---

## 3. Papéis formais (UserRole)

Para rotas, permissões e UI:

```ts
type UserRole = "owner" | "manager" | "staff";
```

- **owner** — Dono do restaurante. Backoffice completo, estado do sistema, integrações, billing, Mentor IA, percepção macro.
- **manager** — Gerente. Dashboard operacional, tarefas, equipe, TPV/KDS/Percepção; sem billing nem integrações críticas.
- **staff** — Funcionário (garçom, cozinha, caixa). AppStaff, tarefas, TPV (se autorizado), KDS, check-in; sem finanças, config nem integrações.

Sub-roles operacionais (waiter, kitchen, cashier) podem existir para **atribuição de tarefas** e **contexto de ferramenta**; para **acesso a rotas e módulos** usamos owner | manager | staff.

---

## 4. Funcionário (staff)

### 4.1 Objetivo

Executar bem, rápido, **sem pensar no sistema**.

### 4.2 Interface

- **AppStaff / AppStaff Mínimo** — tela simples, direta, escura (como já está).

### 4.3 Ferramentas essenciais

| Ferramenta             | Descrição                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Tarefas**            | Lista clara; uma tarefa por vez; status: pendente / em execução / concluída; tempo opcional, não opressivo. |
| **TPV / Caixa**        | Se autorizado: abrir mesa, adicionar itens, fechar conta, ver status (sem números complexos).               |
| **KDS (cozinha)**      | Pedidos por prioridade, tempo decorrido, marcar como pronto.                                                |
| **Comunicação mínima** | Alertas do sistema, avisos do gerente; nada de chat livre no início.                                        |
| **Check-in / Turno**   | Iniciar turno, encerrar turno, registrar presença.                                                          |

### 4.4 O que o funcionário NÃO vê

- Finanças
- Configurações
- Integrações
- IA “pensando” (só recebe tarefas e alertas, não o raciocínio)

---

## 5. Gerente (manager)

### 5.1 Objetivo

Garantir que a **operação flua hoje**.

### 5.2 Interface

- **Dashboard operacional**
- **Backoffice parcial** (só o que for relevante para coordenação)

### 5.3 Ferramentas essenciais

| Ferramenta                        | Descrição                                                      |
| --------------------------------- | -------------------------------------------------------------- |
| **Dashboard “O que fazer agora”** | Alertas ativos, gargalos, sugestões da IA, estado da operação. |
| **Gestão de tarefas**             | Criar/delegar tarefas, ver atrasos, repriorizar.               |
| **Equipe**                        | Ver quem está em turno, escalas, papéis básicos.               |
| **Operação**                      | TPV, KDS, Cardápio (edições simples).                          |
| **Percepção Operacional**         | Ver eventos, confirmar alertas, acionar ações.                 |

### 5.4 O que o gerente NÃO decide

- Billing
- Modo do sistema (demo / pilot / live)
- Integrações críticas
- Regras estruturais

---

## 6. Dono (owner)

### 6.1 Objetivo

**Entender, decidir e antecipar.**

### 6.2 Interface

- **Dashboard estratégico**
- **Backoffice completo**

### 6.3 Ferramentas essenciais

| Ferramenta                | Descrição                                                                |
| ------------------------- | ------------------------------------------------------------------------ |
| **Estado do sistema**     | Demo / Piloto / Ao vivo; saúde geral; módulos ativos.                    |
| **Dashboard estratégico** | Resumo do dia, tendências, problemas recorrentes, insights da IA.        |
| **Backoffice completo**   | Configuração, Integrações, Pagamentos, Planos, Modos.                    |
| **Percepção Operacional** | Visão macro, padrões, segurança, histórico.                              |
| **Mentor IA**             | “O que você recomenda?”, “O que está errado?”, “O que devo fazer agora?” |

### 6.4 O que o dono NÃO faz

- Executar tarefas operacionais (coordena e decide, não substitui o funcionário no chão)

---

## 7. Sistema de tarefas (eixo que conecta tudo)

As tarefas são o **sistema nervoso**: tudo converge para tarefas. É assim que o sistema “pensa antes do humano”.

### 7.1 Origem das tarefas

- IA
- Gerente
- Eventos (percepção, pedidos, atrasos)
- Rotinas

### 7.2 Destino

- Funcionário (execução)
- Gerente (delegação, follow-up)
- Sistema (follow-up automático)

### 7.3 Estrutura (conceitual)

```ts
interface Task {
  id: string;
  type: string;
  priority: "critical" | "attention" | "background" | "urgent";
  source: "ai" | "manager" | "system";
  assigned_to?: string; // role ou userId
  context?: Record<string, unknown>;
  due_at?: string;
  // ... (status, createdAt, etc.)
}
```

Alinhar ao que já existe em `StaffCoreTypes.ts` (Task, meta.source, assigneeRole, etc.).

---

## 8. Ferramentas por papel (resumo)

| Ferramenta            | Funcionário        | Gerente            | Dono           |
| --------------------- | ------------------ | ------------------ | -------------- |
| Tarefas               | ✅ executa         | ✅ cria/delega     | 👀 vê          |
| TPV                   | ✅ (se autorizado) | ✅                 | 👀             |
| KDS                   | ✅                 | ✅                 | 👀             |
| Percepção Operacional | ❌                 | ✅ eventos/alertas | ✅ visão macro |
| Dashboard             | ❌                 | ✅ operacional     | ✅ estratégico |
| Backoffice            | ❌                 | ⚠️ parcial         | ✅ completo    |
| IA Mentor             | ❌                 | ⚠️ limitado        | ✅ completo    |
| Integrações           | ❌                 | ❌                 | ✅             |

Legenda: ✅ acesso; 👀 só leitura/visão; ⚠️ parcial/limitado; ❌ não vê.

---

## 9. Permissões por módulo (mapeamento)

| Módulo / Rota               | owner | manager          | staff                   |
| --------------------------- | ----- | ---------------- | ----------------------- |
| /dashboard                  | ✅    | ✅ (operacional) | ❌                      |
| /tpv                        | ✅    | ✅               | ✅ (se autorizado)      |
| /kds-minimal                | ✅    | ✅               | ✅                      |
| /tasks                      | ✅    | ✅ criar/delegar | ✅ executar             |
| /config/\*                  | ✅    | ⚠️ (parcial)     | ❌                      |
| /config/integrations        | ✅    | ❌               | ❌                      |
| /config/perception          | ✅    | ✅               | ❌                      |
| /alerts                     | ✅    | ✅               | ✅ (alertas atribuídos) |
| /mentor                     | ✅    | ⚠️ limitado      | ❌                      |
| /billing/\*                 | ✅    | ❌               | ❌                      |
| /people, /garcom (AppStaff) | ✅    | ✅               | ✅ (próprio contexto)   |
| /health                     | ✅    | ⚠️               | ❌                      |

Implementação: matriz de permissões (role × módulo) ou lista de “allowed roles” por rota; `rolePermissions.ts` (matriz por prefixo), `normalizePath()` para path única, RoleGate + canAccessPath. Menu/sidebar filtrados por papel.

---

## 10. UX por papel

- **Copy:** Texto e labels adaptados ao papel (`core/roles/roleCopy.ts`: `getDashboardCopy`, `getConfigCopy`, `getStaffCopy`; usados em DashboardPortal, ConfigSidebar, AppStaffMinimal). (ex.: “O que fazer agora” para gerente; “Suas tarefas” para funcionário; “Estado do sistema” para dono).
- **Navegação:** Menu e sidebar mostram só o que o papel pode aceder.
- **Tonalidade:** Funcionário = acção imediata; Gerente = coordenação; Dono = estratégia e decisão.

---

## 11. Como isso vira código (sem reinventar)

Já existe boa parte (AppStaff, tarefas, TPV, KDS, Dashboard, Config). O que falta é **organizar por papel**.

| Passo | Descrição                                                                                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | **Formalizar UserRole** = `owner` \| `manager` \| `staff` (e mapear a roles existentes se houver `employee`, `cashier`, `kitchen` para contexto operacional). |
| 2     | **Mapear permissões por módulo** — tabela ou config (role → rotas/módulos permitidos).                                                                        |
| 3     | **Esconder / mostrar rotas** — RoleGate (ou equivalente) que verifica role antes de renderizar rota ou menu.                                                  |
| 4     | **Ajustar copy por papel** — textos e títulos conforme role (opcional por página).                                                                            |
| 5     | **Refinar AppStaff** como interface oficial do funcionário — garantir que é o “modo staff” e que gerente/dono têm entrada para dashboard/backoffice.          |

Nada estrutural precisa ser refeito; é organização e gates.

---

## 12. Próximos passos executáveis (ordem)

| #   | Passo                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ✅ **Criar doc** — Este documento (`CHEFIAPP_ROLE_SYSTEM_SPEC.md`).                                                                         |
| 2   | **Implementar RoleGate** — Componente `<RoleGate allow={['manager','owner']}>` (ou por rota) que esconde/bloqueia acesso conforme UserRole. |
| 3   | **Refinar AppStaff** como interface oficial do funcionário — garantir rota dedicada, copy e menu alinhados ao papel staff.                  |
| 4   | **Persistir role do utilizador** — Em sessão ou em backend (perfil, tenant); usar no RoleGate e na navegação.                               |
| 5   | **Ajustar menus** — Sidebar e Dashboard mostram apenas itens permitidos para o role atual.                                                  |

---

## 13. Referências de código (existente)

| Componente               | Caminho                                    | Nota                                                         |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------------ |
| UserRole (TaskFiltering) | `core/tasks/TaskFiltering.ts`              | `owner` \| `manager` \| `employee` \| `cashier` \| `kitchen` |
| StaffRole (AppStaff)     | `pages/AppStaff/context/StaffCoreTypes.ts` | `manager` \| `waiter` \| `kitchen` \| … \| `owner`           |
| Task, meta.source        | `pages/AppStaff/context/StaffCoreTypes.ts` | source: human, system-reflex, integration, etc.              |
| OrderOrigin              | `core/contracts/OrderOrigin.ts`            | APPSTAFF_MANAGER, APPSTAFF_OWNER                             |
| AppStaff / garcom        | Rotas e páginas AppStaff                   | Interface funcionário                                        |

Alinhar `UserRole` (para gates e permissões) com `StaffRole` (para atribuição de tarefas e contexto operacional): owner/manager/staff para **acesso**; waiter/kitchen/cashier como **contexto** dentro de staff.

---

## 14. Contrato de produto — implementação selada

- **Papéis:** `owner` | `manager` | `staff` (ver secção 3).
- **Ferramentas por papel:** tabela na secção 8.
- **Rotas por papel:** tabela na secção 9; RoleGate redireciona staff (proibido) → `/garcom`, manager/owner (proibido) → `/dashboard`; state `reason: "role_denied"` e toast "Acesso restrito ao seu papel." em `/garcom` e `/dashboard`.
- **Normalização de path:** `normalizePath()` remove query, hash e trailing slash; usada em RoleGate, ConfigSidebar, DashboardPortal e em `getAllowedRolesForPath`.
- **RoleSwitcher:** apenas em DEV (`import.meta.env.DEV`), label "DEV: Simular papel", no Dashboard.

**Nota importante:** O role via `localStorage` (`chefiapp_user_role`) é um **gate de DEV/UX** para simulação e navegação. A **segurança real** virá do backend (sessão, perfil, tenant); quando houver API de auth/perfil, o role deve ser definido pelo servidor e usado no RoleGate e na navegação.

**Integração com backend:** Quando existir sessão/perfil com role, passar o role ao `RoleProvider`:

```tsx
// Exemplo: quando existir useSession() ou useAuth()
<RoleProvider role={session?.user?.role}>
  <App />
</RoleProvider>
```

- Com `role` definido, o backend é a fonte de verdade; `setRole` fica no-op (RoleSwitcher continua visível em DEV mas não altera o role).
- O contexto expõe `fromServer: boolean` para saber se o role vem do servidor.

---

## Referências

- [CHEFIAPP_AI_GATEWAY_SPEC.md](CHEFIAPP_AI_GATEWAY_SPEC.md) — IA como apoio; sugestões viram tarefas
- [CHEFIAPP_INTEGRATIONS_HUB_SPEC.md](CHEFIAPP_INTEGRATIONS_HUB_SPEC.md) — Integrações; dono acede ao Hub
- [PERCEPCAO_OPERACIONAL_SEGURANCA_SPEC.md](PERCEPCAO_OPERACIONAL_SEGURANCA_SPEC.md) — Percepção; gerente e dono
