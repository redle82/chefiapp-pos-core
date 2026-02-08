# BILLING_SUSPENSION_CONTRACT — Estados, bloqueio e recuperação

**Status:** CANONICAL
**Tipo:** Contrato de produto — billing SaaS e efeito na operação
**Local:** docs/architecture/BILLING_SUSPENSION_CONTRACT.md
**Hierarquia:** Subordinado a [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](./CORE_BILLING_AND_PAYMENTS_CONTRACT.md) e [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md)

---

## Princípio

**Billing nunca bloqueia configuração, só operação.** Sem billing ativo → operação (TPV, KDS) bloqueada. Com billing ativo → pode operar. Portal de gestão (/app/\*) permanece acessível em todos os estados.

---

## Estados de billing (billingStatus)

| Estado      | Significado                                         | Portal (/app) | Operação (/op/tpv, /op/kds)               |
| ----------- | --------------------------------------------------- | ------------- | ----------------------------------------- |
| `trial`     | Período de teste ativo                              | ✅ Acesso     | ✅ Pode operar (se publicado)             |
| `active`    | Assinatura paga, em dia                             | ✅ Acesso     | ✅ Pode operar                            |
| `past_due`  | Pagamento em atraso; grace period                   | ✅ Acesso     | ⛔ Bloqueado (ou grace conforme política) |
| `suspended` | Assinatura suspensa (falha pagamento, cancelamento) | ✅ Acesso     | ⛔ Bloqueado                              |

---

## Regras de bloqueio

| Regra                  | Aplicação                                                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bloquear operação      | Quando `billingStatus` não permite operar (past_due ou suspended conforme política). RequireOperational / gate de billing deve verificar.                            |
| Nunca bloquear portal  | /app/dashboard, /app/restaurant, /app/menu, /app/billing, /app/publish, etc. permanecem acessíveis. O cliente pode configurar e regularizar.                         |
| Mensagem ao utilizador | Em /op/tpv ou /op/kds: redirecionar para /app/dashboard (ou /app/billing) com mensagem clara (ex.: "Assinatura em atraso. Regularize em Configuração → Faturação."). |

---

## Recuperação

| Estado      | Ação para recuperar operação                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| `past_due`  | Pagar valor em dívida (Stripe Customer Portal ou fluxo Core). Após confirmação, Core atualiza para `active`.      |
| `suspended` | Renovar assinatura ou reativar plano (via /app/billing). Core atualiza para `active` após confirmação do gateway. |

A UI não decide o estado; o Core é a fonte de verdade (Stripe webhooks / polling). A UI apenas exibe estado e redireciona para /app/billing quando operação está bloqueada.

---

## Referências

- [CORE_BILLING_AND_PAYMENTS_CONTRACT.md](./CORE_BILLING_AND_PAYMENTS_CONTRACT.md) — quem cobra, gateway, Core
- [OPERATIONAL_GATES_CONTRACT.md](./OPERATIONAL_GATES_CONTRACT.md) — gates em /op/\*
- [CAMINHO_DO_CLIENTE.md](./CAMINHO_DO_CLIENTE.md) — fluxo Billing controla, operação executa

**Violação = bloquear portal por billing ou permitir operação sem billing ativo (quando política exige).**
