# Histórico de Migrações

> Documentação das refatorações e migrações do merchant-portal.

## 2026-02-22 — Refatoração Cirúrgica Total

### Objetivo

Eliminar ruído estrutural, consolidar arquitetura em camadas, fortalecer tipos e extrair lógica de negócio da UI.

### Mudanças Estruturais

#### Novas Camadas Criadas

```
src/
├── domain/           # Regras puras (sem React, sem API)
│   ├── payment/      # Cálculos e validações de pagamento
│   ├── order/        # Cálculos de pedidos, status helpers
│   ├── kitchen/      # Tempo de preparo, estados de timer
│   ├── restaurant/   # Validação de identidade/localização
│   └── reports/      # Agregações e formatação
├── infra/
│   ├── payments/     # Payment Layer plugável
│   │   ├── interface.ts
│   │   ├── registry.ts
│   │   └── providers/
│   │       ├── manual.ts
│   │       ├── stripe.ts
│   │       ├── pix.ts
│   │       ├── sumup.ts
│   │       └── mbway.ts
│   └── schemas/      # Validação Zod
│       ├── payment.ts
│       ├── order.ts
│       └── restaurant.ts
├── features/
│   ├── tpv/
│   │   └── hooks/
│   │       ├── useAvailablePaymentMethods.ts
│   │       └── usePayment.ts
│   ├── onboarding/
│   └── config/
└── shared/
    └── ui/           # Primitives consolidados
        ├── LoadingState.tsx
        ├── StatusBadge.tsx
        ├── PageShell.tsx
        ├── SectionCard.tsx
        └── ModalShell.tsx
```

#### Path Aliases Adicionados

```typescript
// tsconfig.app.json
"paths": {
  "@domain/*": ["src/domain/*"],
  "@infra/*": ["src/infra/*"],
  "@features/*": ["src/features/*"],
  "@shared/*": ["src/shared/*"],
  "@core/*": ["src/core/*"]
}
```

### Arquivos Removidos

- `pages/AppStaff/legacy/AppStaff.legacy.tsx`
- `pages/AppStaff/legacy/README.md`
- `src/doc/` (consolidado em `docs/`)
- `src/docs/` (consolidado em `docs/`)

### Dependências Adicionadas

- `zod@^3.25.76` — Validação de schemas em runtime

### Componentes Atualizados

#### PaymentModal.tsx

- Importa funções de cálculo de `@domain/payment`
- Usa `calculateTip`, `calculateGrandTotal`, `parseToCents`, `calculateChange`
- Usa `isCashSufficient` para validação
- Usa `QUICK_CASH_VALUES` do domain

### Como Usar as Novas Camadas

#### Domain Layer

```typescript
// Funções puras, sem React
import { calculateTip, calculateGrandTotal } from "@domain/payment";
import { isOrderActive, canOrderBePaid } from "@domain/order";
import { determineTimerState } from "@domain/kitchen";
import { validateIdentity } from "@domain/restaurant";
```

#### Infra Payments

```typescript
// Providers plugáveis
import { getProvider, getAvailableMethods } from "@infra/payments";

const provider = getProvider("pix");
const result = await provider.createPayment({ ... });
```

#### Schemas Zod

```typescript
// Validação em fronteiras
import { paymentSchemas } from "@infra/schemas";

const result = paymentSchemas.CreatePaymentParamsSchema.safeParse(data);
if (!result.success) {
  console.error(result.error);
}
```

#### Shared UI

```typescript
// Componentes consolidados
import { 
  PageShell, 
  SectionCard, 
  LoadingState, 
  StatusBadge 
} from "@shared/ui";
```

### Próximos Passos

1. Migrar mais componentes para usar `@domain/*`
2. Eliminar `any` restantes (529 → 0)
3. Migrar `pages/` para `features/` gradualmente
4. Consolidar Context Providers duplicados

### Checklist de Verificação

- [x] Domain layer criado e funcional
- [x] Payment Layer plugável implementado
- [x] Schemas Zod criados
- [x] Shared UI consolidado
- [x] Path aliases configurados
- [x] Documentação atualizada
- [ ] Todos os `any` eliminados
- [ ] Todos os módulos migrados para features/
