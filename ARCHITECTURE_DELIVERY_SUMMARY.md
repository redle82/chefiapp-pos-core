# ChefIApp SaaS Architecture — Executive Delivery

**Entregáveis Completos**: 3 documentos + estrutura pronta para produção

---

## 📋 DOCUMENTS DELIVERED

### 1. **ARCHITECTURE_SAAS.md** (12 sections, ~4000 words)

Visão completa da arquitetura SaaS production-ready:

- ✅ Diagrama: Front(Vercel) → Supabase → Render Workers
- ✅ Multi-tenancy: organizations → restaurants → orders (RLS-based)
- ✅ Auth flow: Keycloak → Supabase JWT → RLS policies
- ✅ Onboarding: 9-screen UX + state machine (no-org → /welcome)
- ✅ Webhooks: SumUp inbound + HMAC relay outbound
- ✅ Event sourcing: immutable event_store + legal seals
- ✅ Checklist 7-day: dia-a-dia, riscos, métricas
- ✅ RLS hardening: snippets prontos para copiar/colar
- ✅ Deploy topology: Vercel + Supabase + Render
- ✅ Monitoramento: alertas + métricas críticas

### 2. **IMPLEMENTATION_SCRIPTS.md** (9 sections, ~3000 words)

SQL + scripts prontos para produção:

- ✅ 4 RLS policy sets (organizations, restaurants, orders, +1)
- ✅ Template migration idempotent (DO $$ IF NOT EXISTS $$)
- ✅ Seed data mínimo (1 org + 1 restaurante + 4 tables)
- ✅ Test integration script bash (6 testes, HMAC, RLS)
- ✅ Folder structure guide (migrations/, scripts/, server/, docs/)
- ✅ Makefile shortcuts (make up, make test, make migrate)
- ✅ ENV variables checklist (dev/staging/prod)
- ✅ GitHub Actions CI/CD (test + lint + type-check)
- ✅ Common SQL queries (analytics, webhook tracking)

### 3. **IMPLEMENTATION_CHECKLIST.md** (Executive check-in)

7-day timeline + risk mitigation:

- ✅ Dia-a-dia: o que fazer, quantas horas, critérios de sucesso
- ✅ Riscos: RLS bugs, webhook timeout, connection pool, rate limits
- ✅ Métricas: uptime 99%, auth success, latency p99 < 200ms
- ✅ Dry-run script (health check antes de começar)
- ✅ Go/no-go decision point (Day 3)
- ✅ Handoff checklist (ops/support)

---

## 🏗️ ARCHITECTURE DECISIONS (Objectives, No Fluff)

### Vercel for Frontend ✅

- **Why**: Auto-scale, CDN, edge functions, zero-config deploys
- **Not**: Firebase Hosting (less customizable), AWS (more ops work)

### Supabase PostgreSQL + PostgREST ✅

- **Why**: Managed Postgres 15, auto REST API, built-in JWT + RLS
- **Not**: Firebase FS (document-based, bad for relational), MongoDB (lacks RLS)

### Render for Workers ✅

- **Why**: Simple GitHub integration, webhook receiver, cheap ($7-20/mo), cron support
- **Not**: AWS Lambda (min latency 50ms w/ invocation), Vercel Functions (stateless only)

### Event-Sourcing Foundation ✅

