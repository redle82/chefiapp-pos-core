# 🧪 Testing Strategy - ChefIApp

**Estratégia completa de testes**

---

## 🎯 Objetivos de Testes

### Cobertura Alvo
- **Código crítico:** > 90%
- **Código geral:** > 70%
- **Funcionalidades principais:** 100%

### Tipos de Testes
1. **Unit Tests:** Componentes e funções isoladas
2. **Integration Tests:** Fluxos completos
3. **E2E Tests:** Cenários de usuário
4. **Manual Tests:** Validação de UX

---

## 🧩 Estrutura de Testes

### Organização
```
mobile-app/
├── __tests__/
│   ├── components/
│   │   ├── FastPayButton.test.tsx
│   │   ├── KitchenPressureIndicator.test.tsx
│   │   └── WaitlistBoard.test.tsx
│   ├── hooks/
│   │   └── useKitchenPressure.test.ts
│   ├── services/
│   │   └── persistence.test.ts
│   └── utils/
│       └── urgency.test.ts
├── e2e/
│   ├── fast-pay.spec.ts
│   ├── mapa-vivo.spec.ts
│   └── kds.spec.ts
└── jest.config.js
```

---

## 🔬 Unit Tests

### FastPayButton Test
```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FastPayButton } from '@/components/FastPayButton';
import { useOrder } from '@/context/OrderContext';
import { useAppStaff } from '@/context/AppStaffContext';

jest.mock('@/context/OrderContext');
jest.mock('@/context/AppStaffContext');

describe('FastPayButton', () => {
  const mockQuickPay = jest.fn();
  const mockUpdateOrderStatus = jest.fn();

  beforeEach(() => {
    (useOrder as jest.Mock).mockReturnValue({
      quickPay: mockQuickPay,
      updateOrderStatus: mockUpdateOrderStatus
    });
    (useAppStaff as jest.Mock).mockReturnValue({
      financialState: 'drawer_open'
    });
  });

  it('deve processar pagamento com sucesso', async () => {
    mockQuickPay.mockResolvedValue(true);
    
    const { getByText } = render(
      <FastPayButton 
        orderId="123" 
        total={50.00} 
        tableId="table-1" 
      />
    );

    fireEvent.press(getByText('Cobrar Tudo'));
    fireEvent.press(getByText('Confirmar'));

    await waitFor(() => {
      expect(mockQuickPay).toHaveBeenCalledWith('123', 'cash');
      expect(mockUpdateOrderStatus).toHaveBeenCalledWith('123', 'paid');
    });
  });

  it('deve bloquear pagamento se caixa fechado', () => {
    (useAppStaff as jest.Mock).mockReturnValue({
      financialState: 'drawer_closed'
    });

    const { getByText } = render(
      <FastPayButton 
        orderId="123" 
        total={50.00} 
        tableId="table-1" 
      />
    );

    fireEvent.press(getByText('Cobrar Tudo'));

    expect(mockQuickPay).not.toHaveBeenCalled();
  });
});
```

### useKitchenPressure Hook Test
```typescript
import { renderHook } from '@testing-library/react-hooks';
import { useKitchenPressure } from '@/hooks/useKitchenPressure';
import { useOrder } from '@/context/OrderContext';

jest.mock('@/context/OrderContext');

describe('useKitchenPressure', () => {
  it('deve retornar "low" para < 5 pedidos', () => {
    (useOrder as jest.Mock).mockReturnValue({
      orders: [
        { id: '1', status: 'preparing' },
        { id: '2', status: 'preparing' }
      ]
    });

    const { result } = renderHook(() => useKitchenPressure());

    expect(result.current.pressure).toBe('low');
    expect(result.current.preparingCount).toBe(2);
  });

  it('deve retornar "medium" para 5-10 pedidos', () => {
    const orders = Array.from({ length: 7 }, (_, i) => ({
      id: `${i}`,
      status: 'preparing'
    }));

    (useOrder as jest.Mock).mockReturnValue({ orders });

    const { result } = renderHook(() => useKitchenPressure());

    expect(result.current.pressure).toBe('medium');
  });

  it('deve retornar "high" para > 10 pedidos', () => {
    const orders = Array.from({ length: 12 }, (_, i) => ({
      id: `${i}`,
      status: 'preparing'
    }));

    (useOrder as jest.Mock).mockReturnValue({ orders });

    const { result } = renderHook(() => useKitchenPressure());

    expect(result.current.pressure).toBe('high');
    expect(result.current.shouldHideSlowItems).toBe(true);
  });
});
```

