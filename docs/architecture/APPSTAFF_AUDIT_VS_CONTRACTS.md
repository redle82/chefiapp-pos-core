# Auditoria AppStaff vs Contratos Core

**Data:** 2026-01-28  
**Objetivo:** Mapear o que existe no AppStaff, marcar violações e ausências face aos [seis subcontratos](CORE_APPSTAFF_CONTRACT.md#3-camadas-do-contrato-seis-subcontratos) e definir prioridade (dinheiro / risco / valor).

**Implementação canónica:** O AppStaff que foi criado no Core está no projecto **`mobile-app`** (Expo, iOS/Android): tabs Turno (tarefas + mini TPV), Cardápio, Pedidos, Cozinha, Mesas, Gestão, Conta. Ver [CORE_APPSTAFF_CONTRACT §9](CORE_APPSTAFF_CONTRACT.md#9-implementação-canónica-o-appstaff-que-foi-criado-no-core).

**Âmbito:** O terminal real é o `mobile-app`; no web, `/garcom` mostra apenas «Disponível apenas no app mobile». Esta auditoria aplica-se ao `mobile-app` e, para referência histórica, ao que existia no merchant-portal (AppStaffMinimal, MiniKDSMinimal, MiniTPVMinimal, TaskPanel).

---

## 1. Mapa do que existe

### 1.1 Entrada staff (`/garcom`)

| Ficheiro | Função |
|----------|--------|
| `AppStaffMinimal.tsx` | Página única: header (título, restaurante, botão Voltar ao Dashboard), tabs KDS \| Tarefas, conteúdo por tab. |
| `useRestaurantIdentity` | Identidade restaurante (identity.id). |
| `useRole` | Papel (owner/manager/staff). |
| `getStaffCopy()` | Títulos: "AppStaff", "KDS, TPV e tarefas — o que fazer agora". |
| Fallback `restaurantId` | `identity.id` → `getTabIsolated("chefiapp_restaurant_id")` → hardcoded DEFAULT_RESTAURANT_ID. |

### 1.2 Componentes montados no Minimal

| Componente | Fonte | Função |
|------------|--------|--------|
| MiniKDSMinimal | AppStaff/components | Pedidos activos (readActiveOrders, readOrderItems), estado por item, realtime. |
| MiniTPVMinimal | AppStaff/components | Produtos (fetch directo a gm_products), carrinho, criar pedido (createOrder). |
| TaskPanel | KDSMinimal/TaskPanel | readOpenTasks, acknowledgeTask, resolveTask; **não** gera tarefas (Core/gerente/dono criam). |

### 1.3 Fluxo “full” (não em `/garcom`)

| Ficheiro | Função |
|----------|--------|
| AppStaff.tsx | Landing → Check-in → Manager/Owner/Worker views. **Não** é renderizado em `/garcom`. |
| StaffContext.tsx | operationalContract, activeWorkerId, checkIn, checkOut, employees, verifyPin, shift_logs. |
| WorkerCheckInView.tsx | Lista/PIN/manual check-in; usa StaffContext.checkIn. |
| ManagerDashboard, OwnerDashboard, MiniPOS, KitchenDisplay, CleaningTaskView, WorkerTaskStream, WorkerTaskFocus | Views por papel/ferramenta. |

Conclusão: **Check-in e estado de turno** estão agora no Minimal (ecrã "Entrar em turno", header "Em turno / Papel / Entrada às HH:MM", "Sair de turno"). **Visibilidade financeira** (ticket médio, resumo turno) continua ausente até o Core expor; placeholder no Minimal.

---

## 2. Confronto por contrato

### 2.1 Identity & Presence ([CORE_APPSTAFF_IDENTITY_CONTRACT](CORE_APPSTAFF_IDENTITY_CONTRACT.md))

| Regra / elemento | Existe? | Violação? | Ausência? |
|------------------|--------|-----------|-----------|
| Identidade confirmada | Parcial | Sim: restaurantId = identity + TabIsolated + **hardcoded**. Contrato: “fonte = Core/sessão”. | — |
| Vínculo com restaurante | Sim | — | — |
| Papel | Sim (useRole) | — | — |
| Estado (ativo / suspenso / fora de turno) | Sim | — | — | Em turno = workerName preenchido; fora = ecrã check-in. |
| Perfil (nome, papel, função) | Sim | — | — | Header: "Em turno: {nome}", "Papel: Dono|Gerente|Staff". |
| Último check-in | Sim | — | — | "Entrada às HH:MM" + botão "Sair de turno". |
| QR pessoal | Não | — | **Sim.** | Quando Core suportar. |

**Resumo:** Identidade com exceção dev documentada; estado de turno, perfil e último check-in **implementados** no Minimal. QR pessoal ausente.

---

### 2.2 Time, Turn & Presence ([CORE_TIME_AND_TURN_CONTRACT](CORE_TIME_AND_TURN_CONTRACT.md))

| Regra / elemento | Existe? | Violação? | Ausência? |
|------------------|--------|-----------|-----------|
| Estado de turno (em turno / fora) | Sim | — | — | Sem turno → ecrã "Entrar em turno"; em turno → conteúdo. |
| Acção check-in | Sim | — | — | MinimalCheckInScreen: nome + "Entrar em turno"; estado em TabIsolated. |
| Acção check-out | Sim | — | — | Botão "Sair de turno" no header. |
| Último check-in (data/hora) | Sim | — | — | "Entrada às HH:MM" no header. |
| QR pessoal para check-in | Não | — | **Sim.** | Quando Core suportar. |

**Resumo:** Check-in/out **implementado** no Minimal (ecrã de entrada + header com estado e "Sair de turno"). QR pessoal ausente.

---

### 2.3 Task & Duty ([CORE_TASK_EXECUTION_CONTRACT](CORE_TASK_EXECUTION_CONTRACT.md))

| Regra / elemento | Existe? | Violação? | Ausência? |
|------------------|--------|-----------|-----------|
| Mostrar tarefas atribuídas | Sim (TaskPanel, readOpenTasks) | — | — |
| Confirmação / reconhecimento | Sim (acknowledgeTask) | — | — |
| Execução / resolução | Sim (resolveTask, evidência) | — | — |
| Reportar ao Core | Sim | — | — |
| Quem cria tarefas = Core/gerente/dono | Sim | — | — | TaskPanel só lê/confirma/resolve; criação no Core ou gerente/dono.
| Impacto (XP, alerta) visível | Não | — | **Sim.** Contrato permite “mostrar se Core expor”; não há UI para isso. |

**Resumo:** Mostrar/confirmar/executar/reportar tarefas **alinhado**. Criação de tarefas fora do cliente. **Ausência:** mostrar impacto (XP/alerta) quando o Core expuser.

---

### 2.4 Operational Awareness ([CORE_OPERATIONAL_AWARENESS_CONTRACT](CORE_OPERATIONAL_AWARENESS_CONTRACT.md))

| Regra / elemento | Existe? | Violação? | Ausência? |
|------------------|--------|-----------|-----------|
| Mini KDS (pedidos, estado, tempo) | Sim (MiniKDSMinimal) | — | — |
| Mini TPV (contexto pedidos / criar) | Sim (MiniTPVMinimal) | — | — |
| Métricas operacionais (atrasos, fila, pressão) | Sim | — | — | Bloco "Atrasados / Fila / Pressão" (readActiveOrders, atraso >15 min). |
| Fonte = Core | Parcial | MiniTPVMinimal faz **fetch directo** a `gm_products` (URL + anon key); resto usa readers. Inconsistência de fronteira, não violação directa do contrato de consciência. | — |

**Resumo:** Consciência operacional **presente**: mini KDS, mini TPV e métricas (atrasos, fila, pressão) no Minimal.

---

### 2.5 Financial Visibility ([CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT](CORE_APPSTAFF_FINANCIAL_VISIBILITY_CONTRACT.md))

| Regra / elemento | Existe? | Violação? | Ausência? |
|------------------|--------|-----------|-----------|
| Staff: ticket médio do turno, metas, impacto próprio | Placeholder | — | — | Bloco "Ticket médio do turno: —" (quando Core expuser). |
| Gerente: resumo turno, desvios, alertas | Placeholder | — | — | Bloco "Resumo turno: —" para manager/owner (quando Core expuser). |

**Resumo:** Visibilidade financeira com **placeholder** no Minimal (slot UI); dados reais quando o Core expor.

---

### 2.6 Communication ([CORE_OPERATIONAL_COMMUNICATION_CONTRACT](CORE_OPERATIONAL_COMMUNICATION_CONTRACT.md))

| Regra / elemento | Existe? | Violação? | Ausência? |
|------------------|--------|-----------|-----------|
| Alertas do sistema | Não | — | **Sim.** |
| Notificações (tarefa nova, etc.) | Não | — | **Sim.** (Toast existe para role_denied; não para tarefas/alertas.) |
| Comentário em tarefa | Não | — | **Sim.** | Baixa prioridade; quando Core/UI suportar. |
| Resposta curta a alerta | Não | — | **Sim.** | Idem. |

**Resumo:** Badge "Tarefas (N)" presente. Comunicação operacional (alertas, notificações, comentário, resposta a alerta) **ausente**; baixa prioridade.

---

## 3. Tabela resumo: violações e ausências

| Contrato | Violações | Ausências |
|----------|-----------|-----------|
| Identity & Presence | Identidade: exceção dev documentada (fallback até Core/sessão). | QR pessoal (quando Core suportar). |
| Time, Turn & Presence | Nenhuma. | QR pessoal para check-in. |
| Task & Duty | Nenhuma (criação no Core). | Mostrar impacto (XP/alerta) quando Core expuser. |
| Operational Awareness | Nenhuma. | — (métricas implementadas). |
| Financial Visibility | Nenhuma. | Dados reais quando Core expuser (placeholder UI já existe). |
| Communication | Nenhuma. | Alertas, notificações, comentário em tarefa, resposta a alerta (badge Tarefas presente). |

---

## 4. Priorização (dinheiro / risco / valor)

Critérios:

- **Risco:** contrato diz “obrigatório” ou “não abre sem”; falha = sistema incoerente ou inseguro.
- **Valor:** melhora directa da operação (turno, tarefas, consciência).
- **Dinheiro:** impacto em faturação/retenção (ex.: visibilidade financeira para gerente).

### 4.1 Prioridade ALTA (risco + alinhamento ao contrato)

1. **Identity:** Fonte de identidade/restaurantId = Core ou sessão; remover ou documentar hardcoded como exceção dev.  
   - **Feito:** Documentado em `AppStaffMinimal.tsx` como exceção dev até haver sessão/API; fallback mantido para validação.  
2. **Check-in no terminal:** Integrar estado de turno e acção check-in (e, se aplicável, check-out) no fluxo `/garcom` (ex.: usar WorkerCheckInView ou equivalente antes de mostrar KDS/TPV/Tarefas; ou barra com “em turno” + último check-in).  
   - **Feito:** Em `AppStaffMinimal.tsx`: porta de check-in (sem turno → ecrã "Entrar em turno" com nome); em turno → header com "Em turno: {nome}", "Entrada às HH:MM" e botão "Sair de turno". Estado em TabIsolated até haver Core/backend. Ver [CORE_TIME_AND_TURN_CONTRACT.md](CORE_TIME_AND_TURN_CONTRACT.md).  
3. **Tarefas:** Mover geração de tarefas (generateTasks, generateScheduledTasks) para o **Core** (backend/job); TaskPanel só consome e mostra. Elimina violação “quem cria = Core/gerente/dono”.  
   - **Feito:** TaskPanel deixou de chamar `generateTasks`/`generateScheduledTasks` no cliente; apenas lê, mostra, confirma e reporta. Criação de tarefas fica a cargo do Core (backend/job) ou gerente/dono. Ver `TaskPanel.tsx` e [CORE_TASK_EXECUTION_CONTRACT.md](CORE_TASK_EXECUTION_CONTRACT.md).

### 4.2 Prioridade MÉDIA (valor operacional)

4. **Identity no ecrã:** Perfil mínimo (nome, função) e estado “em turno / fora” + último check-in no header do Minimal.  
   - **Feito:** Header em turno mostra "Em turno: {nome}", "Papel: Dono|Gerente|Staff", "Entrada às HH:MM" e botão "Sair de turno".  
5. **Métricas de consciência:** Bloco resumido no Minimal (pedidos atrasados, fila, pressão) com dados do Core.  
   - **Feito:** Bloco "Atrasados / Fila / Pressão" acima dos tabs; dados de `readActiveOrders` (atraso > 15 min, fila = pedidos OPEN/IN_PREP, pressão baixa|média|alta).  
6. **Alertas/notificações:** Canal mínimo (ex.: tarefa nova, alerta de sistema) sem chat livre; conforme contrato de comunicação.  
   - **Feito:** Badge no tab "Tarefas (N)" com contagem de tarefas abertas (`readOpenTasks`), atualizada a cada 10 s.

### 4.3 Prioridade BAIXA (melhoria / depois)

7. **Visibilidade financeira:** Ticket médio do turno (staff), resumo/desvios (gerente) quando Core expuser.  
8. **Comunicação contextual:** Comentário em tarefa, resposta curta a alerta.  
9. **QR pessoal:** Para check-in noutro dispositivo ou validação, quando Core suportar.

---

## 5. Próximos passos recomendados

1. **Decisão de produto:** O terminal staff é só **AppStaffMinimal** (`/garcom`) ou também o fluxo **AppStaff** (Landing → Check-in → dashboards)? Se for só Minimal, trazer check-in + identidade/turno para o Minimal. Se for os dois, deixar claro qual é “terminal humano” e alinhar contratos a esse fluxo.  
2. **Implementação:**  
   - Alta: identidade (Core/sessão), check-in no terminal, tarefas criadas no Core.  
   - Média: perfil + estado turno no header, métricas de consciência, alertas mínimos.  
   - Baixa: visibilidade financeira, comunicação contextual, QR quando Core permitir.  
3. **Documentação:** Manter este ficheiro como snapshot; criar tarefas ou ADRs por item de prioridade e actualizar auditoria quando algo for fechado.

---

**Conclusão:** O AppStaff em `/garcom` cumpre **a maior parte** dos contratos: identidade (com exceção dev), tempo/turno (check-in no Minimal), consciência operacional (mini KDS, mini TPV, métricas atrasos/fila/pressão), ciclo de tarefas (ler/confirmar/executar; criação no Core) e badge de tarefas estão implementados. Visibilidade financeira tem **placeholder** (ticket médio / resumo turno); dados reais quando o Core expor. Pendente (baixa prioridade): QR pessoal, comunicação contextual (comentário, resposta a alerta).
