# Rotina do checklist Sofia operacional

**Objetivo:** Definir a prática oficial de execução do checklist “Sofia operacional” como validação contínua, demo e pré-release do ambiente Docker/Core (restaurante 100 — Sofia Gastrobar).

**Checklist em si:** [SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md](./SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md) §6 (tabela de itens e “Registo de execução”).

**Referências:** [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md), [SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md](./SOFIA_GASTROBAR_AMBIENTE_OPERACIONAL_RUNBOOK.md).

---

## 1. Estado atual do checklist Sofia

O checklist “Sofia operacional” está definido no doc da Fase 3 (§6) e contém cinco itens:

| # | Item | Critério de passagem |
|---|------|----------------------|
| 1 | Ambiente ativo (Core 3001, portal 5175, topbar “Sofia Gastrobar”, sessão ativa) | Core e portal respondem; opcional: topbar e sessão confirmadas no browser. |
| 2 | Smoke pedidos multi-origem (1 TPV + 1 Comandeiro; ambos no KDS com origem correta) | Pedidos criados e em `gm_orders` com origem CAIXA e APPSTAFF; opcional: confirmação visual no KDS. |
| 3 | Smoke tarefas (criar 1 tarefa no AppStaff, concluir; confirmar em gm_tasks) | Tarefa criada e concluída em `gm_tasks` (status RESOLVED); opcional: confirmação na UI do AppStaff. |
| 4 | Smoke relatórios (SalesByPeriod, OperationalActivity; dados do 100) | Dados do restaurante 100 presentes nas fontes (`gm_orders`, `gm_tasks`); opcional: confirmação visual nas páginas. |
| 5 | (Opcional) AppStaff no emulador Android | WebView carrega portal Sofia; config Core (ex.: 10.0.2.2:3001). |

O **registo de execução** (data, executante, resultado por item) é preenchido na **mesma tabela** do doc da Fase 3 (§6), que é o único local canónico de registo.

---

## 2. Proposta de rotina oficial

A rotina é: **executar o checklist** nas ocasiões definidas abaixo, **registar o resultado** na tabela “Registo de execução” do doc da Fase 3 (§6) e, em caso de falha, **documentar e tratar** conforme §5.

- **Não substitui** os gates de CI/deploy (audit:release:portal, audit:fase3-conformance, etc.); **complementa** a validação do ambiente Sofia (Docker/Core) para demo, smoke recorrente e pré-release.
- **Sustentável:** execução tipicamente &lt; 30 min quando o ambiente está saudável; pode ser parcial (ex.: só itens 1–4, sem Android).

---

## 3. Frequência e gatilhos

| Gatilho | Frequência / quando | Obrigatoriedade |
|---------|----------------------|------------------|
| **Semanal** | Uma vez por semana (ex.: dia fixo ou “última sexta do sprint”) | Recomendado para equipas que usam o Sofia como ambiente de validação contínua. |
| **Pré-release** | Antes de cada release (tag, deploy para produção) que envolva Core, portal ou AppStaff | Recomendado; confirma que o ambiente de demonstração continua operacional. |
| **Após mudanças relevantes** | Após alterações em schema Core, RPCs (create_order_atomic, create_task, complete_task), fluxos TPV/KDS/AppStaff, ou relatórios que usam restaurant_id | Recomendado; evita que mudanças quebrem o Sofia sem deteção. |
| **Demo** | Antes de uma demonstração agendada com o Sofia | Obrigatório para garantir que a demo usa ambiente validado. |

**Mínimo sustentável:** Executar **pelo menos** em **pré-release** e **antes de demo**. Semanal é opcional mas recomendado se o Sofia for usado como ambiente de desenvolvimento/validação diário.

---

## 4. Responsáveis e registo

| Papel | Quem | Ação |
|-------|------|------|
| **Executante** | Qualquer pessoa da equipa que tenha o ambiente Docker/Core e portal a correr (local ou partilhado). Pode ser dev, QA ou ops. | Corre o checklist seguindo os runbooks referidos no doc da Fase 3 (§6); preenche uma nova linha na tabela “Registo de execução” com data, nome (ou “agente”/“script” se for automatizado) e resultado por item (OK / Falha / Parcial / N/A). |
| **Validação do resultado** | O próprio executante; em contexto de release ou demo, o responsável pelo release ou pela demo pode validar que a linha foi preenchida e que os itens obrigatórios (1–4) estão OK ou documentados. | Não é necessário um “aprovador” separado; o registo na tabela é a evidência. Em caso de falha, segue-se §5. |

**Onde regista:** **Sempre** no doc [SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md](./SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md), secção §6, tabela **“Registo de execução”**. Cada execução = uma nova linha (data, executante, colunas 1–5). Opcional: adicionar uma secção “Resultado da execução de &lt;data&gt;” (como §7 e §8) se houver falhas ou notas importantes a documentar.

