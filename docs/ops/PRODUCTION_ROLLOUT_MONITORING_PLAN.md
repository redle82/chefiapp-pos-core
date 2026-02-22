# 📊 PRODUCTION ROLLOUT MONITORING PLAN

**Status:** READY FOR DEPLOYMENT
**Release Gate:** ✅ PASSED
**Date:** 2026-02-22
**Target:** First Production Launch (Zero-Downtime)

---

## 🎯 ROLLOUT STRATEGY

**Type:** Phased Progressive Rollout
**Duration:** 48h monitoring window
**Rollback Plan:** Instant (Vercel previous deployment)

### Phases

1. **Phase 0 (T+0h):** Deploy to production, no traffic yet
2. **Phase 1 (T+1h):** Internal testing (1-2 devices)
3. **Phase 2 (T+6h):** Pilot customers (3-5 devices)
4. **Phase 3 (T+24h):** Full rollout (all customers)
5. **Phase 4 (T+48h):** Monitoring wind-down, normal operations

---

## ✅ PRE-FLIGHT CHECKLIST

### Environment Validation

- [ ] **Sentry DSN configured** (`VITE_SENTRY_DSN`)
- [ ] **Sourcemaps upload enabled** (`VITE_SENTRY_AUTH_TOKEN`)
- [ ] **Production Supabase connected** (verify `VITE_SUPABASE_URL`)
- [ ] **Environment mode** = `production`
- [ ] **Browser-block guard active** (verify BrowserBlockGuard in `/op/tpv`, `/op/kds`, `/app/staff`)

### Release Gate Verification

- [ ] ✅ **`audit:release:portal` passed** (420/422 tests)
- [ ] ✅ **TypeScript compilation clean** (0 errors)
- [ ] ✅ **Law validation passed** (0 errors, 1 non-blocking warning)
- [ ] ✅ **Web E2E audit passed** (preview invariants validated)
- [ ] ✅ **Browser-block enforcement tested** (5/5 tests passing)

### Infrastructure

- [ ] **Vercel production project ready**
- [ ] **Custom domain configured** (if applicable)
- [ ] **SSL certificates valid**
- [ ] **Vercel Analytics enabled**
- [ ] **Supabase production tier confirmed** (check connection limits)

### Observability Stack

- [ ] **Sentry project created** (`chefiapp/merchant-portal`)
- [ ] **Sentry alerts configured:**
  - [ ] Error rate > 5% (critical)
  - [ ] New unhandled error (high)
  - [ ] Performance degradation (medium)
- [ ] **Vercel Speed Insights enabled**
- [ ] **Real User Monitoring (RUM) active**

---

## 📈 CRITICAL METRICS TO WATCH

### 1. Error Rates (Sentry)

**Target:** < 1% error rate
**Warning:** 1-5% error rate
**Critical:** > 5% error rate

**Monitor:**

- Unhandled exceptions
- React ErrorBoundary triggers
- Network request failures (Core RPC, Supabase)
- Device-only enforcement violations (should be 0)

**Dashboard:** https://sentry.io/organizations/chefiapp/issues/

**Actions:**

- **< 1%:** Normal operations ✅
- **1-5%:** Investigate patterns, monitor closely ⚠️
- **> 5%:** Consider rollback, escalate 🚨

---

### 2. Performance Metrics (Vercel Speed Insights)

**Targets (Core Web Vitals):**

- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

**Monitor:**

- Page load times (TPV, KDS, AppStaff entry points)
- Time to Interactive
- Bundle size impact
- React hydration time

**Dashboard:** Vercel Analytics → Speed Insights

**Actions:**

- **All green:** Continue rollout ✅
- **1-2 yellow:** Document, plan optimization ⚠️
- **Any red:** Investigate immediately 🚨

---

### 3. Device-Only Enforcement (Critical)

**Target:** 0 browser access attempts on operational modules
**Warning:** 1-5 attempts (could be user confusion)
**Critical:** > 5 attempts (enforcement failure)

**Monitor:**

- Sentry breadcrumbs: `BrowserBlockScreen` renders
- Analytics events: `browser_block_triggered`
- User reports via support channels

**Test manually:**

1. Open browser → `/op/tpv` → Expect block screen
2. Open browser → `/op/kds` → Expect block screen
3. Open browser → `/app/staff` → Expect block screen
4. Installed PWA → All routes should work

**Actions:**

- **0 attempts:** Enforcement working ✅
- **1-5 attempts:** User education needed ⚠️
- **> 5 attempts:** Bug investigation required 🚨

---

### 4. Core RPC Health (Backend Connectivity)

**Target:** > 99% success rate
**Warning:** 95-99% success rate
**Critical:** < 95% success rate

**Monitor:**

- Supabase connection errors
- RPC timeout errors
- Database connection pool saturation
- Auth token refresh failures

