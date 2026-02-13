# Backlog Fiscal — Brasil (BR)

Owner: Elder Miranda de Andrade
Roadmap: [FISCAL_ROADMAP_GLOBAL.md](../FISCAL_ROADMAP_GLOBAL.md)
Created: 2026-02-13
Status: Active

---

## Phase 0 — Legal Setup & Data ✅ (pilot done)

| #       | Task                                           | Priority | Status  | Notes                                           |
| ------- | ---------------------------------------------- | -------- | ------- | ----------------------------------------------- |
| BR-0-01 | Register CNPJ in fiscal config                 | P0       | ✅ Done | Example: 12.345.678/0001-90 — replace with real |
| BR-0-02 | Define emitter posture (non-fiscal vs emitter) | P0       | ✅ Done | Non-fiscal SOP signed                           |
| BR-0-03 | Register IE (Inscrição Estadual)               | P0       | ✅ Done | Example — replace with real                     |
| BR-0-04 | Obtain digital certificate A1/A3               | P0       | 🔲 Todo | Required for NF-e signing                       |
| BR-0-05 | Create fiscal series for NF-e/NFC-e            | P0       | ✅ Done | Example: Serie 1                                |
| BR-0-06 | Data retention policy                          | P0       | ✅ Done | Retention signoff exists                        |
| BR-0-07 | Export config snapshot for audit               | P0       | ✅ Done | fiscal_config_20260213.md                       |

---

## Phase 1 — Fiscal Document Generation

| #       | Task                                         | Priority | Status  | Notes                                                 |
| ------- | -------------------------------------------- | -------- | ------- | ----------------------------------------------------- |
| BR-1-01 | NF-e XML generator (Nota Fiscal Eletrônica)  | P0       | 🔲 Todo | Module: `fiscal-modules/br/nfe/`                      |
| BR-1-02 | NFC-e XML generator (Nota Fiscal Consumidor) | P0       | 🔲 Todo | Module: `fiscal-modules/br/nfce/`                     |
| BR-1-03 | XML digital signature (X.509 A1/A3)          | P0       | 🔲 Todo | Sign `infNFe` node                                    |
| BR-1-04 | ICMS calculation engine                      | P0       | 🔲 Todo | Per state, per product (CST/CSOSN)                    |
| BR-1-05 | PIS/COFINS calculation                       | P1       | 🔲 Todo | Cumulativo vs não-cumulativo                          |
| BR-1-06 | ISS calculation (services)                   | P2       | 🔲 Todo | Municipal tax — only for service items                |
| BR-1-07 | NCM/CEST product classification              | P1       | 🔲 Todo | Required per item on NF-e                             |
| BR-1-08 | SAT/MFE support (São Paulo / Ceará)          | P2       | 🔲 Todo | Hardware fiscal device integration                    |
| BR-1-09 | DANFE PDF generation                         | P1       | 🔲 Todo | Simplified receipt print                              |
| BR-1-10 | Unit tests for NF-e/NFC-e XML output         | P0       | 🔲 Todo | XSD validation per SEFAZ layout                       |
| BR-1-11 | Tax calculation test matrix                  | P0       | 🔲 Todo | Cover ICMS by state, PIS/COFINS                       |
| BR-1-12 | Sample NF-e validated against SEFAZ schema   | P0       | 🔲 Todo | Artifact: `evidence/engineering/nfe_sample_valid.xml` |

---

## Phase 2 — SEFAZ Communication

| #       | Task                                          | Priority | Status  | Notes                                       |
| ------- | --------------------------------------------- | -------- | ------- | ------------------------------------------- |
| BR-2-01 | SEFAZ Web Service client (SOAP)               | P0       | 🔲 Todo | Module: `fiscal-modules/br/sefaz-client/`   |
| BR-2-02 | NF-e authorization (endpoint por UF)          | P0       | 🔲 Todo | Each state has its own WS                   |
| BR-2-03 | NFC-e authorization                           | P0       | 🔲 Todo | State-specific endpoints                    |
| BR-2-04 | Cancellation flow (evento de cancelamento)    | P0       | 🔲 Todo | Within 24h window                           |
| BR-2-05 | Inutilização de numeração                     | P1       | 🔲 Todo | Gap fill for unused invoice numbers         |
| BR-2-06 | Contingency mode (offline/EPEC/SVC)           | P0       | 🔲 Todo | Queue and retry when SEFAZ offline          |
| BR-2-07 | CCe (Carta de Correção Eletrônica)            | P2       | 🔲 Todo | Post-authorization corrections              |
| BR-2-08 | Handle SEFAZ rejection responses              | P0       | 🔲 Todo | Parse cStat codes, auto-retry               |
| BR-2-09 | Retry queue with exponential backoff          | P1       | 🔲 Todo | DLQ for permanent rejections                |
| BR-2-10 | Store SEFAZ protocol receipts                 | P0       | 🔲 Todo | Table: `fiscal_br_receipts`                 |
| BR-2-11 | End-to-end invoice flow integration test      | P0       | 🔲 Todo | Create order → NF-e → SEFAZ → store receipt |
| BR-2-12 | SEFAZ homologação (sandbox) environment setup | P1       | 🔲 Todo | Use homologação URLs                        |

---

## Phase 3 — SPED & Fiscal Obligations

| #       | Task                                       | Priority | Status  | Notes                                  |
| ------- | ------------------------------------------ | -------- | ------- | -------------------------------------- |
| BR-3-01 | SPED Fiscal (EFD-ICMS/IPI) file generation | P1       | 🔲 Todo | Periodic obligation                    |
| BR-3-02 | SPED Contribuições (PIS/COFINS)            | P2       | 🔲 Todo | Periodic obligation                    |
| BR-3-03 | EFD-Reinf integration                      | P2       | 🔲 Todo | If applicable to food service          |
| BR-3-04 | GIA (Guia de Informação e Apuração) export | P2       | 🔲 Todo | State-specific                         |
| BR-3-05 | Audit trail and fiscal event log           | P0       | 🔲 Todo | Immutable log of all fiscal operations |
| BR-3-06 | Accountant export package (monthly)        | P1       | 🔲 Todo | ZIP with XMLs + SPED                   |

---

## Phase 4 — Operations & Monitoring

| #       | Task                                     | Priority | Status  | Notes                                  |
| ------- | ---------------------------------------- | -------- | ------- | -------------------------------------- |
| BR-4-01 | Monitoring dashboard for fiscal pipeline | P1       | 🔲 Todo | Latency, errors, SEFAZ status          |
| BR-4-02 | Alerting rules for fiscal failures       | P1       | 🔲 Todo | PagerDuty/Slack integration            |
| BR-4-03 | Monthly backup verification drill        | P2       | 🔲 Todo | Automate with cron                     |
| BR-4-04 | Incident log maintained                  | P1       | 🔲 Todo | `evidence/ops/pilot_incident_log_*.md` |
| BR-4-05 | Annual compliance review process         | P2       | 🔲 Todo | SOP for yearly review                  |
| BR-4-06 | Certificate A1 renewal automation        | P1       | 🔲 Todo | A1 expires annually                    |

---

## Summary

| Phase     | Total  | Done  | Remaining |
| --------- | ------ | ----- | --------- |
| 0         | 7      | 6     | 1         |
| 1         | 12     | 0     | 12        |
| 2         | 12     | 0     | 12        |
| 3         | 6      | 0     | 6         |
| 4         | 6      | 0     | 6         |
| **Total** | **43** | **6** | **37**    |