**Interpretação do resultado:** Ver §5 (critérios OK / Falha / Parcial e o que fazer).

---

## 5. Critérios de passagem e tratamento de falhas

### 5.1 O que constitui OK / Falha / Parcial / N/A

| Resultado | Significado | Exemplo |
|-----------|-------------|---------|
| **OK** | Item executado e critério de passagem cumprido. | Core e portal respondem; 2 pedidos em gm_orders com origens corretas; tarefa RESOLVED em gm_tasks. |
| **OK (infra)** / **OK (API)** / **OK (dados)** | Subconjunto do critério verificado (ex.: só infra, ou só API/dados, sem confirmação visual). | Core 3001 e portal 5175 acessíveis; pedidos criados via API e presentes em gm_orders. |
| **OK (visual)** | Confirmação no browser (KDS, relatórios) feita e coerente. | Pedidos visíveis no KDS com badges CAIXA e SALÃO; relatórios mostram dados do 100. |
| **Falha** | Item executado mas critério não cumprido (erro, dado em falta, comportamento incorreto). | Core não responde; pedido não aparece no KDS; tarefa não fica RESOLVED. |
| **Parcial** | Parte do item passou, parte falhou ou ficou por fazer. | Infra OK, mas smoke de pedidos falhou numa superfície. |
| **N/A** | Item não aplicável nesta execução (ex.: item 5 Android não corrido). | Android opcional; executante não correu. |

**Passagem global da execução:** Para considerar a rodada **aprovada** para demo/pré-release: **itens 1–4** devem estar **OK** (ou OK com qualificador: infra, API, dados, visual). O item 5 é opcional; N/A é aceitável. Se algum dos itens 1–4 estiver **Falha** ou **Parcial** sem correção, a rodada **não está aprovada** até se resolver ou documentar exceção.

### 5.2 O que fazer se houver falha

| Ação | Descrição |
|------|-----------|
| **Registar** | Na tabela “Registo de execução”, marcar o item como **Falha** (ou **Parcial**). Opcional: abrir uma secção “Resultado da execução de &lt;data&gt;” no doc da Fase 3 e descrever o erro exato, a superfície e a causa provável. |
| **Comunicar** | Se a execução era pré-release ou pré-demo, informar o responsável pelo release/demo; decidir se se adia a release/demo ou se se aceita exceção documentada. |
| **Corrigir** | Identificar o menor próximo passo (ex.: corrigir RPC, migração, config). Re-executar o checklist após correção e preencher nova linha no registo. |
| **Exceção** | Se for decidido prosseguir com release/demo apesar de falha (ex.: item opcional ou bloqueio conhecido), documentar a exceção na secção de resultado dessa execução e no “Próximo passo único” do doc da Fase 3. |

Não se considera a rotina “quebrada” por uma falha pontual; considera-se que a rotina está a cumprir o seu papel ao **expor** a falha e a exigir registo e decisão (corrigir vs exceção).

---

## 6. Resumo operacional

| Pergunta | Resposta |
|----------|----------|
| **Quem executa?** | Qualquer membro da equipa com ambiente Core + portal (dev, QA, ops). |
| **Quem valida?** | O executante; em release/demo, o responsável pode verificar que o registo está preenchido e itens 1–4 OK. |
| **Quando?** | Semanal (recomendado), pré-release, após mudanças relevantes no Core/portal/AppStaff, e antes de demo. |
| **Onde se regista?** | Doc da Fase 3, §6, tabela “Registo de execução” (obrigatório). Secção de resultado da execução (opcional, para falhas/notas). |
| **O que fazer em falha?** | Registar Falha/Parcial, comunicar se pré-release/demo, corrigir e re-executar ou documentar exceção. |

---

## 7. Referências cruzadas

- **Checklist e registo:** [SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md](./SOFIA_GASTROBAR_FASE3_OPERACAO_CONTINUA.md) §6.
- **Runbooks por item:** links na tabela do checklist (§6 do doc da Fase 3): runbook ambiente, passo 4 (superfícies/KDS), tarefas, relatórios, AppStaff Android.
- **Release gates:** [C44_RELEASE_GATES_AND_ROLLOUT.md](./C44_RELEASE_GATES_AND_ROLLOUT.md) — o checklist Sofia é prática **recomendada** de validação do ambiente Docker/Core (pré-release / demo), não substitui audit:release:portal nem audit:fase3-conformance.
- **Validação oficial do Sofia:** [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md).
- **Demo operacional completa (dia inteiro):** [SOFIA_FULL_DAY_DEMO_RUNBOOK.md](./SOFIA_FULL_DAY_DEMO_RUNBOOK.md) — para demonstração com todas as superfícies, pedidos multi-origem, tarefas, pagamento e relatórios.

---

*Rotina institucionalizada em 2026-03. Última atualização: 2026-03.*
