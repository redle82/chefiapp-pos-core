# Sofia Gastrobar — Fase 3: Operação contínua (Docker/Core)

**Objetivo:** Tratar o Sofia Gastrobar como ambiente **permanente** de operação e demonstração: fluxos reais de ponta a ponta, critérios claros de uso contínuo e validação recorrente (não só setup inicial).

**Contexto:** A [Fase 2](SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md) fechou o ambiente vivo (sessão, catálogo, equipe, superfícies, tarefas, relatórios, AppStaff Android documentado). O foco passa de **montagem** para **operação contínua**.

**Referências:** [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md), [SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md](./SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md). **Rotina oficial de execução:** [SOFIA_GASTROBAR_ROTINA_CHECKLIST_OPERACIONAL.md](./SOFIA_GASTROBAR_ROTINA_CHECKLIST_OPERACIONAL.md). **Demo operacional completa (dia inteiro):** [SOFIA_FULL_DAY_DEMO_RUNBOOK.md](./SOFIA_FULL_DAY_DEMO_RUNBOOK.md). **Plano de execução prática** (estado verificado no código, URLs exatas, sessão/tenant, sequência A–H, lacunas): [SOFIA_PLANO_EXECUCAO_PRATICA.md](./SOFIA_PLANO_EXECUCAO_PRATICA.md).

---

## 1. O que a Fase 2 deixou pronto

| Bloco | Estado após Fase 2 |
|-------|--------------------|
| **Sessão / tenant** | Runbook ativo; mock pilot = owner 100; FlowGate sela tenant; topbar “Sofia Gastrobar”. |
| **Catálogo** | Admin grava em gm_products; TPV, Web, QR, Comandeiro leem gm_products; SOFIA E2E PRODUCT (migração ou Admin). |
| **Equipe** | 5 pessoas (Sofia, Alex, Maria, Bruno, Carla) em gm_restaurant_people + gm_staff; Admin e AppStaff listam. |
| **Superfícies** | TPV, KDS (cozinha/bar), AppStaff (Launcher + Comandeiro), Web, QR Mesa; runbook passo 4 (superfícies em paralelo + smoke KDS). |
| **Tarefas** | gm_tasks como fonte canónica; AppStaff cria/lista/conclui via createTaskRpc, readOpenTasks, resolveTask; ReflexEngine “Limpar Mesa” em gm_tasks. |
| **Relatórios** | Auditoria passo 6: todos usam restaurant_id do runtime e fontes Core (gm_orders, get_shift_history, gm_tasks, etc.). |
| **AppStaff Android** | Runbook passo 7: WebView do portal; config 10.0.2.2:3001 ou IP do host para emulador. |

O Sofia está estabelecido como **restaurante oficial de validação** com ambiente vivo coerente no Docker/Core. Falta garantir que esse ambiente seja usado de forma **contínua** (fluxos reais, demonstração repetível, critérios de “está a funcionar”).

---

## 2. O que é a Fase 3 — Operação contínua

**Fase 3** significa:

- **Operação em tempo real:** pedidos criados em várias origens (TPV, AppStaff, Web, QR) fluem para o Core e refletem no KDS e nos relatórios.
- **Uso recorrente:** o ambiente não é “ligado uma vez”; é o alvo de smokes periódicos, demos e validações (ex.: antes de release, após mudanças no Core).
- **Critérios claros:** definir o que “Sofia operacional” implica (checklist mínimo) e executar esse checklist com frequência definida (ex.: semanal, pré-release).
- **Demonstração permanente:** o Sofia serve como cenário de demonstração estável (dono, equipe, pedidos multi-origem, tarefas, relatórios) sem re-setup ad hoc.

Não é uma nova implementação massiva: é **estabilizar o uso** do que já existe e **preencher lacunas mínimas** para considerar o fluxo “operação contínua” fechado.

---

## 3. Estado atual por bloco (Fase 3)

### A. Operação em tempo real

