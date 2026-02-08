# Checklist operacional completo — TPV + KDS + Cliente

**Critério de aceite:** “O mundo está a funcionar.”
Um único checklist para validar TPV, KDS e Cliente.
Derivado do [ORDER_STATUS_CONTRACT_v1](../contracts/ORDER_STATUS_CONTRACT_v1.md), [MENU_BUILDING_CONTRACT_v1](../contracts/MENU_BUILDING_CONTRACT_v1.md) e [CORE_FINANCE_CONTRACT_v1](../contracts/CORE_FINANCE_CONTRACT_v1.md).

---

## Pré-requisitos

- [ ] **Docker Core no ar** — `docker compose -f docker-core/docker-compose.core.yml up -d` (ou `./scripts/chef-world-up.sh` quando existir)
- [ ] **Merchant portal a correr** — ex.: `npm run dev` no merchant-portal
- [ ] **Restaurante seed** — `00000000-0000-0000-0000-000000000100` já criado pelo Core
- [ ] **Menu com produtos** — pelo menos uma categoria e 2–3 produtos activos (Menu Builder ou seed)
- [ ] **TPV e KDS na mesma origem** — localhost + Docker = mesmo `restaurant_id` / store seed

---

## TPV (passo a passo, pass/fail)

| #   | Acção                   | Pass                                                                                                                 | Fail                                                       |
| --- | ----------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | Abrir TPV               | Tela TPV carrega                                                                                                     | Erro ou tela em branco                                     |
| 2   | Lock / caixa / turno    | Aparece lock screen ou pedido de turno; dá para abrir caixa / iniciar turno                                          | Sem bloqueio ou mensagem confusa                           |
| 3   | Criar pedido            | Seleccionar mesa + adicionar primeiro item; pedido nasce (status OPEN)                                               | Pedido não aparece ou não usa produto do menu              |
| 4   | Enviar à cozinha        | Botão “Enviar à cozinha” / “Preparar”; estado muda (ex.: PREPARING)                                                  | Estado não muda ou pedido some                             |
| 5   | Fechar ciclo (TPV)      | Ver pedido pronto → Servir → Pagar → Fechar pedido (respeitando Core Finance)                                        | TPV fecha pedido fora do Core ou preço digitado à mão      |
| 6   | Ao pagar (Core Finance) | O TPV cria/atualiza o **Financial Order** (Core Finance) e **só então** marca o pedido como terminal (Served/CLOSED) | TPV marca pedido como fechado sem passar pelo Core Finance |

**Regra de ouro TPV:** TPV não inventa produto; não digita preço manualmente; não fecha pedido fora do Core Finance. **Served ≠ Paid:** pedido pode estar SERVED (operação) e ainda em aberto financeiramente; o Core Finance protege isso — ao pagar, criar/atualizar Financial Order primeiro, depois marcar como terminal.

---

## KDS (passo a passo, pass/fail)

| #   | Acção                         | Pass                                                                                     | Fail                                                     |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1   | Pedido aparece no KDS         | Após “Enviar à cozinha”, pedido aparece na lista do KDS                                  | Pedido activo não aparece                                |
| 2   | Transições de estado          | OPEN → PREPARING → IN_PREP → READY → SERVED; cada passo visível no KDS                   | Estado não actualiza ou pedido some antes de terminal    |
| 3   | Pedido sai só quando terminal | Pedido **só sai** da lista quando status = SERVED, CANCELLED, FAILED, ARCHIVED ou CLOSED | READY some antes de SERVED; ou terminal continua visível |

**Detalhe completo (fluxo mínimo + stress):** [CHECKLIST_KDS_FLUXO.md](./CHECKLIST_KDS_FLUXO.md).

### Casos de stress (KDS)

- [ ] **Status inválido/desconhecido** → pedido aparece no KDS com badge ⚠️ “Status desconhecido”; não some silenciosamente.
- [ ] **Status em lowercase** → normaliza e mostra correctamente.
- [ ] **Duplo clique** (ex.: “Iniciar preparo”) → idempotente; não quebra.
- [ ] **API/Core reinicia** → após refresh/polling, pedidos activos voltam.
- [ ] **world-chaos (restart PostgREST ou nginx)** — Executar `make world-chaos` (ou `./scripts/chef-world-chaos.sh postgrest`); com merchant portal e KDS abertos, após refresh ou novo polling os pedidos activos voltam; KDS/TPV não ficam vazios de forma permanente. Ver [CLI_CHEFIAPP_OS.md](./CLI_CHEFIAPP_OS.md).

---

## Ritual caos (CLI)

| #   | Acção       | Pass                                                                                                                                       | Fail                                                          |
| --- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| 1   | world-chaos | Executar `make world-chaos` (ou `./scripts/chef-world-chaos.sh postgrest`); observar KDS/TPV; após refresh/polling, pedidos activos voltam | KDS/TPV ficam vazios de forma permanente após restart do Core |

Critério de aceite: reconexão e pedidos visíveis novamente. Referência: [CLI_CHEFIAPP_OS.md](./CLI_CHEFIAPP_OS.md).

---

## Cliente

| #   | Critério                                       | Estado                                                                               |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | Cliente acompanha pedido (ex.: Web/QR)         | [ ] Pass — visibilidade do estado do pedido / [ ] Fail — não existe ou não actualiza |
| 2   | Visibilidade do estado (OPEN → READY → SERVED) | [ ] Pass / [ ] Fail / [ ] N/A (fluxo cliente ainda não implementado)                 |

**Se não houver fluxo cliente ainda:** considerar secção “A definir” — critérios futuros: link de acompanhamento, notificação quando READY, etc.

---

## Regras de ouro (cross-cutting)

1. **Pedido só sai do KDS** quando o status passa a **terminal** (SERVED, CANCELLED, FAILED, ARCHIVED ou CLOSED). READY continua visível até transição para terminal.
2. **TPV não fecha pedido** fora do Core Finance; preço e imposto vêm do Core, não digitados.
3. **Menu não inventa produto no TPV;** todo item do pedido tem `product_id` válido e activo no menu.

---

## Referências

- Contrato de estado de pedido: [ORDER_STATUS_CONTRACT_v1.md](../contracts/ORDER_STATUS_CONTRACT_v1.md)
- Detalhe KDS: [CHECKLIST_KDS_FLUXO.md](./CHECKLIST_KDS_FLUXO.md)
- Ritual de consciência (observar sem corrigir): [RITUAL_ABRIR_SISTEMA_TELAS.md](./RITUAL_ABRIR_SISTEMA_TELAS.md)
- Menu: [MENU_BUILDING_CONTRACT_v1.md](../contracts/MENU_BUILDING_CONTRACT_v1.md)
- Core Finance: [CORE_FINANCE_CONTRACT_v1.md](../contracts/CORE_FINANCE_CONTRACT_v1.md)
- Plano de teste antes de freeze (4 testes, quando parar, Test Day): [TEST_PLAN_BEFORE_FREEZE.md](./TEST_PLAN_BEFORE_FREEZE.md)
