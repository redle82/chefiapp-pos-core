# Phase 1 — Implementation Roadmap (8 Weeks to Launch)

**Timeline:** Jan 6 – Feb 28, 2025 (8 weeks)  
**Target Launch:** Feb 28, 2025 (100 early-adopter restaurants live)  
**Team:** 4 engineers + 1 product + 1 ops

---

## Sprint Structure

- **Sprints:** 2-week cycles (4 total)
- **Release cadence:** Friday afternoon (prep for weekend testing)
- **Testing window:** Friday EOD → Monday 9 AM (48h)
- **Go-live:** Monday 9 AM (if passing)

---

## Sprint 1: Jan 6–17 (Core Scaffolding + Adapters Foundation)

**Goal:** Marketplace adapters can read orders. Loyalty contracts defined. Testing infrastructure ready.

### Engineering (Week 1: Jan 6–10)

| Task | Owner | Days | Status |
|------|-------|------|--------|
| Finalize marketplace API contracts (Just Eat, Glovo, Uber Eats, Deliveroo) | Backend Lead | 1 | 🔵 Design |
| Build adapter framework (base class + webhook handler) | Backend | 2 | 🔵 Design → Code |
| Just Eat adapter: auth + order polling | Backend | 2 | 🔵 Code |
| Core → marketplace event translator | Backend | 1 | 🔵 Code |
| Set up event log + in-memory store for testing | Backend | 1 | 🔵 Code |

### Testing (Week 1)

- [ ] Just Eat adapter test cases (10 scenarios)
- [ ] Event translator unit tests
- [ ] Polling simulation (100 orders/min)

### Engineering (Week 2: Jan 13–17)

| Task | Owner | Days | Status |
|------|-------|------|--------|
| Glovo adapter: auth + order sync | Backend | 2 | ⏳ Waiting for Week 1 |
| Uber Eats adapter: auth + order sync | Backend | 2 | ⏳ Waiting for Week 1 |
| Loyalty core contracts (events, state) | Backend | 1 | 🔵 Design |
| WhatsApp adapter skeleton | Backend | 1 | ⏳ Low priority |

### Testing (Week 2)

- [ ] Glovo adapter test cases (10 scenarios)
- [ ] Uber Eats adapter test cases (10 scenarios)
- [ ] Multi-marketplace order dedupe tests
- [ ] Loyalty event schema validation

### Release (Fri Jan 17, EOD)

**Branch:** `phase1/sprint1-adapters`

**What ships:**
- Just Eat, Glovo, Uber Eats adapters (beta)
- Core event log ready for orders
- Loyalty state machine sketched

**Testing window:** Fri–Mon (internal)

---

## Sprint 2: Jan 20–31 (Onboarding + Restaurant Page)

**Goal:** Restaurants can sign up, set menu, connect marketplace, see page live.

### Engineering (Week 3: Jan 20–24)

| Task | Owner | Days | Status |
|------|-------|------|--------|
| Auth system (sign-up, email confirm) | Backend | 2 | 🔵 Design |
| Restaurant entity + identity schema | Backend | 1 | 🔵 Code |
| Menu CRUD (add items, pricing) | Backend + Frontend | 2 | 🔵 Code |
| Web UI: sign-up form | Frontend | 2 | 🔵 Design → Code |
| Web UI: onboarding wizard | Frontend | 2 | ⏳ Waiting |

### Testing (Week 3)

- [ ] Sign-up email delivery (3 providers tested)
- [ ] Email token validation (expiry, reuse)
- [ ] Menu item creation + validation
- [ ] UI form accessibility (keyboard, screen reader)

### Engineering (Week 4: Jan 27–31)

| Task | Owner | Days | Status |
|------|-------|------|--------|
| Restaurant page static rendering | Frontend | 2 | 🔵 Design |
| Marketplace connection flow (OAuth skeleton) | Backend | 1 | 🔵 Design |
| Dashboard (overview, marketplace status) | Frontend | 2 | ⏳ Waiting |
| Deliveroo adapter (last marketplace) | Backend | 1 | ⏳ Low priority |

### Testing (Week 4)

- [ ] E2E: sign-up → menu → page live (5 scenarios)
- [ ] Restaurant page renders correctly (mobile, desktop)
- [ ] Dashboard shows correct status
- [ ] Marketplace connection OAuth flow (mock)

### Release (Fri Jan 31, EOD)

**Branch:** `phase1/sprint2-onboarding`

**What ships:**
- Restaurant sign-up + email confirmation
- Menu management
- Restaurant page (public URL)
- Dashboard overview
- Deliveroo adapter (beta)

**Testing window:** Fri–Mon (internal + 5 beta restaurants)

---

## Sprint 3: Feb 3–14 (Marketplace Connection + Orders → TPV)

**Goal:** Restaurants can connect marketplaces. Orders flow to TPV. KDS shows orders.