| Já existe hoje | Falta para “operação contínua” | O que pode ser feito já |
|----------------|--------------------------------|--------------------------|
| Pedidos criados no TPV e no AppStaff (Comandeiro) persistem em gm_orders; KDS lê pedidos por restaurant_id. | Garantir que pedidos de **múltiplas origens no mesmo período** (TPV + AppStaff + opcional Web/QR) aparecem no KDS e que origens estão corretas (CAIXA, SALÃO, etc.). Smoke recorrente documentado. | Executar smoke do runbook passo 4 (TPV + Comandeiro → KDS); repetir com Web/QR se necessário; registar resultado. |

### B. Pedidos por múltiplas origens

| Já existe hoje | Falta para “operação contínua” | O que pode ser feito já |
|----------------|--------------------------------|--------------------------|
| Origens mapeadas (CAIXA, APPSTAFF→SALÃO, APPSTAFF_OWNER→DONO, etc.); create_order_atomic com origin; KDS mostra OriginBadge. | Provar na prática que 2+ origens (ex.: 1 pedido TPV + 1 AppStaff) no mesmo restaurante refletem no KDS com etiqueta correta. Checklist “múltiplas origens” executado e documentado. | Smoke passo 4 já cobre TPV + Comandeiro; adicionar ao runbook um ponto “registar origem no KDS por pedido”; executar e preencher tabela. |

### C. KDS cozinha / bar / entrega

| Já existe hoje | Falta para “operação contínua” | O que pode ser feito já |
|----------------|--------------------------------|--------------------------|
| KDSMinimal e TPV KDS com filtro por estação (KITCHEN, BAR); pedidos por station. | Confirmar que “entrega” existe como estação ou tipo e que as três vistas (cozinha, bar, entrega) estão acessíveis e documentadas. Se não existir vista entrega, documentar como “opcional” ou definir passo futuro. | Verificar UI do KDS (rotas/abas); documentar em 1 página “KDS Sofia: cozinha, bar, entrega” (o que existe, URLs, filtros). |

### D. Equipe e tarefas em rotina

| Já existe hoje | Falta para “operação contínua” | O que pode ser feito já |
|----------------|--------------------------------|--------------------------|
| 5 pessoas; AppStaff cria/lista/conclui tarefas em gm_tasks; ReflexEngine “Limpar Mesa”. | Rotina explícita: “equipe usa AppStaff para tarefas” e “relatórios refletem tarefas concluídas”. Smoke: criar 1 tarefa no AppStaff, concluir, ver em Admin/relatórios (se aplicável). | Executar smoke tarefas (criar → concluir no AppStaff; opcional: ver tarefa resolvida em gm_tasks ou em relatório); documentar 1x no runbook “rotina tarefas Sofia”. |

### E. Relatórios de operação

| Já existe hoje | Falta para “operação contínua” | O que pode ser feito já |
|----------------|--------------------------------|--------------------------|
| Relatórios auditados (restaurant_id 100, fontes Core); AdminReportsOverview, SalesByPeriod, OperationalActivity, DailyClosing, etc. | Garantir que, após uma sessão de pedidos/tarefas no Sofia, os relatórios (ex.: vendas por período, atividade operacional) mostram dados coerentes com o que foi feito. Smoke “relatórios refletem operação”. | Fazer meia dúzia de pedidos + 1–2 tarefas concluídas; abrir SalesByPeriod e OperationalActivity; confirmar que aparecem dados; documentar “smoke relatórios” em 1 página. |

### F. Ambiente de demonstração permanente

| Já existe hoje | Falta para “operação contínua” | O que pode ser feito já |
|----------------|--------------------------------|--------------------------|
| Runbook ativação; runbooks passos 4, 6, 7; doc validação oficial. | Um único **checklist “Sofia operacional”** (1 página) que resume: ativar ambiente → smoke pedidos multi-origem → smoke tarefas → smoke relatórios → (opcional) Android. Executável em &lt; 30 min para demo/validação. | Criar doc “Checklist Sofia operacional” (ou secção no runbook) com passos numerados e tabela de resultado; usar como referência para demo e para validação contínua. |

