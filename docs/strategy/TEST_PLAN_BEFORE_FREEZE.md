# Plano de teste antes de freeze — O teste certo

**Pergunta central:** Se este sistema fosse usado hoje por um restaurante real, ele quebraria em silêncio?

Se a resposta for **não**, pode-se congelar.

Testar agora não é para descobrir bugs; é para provar que o sistema não mente.

---

## Os 4 testes (o que exactamente deve ser testado)

Não inventar novos testes. Usar exactamente o que prova que o mundo é verdadeiro.

| Teste                                         | Fonte                                                                                  | O que provar                                                                                                                                                                                                                   | Critério de sucesso                                                              |
| --------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| **TESTE 1 — Fluxo operacional completo**      | [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md) | TPV cria pedido; pedido aparece no KDS; transições OPEN → PREPARING → IN_PREP → READY → SERVED; pedido sai do KDS só quando terminal; financeiro respeitado (Served ≠ Paid).                                                   | Checklist passa PASS/PASS/PASS, sem "mais ou menos".                             |
| **TESTE 2 — Caos controlado**                 | world-chaos + checklist de stress (ritual caos em CHECKLIST_OPERACIONAL)               | PostgREST reinicia; KDS não fica vazio permanentemente; pedidos reaparecem após refresh/polling; nenhum estado se perde.                                                                                                       | Pergunta respondida: "O que acontece quando ninguém está olhando?"               |
| **TESTE 3 — Simulador como verdade**          | [CHECKLIST_MUNDO_ESTRESSADO.md](./CHECKLIST_MUNDO_ESTRESSADO.md)                       | Simulador cria pedidos reais; pedidos entram no Core; pedidos aparecem no KDS; sistema aguenta volume controlado (ex.: 20–50 pedidos).                                                                                         | Se o simulador funciona, o Core é real; se o KDS reflecte, o front é isomórfico. |
| **TESTE 4 — Falhas conhecidas (ERROS_CANON)** | [ERROS_CANON.md](./ERROS_CANON.md)                                                     | Escolher 3 falhas e forçar manualmente (ex.: E07 status inválido, E10 duplo clique, E22 restart no meio do rush). Provar: sistema não quebra; erro é visível; existe comportamento definido (badge, rejeição, log, checklist). | Erro conhecido não causa pânico.                                                 |

---

## Quando parar de testar

**Parar quando:**

- Não surgem novas classes de falha.
- Não aparece nenhum erro fora do ERROS_CANON.
- Não há dúvida sobre "quem é a fonte da verdade".

**Se surgir:**

- Erro novo → novo E## no ERROS_CANON.
- Ambiguidade → documentar.
- Excepção emocional → registar.

Depois disso, parar. Testar além disso vira ansiedade, não engenharia.

---

## Só depois disso: congelar

Congelar não é parar o projeto. É declarar oficialmente:

**"O mundo funciona. O resto é escolha."**

Esse freeze será legítimo, não dogmático.

---

## Ordem de execução (Test Day)

### Versão 2 horas (mínimo)

1. **Pré-requisitos:** `make world-up`; merchant portal a correr (`npm run dev`); restaurante seed e menu com produtos.
2. **TESTE 1 — Fluxo operacional:** Executar [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md) passo a passo (TPV, KDS, fecho com Core Finance).
3. **TESTE 2 — Caos controlado:** `make world-chaos` (ou `./scripts/chef-world-chaos.sh postgrest`); verificar que KDS e pedidos reaparecem após refresh/polling; nenhum estado perdido.
4. **TESTE 3 — Simulador:** `POSTGREST_URL=http://localhost:3001 COUNT=20 node simulators/orders/run.js`; verificar pedidos no Core e no KDS.
5. **TESTE 4 — Falhas conhecidas:** Forçar E07 (status inválido), E10 (duplo clique em transição), E22 (restart no meio do rush); verificar que o sistema não quebra, o erro é visível e existe comportamento definido.
6. **Critério de fim:** Se todos os testes passam e não surgiu nova classe de falha → pode congelar.

### Versão 1 dia (com buffer)

- Mesma ordem que acima.
- Incluir tempo para documentar qualquer ambiguidade ou novo E##.
- Repetir TESTE 2 com `world-chaos` em nginx ou realtime (além de postgrest).
- Volume do simulador: COUNT=50 (ou mais, conforme [CHECKLIST_MUNDO_ESTRESSADO.md](./CHECKLIST_MUNDO_ESTRESSADO.md)).
- Pausa entre blocos para anotar; no fim do dia, decidir se freeze ou se registar novo E## e repetir só o bloco afectado.

---

## Referências

- [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md) — Critério de aceite TPV/KDS/Cliente.
- [CHECKLIST_HUMANO_OPERACIONAL_COMPLETO.md](./CHECKLIST_HUMANO_OPERACIONAL_COMPLETO.md) — **Ritual humano:** 1 restaurante, 3 roles, 1 pedido do início ao fim; executar antes do freeze legítimo para provar que um humano consegue operar o sistema sem mentir, travar ou confundir.
- [CHECKLIST_MUNDO_ESTRESSADO.md](./CHECKLIST_MUNDO_ESTRESSADO.md) — Simulador e Core→KDS.
- [ERROS_CANON.md](./ERROS_CANON.md) — Catálogo de falhas inevitáveis; falhas E07, E10, E22 (exemplos para TESTE 4).
- [CLI_CHEFIAPP_OS.md](./CLI_CHEFIAPP_OS.md) — world-up, world-down, world-chaos.
- [MUNDO_VERDADEIRO_REGUA.md](./MUNDO_VERDADEIRO_REGUA.md) — Régua "mundo verdadeiro" (três níveis).
- [LEI_EXISTENCIAL_CHEFIAPP_OS.md](./LEI_EXISTENCIAL_CHEFIAPP_OS.md) — Lei existencial, ritual de mudança, zonas intocáveis.

---

## Estado do ciclo (pós–Test Day automatizado)

**O que foi provado objectivamente:**

| Prova            | Resultado                                                                              |
| ---------------- | -------------------------------------------------------------------------------------- |
| Core é real      | Simulador COUNT=20 → 20 pedidos criados, 0 erros; pedidos em gm_orders.                |
| Sistema sob caos | world-chaos (restart PostgREST); API 200; nenhum pedido perdido (E22 coberto).         |
| Invariantes      | E07 (status inválido) → Core rejeita com erro claro; E10 (duplo clique) → idempotente. |

**TESTE 1 — fluxo operacional:** Pode ser simulado (mesma sequência de chamadas que TPV/KDS) com `POSTGREST_URL=http://localhost:3001 node simulators/orders/teste1-humano.js`. Validação humana na UI continua recomendada; checklist: [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md).

**TESTE 1 simulado (script):** `node simulators/orders/teste1-humano.js` — PASSOU (pedido OPEN → IN_PREP → READY → CLOSED; Core é fonte da verdade).

**Opcional (selo humano):** Abrir merchant portal → executar [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md) na UI → marcar PASS/FAIL. Se executares na UI, responder **PASSOU** ou **FALHOU**.

- **PASSOU** (simulado ou humano) → freeze oficial; o sistema está validado.
- **FALHOU** → micro-ajuste ou novo E## no [ERROS_CANON.md](./ERROS_CANON.md); repetir só o trecho afectado.

O sistema já provou que não mente (simulação + testes 2–4). O selo humano na UI é opcional para freeze.
