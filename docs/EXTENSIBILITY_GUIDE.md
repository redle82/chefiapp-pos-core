# 🔧 Extensibility Guide - ChefIApp

**Guia para estender e customizar o sistema**

---

## 🎯 Princípios de Extensibilidade

### 1. Modularidade
Componentes independentes e reutilizáveis

### 2. Configurabilidade
Comportamento controlado por configuração

### 3. Hooks e Contextos
Estado compartilhado via hooks

### 4. Service Layer
Lógica de negócio isolada em services

---

## 🧩 Arquitetura de Extensão

### Estrutura Recomendada
```
mobile-app/
├── components/
│   ├── core/          # Componentes base
│   ├── features/      # Features específicas
│   └── shared/        # Compartilhados
├── hooks/
│   ├── core/          # Hooks base
│   └── features/      # Hooks de features
├── services/
│   ├── core/          # Services base
│   └── integrations/  # Integrações externas
└── config/
    └── features.ts    # Configuração de features
```

---

## 🔌 Adicionar Nova Feature

### 1. Criar Componente
```typescript
// components/features/NewFeature.tsx
import React from 'react';
import { View, Text } from 'react-native';

interface NewFeatureProps {
  // Props específicas
}

export function NewFeature({ ...props }: NewFeatureProps) {
  return (
    <View>
      <Text>Nova Feature</Text>
    </View>
  );
}
```

### 2. Criar Hook (se necessário)
```typescript
// hooks/features/useNewFeature.ts
import { useState, useEffect } from 'react';

export function useNewFeature() {
  const [state, setState] = useState();

  useEffect(() => {
    // Lógica
  }, []);

  return { state };
}
```

### 3. Criar Service (se necessário)
```typescript
// services/features/NewFeatureService.ts
class NewFeatureService {
  static async doSomething() {
    // Lógica de negócio
  }
}

export { NewFeatureService };
```

### 4. Integrar na Tela
```typescript
// app/(tabs)/index.tsx
import { NewFeature } from '@/components/features/NewFeature';

export default function HomeScreen() {
  return (
    <View>
      {/* Componentes existentes */}
      <NewFeature />
    </View>
  );
}
```

---

## 🎨 Customizar Componentes Existentes

### FastPayButton - Adicionar Método
```typescript
// 1. Adicionar método em config
const PAYMENT_METHODS = {
  cash: { label: 'Dinheiro', icon: '💵' },
  card: { label: 'Cartão', icon: '💳' },
  pix: { label: 'PIX', icon: '📱' },
  // ✅ NOVO
  meal_voucher: { label: 'Vale Refeição', icon: '🍽️' }
};

// 2. Atualizar lógica de seleção
const getDefaultMethod = () => {
  // Lógica para detectar método mais usado
  // Incluir novo método
};

// 3. Atualizar processamento
const quickPay = async (orderId: string, method: string) => {
  // Adicionar lógica específica para meal_voucher
  if (method === 'meal_voucher') {
    // Processar vale refeição
  }
};
```

### Mapa Vivo - Adicionar Novo Ícone
```typescript
// 1. Adicionar flag no order
const hasSpecialRequest = order.items.some(
  item => item.specialRequest
);

// 2. Adicionar ícone
{hasSpecialRequest && (
  <Text>⭐ Pedido Especial</Text>
)}
```

### KDS - Adicionar Nova Categoria
```typescript
// 1. Adicionar em PREP_TIME
const PREP_TIME = {
  'drink': 2,
  'appetizer': 5,
  'main': 15,
  'dessert': 10,
  // ✅ NOVO
  'sushi': 20,
  'pizza': 12
};

// 2. Sistema automaticamente detecta e filtra
```

---

## 🔗 Integrações Externas

