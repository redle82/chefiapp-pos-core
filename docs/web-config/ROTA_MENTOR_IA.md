# Rota — Mentor IA (Web de Configuração, opcional)

**Path exato:** `/mentor`  
**Tipo:** WEB CONFIG  
**Estado atual:** UI PARCIAL (página MentorDashboardPage existe; papel de “observador operacional” opcional).

---

## 1. Visão Geral

- **O que esta rota resolve no restaurante real:** IA mentora como observador operacional — sugestões baseadas em tarefas, pedidos, tempos e saúde do restaurante (ex.: “Verificar gargalo na cozinha”, “Priorizar saída de pedidos”). O dono usa para ter um “segundo par de olhos” sobre a operação, sem substituir decisões humanas.
- **Para quem é:** Dono apenas — web de configuração.
- **Em que momento do ciclo de vida:** TRIAL e ACTIVE; em SETUP pode mostrar estado vazio (“Abra o TPV e comece a operar para receber sugestões do Mentor.”).

---

## 2. Rota & Acesso

- **Path:** `/mentor`
- **Tipo:** WEB CONFIG.
- **Guard aplicado:** CoreFlow — ALLOW para hasOrg; nunca bloquear por systemState nem por billing. Referência: rolePermissions inclui `/mentor` para owner/manager; na web de configuração só Dono (CONTRATO_OWNER_ONLY_WEB).
- **Comportamento por SystemState:**
  - **SETUP:** ALLOW; estado vazio: “Complete a configuração e abra o TPV para receber sugestões.”
  - **TRIAL:** ALLOW; sugestões baseadas em dados reais do trial.
  - **ACTIVE:** ALLOW; sugestões reais.
  - **SUSPENDED:** ALLOW leitura; sugestões conforme política.

---

## 3. Conexão com o Core

- **Entidades lidas:** Restaurant, Orders (tempos, estados), Tasks (abertas, prioridade), EventMonitor (pedidos atrasados), Health/Operational metrics. Pode alimentar permissões e relatórios (demoExplicativoContent).
- **Entidades escritas:** Nenhuma escrita direta; Mentor é observador. Eventual registo de “sugestão vista” ou “ação tomada” se implementado.
- **Eventos gerados:** Leitura de eventos existentes; sugestões derivadas (ex.: `mentor_advice` no aiGateway). Não usar “demo” para sugestões.

---

## 4. Backend & Dados

- **Tabelas envolvidas:** Dados agregados de pedidos, tarefas, métricas operacionais (ex.: `get_operational_metrics`). RPCs ou endpoints: ex. `get_mentor_suggestions`, `get_task_suggestions`. Backend local: Docker Core; se não existir, estado vazio ou mensagem “Sugestões indisponíveis. Verifique a ligação ao Core.”
- **Estado vazio honesto:** “Ainda não há sugestões. Opere o restaurante (TPV, tarefas) para o Mentor analisar.”

---

## 5. UI / UX Esperada

- **Estados:** (1) **Vazio** — sem dados operacionais; CTA: “Abrir TPV”, “Ir ao Dashboard”. (2) **Em uso** — lista ou cards de sugestões (ex.: “Verificar gargalo na cozinha”, “Priorizar saída de pedidos”); ações: “Ver detalhe”, “Marcar como vista”. (3) **Erro** — “Não foi possível carregar as sugestões. Tente novamente.”
- **Mensagens:** Sem “demo”; sugestões baseadas em operação real.
- **CTAs:** “Atualizar sugestões”, “Ir ao TPV”, “Ver tarefas”.

---

## 6. Integração com Outras Rotas

- **De onde vem:** Dashboard (módulo Mentor IA), Tasks, Health, Alertas.
- **Para onde vai:** Dashboard, TPV, KDS, Tasks, Alertas. Depende de pedidos/tarefas/métricas para gerar sugestões.
- **Dependências:** Não bloqueia nem é bloqueada por billing; depende de dados operacionais para valor.

---

## 7. Regras de Negócio

- **Permitido:** Ver sugestões baseadas em dados reais; estado vazio quando não há operação.
- **Bloqueado:** Não bloquear a rota por billing; não mostrar “sugestões de demonstração”.
- **Regra de ouro:** Mentor é observador operacional; trial = dados reais; nenhuma sugestão fictícia.

---

## 8. Estado Atual

- **Estado:** UI PARCIAL — `MentorDashboardPage` existe; integração com aiGateway/taskMentor e RPCs podem estar parciais.
- **Próximo passo técnico:** (1) Garantir `/mentor` em `isWebConfigPath` se o fluxo usar prefixos; (2) Ligar sugestões a EventMonitor/tarefas e métricas do Core; (3) Estado vazio e mensagens humanas.
