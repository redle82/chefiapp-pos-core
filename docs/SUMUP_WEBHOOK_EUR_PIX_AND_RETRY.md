# SumUp Webhook — EUR, PIX BRL e retry

**Objetivo:** Documentar o comportamento do webhook SumUp para pagamentos EUR, cartão não-EUR e PIX (BRL), e idempotência/retry.

## Tipos de pagamento

- **Cartão EUR:** Payload SumUp com moeda EUR; `merchant_code` identifica o terminal/restaurante. A resolução `merchant_code` → `restaurant_id` é feita no Core (ex.: `merchant_code_mapping` ou equivalente) para actualizar a ordem/pagamento.
- **Cartão não-EUR (outros mercados):** Mesmo fluxo; o payload traz a moeda do pagamento. O Core persiste o evento e aplica a lógica de sync por `merchant_code`/`order_id` conforme disponível.
- **PIX (BRL):** Payload com moeda BRL; mesmo endpoint `POST /api/v1/webhook/sumup`. O handler **não** diferencia por tipo na entrada: regista o evento via `process_webhook_event`; a lógica downstream (sync de ordem) usa os campos do payload (ex.: `transaction_code`, `order_id`, `merchant_code`). Ver `docs/PIX_BILLING_BRL_AND_REFUNDS.md`.

## Resolução merchant_code → restaurant_id

- O webhook envia o payload ao Core (RPC `process_webhook_event`). A associação `merchant_code` → `restaurant_id` e a actualização de ordens/pagamentos são feitas no Core (funções de sync após webhook). Garantir que:
  - Para cada mercado (EUR, PIX BRL), o mapeamento `merchant_code` → restaurante está configurado (ex.: tabela `merchant_code_mapping` ou configuração por restaurante).
  - O payload SumUp pode usar campos ligeiramente diferentes (ex.: `merchant_code` vs `merchantCode`); o extractor no integration-gateway normaliza quando possível. Ver `integration-gateway/src/services/sumup-payment.ts` (`extractSumUpWebhookFields`).

## Idempotência e retry

- **Idempotência:** O Core RPC `process_webhook_event` deve ser idempotente por `(provider, event_id)`: o mesmo `event_id` não deve aplicar a mesma actualização duas vezes. Assim, se a SumUp reenviar o mesmo evento (retry após 5xx ou timeout), a segunda vez não altera estado incorretamente.
- **Retry SumUp:** Em caso de resposta 5xx ou timeout, a SumUp pode reenviar o webhook. O handler deve responder 200/202 após registar o evento para evitar retries desnecessários; em caso de falha temporária (ex.: Core indisponível), responder 5xx para a SumUp retentar.
- **Teste:** Enviar o mesmo payload duas vezes com o mesmo `event_id` e confirmar que apenas uma actualização de estado ocorre (e que a segunda resposta é ainda 202/200).

## Referências

- `server/integration-gateway.ts`: `handleSumUpWebhook`.
- `integration-gateway/src/index.ts`: `POST /api/v1/webhook/sumup`.
- `integration-gateway/src/services/sumup-payment.ts`: `extractSumUpWebhookFields`.
- Core: `process_webhook_event`, funções de sync de pagamento/ordem.