### Adicionar Integração de Delivery
```typescript
// services/integrations/DeliveryService.ts
interface DeliveryProvider {
  name: string;
  createOrder(order: Order): Promise<DeliveryOrder>;
  trackOrder(orderId: string): Promise<DeliveryStatus>;
}

class DeliveryService {
  private providers: Map<string, DeliveryProvider> = new Map();

  registerProvider(name: string, provider: DeliveryProvider) {
    this.providers.set(name, provider);
  }

  async createDeliveryOrder(
    provider: string, 
    order: Order
  ): Promise<DeliveryOrder> {
    const deliveryProvider = this.providers.get(provider);
    if (!deliveryProvider) {
      throw new Error(`Provider ${provider} not found`);
    }
    return deliveryProvider.createOrder(order);
  }
}

export const deliveryService = new DeliveryService();

// Uso
deliveryService.registerProvider('ifood', {
  name: 'iFood',
  createOrder: async (order) => {
    // Integração com iFood API
  },
  trackOrder: async (orderId) => {
    // Tracking
  }
});
```

### Adicionar Integração de Pagamento
```typescript
// services/integrations/PaymentGateway.ts
interface PaymentGateway {
  processPayment(
    amount: number, 
    method: string, 
    metadata: any
  ): Promise<PaymentResult>;
}

class PaymentService {
  private gateways: Map<string, PaymentGateway> = new Map();

  registerGateway(name: string, gateway: PaymentGateway) {
    this.gateways.set(name, gateway);
  }

  async process(
    gateway: string,
    amount: number,
    method: string
  ): Promise<PaymentResult> {
    const paymentGateway = this.gateways.get(gateway);
    if (!paymentGateway) {
      throw new Error(`Gateway ${gateway} not found`);
    }
    return paymentGateway.processPayment(amount, method, {});
  }
}

export const paymentService = new PaymentService();
```

---

## 🎛️ Sistema de Configuração

### Feature Flags
```typescript
// config/features.ts
export const FEATURES = {
  FAST_PAY: {
    enabled: true,
    version: '1.0.0'
  },
  MAPA_VIVO: {
    enabled: true,
    version: '1.0.0'
  },
  KDS_INTELIGENTE: {
    enabled: true,
    version: '1.0.0'
  },
  RESERVAS_LITE: {
    enabled: true,
    version: '1.0.0'
  },
  // ✅ NOVA FEATURE
  LOYALTY_PROGRAM: {
    enabled: false, // Feature flag
    version: '1.0.0'
  }
};

// Uso
import { FEATURES } from '@/config/features';

if (FEATURES.LOYALTY_PROGRAM.enabled) {
  // Renderizar componente de lealdade
}
```

### Configuração por Restaurante
```typescript
// config/restaurant.ts
interface RestaurantConfig {
  id: string;
  features: {
    fastPay: boolean;
    mapaVivo: boolean;
    kds: boolean;
    reservations: boolean;
  };
  settings: {
    defaultPaymentMethod: 'cash' | 'card' | 'pix';
    urgencyThresholds: {
      green: number;  // minutos
      yellow: number;
      red: number;
    };
    kitchenPressureThresholds: {
      low: number;
      medium: number;
      high: number;
    };
  };
}

// Carregar do Supabase
const loadRestaurantConfig = async (
  restaurantId: string
): Promise<RestaurantConfig> => {
  const { data } = await supabase
    .from('restaurant_config')
    .select('*')
    .eq('id', restaurantId)
    .single();
  
  return data;
};
```

---

## 🔄 Hooks Customizados

### Criar Hook Reutilizável
```typescript
// hooks/core/useRestaurantConfig.ts
import { useState, useEffect } from 'react';
import { useAppStaff } from '@/context/AppStaffContext';

export function useRestaurantConfig() {
  const { currentStaff } = useAppStaff();
  const [config, setConfig] = useState<RestaurantConfig | null>(null);

  useEffect(() => {
    if (currentStaff?.restaurantId) {
      loadRestaurantConfig(currentStaff.restaurantId)
        .then(setConfig);
    }
  }, [currentStaff?.restaurantId]);

  return { config };
}

// Uso em qualquer componente
const { config } = useRestaurantConfig();
if (config?.features.fastPay) {
  // Renderizar Fast Pay
}
```