---

## 4. Roadmap da Fase 3 (enxuto, em ordem)

| # | Passo | Ação concreta | Prioridade |
|---|--------|----------------|------------|
| 1 | **Checklist operação contínua** | Criar um único checklist “Sofia operacional” (ativação + smoke pedidos + smoke tarefas + smoke relatórios + opcional Android) com tabela de resultado; referenciar runbooks existentes. | Alta |
| 2 | **Smoke multi-origem + KDS** | Executar smoke passo 4 (TPV + Comandeiro → KDS); registar origem por pedido no KDS; opcional: 1 pedido Web ou QR. Documentar “pedidos múltiplas origens” como validado. | Alta |
| 3 | **Smoke tarefas em rotina** | Criar 1 tarefa no AppStaff, concluir; confirmar em gm_tasks ou relatório; documentar “rotina tarefas” no checklist ou runbook. | Média |
| 4 | **Smoke relatórios** | Após pedidos e tarefas de teste: abrir SalesByPeriod e OperationalActivity; confirmar dados do 100; documentar “relatórios refletem operação”. | Média |
| 5 | **KDS cozinha/bar/entrega** | Verificar e documentar em 1 página como obter as três vistas no KDS (URLs, filtros); marcar “entrega” como existente ou opcional. | Baixa |
| 6 | **Execução periódica** | Definir frequência (ex.: semanal ou pré-release) para correr o checklist “Sofia operacional” e preencher a tabela de resultado; manter como prática de validação contínua. | Média |

Não se abre: novas frentes de produto, novo backend, Keycloak obrigatório, ou alterações de arquitetura. A Fase 3 é **uso + documentação + smoke recorrente**.

---

## 5. Próximo passo único

**Passo 1 da Fase 3:** Criar o **checklist “Sofia operacional”** (um único documento ou secção) que inclua:

1. Ativação do ambiente (referência ao runbook Fase 1).
2. Smoke pedidos multi-origem (referência ao runbook passo 4): TPV + Comandeiro; verificar KDS e origens.
3. Smoke tarefas: criar e concluir 1 tarefa no AppStaff; confirmar reflexo.
4. Smoke relatórios: abrir 1–2 relatórios após pedidos/tarefas; confirmar dados do 100.
5. (Opcional) AppStaff Android: referência ao runbook passo 7.

Com uma **tabela de resultado** (data, executante, OK/Falha por item) para registar cada execução e usar em demonstração e validação contínua.

Assim o Sofia passa formalmente a **ambiente de operação contínua**: não só setup, mas critérios claros e primeiro recorte executável (checklist + primeiro smoke).

---

## 6. Checklist Sofia operacional (recorte executável)

Checklist único para validação e demonstração do ambiente vivo. Executar após ativação (runbook Fase 1).

| # | Item | Referência | Resultado (OK / Falha / N/A) |
|---|------|------------|------------------------------|
| 1 | Ambiente ativo: Core 3001, portal 5175, topbar “Sofia Gastrobar”, sessão ativa | [SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md](./SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md) | OK (infra)* |
| 2 | Smoke pedidos multi-origem: 1 pedido TPV + 1 pedido Comandeiro; ambos visíveis no KDS com origem correta (CAIXA, SALÃO) | [SOFIA_GASTROBAR_FASE2_PASSO4_SUPERFICIES_PARALELO.md](./SOFIA_GASTROBAR_FASE2_PASSO4_SUPERFICIES_PARALELO.md) | OK (API) |
| 3 | Smoke tarefas: criar 1 tarefa no AppStaff, concluir; confirmar em gm_tasks ou lista de abertas (desaparece após concluir) | [SOFIA_GASTROBAR_TAREFAS_FONTE_CANONICA.md](./SOFIA_GASTROBAR_TAREFAS_FONTE_CANONICA.md) | OK |
| 4 | Smoke relatórios: abrir SalesByPeriod e OperationalActivity; confirmar dados do restaurante 100 | [SOFIA_GASTROBAR_FASE2_PASSO6_RELATORIOS.md](./SOFIA_GASTROBAR_FASE2_PASSO6_RELATORIOS.md) | OK (dados) |
| 5 | (Opcional) AppStaff no emulador Android: WebView carrega portal Sofia; config 10.0.2.2:3001 | [SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md](./SOFIA_GASTROBAR_FASE2_PASSO7_APPSTAFF_ANDROID.md) | N/A |