**Key Endpoints:**

- `gm_active_table_list()`
- `gm_order_confirm()`
- `gm_payment_register()`
- `gm_product_availability_update()`

**Dashboard:** Supabase Dashboard → Logs & Metrics

**Actions:**

- **> 99%:** Healthy ✅
- **95-99%:** Check connection limits ⚠️
- **< 95%:** Potential outage, investigate 🚨

---

### 5. User Journey Tracking (Analytics)

**Critical Flows:**

- **TPV (Point of Sale):** Order creation → Payment → Confirmation
- **KDS (Kitchen):** Order received → In progress → Completed
- **AppStaff:** Order list → Payment modal → Receipt

**Monitor:**

- Funnel drop-offs (where users abandon flow)
- Modal open/close events
- Payment method selection
- Error events by flow step

**Dashboard:** `merchant-portal/src/analytics/track.ts` → dataLayer

**Actions:**

- **< 5% drop-off:** Normal friction ✅
- **5-15% drop-off:** UX investigation ⚠️
- **> 15% drop-off:** Critical UX issue 🚨

---

## 🔍 MONITORING DASHBOARD SETUP

### 1. Sentry Real-Time Dashboard

**URL:** https://sentry.io/organizations/chefiapp/projects/merchant-portal/

**Widgets to add:**

1. Error rate (last 24h)
2. Unhandled exceptions (grouped by component)
3. Performance transactions (p95, p99)
4. Session replay count
5. Top affected users (by error count)

**Filters:**

- Environment: `production`
- Release: `latest`
- Device type: `all`

---

### 2. Vercel Analytics Dashboard

**URL:** Vercel Dashboard → Project → Analytics

**Tabs to monitor:**

1. **Overview:** Request count, error rate, response time
2. **Speed Insights:** Core Web Vitals
3. **Logs:** Real-time function logs
4. **Usage:** Bandwidth, function invocations

---

### 3. Custom Observability Panel (Optional)

**Location:** `merchant-portal/src/pages/Observability.tsx`

**Features:**

- Real-time error count (last 24h)
- Device registration status
- Active sessions by module
- Recent critical logs

**Access:** Admin-only route (`/observability`)

---

## 🚨 INCIDENT RESPONSE PLAYBOOK

### Scenario A: Error Rate Spike (> 5%)

**Symptoms:**

- Sentry alert: "Error rate above threshold"
- Multiple user reports
- Errors clustered by component/route

**Actions:**

1. **Identify:** Check Sentry issues → Group by error type
2. **Scope:** How many users affected? Which routes?
3. **Decision:**
   - If affecting < 10% users → Monitor, hotfix plan
   - If affecting > 10% users → **ROLLBACK**
4. **Rollback:** Vercel → Deployments → "Promote to Production" (previous)
5. **Post-mortem:** Document root cause, add regression test

**Rollback Command:**

```bash
# Via Vercel CLI
vercel rollback <previous-deployment-url> --prod
```

---

### Scenario B: Performance Degradation

**Symptoms:**

- LCP > 4s (was < 2.5s)
- Users report "slow loading"
- Vercel Speed Insights red

**Actions:**

1. **Identify:** Vercel Logs → Check function duration
2. **Check:** Supabase connection pool usage
3. **Decision:**
   - If < 10% users → Document, optimize next sprint
   - If > 50% users → Investigate bundle size, consider rollback
4. **Quick fixes:**
   - Clear Vercel cache: `vercel --prod --force`
   - Check for large bundle chunks
   - Verify CDN serving static assets

---

### Scenario C: Browser-Block Bypass Detected

**Symptoms:**

- Sentry breadcrumb: User accessed `/op/tpv` in browser
- Analytics event: Operational module loaded in non-installed context

**Actions:**

1. **Verify:** Check if BrowserBlockGuard test still passing
2. **Reproduce:** Manual test in browser (should block)
3. **If bypass confirmed:**
   - **IMMEDIATE ROLLBACK** (critical security/architecture violation)
   - Emergency hotfix: Re-apply browser block logic
   - Run full `audit:release:portal` before re-deploy
4. **Prevention:** Add integration test to CI pipeline

---

### Scenario D: Core RPC Failures (< 95% success)

**Symptoms:**

- Sentry errors: "Function not found" or "Connection timeout"
- Users can't create orders, payments fail
- Supabase logs show connection errors

**Actions:**

1. **Check:** Supabase Dashboard → Database → Connections
2. **Identify:**
   - Connection pool exhausted? (increase limit)
   - Database migration issue? (check schema)
   - Network issue? (Vercel → Supabase connectivity)
3. **Quick fix:**
   - Restart Supabase pooler (if available)
   - Scale up Supabase tier temporarily
   - Enable connection pooling (PgBouncer)