### Engineering (Week 5: Feb 3–7)

| Task | Owner | Days | Status |
|------|-------|------|--------|
| Marketplace OAuth flow (all 4 platforms) | Backend | 2 | 🔵 Design → Code |
| Marketplace token storage (encrypted) | Backend | 1 | 🔵 Code |
| Order ingestion from all 4 marketplaces | Backend | 2 | 🔵 Code |
| TPV core integration (order state sync) | Backend | 1 | 🔵 Code |

### Testing (Week 5)

- [ ] OAuth with each marketplace (sandbox)
- [ ] Token encryption/decryption
- [ ] Order ingestion load test (50 orders/min)
- [ ] Order state transitions (received → confirmed → ready)

### Engineering (Week 6: Feb 10–14)

| Task | Owner | Days | Status |
|------|-------|------|--------|
| Kitchen Display System (KDS) core | Frontend | 2 | 🔵 Design → Code |
| Real-time order updates (websocket) | Backend + Frontend | 2 | 🔵 Code |
| Order confirmation (restaurant accepts order) | Frontend + Backend | 1 | 🔵 Code |
| Notification system (email + SMS stubs) | Backend | 1 | ⏳ Low priority |

### Testing (Week 6)

- [ ] KDS displays orders within 2 sec of ingestion
- [ ] Restaurant confirms orders; TPV updates
- [ ] Real-time sync across multiple connections
- [ ] Load test: 100+ simultaneous orders

### Release (Fri Feb 14, EOD)

**Branch:** `phase1/sprint3-orders`

**What ships:**
- Marketplace connection (all 4)
- Order ingestion (all 4 marketplaces)
- TPV + KDS integration
- Real-time order display
- Order confirmation workflow

**Testing window:** Fri–Mon (internal + 15 beta restaurants)

---

## Sprint 4: Feb 17–28 (Polish + Launch Prep + Go-Live)

**Goal:** Fix bugs, scale test, launch on Feb 28.

### Engineering (Week 7: Feb 17–21)

| Task | Owner | Days | Status |
|------|-------|------|--------|
| Marketplace API error handling (retries, webhooks) | Backend | 2 | 🔵 Code |
| Order error recovery (duplicates, missing fields) | Backend | 1 | 🔵 Code |
| Loyalty event logging (foundation for Phase 2) | Backend | 1 | 🔵 Code |
| WhatsApp adapter (basic, low priority) | Backend | 1 | ⏳ If time |

### Performance & Reliability (Week 7)

- [ ] Load test: 100 restaurants, 50 orders/min
- [ ] Marketplace API failure simulation (circuit breaker)
- [ ] Database backup + recovery test
- [ ] Disaster recovery plan (restore from backup)

### Engineering (Week 8: Feb 24–28)

| Task | Owner | Days | Status |
|------|-------|------|--------|
| Bug fixes (from Week 7 testing) | Backend + Frontend | 2 | 🔵 Code |
| Pre-launch checklist (PHASE1_LAUNCH_CHECKLIST) | All | 1 | 🔵 Review |
| On-call runbook (PHASE1_GOLIVE_RUNBOOK) | Ops + Backend | 1 | 🔵 Write |
| Final sanity checks (all adapters, all flows) | QA | 1 | ⏳ Waiting |

### Launch Prep (Week 8)

- [ ] **Mon Feb 24:** Final code freeze
- [ ] **Tue–Wed Feb 25–26:** Full E2E regression (100 scenarios)
- [ ] **Wed–Thu Feb 26–27:** Marketplace sandbox testing (all 4)
- [ ] **Fri Feb 28 6 AM:** Go-live readiness check
- [ ] **Fri Feb 28 9 AM:** Launch (see PHASE1_GOLIVE_RUNBOOK)

### Release (Fri Feb 28, 9 AM)

**Branch:** `phase1/main` (merge to production)

**What ships:**
- Phase 1 complete (100 restaurants live)
- All 4 marketplace adapters
- Full onboarding → orders → TPV flow
- Metrics dashboard + monitoring
- On-call procedures + runbook

---

## Parallel: Testing & QA Strategy

### Sprint 1–4 (Continuous)

| Week | Focus | Owner |
|------|-------|-------|
| 1 | Unit tests (adapters, contracts) | Backend QA |
| 2 | Integration tests (onboarding, page) | Backend + Frontend QA |
| 3 | E2E tests (sign-up → orders) | QA Lead |
| 4 | Load + failure scenario tests | Performance QA |
| 4 | Final regression (all flows) | All QA |

### Test Coverage Targets

- **Unit tests:** 80%+ (adapters, core state)
- **Integration tests:** 95%+ (critical paths)
- **E2E tests:** 100% (sign-up → orders → confirm)
- **Load tests:** 2x expected throughput

---

## Parallel: Documentation

