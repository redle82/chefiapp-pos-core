# ChefIApp SaaS — Implementation Scripts

## 1. SQL RLS SNIPPETS (Copy-Paste Ready)

### 1.1 Organization Isolation (Core Table)

```sql
-- Enable RLS on organizations
ALTER TABLE public.gm_organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Select
-- User can see org if they are member OR owner
DROP POLICY IF EXISTS "org_select_self" ON public.gm_organizations;
CREATE POLICY "org_select_self"
  ON public.gm_organizations
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT org_id FROM public.gm_org_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Insert (only authenticated users can create orgs)
DROP POLICY IF EXISTS "org_insert_authenticated" ON public.gm_organizations;
CREATE POLICY "org_insert_authenticated"
  ON public.gm_organizations
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Update (only owner can update)
DROP POLICY IF EXISTS "org_update_owner" ON public.gm_organizations;
CREATE POLICY "org_update_owner"
  ON public.gm_organizations
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.gm_organizations TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
```

### 1.2 Restaurant Isolation (via Organization)

```sql
-- Enable RLS on restaurants
ALTER TABLE public.gm_restaurants ENABLE ROW LEVEL SECURITY;

-- Policy: Select
-- User can see restaurant if:
--  a) They are a restaurant member, OR
--  b) They are an org member (org owns this restaurant)
DROP POLICY IF EXISTS "restaurant_select_team_or_org" ON public.gm_restaurants;
CREATE POLICY "restaurant_select_team_or_org"
  ON public.gm_restaurants
  FOR SELECT
  USING (
    -- Restaurant member
    id IN (
      SELECT restaurant_id FROM public.gm_restaurant_members
      WHERE user_id = auth.uid()
    )
    -- OR org member
    OR org_id IN (
      SELECT org_id FROM public.gm_org_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Insert (authenticated can create in their org)
DROP POLICY IF EXISTS "restaurant_insert_in_org" ON public.gm_restaurants;
CREATE POLICY "restaurant_insert_in_org"
  ON public.gm_restaurants
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.gm_org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policy: Update (owner or restaurant staff can update)
DROP POLICY IF EXISTS "restaurant_update_owner_or_staff" ON public.gm_restaurants;
CREATE POLICY "restaurant_update_owner_or_staff"
  ON public.gm_restaurants
  FOR UPDATE
  USING (
    -- Is restaurant staff
    id IN (
      SELECT restaurant_id FROM public.gm_restaurant_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
    -- OR is org owner
    OR org_id IN (
      SELECT org_id FROM public.gm_org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    id IN (
      SELECT restaurant_id FROM public.gm_restaurant_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
    OR org_id IN (
      SELECT org_id FROM public.gm_org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.gm_restaurants TO authenticated;
```

### 1.3 Orders Isolation (via Restaurant)

```sql
-- Enable RLS
ALTER TABLE public.gm_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Select orders
-- User can see orders if they are a member of the restaurant
DROP POLICY IF EXISTS "orders_select_by_restaurant" ON public.gm_orders;
CREATE POLICY "orders_select_by_restaurant"
  ON public.gm_orders
  FOR SELECT
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.gm_restaurant_members
      WHERE user_id = auth.uid()
    )
    OR restaurant_id IN (
      SELECT r.id FROM public.gm_restaurants r
      WHERE r.org_id IN (
        SELECT org_id FROM public.gm_org_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Insert orders
DROP POLICY IF EXISTS "orders_insert_by_staff" ON public.gm_orders;
CREATE POLICY "orders_insert_by_staff"
  ON public.gm_orders
  FOR INSERT
  WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM public.gm_restaurant_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Update orders (only staff of that restaurant)
DROP POLICY IF EXISTS "orders_update_by_staff" ON public.gm_orders;
CREATE POLICY "orders_update_by_staff"
  ON public.gm_orders
  FOR UPDATE
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.gm_restaurant_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM public.gm_restaurant_members
      WHERE user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.gm_orders TO authenticated;
```

### 1.4 Performance: RLS-Aware Indexes

