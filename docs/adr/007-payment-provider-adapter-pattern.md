# ADR-007: Payment Provider Adapter Pattern

## Status

Accepted

## Context

ChefIApp operates across multiple countries (Portugal, Spain, Brazil, Italy,
France, Germany, UK, US) and each market has different preferred payment
methods. We needed to support Stripe (global cards), MBWay (Portugal), SumUp
(European card terminals), PIX (Brazil), and manual/cash payments -- with
the expectation that new providers will be added as we enter new markets.

Without a common abstraction, each payment method would require different
code paths in the checkout flow, making the TPV surface increasingly complex
and fragile.

## Decision

We defined a **common PaymentProvider interface** in
`infra/payments/interface.ts` and implement one adapter per provider:

- `infra/payments/providers/stripe.ts` -- Stripe online payments
- `infra/payments/providers/stripeTerminal.ts` -- Stripe Terminal (in-person)
- `infra/payments/providers/mbway.ts` -- MBWay mobile payments
- `infra/payments/providers/sumup.ts` -- SumUp card terminal
- `infra/payments/providers/sumupReader.ts` -- SumUp card reader
- `infra/payments/providers/pix.ts` -- PIX instant transfer
- `infra/payments/providers/manual.ts` -- Cash and manual entry

A **PaymentRegistry** (`infra/payments/registry.ts`) resolves the correct
provider at runtime based on the restaurant's country configuration and
available payment methods. A **TerminalRegistry**
(`infra/payments/terminalRegistry.ts`) manages physical card reader
connections.

The PaymentBroker in `core/payment/` orchestrates the payment flow using the
provider interface, without knowing which concrete provider is active.

## Consequences

**Positive:**
- Adding a new payment provider requires only a new adapter file and registry entry
- The TPV checkout flow is provider-agnostic -- same code path for all methods
- Each adapter can be tested independently with mocked responses
- Country-specific logic is isolated in the adapter, not the UI
- Terminal management is centralized in the registry

**Negative:**
- The common interface must accommodate the lowest common denominator, so
  provider-specific features (e.g., Stripe's advanced fraud detection) require
  escape hatches or extension interfaces
- Provider SDKs have different loading strategies (Stripe.js is async, SumUp
  requires native bridge) which adds initialization complexity
- Error handling varies significantly between providers, requiring adapter-level
  normalization
- Testing requires mock implementations for each provider
