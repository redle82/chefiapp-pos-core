# Phase 2 — Growth & Core Features (Months 2–3)

**Timeline:** Mar 1 – May 31, 2025 (13 weeks)  
**Target:** Scale from 100 to 1,000 restaurants  
**Core Features:** Loyalty, Advanced KDS, Multi-location, WhatsApp Orders  
**Success Metric:** 1,000 restaurants, 50+ GOV/restaurant/day, NPS 50+

---

## Phase 2 at a Glance

| Metric | Phase 1 | Phase 2 Target |
|--------|---------|---|
| Restaurants | 100 | 1,000 |
| Daily Orders | 250–300 | 5,000–7,000 |
| Avg GOV/Restaurant | €180 | €300+ |
| Marketplace Coverage | 4 (EU) | 6 (EU + UK) |
| Channels | Marketplaces only | Marketplaces + Direct + WhatsApp |
| Loyalty Support | None | Native loyalty (cards, points, tiers) |
| Retention Rate (Day 30) | 85% | 90%+ |
| NPS | +42 | +50+ |

---

## Three Pillars of Phase 2

### Pillar 1: Growth (Get to 1,000 Restaurants)
- Aggressive onboarding (100–150 restaurants/week)
- Sales team + partnerships (delivery platforms, POS suppliers)
- Referral program (restaurants invite restaurants)
- Multi-language support (Portuguese, Spanish, French)

