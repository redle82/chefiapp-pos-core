# Plano de Correção Pós-Teste Humano Supremo (72h)

**Data:** 2026-02-03
**Referências:** Relatório do Teste Humano Supremo (antigravity) · [RELATORIO_TESTE_HUMANO_SUPREMO_V1.1_AGENTE.md](./RELATORIO_TESTE_HUMANO_SUPREMO_V1.1_AGENTE.md) · [VERTICAL_SLICE_DEBUG_DIRECT_FLOW.md](./VERTICAL_SLICE_DEBUG_DIRECT_FLOW.md) · [TESTE_HUMANO_SUPREMO_E2E_PROMPT.md](./TESTE_HUMANO_SUPREMO_E2E_PROMPT.md)

Leitura fria, sem ego; correção em 72h.

---

## O que não se reabre

O que **PASSOU** no teste humano — manter como está:

- **Entrada → onboarding:** CTA claro, criação de conta e restaurante linear, sem bloqueio por billing.
- **Trial real:** Estado TRIAL ATIVO (14 dias) validado; Billing acessível, CTA para planos existe.
- **Billing:** Não bloqueia operação; fluxo coerente.
- **Conceito TPV↔KDS:** Pedido criado no TPV aparece no KDS; ciclo em preparação → pronto validado conceptualmente.

Não alterar estes fluxos. Foco apenas nas falhas listadas abaixo.

---

## Top 5 falhas (tabela)

| #      | Falha                                                   | Local                           | Erro observado                                                              | Impacto                 | Correção objetiva                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Dono | Prazo (horas) |
| ------ | ------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------------- |
| **F1** | Menu Builder quebra                                     | Configuração → Menu             | `Unexpected token '<'` (API devolve HTML em vez de JSON)                    | Bloqueia primeira venda | Garantir que nenhuma chamada à API para `gm_products` / `gm_menu_categories` faça parse de resposta não‑JSON. Respeitar `Content-Type` e tratar 404/HTML ou erro de `response.json()` como **"backend indisponível"**, nunca como crash. Usar o contrato de erro em [API_ERROR_CONTRACT.md](../implementation/API_ERROR_CONTRACT.md), o cliente certo (`dockerCoreFetchClient`) e o fallback já existente em `MenuBuilderCore.tsx` (isNetworkError + `getPilotProducts`). Persistência e reload sem perda. | TBD  | 24–48h        |
| **F2** | Abrir Turno / Caixa confuso                             | TPV (antes de vender)           | TPV exige "Abrir Turno" mas o botão não é óbvio ou não funciona             | Bloqueia TPV            | Criar **1 CTA óbvio** (“Clique aqui para começar a vender AGORA”), **1 estado claro** e **0 ambiguidade** entre estados de turno. Revisar `ShiftGate.tsx` e o fluxo até `TPVMinimal.tsx`. Tratar falha da RPC `open_cash_register_atomic` (ou equivalentes) com mensagem clara e ação de retry; garantir que “Abrir turno” é o único passo obrigatório antes do TPV.                                                                                                                                       | TBD  | 24h           |
| **F3** | Tarefas / Pessoas / outras rotas de config não carregam | Config → Tarefas, Pessoas, etc. | Plano automático ou dados nulos; telas vazias ou erro                       | Degrada confiança       | Aplicar o mesmo padrão de F1: **nunca** fazer parse de HTML como JSON; usar o contrato de erro para todas as chamadas de config (Tarefas, Pessoas, etc.). Quando o backend estiver indisponível ou devolver lixo, mostrar **copy humana** em vez de stack trace e um **estado vazio explícito** (“Ainda não há tarefas configuradas”, “Dados indisponíveis, tenta novamente”).                                                                                                                             | TBD  | 16–24h        |
| **F4** | Configuração "online" acede a dados nulos               | Presença Online (config)        | Bloqueio ou acesso a `null` / `undefined`                                   | Bloqueia ação           | Checar sempre o contexto/API na rota de presença online antes de aceder a dados. Evitar acesso direto a `null` (guards claros) e, quando não houver dados suficientes para configurar presença online, mostrar mensagem explícita (“Configura primeiro a localização/endereço”) com caminho de ação, em vez de crash.                                                                                                                                                                                      | TBD  | 8–16h         |
| **F5** | Dashboard métricas inconsistentes                       | Dashboard                       | Métricas de setup iniciais, falta dados operacionais; vazios sem explicação | Degrada confiança       | Se não há dados operacionais ainda, **dizer por quê**: copy de dono (“Ainda sem vendas hoje”, “Estamos a usar dados de exemplo para te mostrar o potencial”). Não usar “simulação” de forma confusa nem gráficos vazios sem contexto. Sempre que a métrica for derivada de demo/simulação, marcar explicitamente como tal.                                                                                                                                                                                 | TBD  | 16h           |

