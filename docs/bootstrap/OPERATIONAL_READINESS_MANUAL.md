# Manual de Instruções Operacionais (ORE)

Este manual descreve **como executar** as decisões do ORE em cada superfície. O ORE define o quê; este manual descreve o como (passos, textos sugeridos, responsabilidades). O manual não cria estados novos nem regras de prontidão — obedece ao ORE.

**Nota de substituibilidade:** Este manual descreve a execução atual. A UI, os textos, os fluxos e os padrões de interação aqui descritos podem evoluir ou ser substituídos sem alterar o ORE, desde que respeitem integralmente as suas decisões e directivas.

---

## 1. Introdução

- **Autoridade:** ORE manda; manual explica. Nenhuma regra de decisão de prontidão é definida aqui.
- **Âmbito:** Mapeamento ORE → UI, fluxos operacionais passo a passo, responsabilidades humanas, exemplos de UX, troubleshooting.
- **Mudança:** Os textos e CTAs sugeridos podem mudar sem alterar o ORE.

---

## 1.1 Regra de governança

**Se o ORE decidiu READY e a UI bloqueou, a UI está errada.**

Não há exceções por "demo", "localhost" ou "depende"; apenas ORE e BlockingScreen são autoridade de bloqueio. Qualquer ecrã de bloqueio fora do BlockingScreen (ORE) é um defeito.

---

## 2. Mapeamento ORE → UI

Para cada BlockingReason: o que mostrar, o que bloquear, o que permitir, texto sugerido, CTA sugerido. Sem criar novos estados.

| BlockingReason        | O que mostrar           | O que bloquear / permitir            | Título sugerido            | CTA sugerido                   |
| --------------------- | ----------------------- | ------------------------------------ | -------------------------- | ------------------------------ |
| CORE_OFFLINE          | Ecrã de bloqueio        | Operação TPV/KDS                     | Core indisponível          | Ir para o Portal               |
| BOOTSTRAP_INCOMPLETE  | Ecrã de bloqueio        | TPV/KDS até setup completo           | Configuração incompleta    | Completar configuração         |
| NOT_PUBLISHED         | Ecrã de bloqueio        | TPV/KDS até publicar                 | Sistema não operacional    | Ir para o Portal de Gestão     |
| NO_OPEN_CASH_REGISTER | Ecrã bloqueio ou banner | TPV/KDS: bloquear; Dashboard: banner | Caixa fechada              | Ir para o Portal / Abrir turno |
| SHIFT_NOT_STARTED     | Idem NO_OPEN_CASH       | Idem                                 | Turno não iniciado         | Ir para o Portal               |
| MODULE_NOT_ENABLED    | Ecrã de bloqueio        | TPV ou KDS até módulo ativo          | Módulo não ativo           | Configuração > Módulos         |
| PERMISSION_DENIED     | Ecrã de bloqueio        | Área restrita                        | Sem permissão              | Ir para o Portal               |
| MODE_NOT_ALLOWED      | Ecrã de bloqueio        | Ação no modo atual                   | Modo não permitido         | Ir para o Portal               |
| RESTAURANT_NOT_FOUND  | Ecrã ou redirect        | WEB: menu inexistente                | Restaurante não encontrado | Voltar ao início               |

**Dashboard + NO_OPEN_CASH_REGISTER:** Mostrar banner "Caixa fechado. Abrir turno para operar." com botão "Abrir turno" (não ecrã de bloqueio total). Permitir ver o dashboard; orientar a abrir turno.

---

## 3. Fluxos operacionais passo a passo

### 3.1 Abrir turno

1. Utilizador com permissão acede ao Dashboard (ou Portal de Gestão).
2. Se o ORE devolver SHOW_INFO_ONLY com NO_OPEN_CASH_REGISTER, o dashboard mostra o banner "Caixa fechado. Abrir turno para operar."
3. Utilizador clica em "Abrir turno" (ou equivalente na app).
4. A app chama o fluxo de abertura de caixa/turno (CashRegisterEngine, Core, conforme contrato).
5. Após sucesso, ShiftContext passa a refletir turno aberto; o ORE passa a devolver READY para TPV/KDS (se as restantes condições se verificarem).
6. Utilizador pode então aceder ao TPV ou KDS.

**Quem resolve:** Gerente ou utilizador com permissão para abrir turno.

### 3.2 Caixa fechado (utilizador no TPV ou KDS)

