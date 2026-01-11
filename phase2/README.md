# Phase 2 Development Guide

**Current Status:** Implementation Starting (Mar 1, 2025)  
**Target:** May 31, 2025 (1,000 restaurants)  
**Team:** 9–10 engineers

---

## Folder Structure

```
phase2/
├─ loyalty-system/
│  ├─ types.ts                # Core types + contracts
│  ├─ LoyaltyService.ts        # Service implementation
│  ├─ LoyaltyRepository.ts     # Database access (TBD)
│  └─ tests/                   # Test files
│
├─ advanced-kds/
│  ├─ types.ts                # KDS types + alert rules
│  ├─ KDSService.ts            # Order routing, estimation
│  ├─ PrepTimeEstimator.ts     # AI prep time logic
│  └─ tests/
│
├─ multi-location/
│  ├─ types.ts                # Restaurant groups
│  ├─ RestaurantGroupService.ts
│  ├─ MenuSyncService.ts       # Sync menus across locations
│  └─ tests/
│
├─ whatsapp-orders/
│  ├─ types.ts                # WhatsApp schemas
│  ├─ WhatsAppOrderService.ts
│  ├─ MessageParser.ts         # Parse customer messages
│  ├─ WebhookHandler.ts        # Meta webhook handler
│  └─ tests/
│
├─ analytics/
│  ├─ types.ts                # Metrics types
│  ├─ AnalyticsService.ts      # Metrics collection
│  ├─ ForecastingEngine.ts     # Demand forecasting
│  ├─ queries.ts               # SQL queries for metrics
│  └─ tests/
│
├─ shared/
│  ├─ EventBus.ts              # Publish Phase 2 events
│  ├─ Phase2Error.ts           # Custom error types
│  └─ constants.ts             # Config constants
│
└─ PHASE2_IMPLEMENTATION_ROADMAP.md
```

---

## How to Start Developing Phase 2

### 1. Install Dependencies (if needed)

```bash
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
npm install decimal.js  # For accurate monetary calculations
npm install uuid        # For UUID generation
```

### 2. Set Up TypeScript Compilation

Phase 2 code compiles with the root `tsconfig.json`. Make sure it includes `phase2/`:

```bash
npm run typecheck  # Verify all Phase 2 types compile
```

### 3. Create a Feature Branch (for Sprint 1)

```bash
git checkout -b phase2/sprint1-loyalty
```

### 4. Start Implementing Loyalty System (Sprint 1)

**Backend Tasks:**

```typescript
// phase2/loyalty-system/LoyaltyService.ts
// Implement:
// - awardPointsForOrder() — Called when Order confirms
// - redeemReward() — Customer redeems points
// - calculateTierUpgrade() — Promotion logic
```

**Database Migration (PostgreSQL):**

```sql
-- migrations/007_loyalty_schema.sql
CREATE TABLE loyalty_cards (
  id UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  customer_phone VARCHAR(20),
  current_points DECIMAL(10, 2),
  current_tier VARCHAR(20), -- 'bronze' | 'silver' | 'gold' | 'platinum'
  status VARCHAR(20),
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

CREATE TABLE loyalty_rewards (
  id UUID PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES loyalty_cards(id),
  points INT,
  reason VARCHAR(50),
  awarded_at TIMESTAMP,
  redeemed_at TIMESTAMP
);

-- Events table (immutable audit trail)
CREATE TABLE loyalty_events (
  id UUID PRIMARY KEY,
  type VARCHAR(100),
  aggregate_id UUID, -- Card ID
  payload JSONB,
  recorded_at TIMESTAMP
);

CREATE INDEX idx_loyalty_cards_restaurant ON loyalty_cards(restaurant_id);
CREATE INDEX idx_loyalty_cards_phone ON loyalty_cards(customer_phone);
```

### 5. Run Tests as You Build

```bash
# Unit tests
npm test -- phase2/loyalty-system/

# Watch mode (auto-rerun on file changes)
npm run test:watch -- phase2/
```

