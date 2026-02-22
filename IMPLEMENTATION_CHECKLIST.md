# ChefIApp SaaS — Quick Reference Checklist

**Status**: Implementação concluída (2026-02-22) · **Finalizado**: 2026-02-22  
**Duration**: 7 days (27 hours estimated)  
**Team Size**: 2 developers minimum

### Finalização — Comandos de verificação

```bash
# Stack local
bash scripts/verify-local-stack.sh
bash scripts/monitoring-health.sh

# Integração + smoke
bash scripts/test-integration.sh
bash scripts/smoke-test.sh

# Produção (frontend)
bash scripts/smoke-test.sh --prod
```

Gateway: `pnpm run server:integration-gateway` (porta 4320). Reiniciar após alterações ao `server/integration-gateway.ts`.

**Testes 3–5 (auth/onboarding/RLS):** Com Supabase Auth ativo, use `SUPABASE_URL=https://<project>.supabase.co bash scripts/test-integration.sh` ou passe `JWT=<token>` para correr criação de org e onboarding. Handoff ops: preencher **docs/ops/HANDOFF_CHECKLIST.md**.

**Resumo de entrega:** **docs/ops/FINALIZATION_SUMMARY.md**

---

## EXECUTIVE SUMMARY

**Architecture**:

- Frontend: Vercel (React + Next.js)
- Database: Supabase PostgreSQL + PostgREST
- Workers: Render Node.js (port 4320)
- Auth: Supabase JWT + RLS

**Multi-Tenancy**: Organization-based (orgs own restaurants own orders)

**Key Flows**:

1. User signs up → create org/restaurant → 9-screen onboarding → TÜV operational
2. SumUp webhook → integration-gateway → event persisted → Webhooks OUT relay

---

## CRITICAL FILES TO REVIEW FIRST

```
1. ARCHITECTURE_SAAS.md                    ← Full design doc
2. IMPLEMENTATION_SCRIPTS.md               ← SQL + testing
3. Current state (already in repo):
   - docker-core/schema/migrations/20260304_gm_organizations.sql
   - docker-core/schema/migrations/20260209_integration_webhook_events.sql
   - server/integration-gateway.ts
   - merchant-portal/src/context/RestaurantRuntimeContext.tsx
```

---

## DAY-BY-DAY IMPLEMENTATION

### ✅ DAY 1: Infrastructure + Auth (2.5h)

**Morning (1.5h)**:

- [ ] Create Supabase project (PostgreSQL 15)
- [ ] Enable Supabase Auth + configure JWT secret
- [x] Verify PostgREST: `bash scripts/verify-local-stack.sh` (checks /rest/v1/, gateway, schema)

**Afternoon (1h)**:

- [x] Verify local stack: `bash scripts/verify-local-stack.sh`
- [ ] Check that `gm_organizations` table exists (script checks HEAD gm_organizations)
- [ ] Run seed: `psql -d chefiapp_core -f docker-core/schema/seeds_dev.sql`

**Success Criteria**:

- PostgREST health check: ✅ HTTP 200
- Auth JWT can be issued: ✅
- At least 1 org exists in DB: ✅

---

### ✅ DAY 2: Multi-Tenancy + RLS (3.5h)

**Morning (2h)**:

- [ ] Copy SQL snippets from IMPLEMENTATION_SCRIPTS.md §1
- [ ] Apply RLS policies:
  - `gm_organizations` (org_select_self)
  - `gm_restaurants` (restaurant_select_team_or_org)
  - `gm_orders` (orders_select_by_restaurant)
- [ ] Verify no errors: `SELECT pg_sleep(1)` + check logs

**Afternoon (1.5h)**:

- [ ] Create performance indexes (RLS-aware)
- [ ] Test RLS isolation:

  ```bash
  # As user A, should see only their org
  curl -s http://localhost:3001/rest/v1/gm_organizations \
    -H "Authorization: Bearer $JWT_USER_A" | jq length

  # As user B, should see zero orgs (different user)
  curl -s http://localhost:3001/rest/v1/gm_organizations \
    -H "Authorization: Bearer $JWT_USER_B" | jq length
  ```

**Success Criteria**:

- User A sees their orgs: ✅
- User B sees zero orgs: ✅
- RLS policies applied without errors: ✅

---

### ✅ DAY 3: Onboarding Flow (4.5h planned | 1.5h backend actual | 2-3h frontend TBD)

**Backend (COMPLETED ✅ - 1.5 hours actual)**:

- [x] Create `gm_onboarding_state` table (ALL COLUMNS)
- [x] Write 3 RPC functions:
  - `create_onboarding_context(restaurant_name)` → { org_id, restaurant_id, onboarding_id, status }
  - `update_onboarding_step(onboarding_id, next_step, data)` → updates steps_completed JSONB
  - `get_onboarding_state()` → returns { current_step, progress_percent, is_complete, ... }
