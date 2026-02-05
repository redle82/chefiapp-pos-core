# Backlog 72h — Pós-Teste Humano Supremo (técnico para dev)

**Data:** 2026-02-02  
**Referência:** Relatório Teste Humano Supremo v1.1 — **FALHOU**. [PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md](./PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md) · [TESTE_HUMANO_SUPREMO_E2E_PROMPT.md](./TESTE_HUMANO_SUPREMO_E2E_PROMPT.md)

**Ordem inegociável:** P0 → P1 → P2. Sem P0, não rodar novo teste.

---

## Estado da execução (P0/P1/P2 implementados)

- **P0 Menu Builder:** Implementado — fallback ao guardar quando API devolve HTML/rede; criar/editar/apagar/menu de exemplo usam pilot; mensagem "Produto guardado localmente (servidor indisponível)" quando aplicável.
- **P1 Abrir Turno:** Implementado — feedback "Turno aberto" + "A carregar o TPV..." após sucesso; mensagens de erro humanas (sem jargão RPC).
- **P2 Dashboard mínimo:** Implementado — copy honesta quando não há dados ("Ainda sem vendas hoje. Abra um turno e use o TPV..."); useShiftHistory trata rede/não-JSON como vazio; ShiftHistorySection e OperationalMetricsCards com copy e "Tentar novamente" quando falha.

