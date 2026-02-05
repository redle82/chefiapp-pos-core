# Access Rules Minimal — ChefIApp OS

Regras duras de quem pode fazer o quê. Uma página; sem floreio. Roles conforme [WORLD_SCHEMA_v1.md](WORLD_SCHEMA_v1.md) e [docs/boot/BOOTSTRAP_2_IDENTITY_TENANCY.md](../boot/BOOTSTRAP_2_IDENTITY_TENANCY.md): Owner, Manager, Staff (Waiter), Kitchen, Customer.

---

## Quem pode criar pedido

- **Owner, Manager, Waiter (Staff)** — Podem criar pedido (TPV, Web, API). O Core valida; o pedido nasce com product_id válido e preço do menu.
- **Kitchen** — Não cria pedido no TPV; pode operar KDS (mudar status de preparo). Pedido é criado por quem atende (Waiter/Manager/Owner).
- **Customer** — Cria pedido apenas em canais permitidos (ex.: Web/QR); não acede ao TPV nem ao backoffice.

**Se proibido:** UI não mostra acção ou bloqueia; se a chamada chegar ao Core com role/contexto inválido, o Core rejeita (RPC ou policy). Tentativa deve ser logada (auditoria futura).

---

## Quem pode mudar status de pedido

- **Owner, Manager, Waiter, Kitchen** — Podem mudar status de pedido no fluxo operacional (OPEN → PREPARING → IN_PREP → READY → SERVED) conforme [ORDER_STATUS_CONTRACT_v1.md](ORDER_STATUS_CONTRACT_v1.md). Kitchen tipicamente marca IN_PREP e READY no KDS; Waiter/Manager podem marcar SERVED e fechar.
- **Customer** — Não muda status de pedido; só consulta estado (acompanhamento).

**Se proibido:** Core rejeita transição inválida ou chamada sem permissão; UI não oferece botão ou mostra erro. Tentativa proibida deve ser logada.

---

## Quem pode fechar financeiro (Core Finance)

- **Owner, Manager** — Podem fechar financeiro: criar/actualizar Financial Order, marcar pagamentos, fechar caixa. O TPV só marca o pedido como terminal (Served/CLOSED) **depois** de o Core Finance ter registado o pagamento (conforme [CORE_FINANCE_CONTRACT_v1.md](CORE_FINANCE_CONTRACT_v1.md) e [CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](../strategy/CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md)).
- **Waiter (Staff)** — Pode registar pagamento no TPV se política do restaurante permitir; o Core Finance valida. Fechar caixa ou alterar financeiro histórico é Owner/Manager.
- **Kitchen, Customer** — Não fecham financeiro; não acedem a caixa ou a pagamentos.

**Se proibido:** Core rejeita escrita financeira não autorizada; UI bloqueia fecho de caixa ou alteração de invoice. Tentativa proibida deve ser logada.

---

## Quem pode ver faturação

- **Owner, Manager** — Podem ver faturação completa: invoices, totais, impostos, relatórios financeiros.
- **Waiter (Staff)** — Pode ver o que for necessário para o turno (ex.: total de vendas do turno); não vê faturação global nem dados de outros restaurantes sem permissão.
- **Kitchen, Customer** — Não vêem faturação; Kitchen vê apenas estado de pedidos (KDS); Customer vê apenas o seu pedido.

**Se proibido:** UI não expõe dados; API não devolve recursos financeiros para esse role/contexto. Tentativa de acesso deve ser logada.

---

## O que acontece se alguém tentar acção proibida

1. **UI** — Não mostra a acção ou mostra estado desactivado; mensagem clara ("Sem permissão" ou equivalente).
2. **Core** — Rejeita a chamada (RPC ou API): 403 Forbidden ou payload de erro; não altera estado.
3. **Log** — Tentativa de acção proibida deve ser registada (actor, acção, recurso, timestamp) para auditoria. Implementação concreta (tabela, serviço) é Fase 2; a regra é "não silenciar tentativas proibidas".

---

## Referências

- Roles e tenancy: [WORLD_SCHEMA_v1.md](WORLD_SCHEMA_v1.md) (users.role, user_store_roles.role), [docs/boot/BOOTSTRAP_2_IDENTITY_TENANCY.md](../boot/BOOTSTRAP_2_IDENTITY_TENANCY.md)
- Core Finance: [CORE_FINANCE_CONTRACT_v1.md](CORE_FINANCE_CONTRACT_v1.md)
- Checklist operacional (Financial Order): [docs/strategy/CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md](../strategy/CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md)
- Estado de pedido: [ORDER_STATUS_CONTRACT_v1.md](ORDER_STATUS_CONTRACT_v1.md)
