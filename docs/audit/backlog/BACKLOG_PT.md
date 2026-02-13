# Backlog Fiscal — Portugal (PT)

Owner: Elder Miranda de Andrade
Roadmap: [FISCAL_ROADMAP_GLOBAL.md](../FISCAL_ROADMAP_GLOBAL.md)
Created: 2026-02-13
Status: Active

---

## Phase 0 — Legal Setup & Data ✅ (pilot done)

| #       | Task                                             | Priority | Status  | Notes                                  |
| ------- | ------------------------------------------------ | -------- | ------- | -------------------------------------- |
| PT-0-01 | Register NIF in fiscal config                    | P0       | ✅ Done | Example: 123456789 — replace with real |
| PT-0-02 | Define emitter posture (non-fiscal vs certified) | P0       | ✅ Done | Non-fiscal SOP signed                  |
| PT-0-03 | Create fiscal series (FT-2026)                   | P0       | ✅ Done | Example series                         |
| PT-0-04 | Data retention policy signed                     | P0       | ✅ Done | Retention signoff exists               |
| PT-0-05 | Backup and restore drill                         | P0       | ✅ Done | backup_restore_drill evidence          |
| PT-0-06 | Export config snapshot for audit                 | P0       | ✅ Done | fiscal_config_20260213.md              |

---

## Phase 1 — Fiscal Document Generation

| #       | Task                                         | Priority | Status  | Notes                                                  |
| ------- | -------------------------------------------- | -------- | ------- | ------------------------------------------------------ |
| PT-1-01 | Implement SAF-T PT XML generator             | P0       | 🔲 Todo | Module: `fiscal-modules/pt/saft/`                      |
| PT-1-02 | ATCUD generation and sequential numbering    | P0       | 🔲 Todo | Must follow Portaria 195/2020                          |
| PT-1-03 | Hash chain implementation (SHA-256)          | P0       | 🔲 Todo | Each doc references previous hash                      |
| PT-1-04 | VAT calculation engine (IVA PT rates)        | P0       | 🔲 Todo | 23% standard, 13% intermediate, 6% reduced             |
| PT-1-05 | Rounding rules per AT specification          | P1       | 🔲 Todo | Line-level vs document-level                           |
| PT-1-06 | Unit tests for SAF-T XML output              | P0       | 🔲 Todo | Use AT XSD for validation                              |
| PT-1-07 | Unit tests for hash chain integrity          | P0       | 🔲 Todo | Verify sequential, tamper-detection                    |
| PT-1-08 | Sample SAF-T XML validated against AT schema | P0       | 🔲 Todo | Artifact: `evidence/engineering/saft_sample_valid.xml` |
| PT-1-09 | Tax calculation test matrix                  | P1       | 🔲 Todo | Cover all VAT rates + exemptions                       |

---

## Phase 2 — Real AT Communication

| #       | Task                                     | Priority | Status  | Notes                                                |
| ------- | ---------------------------------------- | -------- | ------- | ---------------------------------------------------- |
| PT-2-01 | AT Web Service client (SOAP/REST)        | P0       | 🔲 Todo | Module: `fiscal-modules/pt/at-client/`               |
| PT-2-02 | Invoice submission endpoint              | P0       | 🔲 Todo | Send SAF-T / individual docs                         |
| PT-2-03 | Handle AT rejection responses            | P0       | 🔲 Todo | Parse error codes, store for retry                   |
| PT-2-04 | Retry queue with exponential backoff     | P1       | 🔲 Todo | DLQ for permanent failures                           |
| PT-2-05 | Store AT protocol receipts               | P0       | 🔲 Todo | Table: `fiscal_at_receipts`                          |
| PT-2-06 | End-to-end invoice flow integration test | P0       | 🔲 Todo | Create order → generate doc → submit → store receipt |
| PT-2-07 | AT sandbox environment setup             | P1       | 🔲 Todo | Use AT test credentials                              |
| PT-2-08 | Contingency mode (offline)               | P1       | 🔲 Todo | Queue docs when AT is unreachable                    |

---

## Phase 3 — AT Certification

| #       | Task                                      | Priority | Status  | Notes                                                  |
| ------- | ----------------------------------------- | -------- | ------- | ------------------------------------------------------ |
| PT-3-01 | Prepare certification application package | P0       | 🔲 Todo | AT portal submission                                   |
| PT-3-02 | Self-audit: run AT checklist internally   | P0       | 🔲 Todo | Based on AT certification requirements                 |
| PT-3-03 | External audit engagement (if required)   | P1       | 🔲 Todo | ROC or similar                                         |
| PT-3-04 | Submit software for AT certification      | P0       | 🔲 Todo | Wait for approval                                      |
| PT-3-05 | Store certification record                | P0       | 🔲 Todo | Artifact: `evidence/legal/at_certification_record.pdf` |

---

## Phase 4 — Operations & Monitoring

| #       | Task                                     | Priority | Status  | Notes                                  |
| ------- | ---------------------------------------- | -------- | ------- | -------------------------------------- |
| PT-4-01 | Monitoring dashboard for fiscal pipeline | P1       | 🔲 Todo | Latency, errors, queue depth           |
| PT-4-02 | Alerting rules for fiscal failures       | P1       | 🔲 Todo | PagerDuty/Slack integration            |
| PT-4-03 | Monthly backup verification drill        | P2       | 🔲 Todo | Automate with cron                     |
| PT-4-04 | Incident log maintained                  | P1       | 🔲 Todo | `evidence/ops/pilot_incident_log_*.md` |
| PT-4-05 | Annual compliance review process         | P2       | 🔲 Todo | SOP for yearly review                  |

---

## Summary

| Phase     | Total  | Done  | Remaining |
| --------- | ------ | ----- | --------- |
| 0         | 6      | 6     | 0         |
| 1         | 9      | 0     | 9         |
| 2         | 8      | 0     | 8         |
| 3         | 5      | 0     | 5         |
| 4         | 5      | 0     | 5         |
| **Total** | **33** | **6** | **27**    |
