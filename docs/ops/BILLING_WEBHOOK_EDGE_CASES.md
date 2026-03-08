# Billing — Edge cases de webhooks

**Objetivo:** Comportamento esperado para webhook duplicado, evento fora de ordem e assinatura inválida.

## Idempotência (webhook duplicado)

- **Stripe e SumUp:** O Core RPC `process_webhook_event` deve ser idempotente por `(provider, event_id)`. O mesmo `event_id` não deve aplicar a mesma actualização duas vezes (ex.: não criar duas linhas em `merchant_subscriptions` nem alterar `billing_status` duas vezes).
- **Teste:** Enviar o mesmo payload (mesmo `event_id`) duas vezes; a segunda resposta deve ser 200/202 e o estado no DB deve permanecer o mesmo que após a primeira.
- **Referência:** `tests/integration/plpgsql-core-rpcs.test.ts` (sync_stripe_subscription_from_event deduplica billing_incidents por event_id+reason); idempotência de `process_webhook_event` deve ser garantida no schema/RPC.

## Evento fora de ordem

- **Cenário:** Ex.: `invoice.paid` chega antes de `customer.subscription.updated`.
- **Comportamento:** O Core usa `last_billing_event_at` (timestamp guard) para ignorar eventos mais antigos que o último processado. Eventos fora de ordem podem ser ignorados (stale) ou aplicados conforme o timestamp. Documentar no código ou em runbook que a ordem recomendada pela Stripe (subscription.* antes de invoice.*) pode não ser garantida; o guard de timestamp mitiga.
- **Log:** Em caso de evento ignorado por stale, a função retorna mensagem do tipo "Stale event skipped".

## Assinatura inválida

- **Stripe:** Se `STRIPE_WEBHOOK_SECRET` estiver definido, o handler deve verificar a assinatura e responder **401** sem persistir nem alterar estado.
- **SumUp:** Se `SUMUP_WEBHOOK_SECRET` estiver definido, o handler deve verificar `X-SumUp-Signature` e responder **401** sem persistir nem alterar estado.
- **Testes:** `tests/unit/server/integration-gateway.test.ts` inclui testes de 401 para SumUp (invalid signature). Garantir que Stripe webhook (Edge ou gateway) também tem teste de 401 quando a assinatura é inválida.

## Retry pelo provider

- Após 5xx ou timeout, Stripe/SumUp reenviam o webhook. O handler deve ser idempotente para que o retry não cause estado incorrecto (duplicação ou overwrite indesejado).
