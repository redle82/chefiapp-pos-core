# Checklist Humano Operacional Completo — Ritual Humano: 1 Pedido, 3 Roles

**Pergunta central:** Se este sistema estivesse aberto hoje num restaurante real, ele quebraria em silêncio?

**Regra:** Sem automação. Sem abstração. Sem "imagina que". Um humano executa cada passo e marca Pass ou Fail. Este é o ritual unificado que prova que um humano consegue operar o sistema inteiro sem o sistema mentir, travar ou confundir.

**Escopo fixo:** 1 restaurante | 3 roles (Garçom, Cozinha, Gerente) | 1 pedido do início ao fim | PASS/FAIL explícito por passo.

---

## Pré-requisitos

Verificar antes de começar o ritual. Um único humano pode trocar de conta/role entre passos; ou três pessoas, uma por role.

- [ ] **Docker Core no ar** — `make world-up` (ou `docker compose -f docker-core/docker-compose.core.yml up -d`)
- [ ] **Merchant portal a correr** — ex.: `npm run dev` no merchant-portal
- [ ] **1 restaurante seed** — mesmo `restaurant_id` em TPV, KDS, AppStaff (ex.: `00000000-0000-0000-0000-000000000100`)
- [ ] **Menu com produtos** — pelo menos uma categoria e 2–3 produtos activos (Menu Builder ou seed)
- [ ] **3 contas/roles disponíveis** — Garçom (Waiter/Staff), Cozinha (Kitchen), Gerente (Manager); cada uma acessível no portal

**Pass:** Tudo ligado e acessível. **Fail:** Algo não sobe ou não se acede.

---

## Passos — 1 pedido do início ao fim

Cada passo: executar a acção com o role indicado; verificar critério Pass; marcar [ ] Pass ou [ ] Fail.

### Fase TPV

| #   | Acção                                                                                                             | Quem (role)       | Pass                                                                           | Fail                                                               | [ ] Pass / [ ] Fail |
| --- | ----------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------- |
| 1   | Abrir TPV; abrir caixa/turno se exigido; seleccionar mesa; adicionar 1 ou mais itens do menu; "Enviar à cozinha". | Gerente ou Garçom | Pedido nasce (OPEN) e muda para PREPARING; produto vem do menu; preço do Core. | Pedido não aparece, ou preço digitado à mão, ou produto inventado. |                     |

### Fase KDS

| #   | Acção                                                                    | Quem (role) | Pass                                       | Fail                                        | [ ] Pass / [ ] Fail |
| --- | ------------------------------------------------------------------------ | ----------- | ------------------------------------------ | ------------------------------------------- | ------------------- |
| 2   | Abrir KDS; ver o mesmo pedido; ver transição OPEN → PREPARING / IN_PREP. | Cozinha     | Pedido visível no KDS com estado coerente. | Pedido não aparece ou estado não actualiza. |                     |
| 3   | Avançar pedido para READY (botão "Pronto" ou equivalente).               | Cozinha     | Estado READY no KDS.                       | Estado não muda ou pedido some.             |                     |

### Fase AppStaff

| #   | Acção                                                 | Quem (role) | Pass                                                                                                                 | Fail                                          | [ ] Pass / [ ] Fail |
| --- | ----------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------- |
| 4   | Abrir AppStaff como Garçom; ir à tela Agora / Worker. | Garçom      | Vê pedidos READY (e eventualmente tarefas atribuídas); não vê acções de Gerente (criar tarefa global, fechar caixa). | Vê o que não devia ou não vê pedidos READY.   |                     |
| 5   | Na Agora, pedido READY → "Marcar entregue" (SERVED).  | Garçom      | Pedido sai da lista READY e fica SERVED; KDS deixa de mostrar como activo (ou mostra como SERVED).                   | Pedido não transiciona ou duplica/desaparece. |                     |

### Fase Finance

| #   | Acção                                                        | Quem (role) | Pass                                                                                                     | Fail                                                    | [ ] Pass / [ ] Fail |
| --- | ------------------------------------------------------------ | ----------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------- |
| 6   | No TPV, pedido SERVED → Pagar (Core Finance); fechar pedido. | Gerente     | Financial Order criado/actualizado no Core; pedido marcado terminal (CLOSED); nada fechado fora do Core. | TPV fecha sem passar pelo Core Finance ou total errado. |                     |

### Integridade final

| #   | Acção                                                                                                                                         | Quem (role) | Pass                                                               | Fail                                          | [ ] Pass / [ ] Fail |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------ | --------------------------------------------- | ------------------- |
| 7   | Verificar: mesmo pedido tem um único percurso visível (TPV → KDS → Agora → SERVED → Finance → CLOSED); sem duplicados; sem pedido "fantasma". | Qualquer    | Um pedido, um fluxo, um estado final. Nada some, duplica ou mente. | Duplicado, desaparecimento ou inconsistência. |                     |

---

## Passos opcionais (se implementado e tempo permitir)

| #   | Acção                                                                                                             | Quem (role) | Pass                                                     | Fail                                              | [ ] Pass / [ ] Fail |
| --- | ----------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------- | ------------------------------------------------- | ------------------- |
| O1  | Gerente vê alerta "Repor X" (Inventory Lite); cria tarefa "Repor X"; tarefa aparece na Agora.                     | Gerente     | Tarefa criada e visível; role errado não consegue criar. | Tarefa não aparece ou role errado consegue criar. |                     |
| O2  | Se o fluxo gerar tarefas a partir do pedido (ex.: tarefa de preparação): Cozinha vê e executa (iniciar/concluir). | Cozinha     | Tarefa visível e transicionável.                         | Tarefa não aparece ou não transiciona.            |                     |

---

## Critério de sucesso do ritual

**Todos os passos obrigatórios (1–7) marcados Pass** → O sistema foi provado por um humano de ponta a ponta. Freeze legítimo pode ser declarado; release, pitch e evolução cognitiva passam a ter base de prova humana.

Se algum passo for Fail: corrigir ou documentar (ex.: novo E## no [ERROS_CANON.md](./ERROS_CANON.md)); repetir só o trecho afectado até Pass.

---

## Frase final

Sistemas vivos não falham por falta de código. Eles falham quando ninguém prova que um humano consegue viver dentro deles.

---

## Referências

- [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](./CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md) — TPV, KDS, Cliente (passo a passo técnico).
- [CHECKLIST_APPSTAFF.md](./CHECKLIST_APPSTAFF.md) — AppStaff: Agora, tarefas, Inventory Lite, RBAC.
- [TEST_PLAN_BEFORE_FREEZE.md](./TEST_PLAN_BEFORE_FREEZE.md) — Os 4 testes e ordem de execução (Test Day).
- [CHEFIAPP_OS_MAPA_MENTAL_E_FLUXO.md](./CHEFIAPP_OS_MAPA_MENTAL_E_FLUXO.md) — Bússola: Runtime vs Cloud, onde testar, quando congelar.

Este documento não substitui os acima; é o **ritual unificado** que prova o humano de ponta a ponta (1 pedido, 3 roles).