1. ORE devolve !ready com NO_OPEN_CASH_REGISTER e uiDirective SHOW_BLOCKING_SCREEN.
2. A superfície (TPV ou KDS) mostra BlockingScreen com título "Caixa fechada", descrição "Abra um turno (caixa) para poder operar o TPV e a cozinha.", CTA "Ir para o Portal".
3. Utilizador clica no CTA e é levado ao Dashboard.
4. No Dashboard, segue o fluxo "Abrir turno" (secção 3.1).
5. Após abrir turno, utilizador pode voltar ao TPV ou KDS; o ORE passará a devolver READY (se as restantes condições se verificarem).

**Quem resolve:** Gerente. O utilizador no TPV/KDS não pode abrir turno a partir do ecrã de bloqueio; deve ir ao Portal.

### 3.3 Publicar restaurante

1. ORE devolve !ready com NOT_PUBLISHED e uiDirective SHOW_BLOCKING_SCREEN (TPV/KDS) ou equivalente noutras superfícies.
2. A superfície mostra BlockingScreen com título "Sistema não operacional", descrição indicando que é necessário publicar o restaurante, CTA "Ir para o Portal de Gestão".
3. Utilizador com permissão (Dono/Gestão) acede ao Portal de Gestão.
4. No portal, completa o fluxo de publicação (conforme RESTAURANT_BOOTSTRAP_CONTRACT e BOOTSTRAP_MAP): confirma dados mínimos, ativa publicação.
5. Após publicação, runtime.isPublished / publishStatus passam a refletir estado publicado; o ORE deixa de devolver NOT_PUBLISHED para esse restaurante.
6. Utilizador pode então aceder ao TPV ou KDS (desde que as restantes condições — turno, módulo, etc. — se verifiquem).

**Quem resolve:** Dono ou utilizador com permissão de gestão/publicação.

### 3.4 Resolver permissão negada

1. ORE devolve !ready com PERMISSION_DENIED e uiDirective SHOW_BLOCKING_SCREEN.
2. A superfície mostra BlockingScreen com título "Sem permissão", descrição indicando que a ação requer permissões que o utilizador não tem, CTA "Ir para o Portal".
3. O utilizador não pode executar a ação a partir dessa superfície; deve contactar quem tem permissão (Dono/Admin) ou aceder com outra conta.
4. Dono/Admin: no Portal (ou sistema de gestão de roles), atribui o papel ou permissão necessária ao utilizador (conforme contrato Auth/Roles).
5. Após alteração de permissões, o utilizador faz novo login ou a sessão é revalidada; o ORE passa a avaliar PERMISSION_DENIED com o novo contexto.
6. Se a permissão for concedida, o ORE deixa de devolver PERMISSION_DENIED para essa superfície/ação.

**Quem resolve:** Dono ou Admin (gestão de utilizadores e roles). O utilizador sem permissão não pode auto-conceder acesso.

---

## 4. Responsabilidades humanas

| Situação                  | Quem resolve  |
| ------------------------- | ------------- |
| Caixa fechado             | Gerente       |
| Turno não iniciado        | Gerente       |
| Permissão negada          | Dono / Admin  |
| Core offline              | Suporte / IT  |
| Módulo não ativo          | Dono / Config |
| Restaurante não publicado | Dono / Gestão |
| Configuração incompleta   | Dono / Setup  |

---

## 5. Exemplos de UX (não canónicos)

Estes textos e CTAs podem mudar sem alterar o ORE. Servem de referência para implementação e treino.

- **CORE_OFFLINE:** "O servidor do restaurante não está a responder. Verifique a ligação ou tente mais tarde." — CTA: "Ir para o Portal".
- **NO_OPEN_CASH_REGISTER (banner Dashboard):** "Caixa fechado. Abrir turno para operar." — CTA: "Abrir turno".
- **NOT_PUBLISHED:** "As ferramentas de operação (TPV, KDS) só ficam disponíveis após publicar o restaurante. Aceda ao portal de gestão para configurar." — CTA: "Ir para o Portal de Gestão".

**Micro-UX TPV / Abrir turno (sugestões):**

- Botão "Abrir turno" deve dar feedback imediato: estado "A abrir..." ou loading breve, depois "Turno aberto" ou mensagem de sucesso inequívoca.
- Em erro (RPC falhou): mensagem humana ("Não foi possível abrir o turno. Tente novamente."), sem jargão técnico.
- Dono/gerente deve saber com 100% de certeza se o turno abriu ou não; nenhuma ambiguidade.

**Aviso:** Alterações de copy ou layout não exigem alteração ao documento ORE.

---

## 6. Modos especiais