```sql
-- Index for org member lookup (used in policies)
CREATE INDEX IF NOT EXISTS idx_gm_org_members_user_fastest
  ON public.gm_org_members(user_id, org_id);

-- Index for restaurant member lookup
CREATE INDEX IF NOT EXISTS idx_gm_restaurant_members_user_fastest
  ON public.gm_restaurant_members(user_id, restaurant_id);

-- Index for restaurant-org relationship (used in SELECT policy)
CREATE INDEX IF NOT EXISTS idx_gm_restaurants_org_id
  ON public.gm_restaurants(org_id);

-- Index for order queries
CREATE INDEX IF NOT EXISTS idx_gm_orders_restaurant_id
  ON public.gm_orders(restaurant_id);

-- Analyze indexes
REINDEX INDEX idx_gm_org_members_user_fastest;
REINDEX INDEX idx_gm_restaurant_members_user_fastest;
```

---

## 2. IDEMPOTENT MIGRATION TEMPLATE

Create a file `/migrations/20260305_sample_feature.sql`:

```sql
-- =============================================================================
-- Migration: Sample Feature
-- =============================================================================
-- Date: 2026-03-05
-- Purpose: Example of idempotent migration
-- Idempotency: All operations use IF NOT EXISTS / IF EXISTS
-- =============================================================================

BEGIN;

-- 1. Create table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'sample_feature'
  ) THEN
    CREATE TABLE public.sample_feature (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    RAISE NOTICE 'Created table sample_feature';
  ELSE
    RAISE NOTICE 'Table sample_feature already exists, skipping';
  END IF;
END $$;

-- 2. Add column if not exists
ALTER TABLE public.sample_feature
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Create index if not exists
CREATE INDEX IF NOT EXISTS idx_sample_feature_restaurant
  ON public.sample_feature(restaurant_id);

-- 4. Create function if not exists
CREATE OR REPLACE FUNCTION public.get_sample_feature_count(p_restaurant_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*) FROM public.sample_feature
  WHERE restaurant_id = p_restaurant_id;
$$;

-- 5. Update data (only if needed, no-op if already updated)
UPDATE public.sample_feature
SET status = 'active'
WHERE status IS NULL;

-- 6. Enable RLS if not already enabled
ALTER TABLE public.sample_feature ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policy if not exists
DROP POLICY IF EXISTS "sample_feature_select_by_restaurant" ON public.sample_feature;
CREATE POLICY "sample_feature_select_by_restaurant"
  ON public.sample_feature
  FOR SELECT
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM public.gm_restaurant_members
      WHERE user_id = auth.uid()
    )
  );

-- 8. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sample_feature TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sample_feature_count(UUID) TO authenticated;

-- 9. Metadata tracking
INSERT INTO public.schema_metadata (key, value)
VALUES ('migration_sample_feature_20260305', 'applied')
ON CONFLICT (key) DO UPDATE SET value = 'applied';

COMMIT;
```

**Running migrations**:

```bash
# Local development
docker compose -f docker-compose.core.yml down -v
docker compose -f docker-compose.core.yml up

# Or via psql directly
psql -d chefiapp_core -f migrations/20260305_sample_feature.sql

# Staging/Production (via CI/CD)
supabase db push
```

---

## 3. SEED DATA SCRIPT (Minimal)

`docker-core/schema/seeds_dev.sql`:

```sql
-- =============================================================================
-- MINIMAL SEED DATA for Development
-- =============================================================================

BEGIN;

-- 1. One test organization
INSERT INTO public.gm_organizations (name, slug, owner_id, plan_tier)
VALUES (
  'Dev Restaurant Group',
  'dev-restaurant-group',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'trial'
)
ON CONFLICT (slug) DO NOTHING
RETURNING id AS v_org_id \gset

-- 2. Org member (owner)
INSERT INTO public.gm_org_members (org_id, user_id, role)
VALUES (
  :'v_org_id'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'owner'
)
ON CONFLICT DO NOTHING;

-- 3. One test restaurant
INSERT INTO public.gm_restaurants (org_id, name, status)
VALUES (
  :'v_org_id'::uuid,
  'Dev Restaurant',
  'active'
)
ON CONFLICT (slug) DO NOTHING
RETURNING id AS v_restaurant_id \gset

-- 4. Restaurant member (staff)
INSERT INTO public.gm_restaurant_members (restaurant_id, user_id, role)
VALUES (
  :'v_restaurant_id'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'staff'
)
ON CONFLICT DO NOTHING;

-- 5. Categories
DO $$
DECLARE
  v_drinks_cat UUID;
  v_food_cat UUID;
BEGIN
  INSERT INTO public.gm_menu_categories (restaurant_id, name, sort_order)
  VALUES (
    :'v_restaurant_id'::uuid,
    'Drinks',
    0
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_drinks_cat;

  INSERT INTO public.gm_menu_categories (restaurant_id, name, sort_order)
  VALUES (
    :'v_restaurant_id'::uuid,
    'Food',
    1
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_food_cat;

-- 6. Products
  INSERT INTO public.gm_products (
    restaurant_id, category_id, name, price_cents,
    prep_time_seconds, prep_category, station
  )
  VALUES
    (:'v_restaurant_id'::uuid, v_drinks_cat, 'Coffee', 250, 45, 'drink', 'BAR'),
    (:'v_restaurant_id'::uuid, v_drinks_cat, 'Juice', 350, 30, 'drink', 'BAR'),
    (:'v_restaurant_id'::uuid, v_food_cat, 'Pasta Carbonara', 1200, 600, 'main', 'KITCHEN'),
    (:'v_restaurant_id'::uuid, v_food_cat, 'Grilled Fish', 1800, 900, 'main', 'KITCHEN')
  ON CONFLICT DO NOTHING;
END $$;

-- 7. Tables
DO $$
BEGIN
  FOR i IN 1..4 LOOP
    INSERT INTO public.gm_tables (restaurant_id, number, status)
    VALUES (
      :'v_restaurant_id'::uuid,
      i,
      'available'
    )
    ON CONFLICT (restaurant_id, number) DO NOTHING;
  END LOOP;
END $$;

-- 8. Billing plans
INSERT INTO public.billing_plans (id, name, tier, price_cents, max_devices)
VALUES
  ('trial', 'Trial', 'trial', 0, 2),
  ('starter', 'Starter', 'starter', 4900, 3),
  ('pro', 'Pro', 'pro', 9900, 10)
ON CONFLICT DO NOTHING;

-- 9. Subscription
INSERT INTO public.merchant_subscriptions (restaurant_id, plan_id, status)
VALUES (
  :'v_restaurant_id'::uuid,
  'trial',
  'trialing'
)
ON CONFLICT (restaurant_id) DO NOTHING;

COMMIT;
```

---

## 4. INTEGRATION TEST SCRIPT

`scripts/test-integration.sh`:

```bash
#!/usr/bin/env bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:3001}"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:4320}"
INTERNAL_TOKEN="${INTERNAL_TOKEN:-chefiapp-internal-token-dev}"

echo "=========================================="
echo "ChefIApp Integration Tests"
echo "=========================================="
echo "API URL: $API_URL"
echo "Gateway: $GATEWAY_URL"
echo ""

# Test 1: Health check
echo -n "Test 1: Health check... "
if curl -sf "${API_URL}/rest/v1/" > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
  echo "PostgREST not responding at $API_URL"
  exit 1
fi

# Test 2: Auth (login)
echo -n "Test 2: Auth (sign up + login)... "
RESPONSE=$(curl -s -X POST "${API_URL}/auth/v1/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test-'$(date +%s)'@test.com",
    "password":"TestPassword123!"
  }')

JWT=$(echo "$RESPONSE" | jq -r '.session.access_token // empty')
if [[ -z "$JWT" ]]; then
  echo -e "${RED}✗${NC}"
  echo "Auth failed: $RESPONSE"
  exit 1
fi
echo -e "${GREEN}✓${NC}"

# Test 3: RLS (list organizations)
echo -n "Test 3: RLS (query organizations)... "
ORGS=$(curl -s "${API_URL}/rest/v1/gm_organizations" \
  -H "Authorization: Bearer $JWT")

org_count=$(echo "$ORGS" | jq 'length')
echo -e "${GREEN}✓${NC} (found $org_count org(s))"

# Test 4: Create organization
echo -n "Test 4: Create organization (RPC)... "
ORG=$(curl -s -X POST "${API_URL}/rpc/create_onboarding_context" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "p_name":"Test Restaurant",
    "p_user_id":"'$(echo $JWT | jq -r '.sub')'"
  }')

ORG_ID=$(echo "$ORG" | jq -r '.org_id // empty')
RESTAURANT_ID=$(echo "$ORG" | jq -r '.restaurant_id // empty')

if [[ -z "$ORG_ID" ]] || [[ -z "$RESTAURANT_ID" ]]; then
  echo -e "${RED}✗${NC}"
  echo "Create org failed: $ORG"
  exit 1
fi
echo -e "${GREEN}✓${NC} (org=$ORG_ID, restaurant=$RESTAURANT_ID)"

# Test 5: Create order
echo -n "Test 5: Create order (transactional)... "

# Get a product ID (from seed)
PRODUCTS=$(curl -s "${API_URL}/rest/v1/gm_products?restaurant_id=eq.$RESTAURANT_ID" \
  -H "Authorization: Bearer $JWT")

PRODUCT_ID=$(echo "$PRODUCTS" | jq -r '.[0].id // empty')
if [[ -z "$PRODUCT_ID" ]]; then
  echo -e "${YELLOW}~${NC} (No products, skipping)"
else
  ORDER=$(curl -s -X POST "${API_URL}/rpc/create_order_atomic" \
    -H "Authorization: Bearer $JWT" \
    -H "Content-Type: application/json" \
    -d '{
      "p_restaurant_id":"'$RESTAURANT_ID'",
      "p_items":[{"product_id":"'$PRODUCT_ID'","quantity":1,"unit_price":1200}],
      "p_payment_method":"cash"
    }')

  ORDER_ID=$(echo "$ORDER" | jq -r '.id // empty')
  if [[ -z "$ORDER_ID" ]]; then
    echo -e "${RED}✗${NC}"
    echo "Order creation failed: $ORDER"
    exit 1
  fi
  echo -e "${GREEN}✓${NC} (order=$ORDER_ID)"
fi

# Test 6: Webhook ingest
echo -n "Test 6: Webhook ingest... "
WEBHOOK=$(curl -s -X POST "${GATEWAY_URL}/internal/events" \
  -H "X-Internal-Token: $INTERNAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event":"payment.confirmed",
    "provider":"sumup",
    "data":{
      "order_id":"'$ORDER_ID'",
      "amount_cents":1200,
      "payment_method":"card"
    }
  }')

WEBHOOK_STATUS=$(echo "$WEBHOOK" | jq -r '.status // empty')
if [[ "$WEBHOOK_STATUS" != "queued" ]] && [[ "$WEBHOOK_STATUS" != "success" ]]; then
  echo -e "${YELLOW}~${NC} (webhook response: $WEBHOOK_STATUS)"
else
  echo -e "${GREEN}✓${NC}"
fi

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✓ All tests passed!${NC}"
echo "=========================================="
```

**Run**:

```bash
bash scripts/test-integration.sh
```

---

## 5. FOLDER STRUCTURE GUIDE

Create this directory tree for clean organization:

```
chefiapp-pos-core/
│
├── ARCHITECTURE_SAAS.md                   ← You are here
├── IMPLEMENTATION_SCRIPTS.md              ← This file (scripts & SQL)
│
├── docker-core/
│   ├── schema/
│   │   ├── 01-core-schema.sql            (base tables: restaurants, orders)
│   │   ├── 02-seeds-dev.sql              (seed data)
│   │   ├── 03-migrations-consolidated.sql (task engine, prep times)
│   │   ├── 04-modules-and-extras.sql     (event store, legal seals)
│   │   ├── 05-device-kinds.sql           (TPV, KDS device types)
│   │   ├── 06-seed-enterprise.sql        (enterprise seed)
│   │   ├── 07-role-anon.sql              (PostgREST roles)
│   │   │
│   │   └── migrations/                   (numbered, one per feature)
│   │       ├── 20260304_gm_organizations.sql            [DAY 2]
│   │       ├── 20260305_rls_hardening.sql               [DAY 2]
│   │       ├── 20260127_onboarding_persistence.sql      [DAY 3]
│   │       ├── 20260209_integration_webhook_events.sql  [DAY 4]
│   │       ├── 20260301_webhook_out_config.sql          [DAY 5]
│   │       ├── 20260222_merchant_subscriptions.sql      [DAY 4]
│   │       └── 20260305_audit_logs.sql                  [DAY 6]
│   │
│   ├── docker-compose.core.yml           (postgres + postgrest + nginx)
│   └── nginx.conf                        (reverse proxy: / → postgrest/)
│
├── server/                               (Node.js workers, Render:4320)
│   ├── integration-gateway.ts            (webhook receiver + relay)
│   ├── imageProcessor.ts
│   └── minioStorage.ts
│
├── merchant-portal/                      (Frontend, Vercel)
│   └── src/
│       ├── onboarding-core/              (9-screen startup flow)
│       │   ├── OnboardingPage1.tsx       (location)
│       │   ├── OnboardingPage2.tsx       (hours)
│       │   ├── OnboardingPage3.tsx       (shift setup)
│       │   ├── OnboardingPage4.tsx       (products)
│       │   ├── OnboardingPage5.tsx       (tables)
│       │   ├── OnboardingPage6.tsx       (team)
│       │   ├── OnboardingPage7.tsx       (payment provider)
│       │   ├── OnboardingPage8.tsx       (TPV preview)
│       │   └── OnboardingPage9.tsx       (launch)
│       │
│       ├── pages/
│       │   ├── Onboarding/
│       │   │   ├── OnboardingWelcomePage.tsx
│       │   │   ├── OnboardingLocationPage.tsx
│       │   │   └── ...
│       │   ├── TPVPage.tsx               (main POS)
│       │   ├── BillingPage.tsx           (subscriptions)
│       │   ├── TeamPage.tsx              (staff management)
│       │   └── DashboardPage.tsx         (analytics)
│       │
│       ├── context/
│       │   ├── RestaurantRuntimeContext.tsx  (global state)
│       │   └── OnboardingContext.tsx         (9-screen state)
│       │
│       ├── services/
│       │   ├── api.ts                   (PostgREST client wrapper)
│       │   ├── auth.ts                  (Supabase Auth)
│       │   └── webhooks.ts              (webhook config UI)
│       │
│       └── routes/
│           ├── AuthRoutes.tsx           (login, signup)
│           ├── OnboardingRoutes.tsx     (9-screen flow)
│           └── AppRoutes.tsx            (TPV, billing, etc)
│
├── migrations/
│   ├── README.md                        (how to run migrations)
│   ├── 20260304_gm_organizations.sql    (symlink/copy from docker-core)
│   ├── 20260209_integration_webhook_events.sql
│   └── ... (other migrations)
│
├── scripts/
│   ├── README.md                        (usage guide)
│   ├── core/
│   │   ├── health-check-core.sh         (verify local stack)
│   │   └── diagnose-postgrest-schema.sh (RLS + schema validation)
│   │
│   ├── test-integration.sh              (full end-to-end test)
│   ├── smoke-test.sh                    (production quick test)
│   ├── seed-db.sh                       (run seed data)
│   └── migrate.sh                       (run migrations)
│
├── docs/
│   ├── ONBOARDING_FLOW.md               (9-screen UX spec)
│   ├── RLS_POLICIES.md                  (detailed RLS design)
│   ├── WEBHOOK_SPEC.md                  (webhook format + examples)
│   ├── API_ENDPOINTS.md                 (PostgREST + RPC reference)
│   └── DEPLOYMENT.md                    (Vercel + Render + Supabase)
│
├── docker-compose.yml                   (all services for dev)
├── Makefile                             (convenience targets)
├── vercel.json                          (Vercel config)
├── render.yaml                          (Render config)
└── package.json
```

---

## 6. MAKEFILE SHORTCUTS

Create `Makefile`:

```makefile
.PHONY: help up down logs test migrate seed clean

help:
	@echo "ChefIApp SaaS Development Commands"
	@echo "===================================="
	@echo "make up              - Start local services (docker-compose)"
	@echo "make down            - Stop services"
	@echo "make logs            - Tail service logs"
	@echo "make test            - Run integration tests"
	@echo "make migrate         - Run database migrations"
	@echo "make seed            - Seed test data"
	@echo "make clean           - Remove volumes + containers"
	@echo "make build           - Build Docker images"

up:
	docker compose -f docker-compose.core.yml up -d
	@echo "✅ Services started"

down:
	docker compose -f docker-compose.core.yml down
	@echo "✅ Services stopped"

logs:
	docker compose -f docker-compose.core.yml logs -f

test:
	bash scripts/test-integration.sh

migrate:
	@echo "Running migrations..."
	for f in migrations/*.sql; do \
		echo "Applying $$f..."; \
		psql -d chefiapp_core -f "$$f"; \
	done
	@echo "✅ Migrations complete"

seed:
	psql -d chefiapp_core -f docker-core/schema/seeds_dev.sql
	@echo "✅ Seed data loaded"

clean:
	docker compose -f docker-compose.core.yml down -v
	@echo "✅ Clean complete (volumes removed)"

build:
	docker compose -f docker-compose.core.yml build
	@echo "✅ Images built"
```

**Usage**:

```bash
make up
make migrate
make seed
make test
make down
```

---

## 7. ENV VARIABLES CHECKLIST

### Local Development

```bash
# .env.local
VITE_API_BASE=http://localhost:3001
VITE_SUPABASE_URL=http://localhost:3001
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# server/
NODE_ENV=development
PORT=4320
CORE_URL=http://localhost:3001
CORE_SERVICE_KEY=<jwt-service-role>
INTERNAL_API_TOKEN=chefiapp-internal-token-dev
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_STARTER=price_xxx
```

### Staging

```bash
# Vercel preview environment
VITE_API_BASE=https://staging-api.chefiapp.pt
VITE_SUPABASE_URL=https://staging.supabase.co
VITE_SUPABASE_ANON_KEY=<staging-anon-key>
```

### Production

```bash
# Vercel production
VITE_API_BASE=https://api.chefiapp.pt
VITE_SUPABASE_URL=https://prod.supabase.co
VITE_SUPABASE_ANON_KEY=<prod-anon-key>

# Render production backend
CORE_URL=https://api.chefiapp.pt
CORE_SERVICE_KEY=<prod-service-jwt>
STRIPE_SECRET_KEY=sk_live_...
```

---

## 8. CI/CD INTEGRATION (GitHub Actions)

Create `.github/workflows/test.yml`:

```yaml
name: Test & Lint

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: chefiapp_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Run migrations
        run: pnpm run migrate:test
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/chefiapp_test

      - name: Run tests
        run: pnpm run test
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/chefiapp_test

      - name: Run linter
        run: pnpm run lint

      - name: Check types
        run: pnpm run type-check
```

---

## 9. QUICK REFERENCE: COMMON QUERIES

### List all organizations for a user

```sql
SELECT o.* FROM public.gm_organizations o
JOIN public.gm_org_members m ON o.id = m.org_id
WHERE m.user_id = '<user_id>';
```

### Count active orders by restaurant (today)

```sql
SELECT
  restaurant_id,
  COUNT(*) as order_count,
  SUM(total_cents) / 100.0 as revenue_eur
FROM public.gm_orders
WHERE restaurant_id = '<restaurant_id>'
  AND DATE(created_at) = CURRENT_DATE
GROUP BY restaurant_id;
```

### Find slow webhook deliveries

```sql
SELECT
  config_id,
  delivery_id,
  (attempted_at::timestamp - created_at::timestamp) as latency_seconds,
  status_code
FROM public.webhook_out_delivery_log
WHERE attempted_at > NOW() - INTERVAL '7 days'
  AND (attempted_at::timestamp - created_at::timestamp) > INTERVAL '5 seconds'
ORDER BY latency_seconds DESC
LIMIT 20;
```

### Duplciate webhook detection (idempotency)

```sql
SELECT
  idempotency_key,
  COUNT(*) as duplicates
FROM public.integration_webhook_events
WHERE received_at > NOW() - INTERVAL '24 hours'
GROUP BY idempotency_key
HAVING COUNT(*) > 1;
```

---

**Document Version**: 1.0
**Last Updated**: 2026-02-21
