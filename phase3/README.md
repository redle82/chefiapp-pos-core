# Phase 3 Development Guide

**Purpose:** How to develop Phase 3 features  
**Audience:** Backend, Frontend, Mobile, QA engineers  
**Updated:** Dec 24, 2025

---

## Quick Start

### 1. Get the Code
```bash
git clone https://github.com/goldmonkey777/ChefIApp-POS-CORE.git
cd chefiapp-pos-core
git checkout main
git pull origin main
```

### 2. Create Feature Branch
```bash
# For Sprint 1 (Autonomous Rules)
git checkout -b feature/phase3-sprint1-autonomous-rules

# For Sprint 2 (Inventory)
git checkout -b feature/phase3-sprint2-inventory

# Pattern: feature/phase3-sprint{N}-{feature-name}
```

### 3. Set Up Environment
```bash
# Install dependencies
npm install

# Configure Python (if you have data science tasks)
cd /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core
# Data science uses Python; see data science guide

# Run TypeScript check
npm run typecheck

# Run tests
npm test

# Start dev server
npm run dev
```

---

## Folder Structure (Phase 3)

```
phase3/
├── autonomous-rules/
│   ├── types.ts                    ✅ Defined
│   ├── AutonomousRulesService.ts   🟡 Skeleton (Sprint 1)
│   ├── AutonomousRulesRepository.ts 🔵 TBD
│   └── tests/                       🔵 TBD
│
├── inventory-system/
│   ├── types.ts                    ✅ Defined
│   ├── InventoryService.ts         🟡 Skeleton (Sprint 2)
│   ├── InventoryRepository.ts      🔵 TBD
│   └── tests/                       🔵 TBD
│
├── staff-management/
│   ├── types.ts                    ✅ Defined
│   ├── StaffService.ts             🟡 Skeleton (Sprint 4)
│   ├── StaffRepository.ts          🔵 TBD
│   └── tests/                       🔵 TBD
│
├── predictive-analytics/
│   ├── types.ts                    ✅ Defined
│   ├── AnalyticsEngine.ts          🟡 Skeleton (Sprint 3)
│   ├── ForecastingModel.ts         🔵 TBD (Data Science)
│   └── tests/                       🔵 TBD
│
├── pos-hardware/
│   ├── types.ts                    ✅ Defined
│   ├── POSService.ts               🟡 Skeleton (Sprint 6)
│   ├── PaymentProcessor.ts         🔵 TBD
│   └── tests/                       🔵 TBD
│
├── shared/
│   ├── RuleEvaluationEngine.ts     🔵 TBD (Shared by all)
│   ├── HardwareDiscovery.ts        🔵 TBD
│   └── NotificationService.ts      🔵 TBD
│
├── README.md                        📖 You are here
└── MANIFEST.md                      📋 Deliverables checklist

tests/
├── phase3/
│   ├── autonomous-rules.test.ts    🔵 TBD
│   ├── inventory.test.ts           🔵 TBD
│   ├── staff.test.ts               🔵 TBD
│   ├── analytics.test.ts           🔵 TBD
│   └── hardware.test.ts            🔵 TBD
```

**Legend:**
- ✅ Done (ready to use)
- 🟡 Skeleton (fill in implementation)
- 🔵 TBD (create new)

---

## How to Implement a Feature (Example: Autonomous Rules)

### Step 1: Review the Types
```bash
cat phase3/autonomous-rules/types.ts
```

You'll see:
- `AutonomousRule` (core data structure)
- `RuleCondition` (what triggers a rule)
- `RuleAction` (what happens when rule triggers)
- `AutonomousRulesService` (interface you need to implement)

### Step 2: Create Database Migrations

Create migration file: `migrations/008_create_autonomous_rules.sql`

```sql
CREATE TABLE autonomous_rules (
  id UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  rule_type VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  conditions JSONB NOT NULL,
  action JSONB NOT NULL,
  priority INT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_autonomous_rules_restaurant ON autonomous_rules(restaurant_id);
CREATE INDEX idx_autonomous_rules_enabled ON autonomous_rules(enabled);

CREATE TABLE autonomous_decisions_log (
  id UUID PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  order_id UUID,
  rule_id UUID NOT NULL REFERENCES autonomous_rules(id),
  suggested_action JSONB,
  was_overridden BOOLEAN,
  confidence DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_decisions_restaurant ON autonomous_decisions_log(restaurant_id);
CREATE INDEX idx_decisions_order ON autonomous_decisions_log(order_id);
```

Apply it:
```bash
npm run migrate -- migrations/008_create_autonomous_rules.sql
```

### Step 3: Implement the Service

Edit `phase3/autonomous-rules/AutonomousRulesService.ts`:

