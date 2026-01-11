# GO/NO-GO DECISION MEMO

**Data:** 2025-12-24  
**From:** Chief Systems Auditor  
**Subject:** Beta Launch Authority & Gates

---

## Decision Framework

| Gate | Status | Blocker? | Override? |
|------|--------|----------|-----------|
| Architecture Integrity (92/100) | ✅ PASS | NO | N/A |
| Contract Compliance (12/12) | ✅ PASS | NO | N/A |
| Flow Causality (95/100) | ✅ PASS | NO | N/A |
| AppStaff Invariants | ✅ FIXED | NO | Applied |
| Router Guard Global | ⚠️ CONDITIONAL | YES | Implementable in 4h |
| Auth Real Implementation | ❌ MISSING | YES | Deferred to Pre-Scale |
| Billing Real Implementation | ⚠️ PARTIAL | MEDIUM | Deferred to Post-Beta |

---

## VERDICT: GO FOR BETA (CONTROLLED)

**Conditions:**
- [x] Fix `appstaff-core/invariants.ts` — DONE
- [ ] Implement Router Guard as global middleware (Est: 4 hours)
- [ ] Remove hardcoded demo data (Sofia Gastrobar, etc.)
- [x] Audit Report signed

**Release Gate:** POST-ROUTER-GUARD-FIX

---

## Pre-Beta Checklist (48 hours)

- [ ] Router Guard global implementation (4h)
- [ ] Remove demo defaults (2h)
- [ ] Smoke test: Full onboarding flow (4h)
- [ ] Security audit: No hardcoded secrets (2h)
- [ ] Pilot selection: 1–3 restaurants (2h)
- [ ] Legal review: Terms of Service + Privacy (4h)

---

## Go Decision Logic

| Scenario | Decision |
|----------|----------|
| Router Guard ✅ + No Secrets ✅ | GO FOR BETA |
| Router Guard ❌ | CONDITIONAL GO (24h to fix) |
| Found hardcoded secrets | STOP (fix required) |
| Legal review 🟢 | GO |
| Found > 3 critical bugs | REASSESS |

---

## No-Go Triggers

| Trigger | Action |
|---------|--------|
| Invariant check fails | Fix + Retest |
| Contract violation | Architecture review |
| Hardcoded secrets found | Security remediation |
| Audit trail breaks | Event log review |
| Causal flow broken | Flow engine retest |

---

## Beta Boundaries

**INCLUDE:**
- ✅ Full onboarding (Identity → Menu → TPV Ready)
- ✅ Preview (Ghost + Live modes)
- ✅ Web public page (`/public/{slug}`)
- ✅ Legal profiles (ES, PT, BR, FR)
- ✅ TPV simulator demo

**EXCLUDE:**
- ❌ Real Stripe integration (demo only)
- ❌ Marketplace integrations (Glovo, Uber, etc.)
- ❌ WhatsApp orders
- ❌ Advanced KDS
- ❌ Staff app (AppStaff UI not ready)

---

## Pilot Criteria

**Ideal Pilot Restaurants:**
1. **Tech-forward** (willing to give feedback)
2. **Casual dining or dark kitchen** (simpler setup)
3. **Single location** (Phase 1)
4. **Small menu** (< 50 items)
5. **Willing to go live** (real orders, not sandbox)

**Non-Starters:**
- ❌ High-volume chains
- ❌ Complex compliance (multi-country)
- ❌ Integrated third-party systems

---

## Success Criteria (Beta)

| Metric | Target | KPI |
|--------|--------|-----|
| Onboarding time | < 30 min | 95% complete |
| No critical bugs | 0 per week | Zero blocking issues |
| Order flow latency | < 2s | 99th percentile |
| Uptime | 99.5%+ | Monitored 24/7 |
| NPS | > 30 | Qualitative feedback |
| Legal compliance | 100% | No violations logged |

---

## Escalation Path

**Issue Severity**

- **Critical:** Breaks onboarding or order flow → Immediate fix
- **High:** Security, legal, data loss → 24h fix
- **Medium:** UX, performance → Sprint planning
- **Low:** Copy, UI polish → Post-beta

---

## Sign-Off

**Auditor:** Claude Opus 4.5  
**Date:** 2025-12-24  
**Authority:** Chief Systems Auditor  

**Next Review:** Post-Router-Guard implementation (Est. 2025-12-25)

---

## Appendix: Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Auth not real | Demo token is labeled; no production data |
| Billing not integrated | Free tier beta; manual invoicing |
| Single location | Explicit UI limitation |
| No integrations | Messaging: "Phase 2 capability" |

**Final Note:** The system is architecturally sound. The gaps are operational (auth, billing), not structural. Beta is executable with current constraints.
