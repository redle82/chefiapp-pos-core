# Backlog Fiscal — United States (USA)

Owner: Elder Miranda de Andrade
Roadmap: [FISCAL_ROADMAP_GLOBAL.md](../FISCAL_ROADMAP_GLOBAL.md)
Created: 2026-02-13
Status: Active

---

## Phase 0 — Legal Setup & Data ✅ (pilot done)

| # | Task | Priority | Status | Notes |
|---|------|----------|--------|-------|
| US-0-01 | Register EIN in fiscal config | P0 | ✅ Done | Example: 12-3456789 — replace with real |
| US-0-02 | Define tax posture (internal vs external engine) | P0 | ✅ Done | Non-fiscal SOP signed |
| US-0-03 | Sales tax permits by target state | P0 | 🔲 Todo | Depends on expansion states |
| US-0-04 | Tax nexus determination | P0 | 🔲 Todo | Physical + economic nexus analysis |
| US-0-05 | Data retention policy | P0 | ✅ Done | Retention signoff exists |
| US-0-06 | Export config snapshot for audit | P0 | ✅ Done | fiscal_config_20260213.md |

---

## Phase 1 — Tax Calculation Engine

| # | Task | Priority | Status | Notes |
|---|------|----------|--------|-------|
| US-1-01 | State sales tax rate database | P0 | 🔲 Todo | Module: `fiscal-modules/usa/tax-rates/` |
| US-1-02 | County/city local tax overlay | P0 | 🔲 Todo | Some jurisdictions add local surtax |
| US-1-03 | Tax exemption rules (food vs prepared food) | P0 | 🔲 Todo | Varies by state — critical for restaurants |
| US-1-04 | Taxability matrix by product category | P1 | 🔲 Todo | Beverages, food, alcohol, tips |
| US-1-05 | Tax-inclusive vs tax-exclusive pricing toggle | P1 | 🔲 Todo | Support both models |
| US-1-06 | Integration with external tax APIs (TaxJar/Avalara) | P2 | 🔲 Todo | Optional — for automated rate updates |
| US-1-07 | Unit tests for tax calculation by state | P0 | 🔲 Todo | Cover no-tax states (OR, MT, DE, NH) |
| US-1-08 | Tax calculation test matrix (10+ states) | P0 | 🔲 Todo | NY, CA, TX, FL, IL, WA, etc. |
| US-1-09 | Tipped transactions and gratuity tax handling | P1 | 🔲 Todo | Tips exempt in most states |

---

## Phase 2 — Filing & Compliance

| # | Task | Priority | Status | Notes |
|---|------|----------|--------|-------|
| US-2-01 | Sales tax return data aggregator | P0 | 🔲 Todo | Module: `fiscal-modules/usa/filing/` |
| US-2-02 | State-specific return formats | P1 | 🔲 Todo | Each state has own form |
| US-2-03 | Filing frequency tracking (monthly/quarterly/annual) | P0 | 🔲 Todo | Varies by state and revenue |
| US-2-04 | Remittance calculation and reconciliation | P0 | 🔲 Todo | Collected vs owed |
| US-2-05 | Integration with state e-filing portals | P2 | 🔲 Todo | Optional — manual filing fallback |
| US-2-06 | 1099-K reporting preparation | P2 | 🔲 Todo | If processing payments above threshold |
| US-2-07 | Reconciliation reports for accountant | P1 | 🔲 Todo | Monthly export package |
| US-2-08 | Audit trail for all tax events | P0 | 🔲 Todo | Immutable log |

---

## Phase 3 — Operations & Monitoring

| # | Task | Priority | Status | Notes |
|---|------|----------|--------|-------|
| US-3-01 | Monitoring dashboard for tax pipeline | P1 | 🔲 Todo | Rate update freshness, calculation errors |
| US-3-02 | Alerting rules for tax calculation failures | P1 | 🔲 Todo | PagerDuty/Slack integration |
| US-3-03 | Tax rate update automation | P1 | 🔲 Todo | Quarterly rate refresh process |
| US-3-04 | Backup and restore drill | P1 | 🔲 Todo | Periodic verification |
| US-3-05 | Incident log maintained | P1 | 🔲 Todo | `evidence/ops/pilot_incident_log_*.md` |
| US-3-06 | Annual compliance review process | P2 | 🔲 Todo | Nexus re-evaluation, permit renewals |
| US-3-07 | Multi-location tax config management | P2 | 🔲 Todo | If operating in multiple states |

---

## Summary

| Phase | Total | Done | Remaining |
|-------|-------|------|-----------|
| 0 | 6 | 4 | 2 |
| 1 | 9 | 0 | 9 |
| 2 | 8 | 0 | 8 |
| 3 | 7 | 0 | 7 |
| **Total** | **30** | **4** | **26** |