```typescript
import {
  AutonomousRule,
  AutonomousRulesService as IAutonomousRulesService,
  CreateRuleInput,
  RuleDecisionLog,
  evaluateCondition,
} from './types';

export class AutonomousRulesService implements IAutonomousRulesService {
  constructor(private db: Database) {}

  async createRule(input: CreateRuleInput): Promise<AutonomousRule> {
    // Validate input
    const errors = validateRule(input);
    if (errors.length > 0) {
      throw new Error(`Rule validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    // Save to database
    const rule = await this.db.query(
      `INSERT INTO autonomous_rules (id, restaurant_id, rule_type, ...)
       VALUES ($1, $2, $3, ...) RETURNING *`,
      [uuid(), restaurantId, input.rule_type, ...],
    );

    return rule;
  }

  async evaluateRules(
    restaurantId: UUID,
    context: RuleEvaluationContext,
  ): Promise<RuleDecision[]> {
    // Get all enabled rules for this restaurant
    const rules = await this.db.query(
      `SELECT * FROM autonomous_rules 
       WHERE restaurant_id = $1 AND enabled = true
       ORDER BY priority DESC`,
      [restaurantId],
    );

    const decisions: RuleDecision[] = [];

    for (const rule of rules) {
      // Evaluate all conditions (AND logic)
      let triggered = true;
      for (const condition of rule.conditions) {
        const conditionValue = extractValue(context, condition.field);
        if (!evaluateCondition(condition, conditionValue)) {
          triggered = false;
          break;
        }
      }

      if (triggered) {
        decisions.push({
          rule_id: rule.id,
          rule_name: rule.name,
          triggered: true,
          suggested_action: rule.action,
          confidence: 0.95, // TODO: Calculate from rule evaluation
          explanation: `Rule "${rule.name}" was triggered`,
        });

        // Log the decision
        await this.db.query(
          `INSERT INTO autonomous_decisions_log (...)
           VALUES (...)`,
          [...],
        );
      }
    }

    return decisions;
  }

  // ... implement remaining methods
}
```

### Step 4: Create Repository (Database Access)

Create `phase3/autonomous-rules/AutonomousRulesRepository.ts`:

```typescript
export class AutonomousRulesRepository {
  constructor(private db: Database) {}

  async create(rule: AutonomousRule): Promise<void> {
    await this.db.query(
      `INSERT INTO autonomous_rules (...) VALUES (...)`,
      [...],
    );
  }

  async findById(ruleId: UUID): Promise<AutonomousRule | null> {
    const result = await this.db.query(
      `SELECT * FROM autonomous_rules WHERE id = $1`,
      [ruleId],
    );
    return result.rows[0] || null;
  }

  async findByRestaurant(restaurantId: UUID): Promise<AutonomousRule[]> {
    const result = await this.db.query(
      `SELECT * FROM autonomous_rules WHERE restaurant_id = $1`,
      [restaurantId],
    );
    return result.rows;
  }

  // ... more methods
}
```

### Step 5: Write Unit Tests

Create `tests/phase3/autonomous-rules.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals';
import { evaluateCondition, calculateTierUpgrade } from '../phase3/autonomous-rules/types';

describe('Autonomous Rules', () => {
  describe('evaluateCondition', () => {
    it('should evaluate LT condition correctly', () => {
      const condition = { field: 'margin', operator: 'lt' as const, value: 15 };
      expect(evaluateCondition(condition, 12)).toBe(true);
      expect(evaluateCondition(condition, 16)).toBe(false);
    });

    it('should evaluate IN condition correctly', () => {
      const condition = { field: 'status', operator: 'in' as const, value: ['active', 'pending'] };
      expect(evaluateCondition(condition, 'active')).toBe(true);
      expect(evaluateCondition(condition, 'closed')).toBe(false);
    });
  });

  describe('Rule evaluation', () => {
    it('should trigger rule when all conditions match', () => {
      // TODO: Test with mock service
    });

    it('should not trigger if any condition fails', () => {
      // TODO: Test with mock service
    });
  });
});
```

### Step 6: Integration Test (With Phase 2)

Create `tests/phase3/integration/order-to-rule-flow.test.ts`:

```typescript
describe('Order to Rule Flow (Phase 2 ↔ Phase 3)', () => {
  it('should evaluate rules when order is received', async () => {
    // 1. Create order (Phase 2)
    const order = await orderService.createOrder({
      restaurant_id: restaurantId,
      items: [...],
      customer_id: customerId,
    });

    // 2. Evaluate rules (Phase 3)
    const decisions = await autonomousRulesService.evaluateRules(
      restaurantId,
      { order: { id: order.id, margin: 12, distance_km: 5 } },
    );

    // 3. Assert rule was triggered
    expect(decisions).toHaveLength(1);
    expect(decisions[0].rule_name).toBe('Reject Low-Margin Orders');
    expect(decisions[0].triggered).toBe(true);
  });
});
```

### Step 7: Create PR

```bash
git add .
git commit -m "feat(phase3): Implement autonomous rules engine

