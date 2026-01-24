# Phase 1 — Success Metrics & Observability Dashboard

**Goal:** Monitor 100 early-adopter restaurants, identify issues, measure product-market fit.

---

## Core Metrics (Real-Time Dashboard)

**URL:** chefiapp.com/admin/phase1-metrics

### 1. Onboarding Funnel (Daily)

```
Sign-ups Today:          42
├─ Email confirmed:      38 (90%)
├─ Restaurant set up:    36 (95% of confirmed)
├─ Menu defined:         34 (94% of set up)
├─ Published:            32 (94% of menu)
├─ 1+ Marketplace:       28 (88% of published)
└─ First order:          12 (43% with marketplace)

Target: 30 new restaurants → 25 with first order
Status: 🟢 ON TRACK
```

**Calculation**
- Funnel = (count at each step) / (total sign-ups)
- Goal: 100 sign-ups → 85 published → 60 with marketplace → 25 first orders

---

### 2. Restaurant Status Overview (Live, Hourly Update)

```
Total Restaurants (Phase 1):  100
├─ Live (published + 1+ marketplace): 87
├─ Setup (published, no marketplace):  8
├─ Drafts (not published):              5

Orders Today (across all):
├─ Total:                     234
├─ Avg per live restaurant:   2.7
├─ Median:                    1
├─ Max:                       18 (Sofia's Gastrobar)
├─ Min:                       0 (45 restaurants)

Health:
├─ API uptime:               99.98%
├─ Marketplace sync latency:  2.3s (avg)
├─ Errors (last 24h):         3 (0.001% of requests)
```

---

### 3. Marketplace Health (Per Marketplace, Real-Time)

#### Just Eat
```
Connected: 45 restaurants
├─ Orders synced today:      89
├─ Avg latency:              1.2s
├─ Failed syncs (24h):       0
├─ Health:                   ✓ Excellent

Last check: 2 minutes ago
Status: 🟢 UP
```

#### Glovo
```
Connected: 32 restaurants
├─ Orders synced today:      56
├─ Avg latency:              2.1s
├─ Failed syncs (24h):       1 (recovered)
├─ Health:                   ✓ Good

Last check: 2 minutes ago
Status: 🟢 UP
```

#### Uber Eats
```
Connected: 28 restaurants
├─ Orders synced today:      45
├─ Avg latency:              1.8s
├─ Failed syncs (24h):       0
├─ Health:                   ✓ Good

Last check: 2 minutes ago
Status: 🟢 UP
```

#### Deliveroo
```
Connected: 22 restaurants
├─ Orders synced today:      32
├─ Avg latency:              2.9s
├─ Failed syncs (24h):       3 (investigating)
├─ Health:                   ⚠️ Degraded (sync lag)

Last check: 1 minute ago
Status: 🟡 DEGRADED
```

---

### 4. Order Quality (Real-Time)

```
Order Confirmation Rate:  94%
├─ Orders received:       234
├─ Confirmed by restaurant: 220
├─ Rejected/Cancelled:    14 (6%)

Fulfillment Rate:         87%
├─ Confirmed orders:      220
├─ Delivered/Picked up:   191
├─ Pending (>30 min):     29

Issue Detection:
├─ Late order acceptances (>2 min): 8
├─ Customer cancellations:          6
├─ Failed payments:                 2
├─ Duplicate orders:                0
```

---

### 5. Revenue & Economics (Phase 1, Cumulative)

```
Total Gross Order Value (GOV):  €42,300
├─ Just Eat orders:            €18,900
├─ Glovo orders:               €12,100
├─ Uber Eats orders:           €8,200
├─ Deliveroo orders:           €3,100

ChefIApp Commission (2%):       €846

Avg Order Value:               €181
Avg Restaurant Revenue/Day:    €487

Projection (100 restaurants, 30 days): €1.46M GOV
```

---

## Detailed Metrics (Dashboard Tabs)

### Tab 1: Onboarding Cohort Analysis

```
Cohort: Week 1 (Day 1–7)
├─ Sign-ups:                  25
├─ Email confirmed:           23 (92%)
├─ Published:                 21 (91% of confirmed)
├─ With marketplace:          18 (86% of published)
├─ With first order:          10 (56% with marketplace)
├─ Days to first order (avg): 1.8 days

Cohort: Week 2 (Day 8–14)
├─ Sign-ups:                  35
├─ Email confirmed:           32 (91%)
├─ Published:                 29 (91% of confirmed)
├─ With marketplace:          24 (83% of published)
├─ With first order:          12 (50% with marketplace)
├─ Days to first order (avg): 2.1 days

Insight: Week 1 cohort converting better → onboarding flow is improving.
```

---

### Tab 2: Restaurant Deep Dive