**Próximo passo:** Rodar [Teste Humano Supremo v1.1](./TESTE_HUMANO_SUPREMO_E2E_PROMPT.md) no antigravity; preencher [Resultado do teste v2](PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md#resultado-do-teste-v2-preencher-após-executar) no plano. PASSOU → DoR para venda; FALHOU → mais 48h de correção focada.

---

## Veredito do teste (resumo)

- **Status:** FALHOU
- **Causa central:** Menu Builder — API devolve HTML → Unexpected token `<` → parsing quebrado → sem produto salvo → sem venda
- **Efeito:** Tudo a jusante (Abrir Turno, TPV, KDS) ficou BLOQUEADO no relatório
- **Abrir Turno:** Ação existe mas estado não fica claro; humano não sabe se abriu ou o que fazer depois

O teste provou: porta única, trial, TPV↔KDS e modelo mental do dono estão certos. O produto está **inacabado**, não errado.

---

## O que NÃO fazer (72h)

- Não abrir Onda 5
- Não adicionar features
- Não mexer em pricing
- Não refazer onboarding
- Não “embelezar” UI

**Agora é cirurgia, não expansão.**

---

## P0 — Menu Builder (24–48h) — BLOQUEADOR ABSOLUTO

**Objetivo mínimo:** Criar produto → Salvar → Recarregar → Ver produto → Usar no TPV.

**Problema observado:** API devolve HTML (ex.: 404/erro) em vez de JSON → `response.json()` ou parse quebram → "Unexpected token '<'". Loop/retry pode agravar.

**Critério de sucesso (aceitação):**

1. Chamadas a `gm_products` / menu nunca fazem parse de resposta não-JSON (Content-Type ou try/catch; tratar HTML/404 como "backend indisponível" ou erro claro).
2. Estado vazio ou fallback local quando Core não responde (ex.: [MENU_FALLBACK_CONTRACT.md](../architecture/MENU_FALLBACK_CONTRACT.md), [CONTRATO_PRONTIDAO_DADOS.md](../contracts/CONTRATO_PRONTIDAO_DADOS.md)).
3. Criar 1 produto: nome, preço, estação, tempo → salva → persiste ao recarregar → visível no TPV.
4. Mensagem humana em erro (nunca stack ou "Unexpected token" cru).

**Arquivos / áreas prováveis:**

- `merchant-portal/src/core-boundary/readers/ProductReader.ts` — leitura; garantir que não há `response.json()` sem verificar Content-Type ou try/catch.
- `merchant-portal/src/core-boundary/writers/MenuWriter.ts` — escrita; já trata 409; garantir que erros de rede/HTML sobem como erro tratável, não parse exception.
- `merchant-portal/src/core/infra/dockerCoreFetchClient.ts` — contrato de erro (não parse de não-JSON).
- `merchant-portal/src/pages/MenuBuilder/MenuBuilderCore.tsx` — UI: estado vazio, fallback, mensagem em erro; nunca tela branco.

**Definition of Done P0:** Humano consegue criar 1 produto, recarregar a página, ver o produto na lista e usá-lo no TPV; nenhum "Unexpected token" nem tela em branco.

---

## P1 — Abrir Turno (24h)

**Objetivo:** Botão "Abrir Turno" com feedback visual inequívoco e estado persistente. O humano precisa saber com 100% de certeza que o turno abriu.

**Problema observado:** Ação existe mas estado não fica claro; humano não sabe se abriu, se falhou ou o que fazer depois.

**Critério de sucesso (aceitação):**

1. Um CTA óbvio (ex.: "Clique aqui para começar a vender AGORA") antes do TPV.
2. Após clicar: feedback visual imediato (ex.: "Turno aberto", estado de caixa aberta).
3. Se RPC falhar: mensagem clara ("Não foi possível abrir o turno. Tente novamente." ou equivalente), sem jargão técnico.
4. Nenhuma ambiguidade: ou turno está aberto e TPV liberado, ou mensagem de erro explícita.

**Arquivos / áreas prováveis:**

- `merchant-portal/src/core/flow/ShiftGate.tsx` — CTA, estado, mensagem de falha.
- Fluxo até `TPVMinimal.tsx` / TPV: garantir que "Abrir turno" é o único passo antes do TPV.

**Definition of Done P1:** Humano abre turno, vê confirmação clara e entra no TPV sem dúvida; em caso de falha, vê mensagem humana e sabe que deve tentar de novo.

---

## P2 — Dashboard mínimo (16h)

**Objetivo:** Não é analytics. É responder: "Tenho pedido?", "Está aberto?", "Algo está errado?"

**Problema observado:** Dashboard não responde ao que o dono quer saber depois da ação; métricas/vazios sem explicação.

**Critério de sucesso (aceitação):**

1. Se não há dados (pedidos, turnos): copy honesta (ex.: "Ainda sem vendas hoje", "Abra um turno para começar") — nunca tela vazia sem explicação.
2. Não chamar RPC de métricas/histórico quando não há pedidos/turnos (ou tratar falha/vazio com copy de dono).
3. Resposta mínima visível: estado de turno (aberto/fechado) e indicação de "tem pedido" ou "sem pedidos" quando fizer sentido.

**Arquivos / áreas prováveis:**

- Dashboard: componentes de métricas operacionais, histórico de turnos.
- Hooks/readers que chamam `get_operational_metrics`, `get_shift_history` ou equivalentes: gates (não chamar cedo demais) e estados vazios com copy.
- [CONTRATO_PRONTIDAO_DADOS.md](../contracts/CONTRATO_PRONTIDAO_DADOS.md) — não chamar Core antes da hora; se não há dados, explicar + CTA.

**Definition of Done P2:** Dono vê no dashboard resposta mínima (turno aberto?, pedidos?) ou copy clara quando ainda não há dados; nenhum vazio sem explicação.

---

## Ordem de execução e gate

| Ordem | Item   | Prazo   | Gate para próximo |
|-------|--------|--------|--------------------|
| 1     | P0 Menu Builder | 24–48h | Sem P0 concluído, não rodar novo Teste Humano. |
| 2     | P1 Abrir Turno  | 24h    | Rodar teste só após P0+P1. |
| 3     | P2 Dashboard mínimo | 16h | Opcional para primeiro re-teste; obrigatório para DoR. |

---

## Próximo passo (quando P0/P1/P2 estiverem resolvidos)

1. Rodar **exatamente** o mesmo Teste Humano Supremo v1.1 ([prompt](./TESTE_HUMANO_SUPREMO_E2E_PROMPT.md)).
2. Não alterar o prompt.
3. Comparar relatórios.
4. Decidir:
   - **PASSOU** → Definition of Ready para venda
   - **FALHOU** → mais 48h de correção focada no que falhou

---

## Referências

- [PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md](./PLANO_CORRECAO_POS_TESTE_HUMANO_SUPREMO.md) — F1–F5, checklist v2, estado oficial.
- [CONTRATO_PRONTIDAO_DADOS.md](../contracts/CONTRATO_PRONTIDAO_DADOS.md) — Web ↔ Core, quando chamar, nunca tela em branco.
- [MENU_FALLBACK_CONTRACT.md](../architecture/MENU_FALLBACK_CONTRACT.md) — Menu quando Core não responde.