4. **Rollback if:** No immediate fix available + affecting orders

---

## 📋 ROLLOUT TIMELINE CHECKLIST

### T+0h (Deployment)

- [ ] Deploy to Vercel production
- [ ] Verify build successful (no errors)
- [ ] Check Sentry sourcemaps uploaded
- [ ] Verify environment variables loaded
- [ ] Run smoke test: Open `/` (should load)

**Go/No-Go Decision:** If build fails, DO NOT PROCEED.

---

### T+1h (Internal Testing)

- [ ] **Install PWA on 2 test devices**
- [ ] Test TPV flow: Create order → Payment → Confirm
- [ ] Test KDS flow: Receive order → Mark complete
- [ ] Test AppStaff flow: View orders → Process payment
- [ ] **Verify browser block:** Open `/op/tpv` in browser (should block)
- [ ] Check Sentry: 0 critical errors

**Go/No-Go Decision:** If any critical errors, ROLLBACK immediately.

---

### T+6h (Pilot Customers)

- [ ] **Select 3-5 pilot restaurants** (pre-notified)
- [ ] Send installation links (PWA)
- [ ] **Active monitoring:**
  - Sentry: Check for new errors every 30 min
  - Vercel: Monitor function duration
  - Analytics: Track order completion rate
- [ ] **Direct support channel** (WhatsApp/Slack with pilots)
- [ ] Collect feedback: Performance, UX, errors

**Go/No-Go Decision:** If error rate > 2% OR performance red, pause rollout.

---

### T+24h (Full Rollout)

- [ ] **Announce general availability**
- [ ] Send installation instructions to all customers
- [ ] **Monitor continuously:**
  - Sentry dashboard (every 2 hours)
  - Vercel analytics (every 4 hours)
  - User support tickets (real-time)
- [ ] **Stand-by for incidents** (on-call developer)
- [ ] Document issues in `PRODUCTION_ISSUES.md`

**Rollback Threshold:** Error rate > 5% OR critical functionality blocked.

---

### T+48h (Stabilization)

- [ ] **Review all incidents** (if any)
- [ ] **Validate metrics:**
  - Error rate < 1% ✅
  - Performance green ✅
  - No browser-block bypasses ✅
  - Core RPC > 99% ✅
- [ ] **Post-launch report:**
  - Total users onboarded
  - Total orders processed
  - Issues resolved
  - Lessons learned
- [ ] **Normal operations:** Reduce monitoring frequency

---

## 📞 EMERGENCY CONTACTS

### Incident Escalation

**Level 1 (Warning):** Monitor, document
**Level 2 (Degraded):** Investigate, prepare hotfix
**Level 3 (Critical):** Rollback immediately

### Support Channels

- **Sentry Alerts:** Email + Slack integration
- **Vercel Notifications:** Deployment status emails
- **Customer Support:** TBD (WhatsApp/Telegram)
- **On-Call Developer:** TBD

---

## 🎓 LESSONS FROM RELEASE GATE

### What Went Well

1. ✅ **Browser-block enforcement hardened** (DEV bypass removed)
2. ✅ **TDD regression test created** (prevents future bypass)
3. ✅ **React duplicate instance issue resolved** (test infrastructure stable)
4. ✅ **Full release audit passed** (420 tests, 0 blockers)

### Risks Mitigated

1. ⚠️ **No DEV exceptions in production** → Architecture integrity maintained
2. ⚠️ **Test runtime now stable** → CI/CD reliable
3. ⚠️ **Preview invariants validated** → URL patterns correct

### Post-Deploy TODO

1. [ ] Add browser-block integration test to CI (e2e validation)
2. [ ] Document Sentry alert response procedures
3. [ ] Create customer onboarding guide (PWA installation)
4. [ ] Set up weekly observability review meeting

---

## 📚 REFERENCES

- **Observability Setup:** [`docs/ops/OBSERVABILITY_SETUP.md`](./OBSERVABILITY_SETUP.md)
- **Monitoring Guide:** [`docs/ops/monitoring.md`](./monitoring.md)
- **Architecture Rules:** [`docs/architecture/SYSTEM_RULE_DEVICE_ONLY.md`](../architecture/SYSTEM_RULE_DEVICE_ONLY.md)
- **Release Audit Status:** [`docs/audit/RELEASE_AUDIT_STATUS.md`](../audit/RELEASE_AUDIT_STATUS.md)

---

## 🔄 ITERATION HISTORY

**v1.0.0** (2026-02-22)

- Initial production rollout plan
- Based on successful release gate pass
- Incorporates browser-block enforcement validation
- Phased rollout strategy (0→1→5→all)

---

**Status:** READY TO EXECUTE ✅
**Next Action:** Deploy to Vercel production → Start T+0h checklist
