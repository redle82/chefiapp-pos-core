# Phase 1 — Launch Checklist

**Goal:** 100 restaurants live, self-serve signup → page live → first order within 48 hours.

---

## Pre-Launch (Engineering)

### Core System
- [ ] WebCoreState production-ready (4 cores locked).
- [ ] ContractSystem enforces 12 contracts.
- [ ] FlowEngine causal validation active.
- [ ] RouterGuard on all critical routes.
- [ ] Health endpoint real and monitored.

### Marketplace Adapters
- [ ] Just Eat adapter tested (sandbox + live accounts).
- [ ] Glovo adapter tested (sandbox + live accounts).
- [ ] Uber Eats adapter tested (sandbox + live accounts).
- [ ] Deliveroo adapter tested (sandbox + live accounts).
- [ ] Polling service syncs orders ≤10s.
- [ ] Status updates propagate ≤5s.

### Web Page
- [ ] Custom domain (chefiapp.com/{slug}).
- [ ] Mobile-responsive.
- [ ] Live preview (if published).
- [ ] Direct order form works (no payment required for Phase 1).
- [ ] Order history visible to customer.

### TPV (Touch Point)
- [ ] Orders from marketplaces render correctly.
- [ ] Direct orders render correctly.
- [ ] Staff can confirm/complete orders.
- [ ] Order status updates sent back to marketplaces.

### Database
- [ ] Migration scripts tested on staging.
- [ ] Backups automated daily.
- [ ] Read replicas set up (for analytics).
- [ ] Foreign keys enforced.

### Monitoring & Alerting
- [ ] New Relic / DataDog connected.
- [ ] Alerts for: API down, order sync failure, health down.
- [ ] Dashboard shows: orders/min, sync latency, marketplace health.
- [ ] Slack notifications for P0/P1 issues.

### Security
- [ ] API keys stored in env (not code).
- [ ] HTTPS enforced everywhere.
- [ ] CORS policy locked to restaurante domains only.
- [ ] Rate limiting on sign-up endpoint.
- [ ] SQL injection tests pass.

### Performance
- [ ] Page load ≤2s (lighthouse ≥80).
- [ ] API response ≤200ms (p95).
- [ ] Database queries use indexes.
- [ ] CDN configured for static assets.

### Compliance
- [ ] GDPR: privacy policy live.
- [ ] GDPR: data retention policy live.
- [ ] Terms of Service: signed by lawyer (or template approved).
- [ ] Fiscal: POS receipts logged (if applicable).

---

## Pre-Launch (Product)

### Onboarding
- [ ] Sign-up form live (email, password, restaurant name, phone).
- [ ] Email confirmation required.
- [ ] Welcome email sent with next steps.
- [ ] Dashboard shows: page status, marketplace setup, first order CTA.

### Documentation
- [ ] "Getting Started" guide (5 min read).
- [ ] "Connect Marketplace" guide (per-platform, 10 min each).
- [ ] FAQ: common setup issues.
- [ ] Support email active (support@chefiapp.local).

### Support
- [ ] Slack channel for early adopters.
- [ ] Support person assigned (or rotating).
- [ ] Response time SLA: <4 hours (Phase 1).

### Analytics
- [ ] Google Analytics on page + dashboard.
- [ ] Event tracking: sign-up, marketplace setup, first order, dashboard view.
- [ ] Daily report: new restaurants, orders, churn.

---

## Launch (Week 1)

### Beta Group (20 Restaurants)
- [ ] Manually onboard 20 restaurants (friendly/tech-savvy).
- [ ] All 4 marketplaces connected.
- [ ] Monitor: crashes, order sync, TPV usability.
- [ ] Daily check-in calls.
- [ ] Feedback documented.

### Soft Launch (Public, 100 Restaurants Target)
- [ ] Self-serve sign-up live.
- [ ] Marketing: email to acquired restaurants, landing page live.
- [ ] Expect: 5–10 sign-ups/day.
- [ ] Triage: support team ready.

### Daily Ops (Week 1)
- [ ] Monitoring dashboard watched 24/7 (rotation).
- [ ] Any P0 issue: hotfix within 1 hour.
- [ ] Daily standup: metrics, issues, blockers.
- [ ] Weekly review: NPS, churn, feature requests.

---

## Go-Live Criteria (All Green = Launch)

| Criteria | Status | Owner |
|----------|--------|-------|
| All 4 marketplace adapters live | — | Eng |
| Order sync rate ≥99% | — | Eng |
| Page load time ≤2s | — | Eng |
| First 20 restaurants running (no critical bugs) | — | Product |
| Support team trained | — | Ops |
| Monitoring alerts live | — | DevOps |
| No data loss on 100-order test | — | QA |
| GDPR privacy page live | — | Legal |
| Landing page + docs published | — | Product |

---

## Post-Launch (First Month)

### Metrics to Track (Daily)

| Metric | Target | Baseline |
|--------|--------|----------|
| New sign-ups | 5–10/day | — |
| Marketplace setup rate | 70%+ | — |
| First order rate | 40%+ (of sign-ups) | — |
| Order sync success | 99%+ | — |
| Page avg load time | ≤2s | — |
| API error rate | ≤1% | — |
| Support response time | ≤4 hours | — |
| NPS (from first 20) | ≥40 | — |
| Marketplace health | All ≥95% | — |

### Issues Triage (Priority)

**P0 (Fix Within 1 Hour)**
- Orders not syncing from any marketplace.
- Page not loading.
- Marketplace status updates failing.
- Data loss.

**P1 (Fix Within 4 Hours)**
- Single marketplace sync slow (>30s).
- Dashboard broken.
- Email notifications failing.
- API errors >5%.

**P2 (Fix Within 24 Hours)**
- UI bugs (non-critical).
- Performance issues (still acceptable).
- Minor marketplace issues.

**P3 (Fix Next Week)**
- Feature requests.
- UX improvements.
- Documentation updates.

### Weekly Review (Fridays)

- **Metrics:** NPS, churn, sign-ups, first-order rate.
- **Blockers:** Any issues preventing growth.
- **Decisions:** Scale up support? Extend marketplace support?
- **Next week plan:** Targets and risks.

---

## Success = Launch Phase Closed

✅ 100 restaurants sign up.  
✅ 40+ have connected at least 1 marketplace.  
✅ 20+ have live orders.  
✅ No critical bugs.  
✅ NPS ≥40.  
✅ Monitoring stable.  

**Then:** Scale to 500 (Phase 2 prep begins).

