# FASE 3 — Pessoas e Tarefas (checklist técnica)

Checklist executável por dev. Referência: `docs/ROADMAP_POS_FUNDACAO.md`.

**Princípio:** Gerente e Staff NÃO participam do bootstrap. Entram depois, como operação viva.

**Critério de conclusão da FASE 3:** "O sistema instrui pessoas sem eu estar lá."

---

## Passo 1 — Criar pessoas: nome, função (staff/gerente), código ou QR

**Objetivo:** Dono cria pessoas (funcionários/gerentes) com nome, função e identificação (código ou QR para check-in).

**Estado atual:** ConfigPeoplePage + PeopleSection (nome, email, role: owner/manager/staff); lista em memória; persistência real pendente (sistema de convites). Não há código/QR por pessoa.

**Tarefas:** Persistir pessoas em tabela por restaurante (ex. gm_restaurant_people ou gm_employees); campo função (staff/gerente); código ou QR por pessoa para uso no App Staff (check-in, tarefas).

**Critério de aceite:** Dono consegue criar pessoa com nome, função (staff/gerente) e obter código ou QR; pessoa aparece na lista e pode ser usada no fluxo operacional.

---

## Passo 2 — Sistema de tarefas: tarefas ligadas a turnos; checklists

**Objetivo:** Tarefas associadas a turnos e checklists que o staff executa.

**Estado atual:** TaskDashboardPage, TaskCard, TaskSuggestions; eventMonitor, taskFiltering, taskMentor; TaskSystemMinimal, RecurringTasksPage, TaskDetailPage. Tarefas podem vir do EventMonitor/engine; ligação explícita a turno pode existir ou não.

**Tarefas:** Garantir que tarefas estão ligadas a turnos (ex. tarefa válida no turno atual); checklists por tipo de tarefa ou turno; UI para staff marcar conclusão.

**Critério de aceite:** Tarefas visíveis no contexto do turno; staff consegue ver e marcar checklists; Dono vê progresso.

---

## Passo 3 — Gamificação: pontos; feedback

**Objetivo:** Pontos e feedback para motivar execução (opcional na primeira entrega).

**Estado atual:** Pode existir em AppStaff/ReflexEngine ou similar; não obrigatório para critério FASE 3.

**Tarefas:** Definir modelo de pontos (ex. por tarefa concluída); feedback simples (positivo/negativo ou comentário); exibir no App Staff ou no Dashboard do gerente.

**Critério de aceite:** Staff acumula pontos ou recebe feedback visível; Dono/gerente pode consultar.

---

## Passo 4 — Permissões: Staff executa; Gerente acompanha; Dono vê tudo

**Objetivo:** Staff só executa tarefas; gerente acompanha equipa e tarefas; Dono vê tudo (Dashboard, relatórios).

**Estado atual:** RoleGate, useRoleOptional; roles owner/manager/employee; ConfigPeoplePage tab Papéis (placeholder). Permissões por rota podem já existir.

**Tarefas:** Consolidar permissões por papel (staff: apenas execução; gerente: visão equipa + tarefas; dono: tudo); garantir que rotas e ações respeitam o papel; UI Papéis em Config com resumo do que cada um pode fazer.

**Critério de aceite:** Staff não acede a configuração sensível; gerente vê equipa e tarefas; Dono tem acesso total.

---

## Ordem recomendada

1 → 2 → 3 → 4. Validar após cada passo. Passo 3 (gamificação) pode ser reduzido ou adiado para atingir primeiro o critério "O sistema instrui pessoas sem eu estar lá."