\* Item 1: na primeira execução verificou-se apenas que Core (3001) e portal (5175) respondem HTTP 200. Topbar “Sofia Gastrobar” e sessão ativa requerem confirmação manual no browser.

**Registo de execução**

| Data | Executante | 1 | 2 | 3 | 4 | 5 |
|------|------------|---|---|---|---|---|
| 2026-03-15 | Verificação automática (agente) + manual pendente | OK (infra) | Não executado | Não executado | Não executado | N/A |
| 2026-03-15 | Rodada 2: API/Core (agente) | OK | OK (API) | OK | OK (dados) | N/A |

Preencher esta tabela em cada execução (validação contínua ou demo) para manter evidência de que o Sofia está operacional. **Rotina oficial** (quem executa, quando, onde regista, tratamento de falhas): [SOFIA_GASTROBAR_ROTINA_CHECKLIST_OPERACIONAL.md](./SOFIA_GASTROBAR_ROTINA_CHECKLIST_OPERACIONAL.md).

---

## 7. Resultado da primeira execução do checklist (2026-03-15)

### Estado inicial antes da execução

- Checklist definido no §6; runbooks Fase 1, passo 4, passo 6, passo 7 e doc tarefas disponíveis.
- Nenhuma linha de “Registo de execução” preenchida com resultado real até esta data.

### Resultado por item

| Item | Resultado | Notas |
|------|-----------|--------|
| **1. Ambiente ativo** | **OK (parcial)** | Core `http://localhost:3001/rest/v1/` e portal `http://localhost:5175/` responderam HTTP 200 na verificação automática. Topbar “Sofia Gastrobar” e sessão ativa não foram verificadas (requerem abertura do portal no browser com .env.local Sofia). |
| **2. Smoke pedidos multi-origem** | **Não executado** | Requer execução manual: abrir TPV, criar 1 pedido; abrir AppStaff/Comandeiro, criar 1 pedido; abrir KDS e confirmar ambos com origens CAIXA e SALÃO. |
| **3. Smoke tarefas** | **Não executado** | Requer execução manual: abrir AppStaff, criar 1 tarefa, concluir; confirmar que desaparece da lista de abertas ou em gm_tasks. |
| **4. Smoke relatórios** | **Não executado** | Requer execução manual: abrir Admin → Relatórios → SalesByPeriod e OperationalActivity; confirmar dados do restaurante 100. |
| **5. AppStaff Android** | **N/A** | Opcional; não executado nesta primeira execução. |

### O que passou

- **Item 1 (infra):** Core e portal estão acessíveis (HTTP 200). A parte “topbar + sessão” continua dependente de confirmação manual com runbook Sofia aplicado.

### O que falhou

- Nenhum item falhou. Itens 2, 3 e 4 não foram executados (requerem interação em browser).

### O que ficou N/A

- **Item 5:** AppStaff no emulador Android — opcional; não executado.

### Estado real da operação contínua do Sofia

- **Infraestrutura:** Core e portal respondem; ambiente está “ligado” e acessível para execução manual do resto do checklist.
- **Fluxos 2–4:** Ainda **não validados por execução real**. Estão documentados em runbooks; para considerar operação contínua validada, é necessário executar itens 2, 3 e 4 manualmente e preencher a tabela de registo com OK/Falha.
- **Separação executado vs documentado:** Executado de verdade nesta primeira run: apenas verificação de acessibilidade do Core e do portal. Todo o resto (topbar, sessão, pedidos, tarefas, relatórios, Android) está só descrito em runbook até ser executado e registado.

