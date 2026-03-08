# Domain Layer

> Regras de negócio puras — sem React, sem infraestrutura.

## Regras Fundamentais

1. **Nenhum import de React** — funções puras, sem hooks, sem JSX
2. **Nenhum import de infra/** — sem chamadas HTTP, sem DB, sem storage
3. **Nenhum side effect** — funções determinísticas, testáveis
4. **Tipos explícitos** — sem `any`, union types para estados finitos

## Estrutura (Fase 2 — Domain separation)

```
domain/
├── order/            # Pedidos: tipos, totais, status
├── payment/          # Pagamentos: métodos, validação, totais
├── shift/            # Turnos: Shift, Attendance, Schedule; helpers
├── menu/             # Menu: MenuItem, categorias, validação
├── tenant/           # Tenant = restaurante; re-export de restaurant
├── restaurant/       # Identidade e localização do restaurante
├── kitchen/          # Tempo de preparo e estados
└── reports/          # Agregações e formatação
```

**Contrato (Fase 2.5):** A UI não importa Supabase, Stripe ou SDKs. Componentes usam **hooks** ou **facades** que por sua vez usam `@domain/*` e infra.

## Exemplo de Função Pura

```typescript
// ✅ CORRETO — função pura em domain/
export function calculateTip(
  orderTotal: number,
  tipPercent: number | null,
  customTip: string,
): number {
  if (tipPercent !== null) {
    return Math.round(orderTotal * (tipPercent / 100));
  }
  const value = parseFloat(customTip || "0");
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

// ❌ ERRADO — não pertence a domain/
export function useTipCalculation() {
  const [tip, setTip] = useState(0); // React hook!
  // ...
}
```

## Como Usar

```typescript
// Em features/tpv/hooks/usePayment.ts
import { calculateTip, calculateGrandTotal } from "@domain/payment";

export function usePayment() {
  // Hook pode usar funções de domain/
  const tipCents = useMemo(
    () => calculateTip(orderTotal, tipPercent, customTip),
    [orderTotal, tipPercent, customTip],
  );

  const grandTotal = calculateGrandTotal(orderTotal, tipCents);
  // ...
}
```

## Testes

Funções em `domain/` são triviais de testar:

```typescript
import { calculateTip } from "./calculatePaymentTotals";

describe("calculateTip", () => {
  it("calcula gorjeta por percentual", () => {
    expect(calculateTip(10000, 10, "")).toBe(1000); // 10% of 10000 cents
  });

  it("usa valor customizado quando percentual é null", () => {
    expect(calculateTip(10000, null, "5.50")).toBe(550);
  });

  it("retorna 0 para input inválido", () => {
    expect(calculateTip(10000, null, "abc")).toBe(0);
  });
});
```

## Imports na UI

- **Permitido:** `import { ... } from '@domain/order'`, `@domain/payment`, `@domain/shift`, `@domain/menu`, `@domain/tenant'`, `@domain/restaurant'`, etc., dentro de **hooks** ou **services** (não diretamente em componentes de apresentação quando há lógica de negócio).
- **Evitar:** Componentes React importarem `core/db`, `@supabase/*`, `stripe`, SDKs de pagamento. Usar camada de infra (writers/readers) ou hooks que encapsulam domain + infra.

## Checklist de Revisão

Antes de adicionar código a `domain/`:

- [ ] Não importa `react` ou `react-dom`
- [ ] Não importa de `infra/`, `features/`, `pages/`, `components/`
- [ ] Não usa `fetch`, `localStorage`, `sessionStorage`
- [ ] Não usa `console.log` (exceto em dev com flag)
- [ ] Função é determinística (mesma entrada = mesma saída)
- [ ] Tipos são explícitos (sem `any`)
- [ ] Tem testes unitários
