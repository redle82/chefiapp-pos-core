# PIX — Moeda BRL soberana e reembolsos

**Objetivo:** Garantir que PIX (Brasil) usa sempre BRL e que reembolsos têm comportamento definido.

## Moeda BRL soberana

- **Checkout PIX:** O endpoint `POST /api/v1/payment/pix/checkout` (server e integration-gateway) **nunca** usa configuração EUR ou outra moeda. Parâmetros fixos:
  - `currency: "BRL"`
  - `payment_type: "pix"`
  - `country: "BR"`
- **Código:** `server/integration-gateway.ts` (createSumUpCheckoutApi para PIX) e `integration-gateway/src` equivalentes passam estes valores de forma explícita; não há leitura de `process.env` para moeda no path PIX.
- **Webhook:** O webhook SumUp (`POST /api/v1/webhook/sumup`) é partilhado entre pagamentos cartão (EUR/outros) e PIX (BRL). O payload que a SumUp envia contém a moeda do pagamento. O handler **não sobrescreve** a moeda: persiste o evento via `process_webhook_event` e a lógica downstream (sync de ordem/pagamento) usa os campos do payload. Pagamentos PIX chegam com `currency` BRL no payload.

## Reembolsos

- **Comportamento esperado:** Se a SumUp enviar um evento de reembolso (ex.: `status: REFUNDED` ou tipo `refund.*`), o webhook deve:
  1. Aceitar o evento (200/202).
  2. Registar em `webhook_events` via `process_webhook_event` (idempotente por `event_id`).
  3. A actualização do estado da ordem (ex.: `payment_status` → `refunded`) depende da lógica existente em Core (RPC de sync após pagamento/reembolso). Se ainda não existir tratamento explícito para reembolso, o evento fica registado para auditoria e para futura implementação.
- **Teste manual:** Quando credenciais SumUp sandbox estiverem disponíveis, simular um reembolso no dashboard SumUp e confirmar que o webhook é recebido e que `webhook_events` contém o evento. Validar depois se a ordem/pagamento no Core deve ser actualizada (conforme regras de negócio).

## Referências

- `server/integration-gateway.ts`: PIX checkout (currency BRL, payment_type pix, country BR).
- `integration-gateway/src/services/sumup-checkout.ts`: `createSumUpPixCheckout` força BRL/BR/pix.
- `docs/PAYMENT_PROVIDERS_AND_MARKETS.md`, `docs/PIX_ACTIVATION_PLAN.md`.