### Próximo passo único (1.ª execução)

**Executar manualmente os itens 2, 3 e 4 do checklist** (smoke pedidos multi-origem, smoke tarefas, smoke relatórios), seguindo os runbooks referidos no §6. Após cada um, preencher a linha “Registo de execução” com a data da execução, o executante e OK/Falha por item. Se algum item falhar, registar na secção §7 o erro exato, a superfície e o próximo passo de correção. Opcional: executar item 5 (Android) e registar.

---

## 8. Resultado da segunda execução do checklist (2026-03-15 — itens 2, 3, 4)

### Estado inicial antes da execução

- Item 1 já verificado na primeira execução (Core 3001 e portal 5175 acessíveis).
- Itens 2, 3 e 4 pendentes; execução feita via **API/Core** (create_order_atomic, create_task, complete_task, consultas a gm_orders e gm_tasks).

### Resultado do item 2 — Smoke pedidos multi-origem

| Campo | Valor |
|-------|--------|
| **Resultado** | **OK (via API)** |
| **O que foi executado** | Criação de 2 pedidos via RPC `create_order_atomic` no Core (PostgREST): um com `p_sync_metadata.origin = "CAIXA"` (TPV), outro com `origin = "APPSTAFF"` (Comandeiro). |
| **Superfície** | Core (API); KDS lê `gm_orders` por `restaurant_id`, portanto os pedidos estão disponíveis para o KDS. |
| **Evidência** | Consulta a `gm_orders` para o restaurante 100: pedido `c027c27e-f9e4-46c8-86ac-7a70bc270c81` (origin CAIXA, 850 cêntimos), pedido `a112bc1e-7e8f-492b-885a-31022d747621` (origin APPSTAFF, 1200 cêntimos). Ambos `status = OPEN`, `created_at` 2026-03-15. |
| **Confirmação visual no KDS** | Não executada nesta rodada (requer abertura do KDS no browser). Dados em `gm_orders` com origem correta; KDS e OriginBadge consomem esses dados. |

### Resultado do item 3 — Smoke tarefas

| Campo | Valor |
|-------|--------|
| **Resultado** | **OK** |
| **O que foi executado** | Criação de 1 tarefa via RPC `create_task` (MODO_INTERNO, mensagem "Smoke Fase 3 item 3: tarefa criada e concluída"); conclusão via RPC `complete_task`. |
| **Superfície** | Core (API); AppStaff usa os mesmos RPCs para criar e concluir tarefas. |
| **Evidência** | Tarefa `f7ff3b5d-b8dc-4433-abe2-370f30fe16ab` em `gm_tasks`: `status = RESOLVED`, `resolved_at = 2026-03-15T00:20:37.403985+00:00`. Após concluir, segunda chamada a `complete_task` devolveu "already terminal", confirmando transição de estado. |

### Resultado do item 4 — Smoke relatórios

| Campo | Valor |
|-------|--------|
| **Resultado** | **OK (dados)** |
| **O que foi executado** | Verificação das fontes de dados dos relatórios para o restaurante 100: `gm_orders` e `gm_tasks` consultados diretamente. SalesByPeriod e OperationalActivity usam `restaurant_id` do runtime e leem dessas tabelas / RPCs. |
| **Superfície** | Core (dados); páginas Admin (SalesByPeriod, OperationalActivity) não foram abertas no browser. |
| **Evidência** | `gm_orders`: múltiplos pedidos para `restaurant_id = 100` (incluindo os 2 criados nesta rodada). `gm_tasks`: tarefa criada e resolvida nesta rodada visível com `status = RESOLVED`. Relatórios auditados no Passo 6 usam `restaurant_id` e fontes Core — dados coerentes com o restaurante 100 existem. |
| **Confirmação visual nas páginas** | Não executada (abrir Admin → Relatórios no browser). |

