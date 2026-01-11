# Phase 1 — Marketplace Integration Spec

Purpose: Marketplaces feed orders into ChefIApp core as read-only input; core decides response.

---

## Architecture Principle

```
Marketplace API → Adapter → ChefIApp Core → Guard → Page/TPV
(read only)        (translate)   (truth)    (validate)   (output)
```

- Marketplaces: **sensors, not decision-makers**.
- ChefIApp: **single source of truth**.
- Orders: **copied in; core owns workflow**.
- No marketplace API calls from core back out (keeps core simple).

---

## Supported Marketplaces (Phase 1)

| Platform | Priority | API Type | Auth |
|----------|----------|----------|------|
| **Just Eat** | P0 | REST | API Key |
| **Glovo** | P0 | REST | OAuth 2.0 |
| **Uber Eats** | P0 | REST | OAuth 2.0 |
| **Deliveroo** | P0 | REST | API Key |

---

## Integration Pattern (Minimal)

### Order Ingestion

```
GET /orders?restaurantId={id}&status=new,confirmed
→ Transform to ChefIApp Order
→ Save to DB
→ Emit event (OrderReceived)
→ Core processes (via FlowEngine + contracts)
```

### Data Model (ChefIApp Order from Marketplace)

```typescript
type MarketplaceOrder = {
  id: string                    // e.g., "je_12345"
  source: 'justeat' | 'glovo' | 'ubereats' | 'deliveroo'
  restaurantId: string          // Your ID, not theirs
  status: 'new' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
    notes?: string
  }>
  customer: {
    id: string
    name: string
    phone: string
    email?: string
    address?: string
  }
  total: number                 // cents
  commission: number            // cents (marketplace fee)
  estimatedDeliveryTime?: number // minutes
  notes?: string
  createdAt: number             // timestamp
  updatedAt: number             // timestamp
}
```

### Health Check

Each marketplace adapter implements:

```typescript
async function getMarketplaceHealth(source: 'justeat' | 'glovo' | 'ubereats' | 'deliveroo'): Promise<'ok' | 'down'> {
  try {
    const response = await marketplaceAPI.ping()
    return response.ok ? 'ok' : 'down'
  } catch {
    return 'down'
  }
}
```

---

## Per-Marketplace Spec

### Just Eat

**API:** https://api.justeat.io/

**Auth:** API Key (header: `X-API-Key`)

**Key Endpoints**
- `GET /restaurants/{id}/orders?status=new` → list new orders
- `GET /restaurants/{id}/orders/{orderId}` → order details
- `PUT /restaurants/{id}/orders/{orderId}` → update status (ready, accepted, etc.)
- `GET /system/health` → health check

**Polling Strategy**
- Poll every 10 seconds for new orders.
- Update status when restaurant confirms/completes in ChefIApp TPV.

**Adapter Location**
`sdk/marketplace-adapters/justeat-adapter.ts`

---

### Glovo

**API:** https://open-api.glovoapp.com/

**Auth:** OAuth 2.0 (access token in header: `Authorization: Bearer {token}`)

**Key Endpoints**
- `GET /v3/orders?status=PENDING` → new orders
- `GET /v3/orders/{id}` → order details
- `PUT /v3/orders/{id}/status` → update status
- `GET /v3/system/health` → health check

**Polling Strategy**
- Poll every 10 seconds.
- Update status when confirmed in ChefIApp.

**Adapter Location**
`sdk/marketplace-adapters/glovo-adapter.ts`

---

### Uber Eats

**API:** https://api.uber.com/

**Auth:** OAuth 2.0 (restaurant scoped; access token in header)

**Key Endpoints**
- `GET /eats/orders` → list orders (filters: status, time range)
- `GET /eats/orders/{id}` → order details
- `POST /eats/orders/{id}/status` → update status
- `GET /health` → health check

**Polling Strategy**
- Poll every 10 seconds.
- Webhook support (optional; Phase 1 uses polling only).

**Adapter Location**
`sdk/marketplace-adapters/ubereats-adapter.ts`

---

### Deliveroo

**API:** https://api.deliveroo.io/

**Auth:** API Key (header: `Authorization: Bearer {key}`)

**Key Endpoints**
- `GET /restaurants/{id}/orders` → list orders
- `GET /restaurants/{id}/orders/{id}` → details
- `PUT /restaurants/{id}/orders/{id}/status` → update
- `GET /ping` → health check

**Polling Strategy**
- Poll every 10 seconds.
- Update status.

**Adapter Location**
`sdk/marketplace-adapters/deliveroo-adapter.ts`

---

## Service: Marketplace Sync Engine

Location: `merchant-portal/src/services/MarketplaceSyncService.ts`

```typescript
class MarketplaceSyncService {
  // Poll all connected marketplaces
  async syncAllMarketplaces(restaurantId: string): Promise<void>
  
  // Get order from marketplace
  async fetchOrder(source: string, orderId: string): Promise<MarketplaceOrder>
  
  // Update order status back to marketplace
  async updateOrderStatus(source: string, orderId: string, status: string): Promise<void>
  
  // Check health of all marketplaces
  async checkAllMarketplacesHealth(): Promise<Record<string, HealthStatus>>
}
```

**Usage in Core**
- On `OrderReceived` event: load marketplace order, validate against core contracts, render in TPV.
- On `OrderConfirmed` event: call `updateOrderStatus()` back to marketplace.

---

## Event Flow (Simplified)

```
[10s] Poll Just Eat → New order found
      → Translate to ChefIApp Order
      → Save to DB
      → Emit OrderReceived
      → Guard validates (contracts, flow)
      → TPV shows order
      → Restaurant confirms in ChefIApp
      → Event: OrderConfirmed
      → Call updateOrderStatus(justeat, orderId, 'confirmed')
      → Marketplace updated
      → Customer sees "confirmed" on Just Eat
```

---

## Error Handling

| Scenario | Action |
|----------|--------|
| Marketplace API down | Set health='down'; pages show warning; orders not synced |
| Order sync fails | Log error; retry on next poll (exponential backoff) |
| Status update fails | Log; TPV shows local status; retry async |
| Auth token expired | Refresh token; retry |
| Order mismatch (duplicate) | Deduplicate by `source:orderId` |

---

## Data Persistence

**Table: marketplace_orders**
```sql
id UUID PRIMARY KEY
restaurant_id UUID
source STRING (justeat|glovo|ubereats|deliveroo)
external_order_id STRING
status STRING
data JSONB (full marketplace order)
created_at TIMESTAMP
updated_at TIMESTAMP
synced_at TIMESTAMP
last_status_update_at TIMESTAMP
```

**Why:** Keep marketplace copy for audit, replay, and debugging.

---

## Testing Strategy (Phase 1)

- **Unit:** Mock marketplace APIs; test adapters in isolation.
- **Integration:** Sandbox accounts with each marketplace; real API calls; verify order sync.
- **E2E:** Full flow: marketplace order → ChefIApp TPV → status update → marketplace confirmation.

---

## Success Criteria

- ✅ New orders sync within 10 seconds of creation.
- ✅ Status updates propagate back within 5 seconds.
- ✅ 99.5% sync success rate (no lost orders).
- ✅ Health checks accurate (no false positives).

---

## Future (Phase 2+)

- Webhooks instead of polling (lower latency).
- Order filtering (accept/reject by rules).
- Batch order operations.
- Multi-location marketplace routing.