- Create AutonomousRulesService with rule evaluation
- Add database migrations for rules + audit log
- Implement condition evaluator (LT, GT, IN, etc.)
- Add unit tests (100% coverage)
- Add integration tests (order → rule flow)
- Add feature flag FEATURE_AUTONOMOUS_RULES

Fixes #[JIRA-ID]"

git push origin feature/phase3-sprint1-autonomous-rules
```

Visit GitHub → Create Pull Request → Link to JIRA → Request review

---

## Integration Points (How Systems Talk to Each Other)

### Order Service → Autonomous Rules
```typescript
// In order.service.ts (Phase 2)
async confirmOrder(orderId: UUID, restaurantId: UUID) {
  const order = await this.getOrder(orderId);
  
  // NEW: Evaluate rules (Phase 3)
  if (isFeatureFlagEnabled('FEATURE_AUTONOMOUS_RULES', restaurantId)) {
    const decisions = await autonomousRulesService.evaluateRules(
      restaurantId,
      { order: { margin: order.margin, distance_km: order.delivery_distance } }
    );
    
    // Check if any rule says to auto-reject
    const rejectDecision = decisions.find(d => d.suggested_action.type === 'auto_reject');
    if (rejectDecision) {
      await this.rejectOrder(orderId, `Auto-rejected: ${rejectDecision.explanation}`);
      return;
    }
  }
  
  // Continue with normal flow
  await this.finalize(orderId);
}
```

### Order Service → Inventory
```typescript
// When order confirmed, deduct inventory
async confirmOrder(orderId: UUID) {
  const order = await this.getOrder(orderId);
  
  for (const item of order.items) {
    await inventoryService.useStock({
      item_id: item.inventory_item_id,
      quantity: item.quantity,
      reference_id: orderId,
    });
  }
}
```

### Order Service → Analytics
```typescript
// Every order feeds analytics
async confirmOrder(orderId: UUID) {
  const order = await this.getOrder(orderId);
  
  // Fire event for analytics
  await eventBus.publish({
    type: 'OrderConfirmed',
    order_id: orderId,
    restaurant_id: order.restaurant_id,
    amount: order.total,
    // ... other data
  });
  
  // Analytics service listens and updates forecasting
}
```

### Order Service → Hardware (KDS)
```typescript
// Route order to kitchen display
async confirmOrder(orderId: UUID) {
  const order = await this.getOrder(orderId);
  
  if (isFeatureFlagEnabled('FEATURE_HARDWARE_INTEGRATION')) {
    await posService.sendOrderToKDS({
      order_id: orderId,
      station: determineStation(order.items),
      items: order.items.map(item => ({
        menu_item_id: item.id,
        name: item.name,
        quantity: item.quantity,
        special_instructions: item.notes,
      })),
    });
  }
}
```

---

## Feature Flags

Control Phase 3 rollout per-restaurant.

```typescript
// feature-flags.ts
export const PHASE3_FEATURE_FLAGS = {
  FEATURE_AUTONOMOUS_RULES: {
    description: 'Auto-accept/reject orders based on rules',
    default: false,
    sprints: [1],
  },
  FEATURE_INVENTORY_SYSTEM: {
    description: 'Track inventory, manage stock',
    default: false,
    sprints: [2],
  },
  FEATURE_PREDICTIVE_PRICING: {
    description: 'Dynamic pricing based on demand',
    default: false,
    sprints: [3],
  },
  FEATURE_SMART_SCHEDULING: {
    description: 'Auto-generate shifts based on forecast',
    default: false,
    sprints: [4],
  },
  FEATURE_STAFF_APP: {
    description: 'Mobile app for staff',
    default: false,
    sprints: [5],
  },
  FEATURE_HARDWARE_INTEGRATION: {
    description: 'KDS, card reader, printer integration',
    default: false,
    sprints: [6],
  },
};

// Usage
if (isFeatureFlagEnabled('FEATURE_AUTONOMOUS_RULES', restaurantId)) {
  // Use Phase 3 feature
}

// Enable for restaurant
await featureFlagService.enable(restaurantId, 'FEATURE_AUTONOMOUS_RULES');