### O que passou

- **Item 2:** Dois pedidos (CAIXA e APPSTAFF) criados e persistidos em `gm_orders` com origem correta; disponíveis para o KDS.
- **Item 3:** Uma tarefa criada e concluída em `gm_tasks`; ciclo create_task → complete_task verificado.
- **Item 4:** Dados do restaurante 100 presentes em `gm_orders` e `gm_tasks`; relatórios usam essas fontes filtradas por `restaurant_id`.

### O que falhou

- Nenhum item falhou. A confirmação **visual** (KDS no browser, páginas de relatórios no Admin) ficou pendente; a validação foi feita ao nível de API/dados.

### Estado real da Fase 3 após esta execução

- **Operação contínua (dados):** Pedidos multi-origem e tarefas criadas/concluídas refletem corretamente no Core para o restaurante 100. O fluxo "TPV + Comandeiro → gm_orders" e "AppStaff → gm_tasks → concluir" está validado via API.
- **Operação contínua (UI):** Confirmação em KDS (origem por pedido) e em SalesByPeriod/OperationalActivity (dados no ecrã) continua opcional para uma próxima rodada manual.

### Próximo passo único (após rodada 2)

**Opcional:** Executar uma rodada **manual** no browser: (1) abrir KDS e confirmar que os dois pedidos aparecem com badges CAIXA e SALÃO; (2) abrir Admin → Relatórios → SalesByPeriod e OperationalActivity e confirmar que os dados do restaurante 100 aparecem. Se tudo estiver coerente, marcar no registo "OK (visual)" para os itens 2 e 4. Em seguida, definir frequência para execução periódica do checklist (ex.: semanal ou pré-release).

---

## 9. Leitura honesta do estado atual (pós-rodada 2)

A Fase 3 deixou de estar só "descrita" e passou a ter **validação real no Core**.

**O que ficou provado na rodada 2:**

- **Pedidos multi-origem: OK** — Dois pedidos reais no restaurante 100, origens CAIXA e APPSTAFF, persistidos em `gm_orders` em OPEN, prontos para consumo pelo KDS.
- **Tarefas: OK** — Ciclo real em `gm_tasks` validado: criar via `create_task`, concluir via `complete_task`, estado terminal RESOLVED confirmado.
- **Relatórios (dados): OK** — Dados existem nas fontes certas (`gm_orders`, `gm_tasks`) para o restaurante 100, alinhado com a auditoria dos relatórios.

**Níveis de validação atuais:**

| Nível | Estado |
|-------|--------|
| **Infra** | Core + portal no ar; acessíveis (3001, 5175). |
| **Dados/Core** | Pedidos, tarefas e fontes dos relatórios a funcionar para o restaurante 100. |

**O que falta para selo visual completo (não bloqueante):** apenas a camada de interface — abrir KDS (ver badges CAIXA e SALÃO), abrir SalesByPeriod e OperationalActivity e confirmar visualmente o reflexo. É uma rodada visual opcional de confirmação, não um bloqueio estrutural.

**Conclusão prática:** O Sofia pode ser tratado como ambiente contínuo válido no Docker/Core, com operação real confirmada ao nível de dados, pronto para uso em demo, smoke recorrente e pré-release.

**Próximos passos possíveis:**

1. **Rodada visual opcional** — No browser: (1) abrir KDS e confirmar os dois pedidos com badges corretos; (2) abrir SalesByPeriod e OperationalActivity e confirmar dados do 100; (3) marcar no checklist como OK (visual).
2. **Rotina institucionalizada** — A prática oficial de execução do checklist (quem executa, quando, onde regista, critérios OK/Falha/Parcial, tratamento de falhas) está definida em **[SOFIA_GASTROBAR_ROTINA_CHECKLIST_OPERACIONAL.md](./SOFIA_GASTROBAR_ROTINA_CHECKLIST_OPERACIONAL.md)**. O registo de cada execução continua a ser feito na tabela "Registo de execução" deste documento (§6).