### Urgency Color Test
```typescript
import { getUrgencyColor } from '@/utils/urgency';

describe('getUrgencyColor', () => {
  it('deve retornar verde para < 15 minutos', () => {
    expect(getUrgencyColor(10)).toBe('#10B981');
  });

  it('deve retornar amarelo para 15-30 minutos', () => {
    expect(getUrgencyColor(20)).toBe('#F59E0B');
  });

  it('deve retornar vermelho para > 30 minutos', () => {
    expect(getUrgencyColor(35)).toBe('#EF4444');
  });
});
```

---

## 🔗 Integration Tests

### Fast Pay Flow
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OrderProvider } from '@/context/OrderContext';
import TablesScreen from '@/app/(tabs)/tables';

describe('Fast Pay Integration', () => {
  it('deve processar pagamento completo', async () => {
    const { getByText, getByTestId } = render(
      <OrderProvider>
        <TablesScreen />
      </OrderProvider>
    );

    // Selecionar mesa
    fireEvent.press(getByTestId('table-1'));

    // Clicar em "Cobrar Tudo"
    fireEvent.press(getByText('Cobrar Tudo'));

    // Confirmar
    fireEvent.press(getByText('Confirmar'));

    // Verificar resultado
    await waitFor(() => {
      expect(getByText('Mesa Fechada')).toBeTruthy();
    });
  });
});
```

---

## 🎭 E2E Tests (Detox/Appium)

### Fast Pay E2E
```typescript
describe('Fast Pay E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('deve processar pagamento em 2 toques', async () => {
    // 1. Navegar para mesas
    await element(by.id('tables-tab')).tap();

    // 2. Selecionar mesa ocupada
    await element(by.id('table-1')).tap();

    // 3. Clicar "Cobrar Tudo"
    await element(by.id('fast-pay-button')).tap();

    // 4. Confirmar
    await element(by.text('Confirmar')).tap();

    // 5. Verificar sucesso
    await expect(element(by.text('Pagamento processado'))).toBeVisible();
  });
});
```

### Mapa Vivo E2E
```typescript
describe('Mapa Vivo E2E', () => {
  it('deve mostrar timer e cores de urgência', async () => {
    await element(by.id('tables-tab')).tap();

    // Verificar timer visível
    await expect(element(by.id('table-timer-1'))).toBeVisible();

    // Verificar cor verde (< 15min)
    await expect(element(by.id('table-1'))).toHaveStyle({
      borderColor: '#10B981'
    });
  });
});
```

---

## 📋 Manual Testing Checklist

### Fast Pay
- [ ] Pagamento em 2 toques funciona
- [ ] Tempo < 5 segundos
- [ ] Caixa fechado bloqueia cash
- [ ] Confirmação mostra valor correto
- [ ] Mesa fecha após pagamento
- [ ] Haptic feedback funciona

### Mapa Vivo
- [ ] Timer atualiza a cada segundo
- [ ] Cores mudam corretamente (verde → amarelo → vermelho)
- [ ] Ícone "quer pagar" aparece para delivered
- [ ] Ícone "esperando bebida" aparece corretamente
- [ ] Nenhuma mesa ocupada sem timer

### KDS Inteligente
- [ ] Banner aparece quando pressão média/alta
- [ ] Menu filtra pratos lentos em alta pressão
- [ ] Bebidas sempre visíveis
- [ ] Pressão atualiza em tempo real

### Reservas LITE
- [ ] Adicionar entrada funciona
- [ ] Lista persiste após fechar app
- [ ] Atribuir mesa funciona
- [ ] Cancelar entrada funciona

---

## 🚀 Test Automation

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:e2e
```

### Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "detox test",
    "test:e2e:build": "detox build"
  }
}
```

---

## 📊 Coverage Reports

### Gerar Relatório
```bash
npm run test:coverage
```

### Visualizar
```bash
open coverage/lcov-report/index.html
```

### Metas
- **Components:** > 80%
- **Hooks:** > 90%
- **Services:** > 85%
- **Utils:** > 95%

---

## 🐛 Debugging Tests

### Jest Debug
```typescript
// Adicionar breakpoint
debugger;

// Log detalhado
console.log('State:', state);
```

### E2E Debug
```typescript
// Pausar execução
await device.pause();

// Screenshot
await device.takeScreenshot('debug.png');
```

---

## 📚 Ferramentas

### Unit Testing
- **Jest:** Framework principal
- **React Testing Library:** Componentes React
- **@testing-library/react-hooks:** Hooks

### E2E Testing
- **Detox:** E2E para React Native
- **Appium:** Alternativa cross-platform

### Mocking
- **jest.mock:** Mocks nativos
- **MSW:** Mock Service Worker (API)

---

## ✅ Checklist de Testes

### Antes de Deploy
- [ ] Todos os unit tests passando
- [ ] Integration tests passando
- [ ] E2E tests críticos passando
- [ ] Manual testing completo
- [ ] Coverage > 70%
- [ ] Testes de performance OK
- [ ] Testes de segurança OK

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-24