---

## Prioridade absoluta (ordem de ataque)

- **P1 (24–48h):** Menu Builder à prova de humano — F1.
- **P2 (24h):** Abrir Turno = botão óbvio — F2.
- **P3 (16h):** Dashboard honesto — F5.

F3 e F4 podem ser tratadas em paralelo ou logo após P1 (mesmo padrão API + copy/estado vazio).

---

## O que NÃO fazer agora

- Abrir Onda 5 completa ou expandir escopo além destas falhas.
- Adicionar novos módulos ou novas features.
- “Melhorar UX” fora das 5 falhas acima.

Só é permitido acabamento cirúrgico diretamente ligado a F1–F5.

---

## Critério de sucesso

Quando:

- O Menu Builder **passar este mesmo teste humano** sem `Unexpected token '<'`, com fallback de rede aplicado e reload sem perda de estado; e
- O fluxo **Abrir Turno → TPV** tiver 1 CTA óbvio, estados claros e nenhum bloqueio escondido;

…o produto está **apto para P1 sem vergonha**.

Recomenda‑se repetir o [Teste Humano Supremo](./TESTE_HUMANO_SUPREMO_E2E_PROMPT.md) (ou v2) após as correções, como validação final.

---

## Próximo corte

Após este plano:

1. Executar as correções por prioridade (P1 → P2 → P3; F3/F4 em paralelo quando fizer sentido).
2. Repetir o teste completo no antigravity com o [TESTE_HUMANO_SUPREMO_E2E_PROMPT.md](./TESTE_HUMANO_SUPREMO_E2E_PROMPT.md) e registar **F1–F5** como PASSA / NÃO PASSA.
3. Se passar: consolidar o **Definition of Ready para Venda** e autorizar P1 Piloto real.
   Se falhar: abrir **nova iteração de correção focada apenas nas falhas que ainda bloqueiam**.

---

## Referências técnicas (para implementação)

- **Menu Builder / Unexpected token '<' (F1):** [API_ERROR_CONTRACT.md](../implementation/API_ERROR_CONTRACT.md) já exige não fazer parse de não‑JSON; `dockerCoreFetchClient` aplica o contrato para chamadas via `fetch`. `ProductReader` pode fazer `response.json()` diretamente e falhar com HTML. Correção: usar sempre cliente que respeite `Content-Type` (ou tratar exceção de parse como “backend indisponível”) e o fallback já existente em `MenuBuilderCore.tsx` (`isNetworkError` + `getPilotProducts`), alargando o tratamento a “Unexpected token” / respostas não‑JSON.
- **Abrir Turno / Caixa (F2):** `ShiftGate.tsx` mostra `ShiftOpenForm` quando Docker + `restaurantId`; se `useShift()` ficar em loading ou a RPC `open_cash_register_atomic` falhar (ex.: 404), o utilizador não avança. Correção: garantir CTA único e visível (“Clique aqui para começar a vender AGORA”), tratar falha de RPC com mensagem clara e garantir que “Abrir turno” é o único passo antes do TPV.