### Pillar 2: Retention (Keep Them Active)
- Loyalty system (our own fidelization)
- Advanced analytics (restaurant's own dashboard)
- Smart notifications (when orders slow down)
- Support + training (live chat, video tutorials)

### Pillar 3: Monetization (Earn While Growing)
- 2% commission on GOV (from Phase 1)
- Loyalty feature upsell (€99/month pro version)
- Premium analytics (€49/month)
- White-label marketplace for restaurants

---

## Feature Breakdown (Priority Order)

### 🔴 MUST-HAVE (Weeks 1–4)
```
Loyalty System (MVP)
├─ Card management (physical or digital)
├─ Points tracking
├─ Basic tiers (Silver, Gold, Platinum)
└─ Auto-apply loyalty on order confirmation

Advanced KDS
├─ Order routing (to specific kitchen stations)
├─ Prep time estimation (AI-powered)
├─ Kitchen stats (avg prep time, order accuracy)
└─ Sound + light alerts for slow orders

Multi-location (Enterprise)
├─ One account, multiple restaurants
├─ Consolidated dashboard
└─ Bulk operations (menu sync, promotions)
```

### 🟠 SHOULD-HAVE (Weeks 5–8)
```
WhatsApp Orders (Native)
├─ Receive orders via WhatsApp chat
├─ Confirm/reject from KDS
├─ Send updates via WhatsApp
└─ Link to restaurant page for full menu

Restaurant Analytics Dashboard
├─ Daily/weekly/monthly reports
├─ Popular items analysis
├─ Customer retention trends
├─ Revenue by marketplace
└─ Forecasting (predict busy hours)

Delivery Integrations (Shopify Partners)
├─ ShipDay (delivery tracking)
├─ Uber Direct (new marketplace)
└─ Custom delivery provider API

Referral Program
├─ "Invite a friend, get €50 credit"
├─ Tracking + payouts
└─ Leaderboard (gamification)
```

### 🟡 NICE-TO-HAVE (Weeks 9–13)
```
AI Features
├─ Smart menu recommendations (which items to promote)
├─ Demand forecasting (predict order volume)
├─ Staff scheduling suggestions
└─ Chatbot for common FAQs

Multi-language Support
├─ Portuguese (Portugal + Brazil)
├─ Spanish (Spain)
├─ French (France)
└─ English (UK market)

CRM + Marketing
├─ Email campaigns (powered by Klaviyo)
├─ SMS promotions
├─ Customer segmentation
└─ Re-engagement for inactive customers

White-Label Marketplace
├─ Restaurant can brand ChefIApp as their own
├─ Custom domain support
└─ Co-branding options
```

---

## Architecture Changes (Phase 2)

### New Core Entities

```typescript
// Loyalty System
type LoyaltyCard = {
  id: UUID;
  restaurantId: UUID;
  cardType: 'physical' | 'digital'; // Loyalty card version
  tier: 'silver' | 'gold' | 'platinum';
  points: number;
  pointsEarned: number; // cumulative
  pointsRedeemed: number; // cumulative
  status: 'active' | 'suspended' | 'expired';
  createdAt: Timestamp;
  expiresAt?: Timestamp;
};

type LoyaltyReward = {
  id: UUID;
  cardId: UUID;
  restaurantId: UUID;
  points: number;
  reason: 'order' | 'referral' | 'promotion';
  orderId?: UUID;
  createdAt: Timestamp;
};

// Multi-location
type RestaurantGroup = {
  id: UUID;
  ownerId: UUID;
  name: string;
  restaurants: UUID[]; // 1 or more restaurant IDs
  sharedMenu: boolean; // Share menu across locations?
  createdAt: Timestamp;
};

// WhatsApp Orders
type WhatsAppOrder = {
  id: UUID;
  restaurantId: UUID;
  phoneNumber: string; // +351 9XX XXX XXX
  messageId: string; // WhatsApp message ID
  items: OrderItem[];
  status: 'pending_confirmation' | 'confirmed' | 'ready' | 'picked_up';
  createdAt: Timestamp;
  confirmedAt?: Timestamp;
};

// Analytics
type RestaurantMetrics = {
  restaurantId: UUID;
  date: Date;
  ordersCount: number;
  revenue: Decimal; // EUR
  avgOrderValue: Decimal;
  customerCount: number;
  repeatCustomers: number;
  topItems: string[];
  topMarketplace: string; // 'just_eat' | 'glovo' | 'whatsapp' | etc
  avgPrepTime: number; // seconds
  cancellationRate: Decimal; // 0–1
  customerNPS?: number;
};
```

### New Adapters (Layer)

```
adapters/
├─ loyalty/
│  ├─ LoyaltyCardAdapter.ts (manage cards, points)
│  └─ LoyaltyRewardsProcessor.ts (process rewards on order)
├─ analytics/
│  ├─ MetricsAggregator.ts (collect daily metrics)
│  └─ ForecastingEngine.ts (predict demand)
├─ whatsapp/
│  ├─ WhatsAppOrderAdapter.ts (read + send WhatsApp messages)
│  └─ WhatsAppWebhookHandler.ts
├─ crm/
│  ├─ KlaviyoAdapter.ts (email campaigns)
│  └─ SMSAdapter.ts (Twilio SMS)
└─ delivery/
   ├─ ShipDayAdapter.ts (delivery tracking)
   └─ UberDirectAdapter.ts (new marketplace)
```

---

## Sprint Breakdown (Phase 2 = 13 weeks, 2-week sprints = 6.5 sprints ≈ 7 sprints)

### Sprint 1–2: Loyalty System + Advanced KDS (Mar 1–14)

**Week 1 (Mar 1–7):**
- Loyalty card schema + database
- Card creation + activation flow
- Points calculator (X points per € spent)
- Tier logic (points → tier upgrade)

**Week 2 (Mar 10–14):**
- KDS order routing (assign to kitchen station)
- Prep time tracking + estimation
- Kitchen stats dashboard (within KDS)
- Alert system (visual + sound for slow orders)

**Testing:** Loyalty flow (5 scenarios), KDS routing (10 scenarios)  
**Beta:** 20 restaurants (early adopter restaurants test loyalty)

---

### Sprint 3–4: Multi-location + WhatsApp Orders (Mar 17–30)

**Week 3 (Mar 17–23):**
- Restaurant group creation + management
- Consolidated dashboard (one owner, many restaurants)
- Bulk menu sync (edit once, apply to all)
- Shared settings (same marketplace account?)

**Week 4 (Mar 26–30):**
- WhatsApp Business API integration (Meta)
- WhatsApp order webhook handler
- Order format: "1x Burger, 1x Fries, 1x Coke"
- Confirmation flow (click link in KDS)

**Testing:** Multi-location (5 scenarios), WhatsApp (10 scenarios)  
**Beta:** 20 restaurants with multi-location, 10 with WhatsApp

---

### Sprint 5–6: Analytics Dashboard + Delivery Integrations (Apr 1–20)

**Week 5 (Apr 1–7):**
- Daily metrics collection (orders, revenue, customers)
- Weekly/monthly reports
- Popular items chart
- Revenue by marketplace pie chart
- Customer retention trends

**Week 6 (Apr 10–20):**
- ShipDay integration (show delivery status)
- Uber Direct adapter (new marketplace)
- Custom delivery provider webhook
- Delivery tracking in order details

**Testing:** Analytics queries (20 scenarios), delivery sync (10 scenarios)  
**Release:** Analytics dashboard goes live for all Phase 1 restaurants

---

### Sprint 7: Polish + Growth Infrastructure (Apr 23–May 4)

**Week 7:**
- Referral program (invite code, tracking, payouts)
- Multi-language support (Portuguese, Spanish, French)
- Email campaign templates (Klaviyo integration)
- SMS notifications (Twilio stubs)
- CRM segment creation

**Testing:** Referral flow, language switches, email delivery  
**Release:** Growth features + multi-language go live

---

### Sprint 8–9: AI + White-Label (May 7–26)

**Week 8–9:**
- Demand forecasting (ML model training on Phase 1 data)
- Smart menu recommendations
- Staff scheduling suggestions
- White-label marketplace (custom domain)
- Admin panel for white-label setup

**Testing:** Forecasting accuracy, white-label rendering  
**Release:** AI features + white-label (enterprise tier)

---

### Sprint 10: Final Polish + Scale Testing (May 29 – Jun 4)

**Week 10:**
- Load test for 1,000 restaurants (500+ orders/min)
- Loyalty system stress test
- Database optimization (indexing, query tuning)
- Multi-location failover testing
- Disaster recovery (restore from backup with new data)

**Release Candidate:** Phase 2 feature-complete

---

## Success Metrics (May 31, End of Phase 2)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Restaurants** | 1,000 | Count in DB |
| **Daily Orders** | 5,000–7,000 | Orders table |
| **Avg GOV/Restaurant/Day** | €300+ | Revenue / restaurants / days |
| **Marketplace Count** | 6+ | Just Eat, Glovo, UberEats, Deliveroo, WhatsApp, Uber Direct |
| **Loyalty Adoption** | 60%+ | Restaurants using loyalty |
| **WhatsApp Orders** | 10%+ of total | Orders from WhatsApp channel |
| **Retention (Day 30)** | 90%+ | Still active after 30 days |
| **NPS** | 50+ | Customer surveys |
| **API Uptime** | 99.95%+ | Zero downtime during peak |
| **Critical Bugs** | 0 | System-breaking issues |

---

## Team Expansion (Phase 2)

| Role | Phase 1 | Phase 2 |
|------|---------|---------|
| Backend Engineers | 2 | 3 (+1 loyalty/analytics) |
| Frontend Engineers | 1 | 2 (+1 analytics UI) |
| DevOps / Ops | 1 | 1.5 (+0.5 infrastructure) |
| QA Engineers | 1 | 1.5 (+0.5 automation) |
| Product Manager | 1 | 1 (stays same) |
| Sales / Success | 0 | 1 (new role) |
| **Total** | **6** | **9–10** |

---

## Budget & Resources (Phase 2)

### Team Cost (13 weeks)
- **Additional engineers:** 4 × 13 weeks = 52 engineer-weeks @ €200/day (€10.4K)
- **Sales/success hire:** 1 × 13 weeks = 13 weeks @ €150/day (€1.95K)
- **Training + ramp-up:** €2K

### Infrastructure
- **Database scaling:** €500/month → €800/month (+€3.9K for 13 weeks)
- **Monitoring & logging:** €500/month → €800/month (+€3.9K)
- **Additional staging/testing:** €500
- **Third-party APIs:** Klaviyo, Twilio, ShipDay, Uber Direct (~€200/month = €2.6K)

### Total Phase 2 Budget: **€25K–30K**

---

## Risk Register (Phase 2)

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Loyalty system bugs corrupt data | Low (20%) | High | Extensive testing, audit trail |
| WhatsApp API rate limits hit | Medium (35%) | Medium | Implement queuing, fallback to polling |
| Multi-location creates complexity | Medium (40%) | Medium | Start with simple group, iterate |
| Demand forecasting inaccuracy | Low (15%) | Low | Use conservative estimates, human review |
| Scale to 1,000 restaurants = 10x DB load | Medium (30%) | High | Load test in Week 8, pre-optimize queries |
| Team onboarding takes too long | Medium (30%) | Medium | Hire by Week 1, start week before sprint 1 |
| Marketplace API changes break adapters | Low (20%) | High | Maintain multiple adapter versions |

---

## Critical Path (Blocking Dependencies)

```
Week 1: Loyalty Schema ✓
  ↓
Week 2: KDS Integration ✓
  ↓
Week 3: Multi-location Infrastructure
  ↓
Week 4: WhatsApp Orders
  ↓
Weeks 5–6: Analytics + Delivery
  ↓
Week 7: Growth features
  ↓
Weeks 8–9: AI + White-label
  ↓
Week 10: Final scale testing
```

**If any sprint slips >1 week:** Phase 2 completion moves from May 31 to Jun 14.

---

## Decision Gates (Phase 2)

### Gate 1: Sprint 1–2 (Mar 14)
**Question:** Does loyalty system work? Does KDS show orders correctly?  
**Pass criteria:** 20 beta restaurants actively using loyalty, zero critical bugs  
**If FAIL:** 1-week extension (no impact to final timeline)

### Gate 2: Sprint 3–4 (Mar 30)
**Question:** Do multi-location + WhatsApp orders work?  
**Pass criteria:** 20 multi-location restaurants live, 10 WhatsApp orders/day  
**If FAIL:** Reduce scope (skip one, fix other)

### Gate 3: Sprint 5–6 (Apr 20)
**Question:** Is analytics dashboard performant?  
**Pass criteria:** Dashboard loads <2s, handles 1,000 restaurants  
**If FAIL:** Optimize or scale database

### Gate 4: Sprint 7 (May 4)
**Question:** Growth features working?  
**Pass criteria:** 50+ referral signups, multi-language rendering correct  
**If FAIL:** Extend sprint (1 week, no impact)

### Gate 5: Sprint 10 (Jun 4)
**Question:** Ready to scale to 1,000?  
**Pass criteria:** Load test passes (500+ orders/min), NPS 50+, retention 90%+  
**If FAIL:** More optimization needed (1–2 weeks)

---

## Investor Milestones (Communication)

| Date | Milestone | Target |
|------|-----------|--------|
| Mar 7 | Loyalty MVP live | 20 restaurants, 100 points/order |
| Mar 30 | Multi-location + WhatsApp | 30 restaurants with loyalty, 50 WhatsApp orders |
| Apr 20 | Analytics dashboard | 500+ restaurants with insights |
| May 4 | 500 restaurants reached | 1/2 way to goal |
| May 31 | **1,000 restaurants live** | **Phase 2 complete** |

---

## Success = May 31, 1,000 Restaurants, 50+ NPS ✓

After Phase 2, you're a proven SaaS business:
- ✅ Product-market fit (NPS 50+)
- ✅ Unit economics work (€300+ GOV per restaurant/day, 2% commission)
- ✅ Scale demonstrated (1,000 restaurants)
- ✅ Retention proven (90%+ day-30)

**Next:** Phase 3 (International expansion) or Series A funding.