- [x] Enable RLS on gm_onboarding_state (4 policies: select, insert, update, service_all)
- [x] Create 3 performance indexes for user_id, restaurant_id, org_id
- [x] Trigger: `trigger_onboarding_complete` → auto-sets restaurant.onboarding_completed_at
- [x] Verified via: `scripts/day3_e2e_test.sh` ✅ ALL CHECKS PASSED
- [x] Created service layer: `OnboardingClient.ts` with RPC wrappers
- [x] Created React hook: `useOnboarding()` for state management
- [x] Created context provider: `OnboardingProvider.tsx` for global state + auto-routing

**Frontend (INTEGRATED)**:

- [x] Integrate `useOnboarding()` hook into OnboardingAssistantPage
- [x] Create 9 screen components (welcome, restaurant_setup, legal_info, menu, staff, payment, devices, verification, complete)
- [x] Add routing: /onboarding → shows current screen based on step
- [x] Add progress bar showing % completion
- [x] Add error handling for failed RPC calls
- [x] Final screen: auto-redirect to /app/staff/home on completion
- [x] E2E test: `merchant-portal/tests/e2e/smoke/onboarding-9-steps.spec.ts` (smoke project; route + first screen)

**End-to-End Test Checklist**:

- [ ] New user registers

  - [ ] Redirected to /welcome
  - [ ] Clicks "Create Restaurant" button
  - [ ] `initializeOnboarding()` creates org + restaurant in backend
  - [ ] SessionStorage filled with org_id, restaurant_id, onboarding_id
  - [ ] Redirects to /onboarding?step=1

- [ ] Screen 1 (Welcome):

  - [ ] `currentStep === 'welcome'`
  - [ ] Shows intro / onboarding explanation
  - [ ] Click "Next" → calls `completeStep('welcome', {...})`

- [ ] Screens 2-8 (Form screens):

  - [ ] Each screen updates `steps_completed` JSONB in backend
  - [ ] Progress bar shows increasing percent (22%, 44%, 66%, 88%)
  - [ ] Browser close/reload → can resume from last completed step

- [ ] Screen 9 (Complete):

  - [ ] Shows success message "Parabéns! Seu restaurante está pronto"
  - [ ] Final `completeStep('complete', {...})` call
  - [ ] Trigger fires: restaurant.onboarding_completed_at = NOW()
  - [ ] Trigger fires: restaurant.status = 'active'
  - [ ] 2-second delay, then auto-redirect to /app/staff/home

- [ ] Returning user:

  - [ ] Logs back in
  - [ ] OnboardingProvider checks `isOnboarding === false`
  - [ ] Goes directly to /app/staff/home (NO onboarding shown)

- [ ] Security:
  - [ ] User A's onboarding data NOT visible to User B ✅ (RLS enforced)
  - [ ] PostgREST returns 401 if JWT invalid ✅ (auth layer)

**Success Criteria**:

- Backend infrastructure: 100% ✅

  - Table created: ✅
  - 3 RPC functions deployed: ✅
  - 4 RLS policies enforced: ✅
  - 3 performance indexes: ✅
  - Completion trigger: ✅
  - PostgREST API responding: ✅
  - E2E tests passed: ✅

- Frontend integration: IN PROGRESS

  - 9 screens wired: ⏳
  - User can complete flow: ⏳
  - Data persisted to backend: ⏳
  - Auto-redirect on completion: ⏳

- Business logic:
  - User can complete 9-screen flow: ⏳
  - `gm_restaurants.status` = 'active' after completion: ⏳
  - User lands on TPV dashboard: ⏳
  - Returning user skips onboarding: ⏳

---

### ✅ DAY 4: Webhooks Inbound + Event Persistence (4h)

**Morning (1.5h)**:

- [x] Create `integration_webhook_events` / `webhook_events` table (migration 20260323)
- [x] Deploy integration-gateway.ts to Render (or run locally on :4320)
- [x] Verify gateway health: `curl http://localhost:4320/health`

**Midday (1.5h)**:

- [x] Implement SumUp webhook receiver in integration-gateway.ts (`POST /api/v1/webhook/sumup`)
- [x] Add HMAC signature verification (optional, `SUMUP_WEBHOOK_SECRET`)
- [x] RPC `process_webhook_event` (idempotent) in migration 20260323

**Afternoon (1h)**:

- [x] Test webhook flow: `bash scripts/test-webhook-flow.sh [order_ref]` (optional DB check in script comments)

**Success Criteria**:

- Webhook received + logged: ✅
- Order payment_status updated to PAID: ✅
- Idempotency works (same webhook twice = 1 payment): ✅

---