| Week | Deliverable | Owner |
|------|-------------|-------|
| 1 | API contracts (marketplace adapters) | Backend Lead |
| 2 | Onboarding flow (UX) | Product |
| 3 | TPV integration guide | Backend |
| 4 | On-call runbook + disaster recovery | Ops |
| 4 | Post-launch success metrics | Product |

---

## Parallel: Ops & Infrastructure

| Sprint | Task | Owner | Status |
|--------|------|-------|--------|
| 1 | PostgreSQL schema migration framework | Ops | 🔵 Code |
| 1–2 | Monitoring + alerting (Datadog, PagerDuty) | Ops | 🔵 Setup |
| 2 | Backup strategy (daily, tested) | Ops | 🔵 Setup |
| 3 | Load testing environment (staging mirrors prod) | Ops | 🔵 Setup |
| 4 | Disaster recovery drill (full restore) | Ops | ⏳ Waiting |

---

## Blockers & Dependencies

### Known Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Marketplace API changes mid-sprint | Medium | High | Contract freeze week 1; fallback to polling |
| OAuth token refresh fails | Low | High | Implement automatic re-auth + manual override |
| Load test fails (>50 orders/min) | Medium | High | Start load testing week 2; add caching |
| PostgreSQL migration hangs | Low | Critical | Test migrations in staging first |
| Marketplace webhook unreliability | Medium | Medium | Implement polling + webhook deduplication |

### Critical Path

```
Week 1: Adapters + Events ✓
  ↓
Week 2: Onboarding + Restaurant Page ✓
  ↓
Week 3: Marketplace Connection + Orders ← (CRITICAL)
  ↓
Week 4: Polish + Launch
```

**If Week 3 slips:** Launch date moves to Mar 7 (one week).

---

## Success Metrics (Per Sprint)

| Sprint | Metric | Target | Actual |
|--------|--------|--------|--------|
| 1 | Adapters can read 100 test orders | 100% | 🔵 Pending |
| 2 | 10 beta restaurants complete onboarding | 100% | 🔵 Pending |
| 3 | 50 beta restaurants connect 1+ marketplace | 90%+ | 🔵 Pending |
| 4 | 100 production restaurants live, 25+ with orders | 90%+ | 🔵 Pending |

---

## Release Candidates

### Sprint 1 RC (Jan 17)
- **Branch:** `phase1/sprint1-adapters`
- **Approval gate:** Adapters read orders correctly
- **Decision:** Merge to main? **Yes** (low risk)

### Sprint 2 RC (Jan 31)
- **Branch:** `phase1/sprint2-onboarding`
- **Approval gate:** E2E sign-up → page live works
- **Decision:** Merge to main? **Yes** (low risk)

### Sprint 3 RC (Feb 14)
- **Branch:** `phase1/sprint3-orders`
- **Approval gate:** Orders flow end-to-end, KDS works
- **Decision:** Merge to main? **Yes** (medium risk → test thoroughly)

### Sprint 4 RC (Feb 28)
- **Branch:** `phase1/main`
- **Approval gate:** ALL tests pass, load test OK, checklist ✅
- **Decision:** Go live? **Yes or No** (launch decision)

---

## Weekly Sync Format

**Every Friday 5 PM (Berlin time)**

```
Attendees: Tech lead, product, ops, QA lead

Agenda (30 min):
1. Sprint progress (2 min)
2. Blockers (3 min)
3. Testing results (3 min)
4. Next sprint prep (2 min)
5. Launch readiness (20 min in Week 8)

Metrics reviewed:
  - Stories completed
  - Test coverage
  - Known bugs + severity
  - Load test results (if run)
  - Risk register updates
```

---

## Contingency: If Timeline Slips

| Slip Amount | Action |
|-------------|--------|
| 3–7 days | Reduce non-critical features (WhatsApp → Phase 2) |
| 1–2 weeks | Cut Sprint 4 polish, do pre-launch with 50 restaurants |
| 2+ weeks | Escalate to investors; re-plan Phase 1 scope |

---

## Launch Decision Criteria (Feb 27)

✅ **GO if:**
- All 4 marketplaces working in sandbox
- E2E tests 100% passing
- Load test ≥100 orders/min stable
- Checklist 100% complete
- On-call team trained + runbook tested

❌ **HOLD if:**
- Any critical bugs unfixed
- Load test fails consistently
- Marketplace API integration incomplete
- Team not confident in runbook

---

## Stakeholder Updates

| Stakeholder | Frequency | Format |
|-------------|-----------|--------|
| Investors | Weekly (Fri) | Email: metrics + blockers |
| Restaurants (beta) | Ad-hoc | Email: feature updates, testing window |
| Team | Daily (standup) | Slack: progress + blockers |
| Internal | Weekly | Docs: this roadmap updated |

---

## Success = Feb 28, 9 AM, 100 Restaurants Live ✓

If you hit this, you've shipped Phase 1.

Next: Phase 2 (growth to 1,000 restaurants).

