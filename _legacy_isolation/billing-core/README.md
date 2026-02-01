# Billing Core + Gateway Abstraction

## Arquitetura

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              ChefI POS System                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────┐         ┌─────────────────────┐                   │
│   │   BILLING CORE      │         │   CORE ENGINE       │                   │
│   │   (SEU DINHEIRO)    │         │   (RESTAURANTE)     │                   │
│   ├─────────────────────┤         ├─────────────────────┤                   │
│   │ • Subscriptions     │         │ • Orders            │                   │
│   │ • Plans             │         │ • Payments          │                   │
│   │ • Add-ons           │         │ • Sessions          │                   │
│   │ • Feature Gates     │         │ • Audit Trail       │                   │
│   └─────────┬───────────┘         └─────────┬───────────┘                   │
│             │                               │                               │
│             │                               │                               │
│   ┌─────────▼───────────┐         ┌─────────▼───────────┐                   │
│   │   SEU STRIPE        │         │  GATEWAY ABSTRACTION│                   │
│   │   (Assinaturas)     │         │  (Stripe/SumUp)     │                   │
│   │                     │         │                     │                   │
│   │  €29-149/mês        │         │  Dinheiro do        │                   │
│   │  → SUA conta        │         │  cliente → conta    │                   │
│   │                     │         │  do RESTAURANTE     │                   │
│   └─────────────────────┘         └─────────────────────┘                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Fluxo de Dinheiro

```
BILLING (Você recebe):
┌─────────────┐    €59/mês    ┌─────────────┐
│ Restaurante │ ────────────► │ SUA Conta   │
│             │   Assinatura  │ Stripe      │
└─────────────┘               └─────────────┘

PAGAMENTOS (Restaurante recebe):
┌─────────────┐    €45.50     ┌─────────────┐    €45.50     ┌─────────────┐
│ Cliente     │ ────────────► │ ChefI POS   │ ────────────► │ Conta do    │
│ Final       │   Pedido      │ (passagem)  │   Direto!     │ Restaurante │
└─────────────┘               └─────────────┘               └─────────────┘
```

## Planos

| Plano | Preço | Terminais | Mesas | Gateways | Features |
|-------|-------|-----------|-------|----------|----------|
| **Starter** | €29/mês | 1 | 20 | Cash, SumUp | Core POS |
| **Professional** | €59/mês | 3 | ∞ | + Stripe | + Analytics Pro |
| **Enterprise** | €149/mês | ∞ | ∞ | + Multibanco | + Multi-location, API |

## Add-ons

| Add-on | Preço |
|--------|-------|
| Reservas | €19/mês |
| Página Web | €29/mês |
| Terminal Extra | €15/mês |
| White Label | €99/mês |

## Onboarding Flow

```
1. CREATE ACCOUNT
   └─► subscription_id criado
   └─► status = TRIAL (14 dias)

2. CHOOSE PLAN
   └─► plan_id definido
   └─► features liberadas

3. CONFIGURE BILLING PAYMENT (SEU Stripe)
   └─► payment_method_id salvo
   └─► Você vai cobrar assinatura aqui

4. CONFIGURE RESTAURANT GATEWAY
   └─► api_key do Stripe/SumUp DO RESTAURANTE
   └─► webhook_secret configurado
   └─► verified = false

5. VERIFY GATEWAY
   └─► Teste de conexão
   └─► verified = true

6. ✅ POS LIBERADO
   └─► can_use_pos = true
```

## State Machine

```
         ┌─────────────────────────────────────────┐
         │                                         │
         ▼                                         │
      ┌──────┐    payment    ┌────────┐           │
      │TRIAL │ ────────────► │ ACTIVE │ ──────────┤
      └──┬───┘   succeeded   └────┬───┘           │
         │                        │               │
         │ trial ended            │ payment       │
         │ (no payment)           │ failed        │
         │                        ▼               │
         │                   ┌──────────┐         │
         │                   │ PAST_DUE │ ────────┤
         │                   └────┬─────┘         │
         │                        │               │
         │                        │ 7 days        │
         │                        ▼               │
         │                   ┌───────────┐        │
         └─────────────────► │ SUSPENDED │ ───────┤
                             └─────┬─────┘        │
                                   │              │
                                   │ 30 days      │
                                   ▼              │
                             ┌───────────┐        │
                             │ CANCELLED │ ◄──────┘
                             └───────────┘
                                  (cancel from any state)
```

## Feature Blocking

| Status | Blocked Features |
|--------|------------------|
| TRIAL | Nenhum |
| ACTIVE | Nenhum |
| PAST_DUE | API_ACCESS, ANALYTICS_PRO |
| SUSPENDED | CORE_PAYMENTS, API, WEB_PAGE, RESERVATIONS |
| CANCELLED | TUDO |

## API Usage

```typescript
import {
    RestaurantOnboardingService,
    FeatureGateService,
    InMemorySubscriptionStore,
    InMemoryBillingEventStore,
} from './billing-core';

// Setup
const subscriptionStore = new InMemorySubscriptionStore();
const eventStore = new InMemoryBillingEventStore();

const onboarding = new RestaurantOnboardingService({
    findSubscription: (id) => subscriptionStore.findByRestaurant(id),
    saveSubscription: (s) => subscriptionStore.save(s),
    updateSubscription: (s) => subscriptionStore.update(s),
    appendEvent: (e) => eventStore.append(e),
});

const featureGate = new FeatureGateService({
    findByRestaurantId: (id) => subscriptionStore.findByRestaurant(id),
});

// 1. Create subscription
const result = await onboarding.createSubscription({
    restaurant_id: 'rest_123',
    plan_id: 'plan_professional_v1',
});

// 2. Configure gateway
await onboarding.configureRestaurantGateway({
    restaurant_id: 'rest_123',
    gateway_type: 'STRIPE',
    api_key: 'sk_live_...',
    webhook_secret: 'whsec_...',
    account_id: 'acct_...',
});

// 3. Check features
const canUseStripe = await featureGate.canUseGateway('rest_123', 'STRIPE');
const hasAnalytics = await featureGate.hasFeature('rest_123', 'ANALYTICS_PRO');
```

## Gateway Abstraction

```typescript
import { PaymentGateway, GatewayIntent, GatewayResult } from './gateways/PaymentGatewayInterface';

// O Core não sabe quem é Stripe ou SumUp
async function processPayment(
    gateway: PaymentGateway,
    orderId: string,
    amountCents: number
): Promise<GatewayResult> {
    const intent = await gateway.createPaymentIntent({
        amount_cents: amountCents,
        currency: 'EUR',
        order_id: orderId,
        restaurant_id: 'rest_123',
    });

    // Cliente confirma no frontend...

    return gateway.confirmPayment({
        intent_id: intent.intent_id,
    });
}
```

## Separação Clara

| Aspecto | Billing Core | Gateway Abstraction |
|---------|--------------|---------------------|
| **Dinheiro de** | Você (assinaturas) | Restaurante (pedidos) |
| **Vai para** | SUA conta Stripe | Conta do restaurante |
| **Tipo** | B2B | B2C |
| **Eventos** | billing_events | core_events |
| **Responsabilidade** | Cobrar restaurante | Processar pedidos |

## Próximos Passos

1. **Implementar SumUpAdapter** - Seguir interface PaymentGateway
2. **Postgres persistence** - Para billing_events e subscriptions
3. **Webhook handlers** - Para SEU Stripe (billing) e gateway do restaurante
4. **Admin dashboard** - Para gerenciar subscriptions
5. **Dunning system** - Retry automático de pagamentos falhados
