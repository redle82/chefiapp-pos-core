# Phase 2 — Implementation Roadmap (13 Weeks)

**Start Date:** Mar 1, 2025  
**End Date:** May 31, 2025  
**Team Size:** 9–10 (expanded from 6)  
**Goal:** 1,000 restaurants, 50+ NPS, 90%+ retention

---

## Sprint Schedule (13 weeks = 6.5 sprints ≈ 7 sprints)

| Sprint | Dates | Theme | Features |
|--------|-------|-------|----------|
| 1 | Mar 1–14 | Loyalty Core | Card creation, points, tiers, KDS routing |
| 2 | Mar 17–31 | Loyalty Integration | Loyalty ↔ Orders, Multi-location setup |
| 3 | Apr 1–14 | WhatsApp + Delivery | WhatsApp orders, ShipDay, Uber Direct |
| 4 | Apr 15–28 | Analytics | Metrics dashboard, reporting, forecasting |
| 5 | May 1–14 | Growth Features | Referral program, multi-language |
| 6 | May 15–28 | AI + White-Label | Demand forecasting, white-label setup |
| 7 | May 29–Jun 4 | Final Testing | Load testing, scale validation |

---

## Sprint 1: Loyalty Core + KDS Routing (Mar 1–14)

**Goal:** Loyalty system MVP live with 20 beta restaurants

### Engineering Tasks

**Backend (Mar 1–7)**
- [ ] Loyalty card schema (PostgreSQL migrations)
- [ ] LoyaltyService implementation (create, update, award points)
- [ ] Tier calculation logic (bronze → silver → gold → platinum)
- [ ] Event logging (immutable audit trail)
- [ ] Integration with Order service (awardPointsForOrder hook)

**Frontend (Mar 1–7)**
- [ ] Loyalty card display in restaurant dashboard
- [ ] Points tracker (customer-facing UI)
- [ ] Tier badge + progress bar
- [ ] Redemption UI (simple MVP: select reward, click redeem)

**Testing (Mar 8–14)**
- [ ] Unit tests: Tier calculation, points math
- [ ] Integration tests: Order confirmation → Points awarded
- [ ] E2E test: Customer gets card → Receives points → Sees tier
- [ ] Load test: 100 loyalty operations/second

**Deployment (Mar 14)**
- [ ] Feature flag: Enable loyalty for beta restaurants only
- [ ] Database migration + rollback plan
- [ ] Monitoring + alerts (points not awarded)

### Success Criteria

- ✅ 20 beta restaurants have loyalty active
- ✅ Points awarded correctly on order confirmation
- ✅ Tier progression working
- ✅ Zero data corruption (audit trail complete)
- ✅ KDS routing to stations working

**Owner:** Backend Lead + Frontend Lead  
**Risk:** Database migration fails → Rollback plan ready  
**Blockers:** None (independent feature)

---

## Sprint 2: Multi-location + Loyalty Integration (Mar 17–31)

**Goal:** Multi-location restaurants can manage 1+ locations; loyalty works across orders

### Engineering Tasks