**Search:** [Sofia's Gastrobar                 ]  [Search]

```
Sofia's Gastrobar
├─ Created:                    2024-01-15
├─ Status:                     ✓ Published + 3 marketplaces
├─ Page views:                 245
├─ Orders:
│  ├─ Total:                  18
│  ├─ Today:                  3
│  ├─ Avg order value:        €19.50
│  ├─ Conversion (views → orders): 7.3%
├─ Marketplaces:
│  ├─ Just Eat:              ✓ (12 orders, €180)
│  ├─ Glovo:                 ✓ (4 orders, €65)
│  ├─ Uber Eats:             ✓ (2 orders, €32)
│  └─ Deliveroo:             ❌ (not connected)
├─ Menu:
│  ├─ Items:                 24
│  ├─ Most ordered:          "Hamburguer Classico" (6x)
│  └─ Least ordered:         "Salada Grega" (0x)
├─ Issues:
│  ├─ Slow order acceptance:  2 incidents (>5 min)
│  ├─ Customer complaints:    1 ("Wrong side order")
│  └─ Payment failures:       0
├─ Health:
│  ├─ Sync latency (24h avg): 1.1s
│  ├─ Last sync:             2 minutes ago
│  └─ Status:                ✓ Excellent
├─ Owner Contact:
│  ├─ Email:                 sofia@gastrobar.pt
│  ├─ Phone:                 +351 91 234 5678
│  └─ Last login:            Today, 15:32
└─ Actions:
   [ Send message ] [ Check API calls ] [ View logs ]
```

---

### Tab 3: Alerts & Incidents

```
CRITICAL (0)
└─ None

WARNINGS (2)
├─ Deliveroo API latency >3s for 20 minutes
│  Status: Investigating with Deliveroo
│  Action: Auto-retry enabled
├─ Restaurant "Pasta à Noite" hasn't confirmed an order in 4 hours
│  Status: Likely closed
│  Action: Monitor; send check-in email

INFO (5)
├─ 3 new restaurants published today
├─ 1 restaurant added "Salads" category
├─ 2 restaurants disconnected Deliveroo (manual deactivation)
├─ Avg order confirmation time improved 12% week-over-week
└─ New feature request: "Bulk menu import from Excel"
```

---

### Tab 4: Support Tickets (Phase 1)

```
Total tickets: 12
├─ Resolved:   10
├─ In progress: 2
├─ Status:     83% resolution time <24h

Top Issues:
1. "Can't connect to Glovo" (3 tickets)
   → Root cause: Old API credentials
   → Solution: Sent direct support email + re-auth guide
   → Status: ✓ Resolved

2. "Order appears in dashboard but not in marketplace" (2 tickets)
   → Root cause: Marketplace webhook delay
   → Solution: Documented expected 5-30s sync lag
   → Status: ✓ Resolved

3. "Customers say they can't add items to cart" (1 ticket)
   → Root cause: Menu item temporarily out of stock
   → Status: 🔄 In progress — investigating stock sync
```

---

### Tab 5: Product Insights (Behavioral)

```
Feature Usage:
├─ Menu edits per restaurant (avg):    2.3 (post-launch)
├─ Restaurants connecting 2+ markets: 64%
├─ Restaurants viewing analytics:     42%
├─ Direct page views (non-marketplace): 1,250

Engagement:
├─ Daily active restaurants:          78 / 87 live (90%)
├─ Avg time on platform per day:      8.3 min
├─ Admin dashboard views per restaurant: 3.2 per day

Retention:
├─ 7-day retention (published restaurants): 92%
├─ 14-day retention:                        88%
├─ Churn (not published after 7 days):      8%

NPS / Satisfaction:
├─ Surveys sent:     34
├─ Responses:        12
├─ NPS score:        +42 (Excellent)
├─ Top comment:      "Easy setup, orders flowing"
└─ Concern:          "Need better order tracking"
```

---

## Alert Rules (Automated)

| Condition | Severity | Action |
|-----------|----------|--------|
| Marketplace API uptime <99% for 15 min | 🔴 Critical | Page on-call engineer |
| Order sync latency >10s avg (5 min window) | 🟡 Warning | Notify + investigate |
| 10+ failed order syncs in 1 hour | 🔴 Critical | Halt marketplace, notify |
| Restaurant can't confirm orders (2+ hour gap) | 🟡 Warning | Send check-in email |
| 50+ unconfirmed orders in queue | 🔴 Critical | Monitor; offer phone support |
| New restaurant no orders in 48h post-publish | ℹ️ Info | Suggest marketing / menu review |

---

## Weekly Report (Sent Every Monday 9 AM)

### Subject: Phase 1 Status — Week of Jan 15

**Key Numbers**
- New restaurants: 25 (total: 100)
- New orders: 234 (avg per restaurant: 2.3)
- Confirmed orders: 220 (94%)
- Avg order value: €181
- System uptime: 99.98%

**Wins**
✓ Onboarding time reduced to 12 min (target: <15 min)
✓ 3 restaurants hit €1k in GOV
✓ Deliveroo integration live (4th marketplace)
✓ Zero critical incidents

**Issues**
⚠️ 8 restaurants haven't logged in since launch (retention risk)
⚠️ 2 marketplace integrations need re-auth (Glovo API key rotation)

**Next Week**
- Target: 120 restaurants by Jan 22
- Focus: Improve day-2 retention (email re-engagement)
- Investigate: Why "Salads" category has 0 orders (bad demand or bad listing?)

---

## Data Sources & Refresh Rates

| Metric | Source | Refresh |
|--------|--------|---------|
| Sign-ups, published, menu | PostgreSQL (core) | Real-time |
| Orders, GOV | Event log + Fiscal store | Real-time |
| Marketplace health | Marketplace APIs (health check endpoint) | 2 min |
| Confirmation rate | TPV event log | Real-time |
| User engagement (logins, edits) | Analytics DB (log_events table) | 5 min |
| Support tickets | Freshdesk API | 10 min |
| NPS surveys | Typeform API | Hourly |

---

## Alerts Send To

- **Critical:** Slack #chefiapp-phase1 + PagerDuty (on-call)
- **Warning:** Slack #chefiapp-phase1
- **Info:** Weekly email report

---

## Success Criteria (Phase 1 Complete)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Restaurants live | 85+ | 87 | ✓ |
| Orders/day (avg) | 2.5+ | 2.3 | 🟡 |
| Marketplace health | 99%+ uptime | 99.98% | ✓ |
| Customer satisfaction (NPS) | 40+ | 42 | ✓ |
| Support response <4h | 95%+ | 100% | ✓ |
| Zero critical incidents | ✓ | 0/0 | ✓ |

**Phase 1 Launch Ready:** Jan 20, 2024