### 6. Integration with Existing Core

The Order service needs to call Loyalty when order is confirmed:

```typescript
// In core-engine/executor/OrderExecutor.ts (or similar)
// When order status → "confirmed", call:

import { loyaltyService } from '../phase2/loyalty-system/LoyaltyService';

// After order is confirmed:
await loyaltyService.awardPointsForOrder({
  restaurantId: order.restaurantId,
  orderId: order.id,
  orderTotal: new Decimal(order.totalPrice),
  customerPhone: order.customerPhone,
});
```

---

## Integration Points (Phase 2 → Phase 1)

### Loyalty ↔ Orders

When a TPV order is **confirmed**:
1. Order service emits `order.confirmed` event
2. Loyalty service subscribes → Awards points
3. Event logged to immutable event stream

### Multi-location ↔ Restaurant

When viewing restaurant dashboard:
1. Check if restaurant is in a group
2. Fetch consolidated orders (all locations)
3. Show unified metrics

### WhatsApp ↔ Orders

When Meta sends webhook (customer message):
1. Parse message → Extract items
2. Create WhatsApp order (pending confirmation)
3. Send confirmation link via WhatsApp
4. On confirmation → Create regular TPV order

### Analytics ↔ Orders

Daily job:
1. Query all orders for restaurant (past day)
2. Calculate metrics (volume, revenue, etc.)
3. Store in metrics table
4. Trigger forecasting model

---

## Development Workflow

### Sprint 1 Example (Loyalty System)

**Monday (Mar 1)**
```bash
# Create feature branch
git checkout -b phase2/sprint1-loyalty

# Create loyalty types
touch phase2/loyalty-system/types.ts
# → Populate with LoyaltyCard, LoyaltyReward, contracts

# Create database migration
touch migrations/007_loyalty_schema.sql
# → Add loyalty tables
```

**Tuesday–Wednesday (Mar 2–3)**
```bash
# Implement service
vim phase2/loyalty-system/LoyaltyService.ts
# → Implement awardPointsForOrder(), etc.

# Run tests
npm test -- phase2/loyalty-system/

# Fix bugs, iterate
```

**Thursday (Mar 4)**
```bash
# Code review with team
git push origin phase2/sprint1-loyalty
# → Create PR, request review

# Address feedback
git push origin phase2/sprint1-loyalty (updated)
```

**Friday (Mar 7)**
```bash
# Merge to main (if approved)
git checkout main
git merge phase2/sprint1-loyalty

# Prepare for beta testing
npm run build
npm run test  # Full regression

# Tag release
git tag v1.1.0-phase2-alpha
```

---

## Testing Strategy

### Unit Tests (Loyalty Example)

```typescript
// phase2/loyalty-system/__tests__/LoyaltyService.test.ts

describe('LoyaltyService', () => {
  it('awards points correctly', async () => {
    const service = new LoyaltyService(deps);
    const result = await service.awardPointsForOrder({
      restaurantId: 'rest-1',
      orderId: 'order-1',
      orderTotal: new Decimal('50'),
      customerPhone: '+351 91 234 5678',
    });

    expect(result.pointsAwarded).toBe(50); // 1 point per €
    expect(result.newTotal).toEqual(new Decimal('50'));
    expect(result.tier).toBe('bronze');
  });

  it('upgrades tier on threshold', async () => {
    // Create card with 95 points, add 10 more
    // Should upgrade to silver (100 point threshold)
  });

  it('logs event for audit trail', async () => {
    // Verify event published to event bus
  });
});
```

### Integration Tests

```typescript
// phase2/loyalty-system/__tests__/integration.test.ts

describe('Loyalty ↔ Orders Integration', () => {
  it('awards loyalty points when order confirmed', async () => {
    // 1. Create restaurant + menu
    // 2. Create customer (phone number)
    // 3. Create order
    // 4. Confirm order
    // 5. Verify loyalty card has points
  });
});
```

### E2E Tests (Full Flow)