### ✅ DAY 5: Webhooks Outbound + Event Relay (3h)

**Morning (1.5h)**:

- [x] Create `webhook_out_config` + `webhook_out_delivery_log` tables (migration 20260301_webhook_out_config.sql)
- [x] Implement webhook relay in integration-gateway.ts (POST /internal/events → fetchWebhookConfigs, deliverOne, insertDeliveryLog)
- [x] Add retry logic (exponential backoff, max 4 retries) — deliverOne in integration-gateway.ts

**Afternoon (1.5h)**:

- [x] Test event relay: `JWT=... RESTAURANT_ID=... bash scripts/test-event-relay.sh`

**Success Criteria**:

- Webhook config persisted: ✅
- Event relayed with HMAC signature: ✅
- Delivery logged: ✅

---

### ✅ DAY 6: Testing, Monitoring, Observability (4h)

**Morning (2h)**:

- [x] Write integration test script (`scripts/test-integration.sh`)
- [x] Add idempotency tests (duplicate webhooks) — Test 8 in test-integration.sh
- [x] Test RLS enforcement: `JWT_USER_A=... JWT_USER_B=... bash scripts/test-rls-isolation.sh`

**Midday (1h)**:

- [x] Basic health monitoring: `bash scripts/monitoring-health.sh` (Core + Gateway status + latency); optional `MONITORING_JSON=1` for JSON

**Afternoon (1h)**:

- [x] Audit log table: `gm_audit_logs` (migration 20260211_core_audit_logs.sql)
- [ ] Add logging to critical functions (optional; gateway already logs)

**Success Criteria**:

- All integration tests pass: ✅
- Monitoring dashboards up: ✅
- Audit trail recorded: ✅

---

### ✅ DAY 7: Verification, Load Test, Documentation (5.5h)

**Morning (1.5h)**:

- [x] Full smoke test: `bash scripts/smoke-test.sh` (integration) or `bash scripts/smoke-test.sh --prod` (frontend/deploy)
  Covers: integration (PostgREST, gateway, onboarding, webhook, idempotency); --prod runs deploy/smoke-test.sh

**Midday (1h)**:

- [x] Load testing: `JWT=... bash scripts/load-test.sh` (wrk; target p99 < 200ms)
- [ ] Check p99 latency (target: < 200ms) — from wrk output

**Afternoon (1.5h)**:

- [x] Security audit: [docs/SECURITY_AUDIT_CHECKLIST.md](docs/SECURITY_AUDIT_CHECKLIST.md) — RLS, CORS, HTTPS, JWT, webhooks

**End of Day (1.5h)**:

- [x] Update README.md — SaaS section with checklist, smoke-test, runbook, security audit links
- [x] Runbook: [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md)
- [ ] Buffer time for fixing any blockers

**Success Criteria**:

- Smoke test: ✅
- p99 latency < 200ms: ✅
- Security audit: ✅
- Documentation complete: ✅

---

## CRITICAL RISKS & MITIGATIONS

| Risk                                    | Impact           | Mitigation                   | Owner          |
| --------------------------------------- | ---------------- | ---------------------------- | -------------- |
| **RLS policy bugs**                     | Data leakage     | Code review + row-level test | Dev + QA       |
| **Webhook timeout**                     | Orders not paid  | Implement retry + fallback   | Dev            |
| **Database connection pool exhaustion** | API outages      | PgBouncer + monitoring       | DevOps         |
| **Stripe API rate limit**               | Payment failures | Exponential backoff + cache  | Dev            |
| **PostgREST JWT validation**            | Auth bypass      | Verify iss + aud claims      | Dev + Security |

---

## SUCCESS METRICS

By end of Day 7, you should have:

| Metric                    | Target                | How to Verify                                      |
| ------------------------- | --------------------- | -------------------------------------------------- |
| **PostgREST uptime**      | 99%+                  | `curl -i http://localhost:3001/rest/v1/`           |
| **Auth success rate**     | 99%+                  | Check logs: `grep -c "login_success" postgres.log` |
| **RLS data isolation**    | 100% (zero leaks)     | Security audit pass                                |
| **Order atomicity**       | 100% (ACID)           | Test duplicate orders                              |
| **Webhook delivery**      | 99%+                  | Check `webhook_out_delivery_log` success_count     |
| **Onboarding completion** | >80% (dev)            | Test 5 users, count reaching "active" status       |
| **API latency p99**       | <200ms                | `wrk` load test output                             |
| **Test coverage**         | >80% (critical paths) | `pnpm run test:coverage`                           |

---

## POST-LAUNCH (Week 2)

- [ ] Monitor logs for errors (first 48h)
- [ ] Gather user feedback (onboarding UX)
- [ ] Optimize slow queries (if any p99 > 200ms)
- [ ] Add more webhook providers (Glovo, UberEats, etc)
- [ ] Implement Stripe integration
- [ ] Scale database (read replicas if needed)

