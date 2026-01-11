# 🚀 GLOVO - PLANO DE IMPLEMENTAÇÃO

**Objetivo:** Implementar integração Glovo para receber pedidos automaticamente  
**Prioridade:** FASE 1 - SEMANA 3-4  
**Status:** 30% completo (estrutura existe, precisa implementação real)

---

## 📋 INFORMAÇÕES DA API GLOVO

### Base URL
```
https://open-api.glovoapp.com/
```

### Autenticação
- **Tipo:** OAuth 2.0
- **Header:** `Authorization: Bearer {access_token}`
- **Como obter:** 
  1. Registrar app no Glovo Developer Portal
  2. Obter `client_id` e `client_secret`
  3. Fazer OAuth flow para obter `access_token`
  4. Refresh token quando expirar

### Endpoints Principais

#### 1. Listar Pedidos Pendentes
```
GET /v3/orders?status=PENDING
```
**Resposta:**
```json
{
  "orders": [
    {
      "id": "order_123",
      "status": "PENDING",
      "customer": {
        "name": "João Silva",
        "phone": "+351912345678"
      },
      "delivery": {
        "address": "Rua X, 123",
        "city": "Lisboa"
      },
      "items": [
        {
          "id": "item_1",
          "name": "Pizza Margherita",
          "quantity": 2,
          "price": 12.50
        }
      ],
      "total": 25.00,
      "currency": "EUR",
      "created_at": "2026-01-16T10:00:00Z"
    }
  ]
}
```

#### 2. Obter Detalhes do Pedido
```
GET /v3/orders/{orderId}
```

#### 3. Atualizar Status do Pedido
```
PUT /v3/orders/{orderId}/status
Body: { "status": "ACCEPTED" | "PREPARING" | "READY" | "CANCELLED" }
```

#### 4. Health Check
```
GET /v3/system/health
```

---

## 🏗️ ARQUITETURA

### Estrutura de Arquivos

```
merchant-portal/src/integrations/
├── adapters/
│   ├── gloriafood/          # Exemplo existente
│   │   ├── GloriaFoodAdapter.ts
│   │   └── GloriaFoodTypes.ts
│   └── glovo/               # NOVO
│       ├── GlovoAdapter.ts
│       ├── GlovoTypes.ts
│       └── GlovoOAuth.ts
├── core/
│   ├── IntegrationContract.ts
│   └── OrderIngestionPipeline.ts
└── types/
    └── IntegrationEvent.ts
```

### Fluxo de Dados

```
Glovo API → GlovoAdapter → OrderIngestionPipeline → OrderEngine → TPV
```

---

## 📝 IMPLEMENTAÇÃO PASSO A PASSO

### FASE 1: Setup e Estrutura (Dia 1-2)

#### 1.1 Criar Estrutura de Arquivos
- [ ] Criar pasta `merchant-portal/src/integrations/adapters/glovo/`
- [ ] Criar `GlovoTypes.ts` (tipos TypeScript)
- [ ] Criar `GlovoOAuth.ts` (autenticação OAuth)
- [ ] Criar `GlovoAdapter.ts` (adapter principal)

#### 1.2 Definir Tipos TypeScript
```typescript
// GlovoTypes.ts
export interface GlovoOrder {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'CANCELLED';
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  delivery: {
    address: string;
    city: string;
    postal_code?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  items: GlovoOrderItem[];
  total: number;
  currency: string;
  created_at: string;
  scheduled_time?: string;
}

export interface GlovoOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface GlovoConfig {
  restaurantId: string;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  enabled?: boolean;
}
```

#### 1.3 Implementar OAuth
```typescript
// GlovoOAuth.ts
export class GlovoOAuth {
  async getAccessToken(clientId: string, clientSecret: string): Promise<string> {
    // Implementar OAuth flow
    // 1. POST /oauth/token
    // 2. Retornar access_token
    // 3. Armazenar refresh_token
  }
  
  async refreshAccessToken(refreshToken: string): Promise<string> {
    // Implementar refresh token
  }
}
```

---

### FASE 2: Adapter Principal (Dia 3-5)

#### 2.1 Implementar GlovoAdapter
Baseado em `GloriaFoodAdapter.ts`:

```typescript
// GlovoAdapter.ts
export class GlovoAdapter implements IntegrationAdapter {
  readonly id = 'glovo';
  readonly name = 'Glovo';
  readonly type = 'delivery' as const;
  readonly capabilities: IntegrationCapability[] = [
    'orders.receive',
    'orders.update_status', // Futuro
  ];

  private config: GlovoConfig | null = null;
  private oauth: GlovoOAuth;
  
  async initialize(config?: GlovoConfig): Promise<void> {
    // 1. Validar config
    // 2. Obter access token
    // 3. Iniciar polling (se necessário)
  }
  
  async handleWebhook(payload: any): Promise<void> {
    // 1. Validar payload
    // 2. Transformar em IntegrationEvent
    // 3. Chamar eventCallback
  }
  
  async pollOrders(): Promise<void> {
    // 1. GET /v3/orders?status=PENDING
    // 2. Para cada pedido novo, criar IntegrationEvent
    // 3. Chamar eventCallback
  }
}
```

#### 2.2 Transformar Pedidos Glovo → Sistema Interno
```typescript
function transformGlovoOrderToInternal(glovoOrder: GlovoOrder): OrderCreatedEvent {
  return {
    type: 'order.created',
    source: 'glovo',
    payload: {
      externalOrderId: glovoOrder.id,
      customerName: glovoOrder.customer.name,
      customerPhone: glovoOrder.customer.phone,
      deliveryAddress: `${glovoOrder.delivery.address}, ${glovoOrder.delivery.city}`,
      items: glovoOrder.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
      })),
      total: glovoOrder.total,
      currency: glovoOrder.currency,
      createdAt: glovoOrder.created_at,
    },
  };
}
```

---

### FASE 3: Integração com Sistema (Dia 6-7)

#### 3.1 Registrar Adapter
- [ ] Adicionar GlovoAdapter ao IntegrationRegistry
- [ ] Configurar no restaurante (UI de settings)

#### 3.2 Webhook Receiver
- [ ] Criar `supabase/functions/webhook-glovo/index.ts`
- [ ] Implementar validação de webhook
- [ ] Chamar GlovoAdapter.handleWebhook()

#### 3.3 Polling (Alternativa)
- [ ] Implementar polling a cada 10 segundos
- [ ] Usar quando webhook não estiver disponível
- [ ] Gerenciar rate limits da API

#### 3.4 Integração com TPV
- [ ] Pedidos Glovo aparecem no TPV automaticamente
- [ ] Impressão automática na cozinha
- [ ] Atualização de status (futuro)

---

## 🔧 CONFIGURAÇÃO

### Variáveis de Ambiente
```env
GLOVO_CLIENT_ID=xxx
GLOVO_CLIENT_SECRET=xxx
GLOVO_WEBHOOK_SECRET=xxx
```

### Database
- [ ] Tabela `operational_hub_delivery_channels` já existe
- [ ] Adicionar credenciais Glovo (criptografadas)
- [ ] Configurar webhook URL

---

## 🧪 TESTES

### Teste 1: Autenticação
- [ ] Obter access token
- [ ] Refresh token quando expirar
- [ ] Tratar erros de autenticação

### Teste 2: Receber Pedido
- [ ] Webhook recebe pedido
- [ ] Transforma corretamente
- [ ] Cria pedido no sistema
- [ ] Aparece no TPV

### Teste 3: Polling
- [ ] Polling funciona
- [ ] Detecta novos pedidos
- [ ] Não duplica pedidos existentes

### Teste 4: Impressão
- [ ] Pedido Glovo imprime na cozinha
- [ ] Formato correto

---

## 📊 STATUS ATUAL

### ✅ O que existe:
- Estrutura de adapters (`IntegrationAdapter`)
- `OrderIngestionPipeline` para processar pedidos
- `delivery-integration-service.ts` (stub)
- Documentação da API Glovo

### ❌ O que falta:
- Implementação real do GlovoAdapter
- OAuth flow
- Webhook receiver
- Polling (alternativa)
- Mapeamento de produtos
- Testes

---

## 🎯 CRITÉRIO DE SUCESSO

**Cenário de Teste:**
1. ✅ Configurar credenciais Glovo no sistema
2. ✅ Receber pedido do Glovo (via webhook ou polling)
3. ✅ Pedido aparece no TPV automaticamente
4. ✅ Impressão automática na cozinha
5. ✅ Status pode ser atualizado (futuro)

**Resultado:** "Pedidos Glovo chegam automaticamente no POS."

---

## 📚 RECURSOS

### Documentação Glovo
- API Docs: https://docs.glovoapp.com/
- Developer Portal: https://developers.glovoapp.com/
- OAuth Guide: (verificar documentação oficial)

### Exemplos no Código
- `GloriaFoodAdapter.ts` - Padrão a seguir
- `webhook-gloriafood/index.ts` - Webhook receiver exemplo

---

**Última atualização:** 2026-01-16