```typescript
// Will be in phase2/__tests__/e2e.test.ts
// Test: Customer orders → Pays → Gets points → Tier upgrades → Redeems reward
```

---

## Feature Flags (Safe Rollout)

Use feature flags to enable Phase 2 features gradually:

```typescript
// shared/FeatureFlags.ts
export const FEATURE_FLAGS = {
  LOYALTY_SYSTEM: process.env.FEATURE_LOYALTY === 'true',
  ADVANCED_KDS: process.env.FEATURE_KDS === 'true',
  MULTI_LOCATION: process.env.FEATURE_MULTI_LOCATION === 'true',
  WHATSAPP_ORDERS: process.env.FEATURE_WHATSAPP === 'true',
  ANALYTICS: process.env.FEATURE_ANALYTICS === 'true',
};

// In code:
if (FEATURE_FLAGS.LOYALTY_SYSTEM) {
  await loyaltyService.awardPointsForOrder(...);
}
```

In production:
```bash
# Enable for beta restaurants only
FEATURE_LOYALTY=true npm run server
```

---

## Deployment Strategy (Phase 2)

### Blue-Green Deployment

1. Deploy Phase 2 code to **green** environment
2. Run full regression tests
3. If OK: Switch traffic from blue → green
4. If issues: Rollback (switch back to blue)

### Canary Deployment

1. Deploy to 5 restaurants (canary group)
2. Monitor metrics (errors, latency, loyalty points)
3. If healthy: Gradual rollout (10% → 25% → 50% → 100%)

---

## Monitoring & Alerts (Phase 2)

Add to monitoring dashboard:

```
Loyalty Metrics:
  - Points awarded/day
  - Tier upgrades/day
  - Redemption requests/day
  - Event processing latency

KDS Metrics:
  - Avg prep time
  - Orders routed/day
  - Late orders %

WhatsApp Metrics:
  - Messages received/day
  - Parsing success rate
  - Order confirmation rate

Analytics Metrics:
  - Metrics collection time
  - Forecast accuracy
  - Dashboard query latency
```

**Alert if:**
- Loyalty: Points not awarded (5+ min latency)
- KDS: Routing latency >2s
- WhatsApp: Parsing confidence <50%
- Analytics: Collection fails

---

## Dependency Management

### Phase 2 Dependencies on Phase 1

```
Loyalty → Order state machine (confirmed event)
KDS → Order state machine (routing, timing)
Multi-location → Restaurant entity (groups)
WhatsApp → Order creation, menu lookup
Analytics → All orders + events
```

**Rule:** Phase 2 can read Phase 1 state, but doesn't modify core state machines.

---

## Code Review Checklist (Before Merge)

- [ ] Types are strict (no `any`)
- [ ] Contracts defined (Input/Output)
- [ ] Error handling (try-catch, validation)
- [ ] Tests (unit + integration)
- [ ] Event logging (audit trail)
- [ ] Database migrations included
- [ ] Feature flag added
- [ ] Documentation updated
- [ ] No breaking changes to Phase 1

---

## Questions During Development?

1. **"How do I call Order service from Loyalty?"**
   → Don't. Emit event, Order service subscribes.

2. **"How do I store loyalty data?"**
   → Use PostgreSQL (migrations in `migrations/`). Create tables.

3. **"How do I test against real Marketplace API?"**
   → Use sandbox credentials (configured in `.env`). Never use production keys.

4. **"What if I find a bug in Phase 1 code?"**
   → Create separate bug fix branch. Merge to main immediately.

5. **"Phase 2 is too complex. Can we simplify?"**
   → Yes. Post to #chefiapp-phase2 slack, team discusses.

---

## Success Criteria (Mar 31)

By end of March:
- ✅ Loyalty system live (20 beta restaurants using it)
- ✅ KDS routing working
- ✅ Multi-location scaffolding done
- ✅ All code merged to main
- ✅ Zero critical bugs in Phase 1

---

**Welcome to Phase 2. Let's build the future. 🚀**

