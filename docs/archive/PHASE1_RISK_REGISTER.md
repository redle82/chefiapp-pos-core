# Phase 1 — Risk Register & Mitigation Plan

**Owner:** Tech Lead + Product  
**Updated:** Weekly  
**Review cadence:** Every sprint + 48h before launch

---

## Risk Assessment Matrix

```
        │  LOW ($)  │ MEDIUM ($$) │ HIGH ($$$)
───────────────────────────────────────────────
LOW     │  Green    │  Yellow     │  Yellow
MEDIUM  │  Yellow   │  Orange     │  Red
HIGH    │  Yellow   │  Red        │  Red
```

---

## Critical Risks (RED — High Probability + High Impact)

### 🔴 R1: Marketplace API Integration Breaks in Production

**Description:** Just Eat / Glovo API behaves differently in production vs sandbox.

**Probability:** Medium (40%)  
**Impact:** Critical (no orders flow)  
**Detection:** 9:30 AM on launch day (metrics show 0 orders for 5+ min)

**Mitigation (PREVENT):**
- [ ] Test against real marketplace sandboxes in Week 3
- [ ] Have backup polling mode ready (webhook + polling hybrid)
- [ ] Keep marketplace API key rotation schedule documented
- [ ] Test OAuth token refresh 5+ times before launch

**Recovery (IF HAPPENS):**
- [ ] Switch marketplace to polling (orders sync every 30s instead of real-time)
- [ ] Contact marketplace support immediately (have escalation contact ready)
- [ ] Notify restaurants: "Slight delay in order sync, we're fixing it"
- [ ] If >30 min not fixed: Disable adapter, continue with other marketplaces

**Owner:** Backend Lead  
**Status:** 🔵 Planning (Week 1)

---

### 🔴 R2: Database Disk Space Runs Out During Launch

**Description:** PostgreSQL runs out of disk; can't write new orders.

**Probability:** Low (10%)  
**Impact:** Critical (system stops)  
**Detection:** Immediate (write errors in logs)

**Mitigation (PREVENT):**
- [ ] Check disk usage daily Week 1–4
- [ ] Clean up old logs/backups weekly
- [ ] Set up disk space alerts (>85% = page ops)
- [ ] Pre-launch: Run full vacuum to defragment

**Recovery (IF HAPPENS):**
- [ ] Check disk usage immediately
- [ ] Delete old log files (safe to delete, can be >5GB)
- [ ] Scale storage (if cloud database)
- [ ] Restart PostgreSQL if needed
- [ ] Resume operations

**Owner:** Ops Lead  
**Status:** 🔵 Planning (Week 1)

---

### 🔴 R3: Load Test Fails; System Crashes Under 50+ Orders/Min

**Description:** Real traffic exceeds capacity; system becomes unresponsive.

**Probability:** Medium (35%)  
**Impact:** Critical (orders lost, customers see errors)  
**Detection:** Week 4 load testing (or worse, launch day)

**Mitigation (PREVENT):**
- [ ] Start load testing in Week 2 (early detection)
- [ ] Target: handle 100+ orders/min (2x launch day expected)
- [ ] Optimize database queries (index slow queries)
- [ ] Add caching layer (Redis) for menu/restaurant data
- [ ] Set up auto-scaling (if using cloud)
- [ ] Benchmark each component (adapter, TPV, KDS)

**Recovery (IF HAPPENS AT LAUNCH):**
- [ ] Enable aggressive database connection pooling
- [ ] Reduce metrics refresh rate (from 5s → 30s)
- [ ] Disable non-critical features (analytics logging)
- [ ] If still failing: Rollback to pre-launch (30 min)

**Owner:** Backend Lead + Ops Lead  
**Status:** 🔵 Planning (Week 2)

---

## High-Risk Items (ORANGE — Medium Probability + High Impact or High Probability + Medium Impact)

### 🟠 R4: OAuth Token Refresh Fails; Restaurants Can't Stay Connected