**Backend (Mar 17–24)**
- [ ] RestaurantGroup entity (owns multiple restaurants)
- [ ] Authorization: Only owner can see/edit all locations
- [ ] Menu sync: Edit once, apply to all (or per-location override)
- [ ] Consolidated orders view (all locations' orders in one dashboard)
- [ ] Billing consolidation (one invoice for all locations)

**Frontend (Mar 17–24)**
- [ ] Location picker (in restaurant dashboard)
- [ ] Bulk menu editor
- [ ] Unified KDS (all locations' orders in one view, or separate tabs)
- [ ] Multi-location settings (shared features)

**Loyalty Integration (Mar 25–31)**
- [ ] Link loyalty card to customer (by phone number)
- [ ] Award points on any order from any location (same restaurant group)
- [ ] Loyalty tier rewards visible in merchant dashboard
- [ ] Referral: "Invite a friend" with location selection

**Testing (Mar 25–31)**
- [ ] Multi-location authorization tests (only owner sees all)
- [ ] Loyalty across locations (order at location A, points count toward tier)
- [ ] Menu sync (edit at location A, appears at location B)
- [ ] Consolidated billing

### Success Criteria

- ✅ 10 beta restaurants using multi-location
- ✅ Loyalty points accumulate across all locations
- ✅ Menu sync working
- ✅ Billing correct for multi-location

**Owner:** Backend Lead + Product Lead  
**Risk:** Authorization bugs (data leakage) → Extra security review  
**Blockers:** Loyalty from Sprint 1 must be stable

---

## Sprint 3: WhatsApp Orders + Delivery Integrations (Apr 1–14)

**Goal:** Restaurants receiving orders via WhatsApp; delivery tracking live

### Engineering Tasks

**WhatsApp (Apr 1–10)**
- [ ] WhatsApp Business API setup (Meta account, webhook URL)
- [ ] Webhook handler (receive messages from customers)
- [ ] Message parser (fuzzy match menu items)
- [ ] Order creation (WhatsApp message → TPV order)
- [ ] Confirmation flow (send link, customer clicks, order confirmed)
- [ ] Status updates (ready, picked up, cancelled via WhatsApp)

**Delivery (Apr 10–14)**
- [ ] ShipDay adapter (webhook handler, fetch delivery status)
- [ ] Uber Direct adapter (sandbox testing)
- [ ] Order tracking UI (customer sees: "Ready for pickup" → "Picked up" → "Delivered")
- [ ] Delivery status notifications (email, SMS stubs)

**Testing (Apr 10–14)**
- [ ] WhatsApp message parsing (10 scenarios)
- [ ] E2E: Customer sends "1x burger" → Order created → Ready → Notification
- [ ] Delivery tracking (mock delivery status updates)

### Success Criteria

- ✅ 50+ WhatsApp orders in production
- ✅ Delivery tracking showing in order details
- ✅ Confirmation flow working (no orphaned orders)
- ✅ Zero message parsing errors (high confidence threshold)

**Owner:** Backend Lead + Adapters Engineer  
**Risk:** WhatsApp API rate limits → Implement queuing  
**Blockers:** None (independent)

---

## Sprint 4: Analytics Dashboard + Reporting (Apr 15–28)

**Goal:** Restaurants have real-time insights; metrics dashboard live

### Engineering Tasks

**Metrics Collection (Apr 15–21)**
- [ ] Daily metrics snapshot (orders, revenue, customers, popular items)
- [ ] Query optimization (metrics queries must be fast)
- [ ] Retention tracking (customers who reorder)
- [ ] Marketplace revenue breakdown

**Dashboard (Apr 22–28)**
- [ ] Charts: Orders/day, Revenue/day, Popular items
- [ ] Filters: Date range, marketplace, loyalty vs non-loyalty
- [ ] Reports: Weekly, monthly summaries
- [ ] Export to CSV (for accountants)
- [ ] Forecasting UI (predicted orders for next week)

**Testing**
- [ ] Query performance (handle 1,000 restaurants)
- [ ] Chart rendering (large datasets)
- [ ] Data accuracy (spot-check 5 restaurants)

### Success Criteria

- ✅ All Phase 1 restaurants have access to analytics
- ✅ Dashboard loads <2s
- ✅ Forecasting confidence score visible
- ✅ Restaurants can export data

**Owner:** Backend Lead + Frontend Lead  
**Risk:** Queries too slow → Need indexing  
**Blockers:** Metrics schema from Sprint 1

---

## Sprint 5: Growth Features (May 1–14)

**Goal:** 500 restaurants reached; referral program driving new signups

### Engineering Tasks

**Referral Program (May 1–7)**
- [ ] Referral code generation (unique per restaurant)
- [ ] Tracking: Who invited whom (relationship tracking)
- [ ] Payouts: €50 credit per successful referral
- [ ] Leaderboard: Top referrers (gamification)
- [ ] Viral loop: "Invite a friend" email + in-app banner

**Multi-language (May 8–14)**
- [ ] i18n setup (translation files: en, pt, es, fr)
- [ ] UI language switching (restaurant setting)
- [ ] Marketplace names localized
- [ ] Support docs in multiple languages
- [ ] Right-to-left (RTL) languages? (Not yet)

**Testing**
- [ ] Referral flow (5 scenarios)
- [ ] Language switching (all pages render correctly)
- [ ] Leaderboard accuracy

### Success Criteria

- ✅ 10%+ of new signups from referrals
- ✅ Portuguese + Spanish + French fully supported
- ✅ Leaderboard showing (top 10 referrers)

**Owner:** Product Lead + Frontend Lead  
**Risk:** Referral fraud → Implement anti-fraud checks  
**Blockers:** Growth infrastructure from Phase 1

---

## Sprint 6: AI + White-Label (May 15–28)

**Goal:** Enterprise features live; AI forecasting in beta

### Engineering Tasks

**Demand Forecasting (May 15–21)**
- [ ] Time-series analysis (order history → trend)
- [ ] Seasonal adjustment (weekends vs weekdays)
- [ ] Special event handling (holidays, football matches → spike)
- [ ] Confidence intervals (show uncertainty)
- [ ] Recommendations: "Increase prep for Friday" based on forecast

**White-Label (May 22–28)**
- [ ] Custom domain support (restaurant.custom-domain.com)
- [ ] Branding customization (logo, colors, domain)
- [ ] Admin panel: Configure white-label settings
- [ ] Deployment: Separate subdomain or custom domain?
- [ ] Billing: €99/month for white-label tier

**Testing**
- [ ] Forecasting accuracy (backtest on Phase 1 data)
- [ ] White-label rendering (custom domain works)
- [ ] Domain switching (customer sees correct brand)

### Success Criteria

- ✅ Forecasting visible in dashboard (beta label)
- ✅ 5 restaurants testing white-label
- ✅ Custom domain rendering correctly
- ✅ Demand forecast accuracy ≥70%

**Owner:** Backend Lead + Frontend Lead  
**Risk:** Forecasting accuracy poor → Set low confidence threshold  
**Blockers:** Analytics from Sprint 4

---

## Sprint 7: Final Testing & Launch Prep (May 29 – Jun 4)

**Goal:** Phase 2 feature-complete and scale-tested

### Engineering Tasks

**Load Testing (May 29–31)**
- [ ] Simulation: 1,000 restaurants, 500 orders/min
- [ ] Database optimization (query tuning, indexes)
- [ ] Caching layer (Redis for frequently accessed data)
- [ ] Auto-scaling validation (handles spikes)

**Regression Testing (Jun 1–2)**
- [ ] Full E2E regression (all Phase 1 + Phase 2 flows)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile testing (responsive design works)

**Pre-launch (Jun 3–4)**
- [ ] Infrastructure checklist
- [ ] Disaster recovery drill (restore from backup)
- [ ] On-call procedures updated
- [ ] Monitoring + alerts configured

### Success Criteria

- ✅ Load test: 500+ orders/min (stable)
- ✅ All 2,000+ test cases passing
- ✅ Restoration from backup: <30 min
- ✅ Team ready for Phase 2 sunset → Phase 2 launch (mid-June)

---

## Resource Allocation by Week

| Week | Backend | Frontend | DevOps | QA | Product |
|------|---------|----------|--------|----|----|
| W1 (Mar 1) | 2 (loyalty) | 1 (loyalty UI) | 0.5 | 0.5 | 1 |
| W2 (Mar 8) | 2 + 1 (KDS) | 1 | 0.5 | 1 | 0.5 |
| W3 (Mar 15) | 2 (multi-loc) | 1 | 0.5 | 0.5 | 1 |
| W4 (Mar 22) | 1 | 1 (multi-loc) | 0.5 | 1 | 0.5 |
| W5 (Mar 29) | 1 + 1 (WhatsApp) | 0 | 0.5 | 0.5 | 1 |
| W6 (Apr 5) | 1 + 1 (delivery) | 1 | 0.5 | 1 | 0.5 |
| W7 (Apr 12) | 2 (analytics) | 1 | 0.5 | 0.5 | 0.5 |
| W8 (Apr 19) | 1 | 1 (analytics UI) | 0.5 | 1 | 1 |
| W9 (Apr 26) | 1 (referral) | 1 | 0.5 | 0.5 | 1 |
| W10 (May 3) | 1 | 1 (languages) | 0.5 | 0.5 | 0.5 |
| W11 (May 10) | 1 (AI) | 0 | 0.5 | 0.5 | 1 |
| W12 (May 17) | 1 | 1 (white-label) | 0.5 | 0.5 | 0.5 |
| W13 (May 24) | 1 | 0.5 | 1 (optimization) | 1 | 0.5 |

---

## Success Metrics (May 31)

| Metric | Phase 1 | Phase 2 Target | Status |
|--------|---------|---|--------|
| Restaurants | 100 | 1,000 | 🔵 Pending |
| Daily Orders | 250 | 5,000+ | 🔵 Pending |
| Avg GOV/Restaurant | €180 | €300+ | 🔵 Pending |
| Loyalty Adoption | 0% | 60%+ | 🔵 Pending |
| Retention (Day 30) | 85% | 90%+ | 🔵 Pending |
| NPS | 42 | 50+ | 🔵 Pending |
| Uptime | 99.98% | 99.95%+ | 🔵 Pending |

---

## Contingency Plans

### If Sprint slips >1 week:
- Reduce scope: Skip white-label or referral program
- Hire contractor to speed up implementation
- Push Phase 2 completion to Jun 14

### If load test fails:
- Database optimization (indices, query rewriting)
- Add caching layer (Redis)
- Scale PostgreSQL (read replicas)
- Delay public launch, continue with selected 500 restaurants

### If critical bugs found week of launch:
- Branch + hotfix
- Test thoroughly
- Relaunch (following week)

---

## Decision Gates (Go/No-Go)

| Gate | Date | Decision | Consequence |
|------|------|----------|-------------|
| **Sprint 1 Complete** | Mar 14 | Loyalty MVP working? | ✅ Proceed or 1-week extension |
| **Sprint 3 Complete** | Apr 14 | WhatsApp orders working? | ✅ Proceed or scope reduction |
| **Sprint 5 Midpoint** | May 7 | 500 restaurants reached? | ✅ Proceed or reassess growth |
| **Sprint 7 Complete** | Jun 4 | Load test passed? | ✅ Launch Phase 2 or delay |

---

**Phase 2 is ambitious but achievable.**

**Key to success:** Ship incrementally, gather feedback, iterate fast.

**Launch: May 31. 1,000 restaurants. Let's go. 🚀**