---

## 🎨 Temas e Customização Visual

### Sistema de Temas
```typescript
// config/theme.ts
export const themes = {
  default: {
    colors: {
      primary: '#10B981',
      secondary: '#F59E0B',
      danger: '#EF4444',
      urgency: {
        green: '#10B981',
        yellow: '#F59E0B',
        red: '#EF4444'
      }
    }
  },
  dark: {
    colors: {
      primary: '#34D399',
      // ...
    }
  },
  custom: {
    // Tema customizado por restaurante
  }
};

// Uso
import { useTheme } from '@/hooks/useTheme';

const { colors } = useTheme();
<View style={{ backgroundColor: colors.primary }} />
```

---

## 📦 Plugins e Extensions

### Sistema de Plugins
```typescript
// services/plugins/PluginManager.ts
interface Plugin {
  name: string;
  version: string;
  initialize(): Promise<void>;
  execute(command: string, ...args: any[]): Promise<any>;
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin) {
    this.plugins.set(plugin.name, plugin);
    plugin.initialize();
  }

  async execute(
    pluginName: string, 
    command: string, 
    ...args: any[]
  ) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }
    return plugin.execute(command, ...args);
  }
}

export const pluginManager = new PluginManager();

// Exemplo: Plugin de Analytics
pluginManager.register({
  name: 'analytics',
  version: '1.0.0',
  initialize: async () => {
    // Inicializar analytics
  },
  execute: async (command, ...args) => {
    if (command === 'track') {
      // Track event
    }
  }
});
```

---

## 🧪 Testando Extensões

### Testar Nova Feature
```typescript
// __tests__/features/NewFeature.test.tsx
import { render } from '@testing-library/react-native';
import { NewFeature } from '@/components/features/NewFeature';

describe('NewFeature', () => {
  it('deve renderizar corretamente', () => {
    const { getByText } = render(<NewFeature />);
    expect(getByText('Nova Feature')).toBeTruthy();
  });
});
```

---

## 📚 Boas Práticas

### 1. Manter Compatibilidade
```typescript
// ✅ Sempre manter props opcionais para compatibilidade
interface ComponentProps {
  // Props existentes
  newProp?: string; // Opcional inicialmente
}
```

### 2. Versionamento
```typescript
// ✅ Versionar features
const FEATURE_VERSION = '1.0.0';

// Migração de versões
if (featureVersion < '2.0.0') {
  // Migrar dados antigos
}
```

### 3. Documentação
```typescript
/**
 * Nova Feature
 * 
 * @example
 * ```tsx
 * <NewFeature prop1="value" />
 * ```
 */
export function NewFeature() {
  // ...
}
```

### 4. Error Handling
```typescript
// ✅ Sempre tratar erros em extensões
try {
  await newFeature.execute();
} catch (error) {
  console.error('Feature error:', error);
  // Fallback ou notificação
}
```

---

## ✅ Checklist de Extensão

### Antes de Adicionar Feature
- [ ] Componente criado e testado
- [ ] Hook criado (se necessário)
- [ ] Service criado (se necessário)
- [ ] Integrado na tela
- [ ] Testes escritos
- [ ] Documentação atualizada
- [ ] Feature flag adicionado
- [ ] Compatibilidade mantida
- [ ] Error handling implementado

---

## 🚀 Exemplos de Extensões

### 1. Sistema de Notificações Push
```typescript
// services/notifications/PushService.ts
class PushService {
  async sendNotification(
    userId: string, 
    message: string
  ) {
    // Implementar
  }
}
```

### 2. Relatórios Avançados
```typescript
// services/analytics/ReportService.ts
class ReportService {
  async generateReport(
    type: string, 
    dateRange: DateRange
  ) {
    // Implementar
  }
}
```

### 3. Integração com Contabilidade
```typescript
// services/integrations/AccountingService.ts
class AccountingService {
  async exportToAccounting(
    data: FinancialData
  ) {
    // Implementar
  }
}
```

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-24