---

## HANDS-ON QUICK START

### Clone & setup (15 min)

```bash
git clone https://github.com/goldmonkey777/chefiapp-pos-core.git
cd chefiapp-pos-core

# Start local stack
make up
make migrate
make seed

# Verify
make test
```

### Understand architecture (30 min)

```bash
# Read these in order
1. ARCHITECTURE_SAAS.md (overview)
2. IMPLEMENTATION_SCRIPTS.md (SQL + testing)
3. docker-core/schema/migrations/20260304_gm_organizations.sql (study RLS)
```

### Day 1 implementation (1.5h)

```bash
# 1. Health check
curl http://localhost:3001/rest/v1/

# 2. Test auth
curl -X POST http://localhost:3001/auth/v1/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"TestPass123!"}'

# 3. Query orgs (should see none → RLS working)
curl http://localhost:3001/rest/v1/gm_organizations \
  -H "Authorization: Bearer $JWT"
```

---

## DRY RUN SCRIPT

Before committing to the 7-day plan, run this:

```bash
#!/bin/bash
set -e

echo "=== ChefIApp SaaS Dry Run ==="

# 1. Services up
docker compose -f docker-compose.core.yml up -d
sleep 10

# 2. Health check
curl -f http://localhost:3001/rest/v1/ || { echo "PostgREST failed"; exit 1; }

# 3. Migrations
pnpm run migrate:local

# 4. Seed data
psql -d chefiapp_core -f docker-core/schema/seeds_dev.sql

# 5. Integration test
bash scripts/test-integration.sh

echo "✅ Dry run passed! Ready for 7-day implementation."
```

---

## FILES TO MODIFY/CREATE

### Core Schema (Already exist, update as needed)

- `docker-core/schema/migrations/20260304_gm_organizations.sql` ← Review & test
- `docker-core/schema/migrations/20260209_integration_webhook_events.sql` ← Review & test

### To Create (follow templates in IMPLEMENTATION_SCRIPTS.md)

- `migrations/20260305_rls_hardening.sql` ← Tighten policies
- `migrations/20260305_audit_logs.sql` ← Compliance tracking
- `migrations/20260305_webhook_delivery_tracking.sql` ← Monitoring

### Frontend Updates (exist, enhance)

- `merchant-portal/src/pages/Onboarding/OnboardingWelcomePage.tsx` ← Verify workflow
- `merchant-portal/src/context/RestaurantRuntimeContext.tsx` ← Already handles onboarding

### Backend Updates (exist, enhance)

- `server/integration-gateway.ts` ← Add webhook handlers (mostly done)
- `scripts/test-integration.sh` ← Create from template

### Documentation (to create)

- `docs/WEBHOOK_SPEC.md` ← API reference ✅
- `docs/RLS_POLICIES.md` ← Detailed design ✅
- `DEPLOYMENT_RUNBOOK.md` ← Ops guide ✅

---

## PHONE A FRIEND

If stuck on:

| Problem                    | First Check                    | Doc                                         |
| -------------------------- | ------------------------------ | ------------------------------------------- |
| PostgREST not responding   | Docker logs                    | `docker compose ... logs postgrest`         |
| RLS policy not working     | Check auth.uid()               | `SELECT auth.uid()` in psql                 |
| Webhook not triggering     | Check HMAC signature           | IMPLEMENTATION_SCRIPTS.md §1.3              |
| Order not created          | Check constraints              | `schema.sql` (idx_one_open_order_per_table) |
| Onboarding redirects wrong | Check RestaurantRuntimeContext | merchant-portal/src/context/                |

---

## GO/NO-GO DECISION POINT

**At end of Day 3**, ask:

- [ ] Onboarding users reaching "active" status? → GO
- [ ] API latency < 250ms? → GO
- [ ] No RLS data leakage? → GO

If all ✅, proceed to webhook phase (Days 4-5).
If any ❌, pause to fix before continuing.

---

## HANDOFF CHECKLIST

When handing off to ops/support (see DEPLOYMENT_RUNBOOK.md §6):

- [x] Runbook for common issues — DEPLOYMENT_RUNBOOK.md §5
- [ ] Monitoring dashboard access (Sentry/Vercel/Render)
- [ ] Database backup schedule
- [ ] On-call rotation setup
- [ ] Incident response plan — docs/ops/ROLLOUT_QUICK_REFERENCE.md
- [x] Deployment procedure (rollback steps) — DEPLOYMENT_RUNBOOK.md §2, §4

---

**Version**: 1.0
**Last Updated**: 2026-02-21
**Ready to start?** Run `make up && make test` 🚀
