# Camada de Infraestrutura (Fase 3)

> Componentes React **não** importam desta camada directamente. Usam hooks ou facades em `core/*`.

## Responsabilidades

- **Supabase / DB:** `core/db` (client Supabase). Acesso a dados via RLS; nenhum componente importa `core/db`.
- **Edge (API):** Chamadas a Supabase Edge Functions ou gateway usam `CONFIG.API_BASE` + `VITE_INTERNAL_API_TOKEN`. Facades: `core/billing/coreBillingApi`, `core/payment/PaymentBroker`, `integrations/core/IntegrationEventBus`.
- **Payment (Fase 3.2):** `infra/payments/` — interface **PaymentProvider** (createPayment, getPaymentStatus, cancelPayment, refundPayment). Implementações: Stripe, SumUp, Pix, manual, MB Way. Registry: `getProvider(method)`. UI usa `PaymentBroker` ou registry via hooks; **não** importa SDKs para criar/confirmar/reembolsar. Excepção: elementos de UI Stripe (cartão) em `PaymentModal`/`StripePaymentModal` por PCI.
- **Print:** `core/print/PrintQueue` + `core/print/PrintQueueProcessor` = adaptador de impressão. Jobs com `orderId` só são processados após o pedido existir no Core (order sync confirmado).
- **Readers/Writers:** `infra/readers/*`, `infra/writers/*` — leitura/escrita em Core ou Supabase. Usados por services e hooks, não por componentes de apresentação.

## Regra

Nenhum componente (páginas, componentes de UI) deve importar:

- `core/db` ou `@supabase/*`
- `infra/payments/providers/stripe` ou `infra/payments/providers/sumup` (usar `getProvider()` ou `PaymentBroker`)
- SDKs Stripe/SumUp para chamadas de API (excepção: elementos de UI Stripe para cartão num único lugar, por PCI)

Excepção documentada: `PaymentModal` / `StripePaymentModal` usam `@stripe/react-stripe-js` apenas para o elemento de cartão; a criação de intents e confirmação passam por `PaymentBroker` / providers.
