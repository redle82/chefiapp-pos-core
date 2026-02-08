# FASE 3 — Pessoas e Tarefas (checklist técnica)

Checklist executável por dev. Referência: `docs/ROADMAP_POS_FUNDACAO.md`.

**Princípio:** Gerente e Staff NÃO participam do bootstrap. Entram depois, como operação viva.

**Critério de conclusão da FASE 3:** "O sistema instrui pessoas sem eu estar lá."

---

## Passo 1 — Criar pessoas: nome, função (staff/gerente), código ou QR

**Objetivo:** Dono cria pessoas (funcionários/gerentes) com nome, função e identificação (código ou QR para check-in).

**Estado atual:** Implementado. Tabela `gm_restaurant_people` (restaurant_id, name, role staff/manager, staff_code, qr_token). Config → Pessoas → Funcionários usa `RestaurantPeopleSection`: listagem, criação (nome, função), código 4 dígitos e QR (chefiapp://staff?c=…&r=…) para App Staff. Reader `RestaurantPeopleReader`, migration `20260228160000_create_gm_restaurant_people.sql`.

**Tarefas:** ~~Persistir pessoas em tabela por restaurante~~; ~~campo função (staff/gerente)~~; ~~código ou QR por pessoa~~.

**Critério de aceite:** Dono consegue criar pessoa com nome, função (staff/gerente) e obter código ou QR; pessoa aparece na lista e pode ser usada no fluxo operacional. ✅

---

## Passo 2 — Sistema de tarefas: tarefas ligadas a turnos; checklists

**Objetivo:** Tarefas associadas a turnos e checklists que o staff executa.

**Estado atual:** Implementado. Migration `20260228170000_f3_tasks_and_shift_checklists.sql`: coluna opcional `turn_session_id` em `gm_tasks`; tabelas `gm_shift_checklist_templates` e `gm_shift_checklist_completions`. TaskReader aceita `turnSessionId` em `readOpenTasks` (filtra tarefas do turno ou sem turno). Reader/Writer: `ShiftChecklistReader`, `ShiftChecklistWriter` (templates, conclusões, defaults). UI: `ShiftChecklistSection` em TaskSystemMinimal e TaskDashboardPage; staff marca conclusão quando há turno ativo (`chefiapp_turn_session_id` no localStorage).

**Tarefas:** ~~Ligar tarefas a turnos~~; ~~checklists por turno~~; ~~UI para staff marcar conclusão~~.

**Critério de aceite:** Tarefas visíveis no contexto do turno; staff consegue ver e marcar checklists; Dono vê progresso. ✅

---

## Passo 3 — Gamificação: pontos; feedback

**Objetivo:** Pontos e feedback para motivar execução (opcional na primeira entrega).

**Estado atual:** Pode existir em AppStaff/ReflexEngine ou similar; não obrigatório para critério FASE 3.

**Tarefas:** Definir modelo de pontos (ex. por tarefa concluída); feedback simples (positivo/negativo ou comentário); exibir no App Staff ou no Dashboard do gerente.

**Critério de aceite:** Staff acumula pontos ou recebe feedback visível; Dono/gerente pode consultar.

---

## Passo 4 — Permissões: Staff executa; Gerente acompanha; Dono vê tudo

**Objetivo:** Staff só executa tarefas; gerente acompanha equipa e tarefas; Dono vê tudo (Dashboard, relatórios).

**Estado atual:** Implementado. rolePermissions: `/config` e `/dashboard` apenas owner/manager (staff bloqueado); `/config` cobre /config/people e demais sub-rotas; RoleGate redireciona staff para /garcom quando nega acesso. Config → Pessoas → Papéis usa RolesSummarySection com resumo por papel (Staff: apenas execução; Gerente: equipa + tarefas; Dono: tudo).

**Tarefas:** ~~Consolidar permissões por papel~~; ~~rotas respeitam o papel~~; ~~UI Papéis com resumo~~.

**Critério de aceite:** Staff não acede a configuração sensível; gerente vê equipa e tarefas; Dono tem acesso total. ✅

---

## Ordem recomendada

1 → 2 → 3 → 4. Validar após cada passo. Passo 3 (gamificação) pode ser reduzido ou adiado para atingir primeiro o critério "O sistema instrui pessoas sem eu estar lá."