// Gradual rollout
await featureFlagService.enableForPercentage('FEATURE_AUTONOMOUS_RULES', 10); // 10% of restaurants
```

---

## Testing Checklist (Per Sprint)

### Unit Tests (100% coverage for service)
- [ ] All methods of service have tests
- [ ] Edge cases covered (empty list, null values, invalid input)
- [ ] Error handling tested (throws correct errors)

### Integration Tests (Service ↔ Phase 2)
- [ ] Feature works with existing Phase 2 code
- [ ] Database operations work (CRUD)
- [ ] Event publishing works
- [ ] No breaking changes to Phase 2 APIs

### Manual Testing (With Beta Restaurants)
- [ ] 30–50 beta restaurants testing feature
- [ ] Feature enabled via feature flag
- [ ] No critical bugs reported
- [ ] Performance acceptable (latency <500ms)

### Load Testing (For Scale)
- [ ] Can handle 2,500 restaurants
- [ ] Queries optimized (use indexes)
- [ ] No N+1 queries
- [ ] Horizontal scaling possible

---

## Debugging Tips

### Enable Debug Logging
```typescript
// In your service
import debug from 'debug';
const log = debug('chefiapp:phase3:autonomous-rules');

log('Evaluating rule', rule.id);
log('Condition matched', condition);
```

Run with:
```bash
DEBUG=chefiapp:phase3:* npm test
```

### Inspect Database State
```bash
# Connect to development database
psql -U postgres -d chefiapp_pos_core

# Check rules
SELECT * FROM autonomous_rules WHERE restaurant_id = 'xxx';

# Check decision log
SELECT * FROM autonomous_decisions_log ORDER BY created_at DESC LIMIT 10;
```

### Mock External Services
```typescript
jest.mock('../../../order-service', () => ({
  OrderService: jest.fn().mockImplementation(() => ({
    getOrder: jest.fn().mockResolvedValue({ ... }),
  })),
}));
```

---

## Performance Checklist

- [ ] Database queries use indexes
- [ ] No N+1 queries (use JOIN for related data)
- [ ] Caching used for frequently accessed data
- [ ] Lazy loading for large collections
- [ ] Pagination for list endpoints
- [ ] Query optimization (EXPLAIN ANALYZE)

```bash
# Check query performance
EXPLAIN ANALYZE
SELECT * FROM autonomous_rules
WHERE restaurant_id = '...'
AND enabled = true
ORDER BY priority DESC;
```

---

## Code Review Checklist

When submitting a PR, ensure:

- [ ] Code compiles (`npm run typecheck`)
- [ ] Tests pass (`npm test`)
- [ ] No console.log() left in code
- [ ] No hardcoded values (use config)
- [ ] Error messages are clear
- [ ] Comments explain "why", not "what"
- [ ] Commit messages follow convention
- [ ] No breaking changes to Phase 2 APIs
- [ ] Database migrations included (if applicable)
- [ ] Documentation updated (if applicable)

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass (unit, integration, E2E)
- [ ] Load testing successful (2,500 restaurants)
- [ ] Feature flag created + tested
- [ ] Rollback plan documented
- [ ] Monitoring + alerts configured
- [ ] Security audit passed
- [ ] Documentation updated (README, runbooks)
- [ ] Team trained (if manual intervention needed)

---

## Useful Commands

```bash
# TypeScript
npm run typecheck              # Check for type errors
npm run build                  # Build project

# Testing
npm test                       # Run all tests
npm test -- phase3/            # Run Phase 3 tests only
npm run test:watch            # Watch mode

# Database
npm run migrate               # Run pending migrations
npm run migrate:rollback      # Rollback last migration
npm run migrate:status        # Check migration status

# Linting
npm run lint                  # Check code style
npm run lint:fix              # Auto-fix style issues

# Development
npm run dev                   # Start dev server
npm run dev:debug             # Start with debugging

# Git
git log --oneline             # See commit history
git diff origin/main          # See your changes
git push origin feature/...    # Push branch
```

---

## Questions?

- **Type not found?** → Check phase3/{system}/types.ts
- **Service interface unclear?** → Read PHASE3_SPECIFICATION.md
- **How to test?** → Look at existing tests in tests/ folder
- **Database question?** → Check schema docs in PHASE3_SPECIFICATION.md
- **Blocked?** → Post in #chefiapp-phase3 Slack channel

---

## Next Steps (After Finishing Feature)

1. ✅ Code complete + tests passing
2. ✅ Feature flag created
3. ✅ Beta testing with 30+ restaurants
4. ✅ Documentation updated
5. ✅ PR merged to main
6. ✅ Monitor metrics in production
7. ✅ Iterate based on feedback

**Repeat for next sprint.**

---

**Welcome to Phase 3 development. Build something great. 🚀**