- **Why**: Immutable audit trail (regulatory), replay/recovery, time-travel analytics
- **Not**: Traditional CRUD (can't replay state, audit nightmare)

### Idempotent Webhooks ✅

- **Why**: Network failures cause duplicate deliveries, at-least-once guarantee
- **Not**: Exactly-once (requires distributed consensus, AWS SQS overkill)

---

## 📊 MULTI-TENANCY MODEL

```
gm_organizations (1)
  ├─ id, slug, owner_id, plan_tier ('trial'|'starter'|'pro'|'enterprise')
  ├─ max_restaurants (from billing_plans)
  └─ metadata

gm_org_members (N)
  ├─ org_id (FK)
  ├─ user_id (Keycloak)
  ├─ role: 'owner' | 'admin' | 'billing' | 'viewer'

gm_restaurants (N per org)
  ├─ org_id (FK)
  ├─ status: 'draft' | 'active' | 'paused'
  ├─ onboarding_completed_at

gm_orders (N per restaurant)
  └─ restaurant_id → RLS policy checks membership
```

**RLS Enforcement**: User can ONLY see rows where:

```sql
restaurant_id IN (SELECT id FROM gm_restaurants
  WHERE org_id IN (SELECT org_id FROM gm_org_members
    WHERE user_id = auth.uid()))
```

---

## 🔐 AUTH & ONBOARDING FLOW

### Login Path

```
User → /app/staff/home
├─ No JWT → Redirect /login → Supabase hosted
├─ Keycloak SSO or email/password
└─ JWT issued, stored in localStorage
```

### Onboarding State Machine

```
No org
  ↓
/welcome
  ├─ "Create Restaurant" → POST /rpc/create_onboarding_context
  │  └─ Creates: org + org_members + restaurant + onboarding_state
  │
  ├─ 9-screen flow
  │  ├─ Location (name, address, phone)
  │  ├─ Hours (open/close)
  │  ├─ Shift setup (cash registers, payment methods)
  │  ├─ First product
  │  ├─ Table layout (QR auto-generated)
  │  ├─ Team invite (email staff)
  │  ├─ Payment provider (SumUp, Stripe)
  │  ├─ TPV preview (demo order)
  │  └─ Launch (set status='active')
  │
  └─ /app/staff/home (TPV operational)
```

---

## 🔔 WEBHOOKS & EVENT BUS

### Inbound (SumUp → integration-gateway → DB)

```
1. SumUp webhook: POST /api/v1/webhook/sumup
2. HMAC verification (webhook secret)
3. Transform → standard event format
4. POST /internal/events (with INTERNAL_API_TOKEN)
5. Persist to integration_webhook_events table
6. RPC process_webhook_event (idempotent, on-conflict-upsert)
7. Update gm_orders.payment_status = 'PAID'
8. Emit to Webhooks OUT (if configured)
```

### Outbound (Order created → client webhook)

```
1. INSERT gm_orders triggers event
2. Query webhook_out_config for restaurant
3. Filter by subscribed events: [] = all, or ["order.created", ...]
4. Compute HMAC-SHA256 signature
5. POST to client's webhook URL with:
   - X-Chefiapp-Signature: sha256=...
   - X-Chefiapp-Delivery-Id: wh_evt_...
   - X-Chefiapp-Timestamp: Unix timestamp
6. Log attempt + response to webhook_out_delivery_log
7. Retry on 5xx (exponential backoff: 1s, 2s, 4s, max 4 attempts)
```

---

## 📦 IDEMPOTENT MIGRATIONS

Every migration in `/migrations/` uses:

```sql
-- Create table if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
    WHERE table_name = 'new_table') THEN
    CREATE TABLE ...;
  END IF;
END $$;

-- Add column if not exists
ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_... ON ...;
```

**Execution**: Docker entrypoint runs all migrations in order (sorted by filename).

**Safety**: Can re-run any migration multiple times (no errors).

---

## 🚀 7-DAY IMPLEMENTATION PLAN

| Day       | Focus                  | Hours   | Success Metric                       |
| --------- | ---------------------- | ------- | ------------------------------------ |
| **1**     | Auth + Health Check    | 2.5h    | PostgREST responds ✅                |
| **2**     | Multi-tenancy + RLS    | 3.5h    | User A ≠ User B data ✅              |
| **3**     | Onboarding 9-screen    | 4.5h    | Users reach "active" ✅              |
| **4**     | Webhooks Inbound       | 4h      | Payment webhook → order paid ✅      |
| **5**     | Webhooks Outbound      | 3h      | Event relayed w/ HMAC ✅             |
| **6**     | Testing + Monitoring   | 4h      | All tests pass, dashboard up ✅      |
| **7**     | Smoke Test + Load Test | 5.5h    | p99 < 200ms, 100 concurrent users ✅ |
| **TOTAL** |                        | **27h** | Production-ready ✅                  |

**Risk Mitigation**:

- Day 3 go/no-go: If onboarding broken, pause before webhooks
- Daily: Check logs for errors, adjust timeline if needed
- Buffer: Day 7 has 1.5h contingency for blockers

---

## 📊 MONITORING & ALERTS

**Key Metrics** (Grafana/Datadog):

```
PostgREST:
  - p50, p99 latency
  - Error rate (5xx)
  - Active connections

Webhooks:
  - Delivery success rate (%)
  - Retry count distribution
  - Processing time (SumUp → update)

Database:
  - Slow queries (> 1s)
  - Connection pool saturation
  - RLS policy evaluation time

Business:
  - Orders created/min
  - Payment success rate
  - Onboarding completion rate
```

**Alert Rules**:

- **Warning**: p99_latency > 500ms → log to DataDog
- **Critical**: webhook_success_rate < 95% → page on-call
- **Critical**: RLS_policy_evaluation > 100ms → page DBA

---

## 🔒 SECURITY HARDENING CHECKLIST

- ✅ RLS policies: no `true` (deny-by-default)
- ✅ JWT: verify `iss` + `aud` + expiration
- ✅ Secrets: never in code (env vars, Supabase Vault)
- ✅ CORS: only restaurant domain + merchant portal
- ✅ HTTPS: enforce in production
- ✅ HMAC: verify webhook signatures (constant-time comparison)
- ✅ Audit log: track all user actions
- ✅ Penetration test: RLS bypass attempts

---

## 📁 FOLDER STRUCTURE

```
chefiapp-pos-core/
├── ARCHITECTURE_SAAS.md                  (this you read first)
├── IMPLEMENTATION_SCRIPTS.md             (SQL templates)
├── IMPLEMENTATION_CHECKLIST.md           (day-by-day timeline)
│
├── docker-core/schema/
│   ├── 01-core-schema.sql                (gm_restaurants, gm_orders)
│   ├── migrations/
│   │   ├── 20260304_gm_organizations.sql ← ALREADY EXISTS
│   │   ├── 20260209_integration_webhook_events.sql ← ALREADY EXISTS
│   │   └── 20260305_audit_logs.sql       (to create)
│   └── docker-compose.core.yml
│
├── server/integration-gateway.ts         (webhook receiver, Render:4320)
├── merchant-portal/src/onboarding-core/  (9-screen flow)
├── migrations/                           (symlinks to docker-core)
├── scripts/
│   ├── test-integration.sh               (full E2E test)
│   └── smoke-test.sh                     (prod quick-check)
├── docs/
│   ├── WEBHOOK_SPEC.md
│   ├── RLS_POLICIES.md
│   └── DEPLOYMENT_RUNBOOK.md
└── Makefile                              (make up, make test)
```

---

## ✅ SIGN-OFF CHECKLIST

**By COB Day 7, verify**:

- [ ] Smoke test passed (signup → menu → order → payment → delivery)
- [ ] Load test: p99 latency < 200ms @ 100 concurrent users
- [ ] Security audit: RLS denies public queries, zero data leakage
- [ ] Webhook delivery: 99%+ success rate (check logs)
- [ ] Onboarding completion: >= 80% of test users reaching "active"
- [ ] Documentation: runbooks, API reference, troubleshooting
- [ ] Monitoring: dashboards up, alerts configured
- [ ] Ops handoff: runbook, on-call rotation, incident plan

---

## 🎯 KEY DECISIONS LOCKED IN

1. **Vercel** for Frontend (React + Next.js, auto-scale, CDN)
2. **Supabase PostgreSQL** for Database (managed, RLS, OAuth, Realtime)
3. **Render** for Workers (webhook gateway, simple deploy, cheap)
4. **Event-Sourcing** for Audit Trail (immutability, replay, compliance)
5. **Idempotent Webhooks** for Reliability (at-least-once + deduplication)
6. **Organization-based** Multi-Tenancy (vs. user-based or schema-per-tenant)
7. **RLS Policies** for Isolation (not app-layer filtering)
8. **Async Webhooks** for Scalability (not sync callback)

**Not Changing These After Day 1** → Lock in architecture now.

---

## 📞 SUPPORT

### If stuck on...

| Issue             | Check                     | Doc                                         |
| ----------------- | ------------------------- | ------------------------------------------- |
| PostgREST down    | Docker logs               | `docker-compose ... logs postgrest`         |
| RLS not working   | auth.uid() null           | Supabase JWT not being set                  |
| Webhook failed    | HMAC signature            | IMPLEMENTATION_SCRIPTS.md §2                |
| Order not created | Constitutional constraint | `idx_one_open_order_per_table` unique index |
| Onboarding loops  | RestaurantRuntimeContext  | Check `mode` vs `status` fields             |

### Escalation

- Supabase support: https://supabase.com/dashboard/support
- Render support: https://render.com/docs
- Vercel support: https://vercel.com/support

---

## 🎉 YOU'RE READY

**Next step**: Read `ARCHITECTURE_SAAS.md` top-to-bottom (30 min).

**Then**: Run `make up && make test` to verify local stack (15 min).

**Then**: Start Day 1 of the 7-day plan.

**Timeline**: 1 week from now, you have production-ready SaaS.

---

**Version**: 1.0 Final
**Delivery Date**: 2026-02-21
**Team**: 2 developers (front + back)
**Status**: 🚀 Ready to build

---

## FILES CREATED

```bash
# Summary of what was delivered
ls -1 /Users/goldmonkey/Projetos/Apps-Proprios/chefiapp-pos-core/ | grep -E "ARCHITECTURE|IMPLEMENTATION"

# Output:
ARCHITECTURE_SAAS.md
IMPLEMENTATION_CHECKLIST.md
IMPLEMENTATION_SCRIPTS.md
```

All 3 documents + existing codebase = **complete SaaS blueprint**.

Boa sorte! 🍀