- **Demo / Teste:** Subordinado ao ORE. Se o ORE devolver READY em modo demo, a UI pode mostrar indicador "Modo demonstração" sem alterar a decisão de prontidão.
- **Operação degradada / Failover manual:** Quando aplicável, documentar em contratos específicos; a UI continua a seguir a uiDirective do ORE. O ORE não define procedimentos de failover; o manual pode descrever acções humanas (ex.: contactar suporte).

---

## 7. Checklists operacionais

Derivados do ORE; não são novas regras.

**Antes de operar TPV:**

- Core online (ou modo offline intencional conforme contrato).
- Restaurante publicado.
- Caixa aberto / turno iniciado.
- Módulo TPV ativo (se aplicável).

**Antes de operar KDS:**

- Idem; módulo KDS ativo (se aplicável).

**Antes de abrir restaurante ao público (WEB):**

- Restaurante publicado e visível.
- Slug/configuração de web pública conforme contrato.

---

## 8. Troubleshooting

- **"Fico sempre no ecrã de bloqueio"** — Verificar: Core acessível? Restaurante publicado? Turno/caixa aberto? Módulo ativo? Consultar fontes de verdade (ORE, secção 4) e responsabilidades (secção 4 deste manual).
- **"Dashboard mostra loading sem parar"** — Não deve ocorrer quando o único bloqueio é caixa fechado (ORE devolve SHOW_INFO_ONLY para DASHBOARD). Se ocorrer, verificar que a superfície consome o ORE e não aplica loading por outros critérios.
- **"TPV/KDS diz que não posso mas já publiquei"** — Verificar ordem de avaliação do ORE: pode ser caixa fechado ou módulo não ativo antes de "publicado". Resolver por ordem: abrir turno, ativar módulo, depois re-testar.

Sem "refresh e reza"; cada sintoma mapeia para um estado do ORE e uma acção humana ou de configuração.

---

## 9. Cenário: uso real (dono cansado, 5 min)

Simulação de uso sem contexto técnico — o que o dono vê e faz no primeiro dia.

1. **Entrada:** Dono abre o portal (dashboard). Se caixa fechada, vê banner "Caixa fechado. Abrir turno para operar." e botão "Abrir turno".
2. **Abrir turno:** Clica "Abrir turno". Deve ver feedback imediato ("A abrir..." ou similar) e depois confirmação clara ("Turno aberto" ou "Pronto para vender").
3. **Ir ao TPV:** Acede ao TPV. Se tudo OK (ORE READY), vê o TPV operacional; pode criar pedidos.
4. **Se algo falhar:** Mensagem humana, não stack nem "Unexpected token". CTA claro (ex.: "Ir para o Portal", "Tentar novamente").
5. **Sem surpresas:** Nenhum estado ambíguo. Ou pode operar, ou sabe exactamente o que falta (publicar, abrir turno, activar módulo).

Objectivo: em 5 minutos, um dono cansado percebe se está pronto a vender e o que fazer se não estiver.

---

## 10. Checklist mental do dono — primeiro dia de operação

Lista mínima para o dono no primeiro dia (sem jargão). Derivada do ORE; não são novas regras.

**Antes de abrir portas:**

- [ ] Restaurante publicado? (portal de gestão)
- [ ] Turno aberto? (botão "Abrir turno" no dashboard)
- [ ] TPV e KDS acessíveis? (sem ecrã de bloqueio)

**Se algo bloquear:**

- Caixa fechada → ir ao dashboard, clicar "Abrir turno"
- "Sistema não operacional" → publicar restaurante no portal
- "Módulo não ativo" → Configuração > Módulos

**Durante o serviço:**

- Turno aberto = TPV e cozinha operacionais; fechar turno no fim do dia (conforme contrato de caixa).

Este checklist pode ser dado ao dono em papel ou numa página "Primeiro dia" no portal; não substitui o Manual nem o ORE.

---

## Referências

- **ORE (cérebro):** [OPERATIONAL_READINESS_ENGINE.md](OPERATIONAL_READINESS_ENGINE.md)
- **Bootstrap:** [RESTAURANT_BOOTSTRAP_CONTRACT.md](RESTAURANT_BOOTSTRAP_CONTRACT.md)
- **Mapa bootstrap:** [BOOTSTRAP_MAP.md](BOOTSTRAP_MAP.md)
- **Auditoria código vs ORE:** [ORE_CODE_AUDIT.md](ORE_CODE_AUDIT.md) — para troubleshooting e PRs que mexam em gates.
