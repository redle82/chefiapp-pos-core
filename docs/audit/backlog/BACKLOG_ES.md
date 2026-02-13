# Backlog Fiscal — España (ES)

Owner: Elder Miranda de Andrade
Roadmap: [FISCAL_ROADMAP_GLOBAL.md](../FISCAL_ROADMAP_GLOBAL.md)
Created: 2026-02-13
Status: Active

---

## Phase 0 — Legal Setup & Data ✅ (pilot done)

| #       | Task                                             | Priority | Status  | Notes                                  |
| ------- | ------------------------------------------------ | -------- | ------- | -------------------------------------- |
| ES-0-01 | Register CIF/NIF in fiscal config                | P0       | ✅ Done | Example: B12345678 — replace with real |
| ES-0-02 | Define emitter posture (non-fiscal vs certified) | P0       | ✅ Done | Non-fiscal SOP signed                  |
| ES-0-03 | Determine region (TicketBAI vs AEAT general)     | P0       | ✅ Done | Ibiza → AEAT general (Baleares)        |
| ES-0-04 | Create fiscal series                             | P0       | ✅ Done | Example: FE-2026                       |
| ES-0-05 | Data retention policy                            | P0       | ✅ Done | Retention signoff exists               |
| ES-0-06 | Export config snapshot for audit                 | P0       | ✅ Done | fiscal_config_20260213.md              |

---

## Phase 1 — Fiscal Document Generation

| #       | Task                                           | Priority | Status  | Notes                                                |
| ------- | ---------------------------------------------- | -------- | ------- | ---------------------------------------------------- |
| ES-1-01 | TicketBAI XML generator (País Vasco / Navarra) | P1       | 🔲 Todo | Module: `fiscal-modules/es/ticketbai/`               |
| ES-1-02 | Factura-e XML generator (AEAT)                 | P0       | 🔲 Todo | Module: `fiscal-modules/es/facturae/`                |
| ES-1-03 | IVA calculation engine                         | P0       | 🔲 Todo | 21% general, 10% reduced, 4% super-reduced           |
| ES-1-04 | IGIC calculation (Canarias)                    | P2       | 🔲 Todo | 7% general — only if expanding to Canarias           |
| ES-1-05 | Recargo de equivalencia support                | P2       | 🔲 Todo | Required for some retail operations                  |
| ES-1-06 | Sequential numbering and series management     | P0       | 🔲 Todo | Per AEAT requirements                                |
| ES-1-07 | Unit tests for XML output validation           | P0       | 🔲 Todo | XSD validation                                       |
| ES-1-08 | Tax calculation test matrix                    | P1       | 🔲 Todo | Cover IVA rates + exemptions                         |
| ES-1-09 | Sample Factura-e validated against AEAT schema | P0       | 🔲 Todo | Artifact: `evidence/engineering/facturae_sample.xml` |

---

## Phase 2 — Communication & Compliance

| #       | Task                                                  | Priority | Status  | Notes                                        |
| ------- | ----------------------------------------------------- | -------- | ------- | -------------------------------------------- |
| ES-2-01 | AEAT SII (Suministro Inmediato de Información) client | P0       | 🔲 Todo | Module: `fiscal-modules/es/sii-client/`      |
| ES-2-02 | TicketBAI submission to regional endpoint             | P1       | 🔲 Todo | Only for TicketBAI regions                   |
| ES-2-03 | Handle AEAT rejection responses                       | P0       | 🔲 Todo | Parse error codes                            |
| ES-2-04 | Retry queue with exponential backoff                  | P1       | 🔲 Todo | DLQ for permanent failures                   |
| ES-2-05 | Store submission protocols and receipts               | P0       | 🔲 Todo | Table: `fiscal_es_receipts`                  |
| ES-2-06 | End-to-end invoice flow integration test              | P0       | 🔲 Todo | Create order → generate doc → submit → store |
| ES-2-07 | AEAT sandbox environment setup                        | P1       | 🔲 Todo | Use AEAT test credentials                    |
| ES-2-08 | Modelo 303 (quarterly IVA return) data export         | P2       | 🔲 Todo | CSV/XML for accountant                       |

---

## Phase 3 — Certification & Operations

| #       | Task                                          | Priority | Status  | Notes                                  |
| ------- | --------------------------------------------- | -------- | ------- | -------------------------------------- |
| ES-3-01 | Regional certification process (if TicketBAI) | P1       | 🔲 Todo | Depends on target regions              |
| ES-3-02 | AEAT compliance self-audit                    | P0       | 🔲 Todo | Internal checklist                     |
| ES-3-03 | Monitoring dashboard for fiscal pipeline      | P1       | 🔲 Todo | Latency, errors, queue depth           |
| ES-3-04 | Alerting rules for fiscal failures            | P1       | 🔲 Todo | PagerDuty/Slack integration            |
| ES-3-05 | Backup and restore drill                      | P1       | 🔲 Todo | Periodic verification                  |
| ES-3-06 | Incident log maintained                       | P1       | 🔲 Todo | `evidence/ops/pilot_incident_log_*.md` |
| ES-3-07 | Annual compliance review process              | P2       | 🔲 Todo | SOP for yearly review                  |

---

## Summary

| Phase     | Total  | Done  | Remaining |
| --------- | ------ | ----- | --------- |
| 0         | 6      | 6     | 0         |
| 1         | 9      | 0     | 9         |
| 2         | 8      | 0     | 8         |
| 3         | 7      | 0     | 7         |
| **Total** | **30** | **6** | **24**    |