**Description:** Marketplace OAuth tokens expire; refresh endpoint fails or returns invalid tokens.

**Probability:** Medium (30%)  
**Impact:** High (new orders don't flow, existing ones stuck)  
**Detection:** After 1 week (tokens naturally expire)

**Mitigation (PREVENT):**
- [ ] Implement automatic token refresh (background job)
- [ ] Test token refresh with real marketplace credentials (Week 3)
- [ ] Log all refresh attempts; alert on 3+ failures
- [ ] Build manual "reconnect" button for restaurants

**Recovery (IF HAPPENS):**
- [ ] Send automated email: "Please reconnect your Just Eat account"
- [ ] Provide one-click reconnect link
- [ ] If >5% of restaurants affected: Escalate to marketplace support

**Owner:** Backend Lead  
**Status:** 🟡 At risk (Week 3)

---

### 🟠 R5: Restaurant Onboarding Has Friction; Completion Rate <70%

**Description:** Sign-up form has UX issues; restaurants abandon halfway.

**Probability:** High (50%)  
**Impact:** Medium (slower adoption, but fixable)  
**Detection:** Week 2 beta testing (5–10 restaurants)

**Mitigation (PREVENT):**
- [ ] Test onboarding with 5 actual restaurant owners (Week 2)
- [ ] Measure: Time from sign-up to menu (target: <5 min)
- [ ] A/B test: 1-step vs 3-step onboarding
- [ ] Have phone support ready (call if email not confirmed in 30 min)

**Recovery (IF HAPPENS):**
- [ ] Analyze drop-off point (which step do they quit?)
- [ ] Redesign that step
- [ ] Retest
- [ ] Rollout fix in Week 3 or Week 4 (before mass invite)

**Owner:** Product + Frontend  
**Status:** 🟡 At risk (Week 2)

---

### 🟠 R6: Marketplace Webhook Sends Duplicate Orders

**Description:** Just Eat retries webhook 3+ times; we create duplicate orders.

**Probability:** Medium (40%)  
**Impact:** High (customer confusion, support tickets)  
**Detection:** Week 3 testing or early launch day

**Mitigation (PREVENT):**
- [ ] Implement idempotency key checking (webhook_id)
- [ ] Test webhook retry scenario (simulate marketplace retries)
- [ ] Log all order ingestions with deduplication status

**Recovery (IF HAPPENS):**
- [ ] Detect duplicates using order ID + restaurant + timestamp
- [ ] Automatically cancel/merge duplicate orders
- [ ] Notify restaurant owner: "We detected a duplicate order; it's been handled"
- [ ] Log incident for post-launch analysis

**Owner:** Backend Lead  
**Status:** 🟡 At risk (Week 3)

---

### 🟠 R7: Email Delivery Fails; Restaurants Don't Get Confirmation Links

**Description:** Email provider (Sendgrid) has outage; confirmation emails don't send.

**Probability:** Low (15%)  
**Impact:** High (sign-up blocked for everyone)  
**Detection:** Immediate (first sign-up fails)

**Mitigation (PREVENT):**
- [ ] Have backup email provider configured (AWS SES)
- [ ] Test email sending in Week 2 (real emails to test account)
- [ ] Monitor email delivery rate (alert if >5% fail)
- [ ] Keep email provider support contacts ready

**Recovery (IF HAPPENS):**
- [ ] Switch to backup email provider (config change, 5 min)
- [ ] Resend failed confirmations
- [ ] Notify restaurants: "Confirmation email delayed, resending now"

**Owner:** Backend Lead + Ops  
**Status:** 🟡 At risk (Week 2)

---

## Medium-Risk Items (YELLOW — Low Probability + High Impact or Medium Probability + Medium Impact)

### 🟡 R8: Bug Found After Code Freeze (Feb 24)

**Description:** Critical bug discovered Monday (Feb 24), can't fix before Friday (Feb 28).

**Probability:** Medium (50%)  
**Impact:** Medium (might need 1-week delay)

**Mitigation (PREVENT):**
- [ ] Code freeze Monday (Feb 24) — no new features
- [ ] QA regression testing Tue–Thu (100+ test cases)
- [ ] If bug found: Assess if it blocks launch
- [ ] Priority: Fix in <4 hours or delay launch

**Recovery (IF HAPPENS):**
- [ ] Decide: Is bug critical? (blocks sign-up, orders, payment)
- [ ] If YES: Delay launch to Mar 3 (Monday)
- [ ] If NO: Accept risk, fix in Phase 1.1 (week after launch)

**Owner:** Tech Lead  
**Status:** 🟡 At risk (Week 4)

---

### 🟡 R9: Marketplace Rate Limits Hit; Orders Stop Flowing

**Description:** We hit Just Eat API rate limit (e.g., 1000 requests/min).

**Probability:** Low (15%)  
**Impact:** High (orders stop)

**Mitigation (PREVENT):**
- [ ] Check marketplace rate limits (usually 1000+ req/min)
- [ ] Implement request batching (don't poll every second)
- [ ] Add circuit breaker (if hit limit, pause 60s)
- [ ] Monitor API calls per minute (alert if approaching limit)

**Recovery (IF HAPPENS):**
- [ ] Reduce polling frequency (every 30s instead of 5s)
- [ ] Contact marketplace support (might raise limit for partners)
- [ ] Switch to webhook-only (stop polling)

**Owner:** Backend Lead  
**Status:** 🟡 At risk (Week 3)

---

### 🟡 R10: Restaurant Page Slow / CLS (Core Web Vitals) Poor

**Description:** Restaurant page takes >3s to load; Google penalizes rankings.

**Probability:** Medium (40%)  
**Impact:** Medium (affects SEO down the line, not immediate)

**Mitigation (PREVENT):**
- [ ] Test restaurant page load time (Week 2)
- [ ] Target: <2s on 4G mobile
- [ ] Optimize images (lazy load, WebP)
- [ ] Minimize JavaScript
- [ ] Use CDN for assets

**Recovery (IF HAPPENS):**
- [ ] It's OK for Phase 1 (can fix later)
- [ ] But measure and log it (meta for Phase 2)
- [ ] If launch blocker: Simplify page design

**Owner:** Frontend Lead  
**Status:** 🟡 At risk (Week 2)

---

## Lower-Risk Items (Monitoring, Not Critical)

### 🟢 R11: Server Error Logs Grow Too Large

**Probability:** Low (20%)  
**Mitigation:** Rotate logs daily; delete >30 days old  
**Owner:** Ops

### 🟢 R12: Team Burnout / Missed Sprints

**Probability:** Low (15%)  
**Mitigation:** Monitor team capacity; hire contractor if needed  
**Owner:** Product Lead

### 🟢 R13: Competitor Launches Before Us

**Probability:** Very Low (5%)  
**Mitigation:** Focus on execution, not competition  
**Owner:** Product Lead

---

## Risk Tracking (Weekly Updates)

| Risk | Probability | Impact | Mitigation Status | Notes |
|------|-------------|--------|-------------------|-------|
| R1 (Marketplace API) | 40% | Critical | 🔵 In Progress (Week 1) | Test in sandbox ASAP |
| R2 (Disk Space) | 10% | Critical | 🔵 Planning | Daily monitor Week 2+ |
| R3 (Load Test Fails) | 35% | Critical | 🔵 In Progress (Week 2) | Start load testing early |
| R4 (OAuth Refresh) | 30% | High | 🔵 Planning | Implement Week 2 |
| R5 (Low Completion) | 50% | Medium | 🔵 Planning | Beta test Week 2 |
| R6 (Duplicate Orders) | 40% | High | 🔵 Planning | Implement Week 2–3 |
| R7 (Email Fails) | 15% | High | 🔵 Planning | Test Week 2 |
| R8 (Post-Freeze Bug) | 50% | Medium | 🟡 At Risk | Regression testing Tue–Thu |
| R9 (Rate Limits) | 15% | High | 🔵 Planning | Check limits Week 1 |
| R10 (Page Speed) | 40% | Medium | 🔵 Planning | Measure Week 2 |

---

## Escalation Rules

### If Risk Probability Rises to HIGH (>60%):
1. **Immediately** notify Tech Lead + Product Lead
2. **Within 1 hour:** Decide mitigation or delay launch
3. **Within 24 hours:** Implement fix or escalate to investors

### If Risk Impact becomes CRITICAL + Probability MEDIUM (>30%):
1. **Pause sprint** to focus on mitigation
2. **Double down** on testing that risk
3. **If not fixed by end of week:** Plan for launch delay

### If Multiple RED Risks Exist on Feb 27:
1. **Do not launch**
2. **Delay to Mar 3 (Monday)**
3. **Fix identified issues over weekend**
4. **Relaunch Monday**

---

## Post-Launch Monitoring (First Week)

**Continue monitoring these risks:**

| Risk | Monitor | Frequency | Alert If |
|------|---------|-----------|----------|
| R1 (Marketplace API) | Order sync latency | Every 5 min | >5s avg |
| R3 (Load Test) | Orders/min + API response | Every 5 min | >50 orders/min OR >2s response |
| R4 (OAuth Refresh) | Token refresh success rate | Hourly | <95% success |
| R6 (Duplicates) | Duplicate order detection | Every hour | >1 duplicate detected |
| R7 (Email) | Email delivery rate | Every hour | <95% delivery |

---

## Risk Acceptance (Knowingly Launch With)

**These risks we accept (we can't eliminate them):**

1. **Very early adopter complaints** (always happens in Phase 1)
   - Accept with caveat: We'll fix in 48–72 hours
   - Have support email ready

2. **One marketplace might have issues** (Just Eat, Glovo, etc.)
   - Accept: We'll continue with other 3 while fixing
   - Have fallback (polling + manual confirmation)

3. **Some restaurants won't complete onboarding**
   - Accept: It's part of funnel, measure it
   - Improve in Phase 1.1 based on data

---

## Decision Criteria for Launch Delay

**DELAY LAUNCH IF ANY OF THESE:**

- ❌ R1 (Marketplace API) not working in sandbox (Feb 24)
- ❌ R2 (Disk issues) unresolved (Feb 27)
- ❌ R3 (Load test) fails at 100 orders/min (Feb 24)
- ❌ R7 (Email) not working reliably (Feb 24)
- ❌ More than 2 RED risks remain (Feb 27)
- ❌ Team not confident in runbook (Feb 27 evening)

**PROCEED WITH LAUNCH IF:**

- ✅ All RED risks mitigated or have recovery plan
- ✅ Load test ≥100 orders/min (stable)
- ✅ E2E sign-up → orders works 100% in test
- ✅ Marketplace adapters work in sandbox
- ✅ Team votes "ready" unanimously (Feb 27, 5 PM)

---

## Post-Launch Retrospective (Mar 3, 10 AM)

**Assess which risks actually happened:**

- Which risks materialized?
- Which mitigations worked?
- Which failed?
- How do we prevent each in Phase 2?

**Update this register based on reality.**

---

## Owner Assignments

| Risk | Owner | Backup |
|------|-------|--------|
| R1–R3, R4, R6, R9 | Backend Lead | Tech Lead |
| R2 | Ops Lead | Tech Lead |
| R5 | Product Lead | Frontend Lead |
| R7 | Backend Lead | Ops Lead |
| R8 | Tech Lead | Product Lead |
| R10 | Frontend Lead | Product Lead |

---

**This register is living.** Update it every Friday in the sprint sync.  
**Before launch:** Review with team. Make sure everyone knows the risks.  
**On launch day:** Have this printed. Refer to it every hour.

