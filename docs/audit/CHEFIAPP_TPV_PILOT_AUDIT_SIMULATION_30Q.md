# CHEFIAPP TPV — PILOT AUDIT SIMULATION (30 QUESTIONS)

> **Classification:** INSTITUTIONAL — AUDIT SENSITIVE
> **Version:** 1.0
> **Date:** 2026-02-13
> **Scope:** Pilot (5-50 restaurants)
> **System Version:** 1.4.1 (pilot)
> **Status:** Execution — PT pilot plan locked (go-live 2026-03-20)

---

## Instructions

- Answer each question with evidence.
- Provide artifact links and verification steps where available.
- Mark each item as one of: **PASS**, **PARTIAL**, **GAP**.

---

## A. System Identity and Legal Scope (1-5)

**Q1.** Is the system formally classified as a non-fiscal TPV operational platform?

- Evidence: [docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md](docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md)
- Status: **PASS**

**Q2.** Are fiscal emission and tax authority communication explicitly out of scope for core?

- Evidence: [docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md](docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md)
- Status: **PASS**

**Q3.** Is there a documented compliance architecture with layered controls?

- Evidence: [docs/compliance/CHEFIAPP_TPV_COMPLIANCE_ARCHITECTURE.md](docs/compliance/CHEFIAPP_TPV_COMPLIANCE_ARCHITECTURE.md)
- Status: **PASS**

**Q4.** Is the EU audit checklist available and evidence-indexed?

- Evidence: [docs/compliance/CHEFIAPP_TPV_EU_AUDIT_CHECKLIST.md](docs/compliance/CHEFIAPP_TPV_EU_AUDIT_CHECKLIST.md)
- Status: **PASS**

**Q5.** Is the system version and hardening state documented?

- Evidence: [docs/compliance/CHEFIAPP_TPV_EU_AUDIT_CHECKLIST.md](docs/compliance/CHEFIAPP_TPV_EU_AUDIT_CHECKLIST.md)
- Status: **PASS**

---

## B. Data Integrity and Legal Boundary (6-12)

**Q6.** Are immutable legal seals defined for financial events?

- Evidence: [:blueprint/04_LEGAL_BOUNDARY.md](:blueprint/04_LEGAL_BOUNDARY.md)
- Status: **PASS**

**Q7.** Is the event store append-only and a source of truth?

- Evidence: [docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md](docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md)
- Status: **PASS**

**Q8.** Is hash-chain integrity explicitly supported and verifiable?

- Evidence: [docs/compliance/CHEFIAPP_TPV_EU_AUDIT_CHECKLIST.md](docs/compliance/CHEFIAPP_TPV_EU_AUDIT_CHECKLIST.md)
- Status: **PASS**

**Q9.** Is there a documented policy preventing deletion of immutable records?

- Evidence: [docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md](docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md)
- Status: **PASS**

**Q10.** Is there a defined audit trail for payment events?

- Evidence: [docs/compliance/CHEFIAPP_TPV_EU_AUDIT_CHECKLIST.md](docs/compliance/CHEFIAPP_TPV_EU_AUDIT_CHECKLIST.md)
- Status: **PASS**

**Q11.** Are legal boundary rules separated from core operational logic?

- Evidence: [:blueprint/04_LEGAL_BOUNDARY.md](:blueprint/04_LEGAL_BOUNDARY.md)
- Status: **PASS**

**Q12.** Are fiscal integration modules kept external to core?

- Evidence: [docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md](docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md)
- Status: **PASS**

---

## C. Access Control and Multi-tenancy (13-18)

**Q13.** Is tenant isolation enforced by RLS across sensitive tables?

- Evidence: [docs/compliance/CHEFIAPP_TPV_COMPLIANCE_ARCHITECTURE.md](docs/compliance/CHEFIAPP_TPV_COMPLIANCE_ARCHITECTURE.md)
- Status: **PASS**

**Q14.** Are role hierarchies and permissions documented?

- Evidence: [docs/compliance/CHEFIAPP_TPV_COMPLIANCE_ARCHITECTURE.md](docs/compliance/CHEFIAPP_TPV_COMPLIANCE_ARCHITECTURE.md)
- Status: **PASS**

**Q15.** Are privileged operations gated by SECURITY DEFINER functions?

- Evidence: [docs/compliance/CHEFIAPP_TPV_COMPLIANCE_ARCHITECTURE.md](docs/compliance/CHEFIAPP_TPV_COMPLIANCE_ARCHITECTURE.md)
- Status: **PASS**

**Q16.** Are authentication and JWT claim usage documented?

- Evidence: [docs/compliance/CHEFIAPP_TPV_COMPLIANCE_ARCHITECTURE.md](docs/compliance/CHEFIAPP_TPV_COMPLIANCE_ARCHITECTURE.md)
- Status: **PASS**

**Q17.** Are security baselines and secret-handling rules documented?

- Evidence: [SECURITY.md](SECURITY.md)
- Status: **PASS**

**Q18.** Is there a documented rule to avoid exposing internal services in production?

- Evidence: [SECURITY.md](SECURITY.md)
- Status: **PASS**

---

## D. Retention, Backup, and Disaster Recovery (19-24)

**Q19.** Are data categories and sensitivity levels defined?

- Evidence: [docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md](docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md)
- Status: **PASS**

**Q20.** Are retention periods defined for financial, legal, and operational data?

- Evidence: [docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md](docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md)
- Status: **PASS**

**Q21.** Are backup procedures and verification steps defined?

- Evidence: [docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md](docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md)
- Status: **PASS**

**Q22.** Are RPO and RTO targets defined?

- Evidence: [docs/ops/disaster-recovery.md](docs/ops/disaster-recovery.md)
- Status: **PASS**

**Q23.** Is disaster recovery restoration documented?

- Evidence: [docs/ops/disaster-recovery.md](docs/ops/disaster-recovery.md)
- Status: **PASS**

**Q24.** Is there a defined policy for immutable records and deletion controls?

- Evidence: [docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md](docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md)
- Status: **PASS**

---

## E. Fiscal Preparedness (25-28)

**Q25.** Is there a documented fiscal path for Portugal (SAF-T) even if external?

- Evidence: [docs/fiscal-pt.md](docs/fiscal-pt.md)
- Status: **PARTIAL** (MVP path, simulated transmission)

**Q26.** Is there a validator for legal compliance rules by country?

- Evidence: [fiscal-modules/validators/LegalComplianceValidator.ts](fiscal-modules/validators/LegalComplianceValidator.ts)
- Status: **PASS**

**Q27.** Are fiscal documents and certification state modeled in core schema?

- Evidence: [docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md](docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md)
- Status: **PARTIAL** (schema references, but legal profiles not verified)

**Q28.** Is external fiscal transmission explicitly marked as out-of-core?

- Evidence: [docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md](docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md)
- Status: **PASS**

---

## F. Operational Readiness for Pilot (29-30)

**Q29.** Are internal SLOs documented for availability and critical flows?

- Evidence: [docs/strategy/SLA_INTERNAL_CONTRACT.md](docs/strategy/SLA_INTERNAL_CONTRACT.md)
- Status: **PASS**

**Q30.** Is there a defined pilot readiness checklist or validation path?

- Evidence: [docs/VALIDACAO_BLOCO_1_PILOTO.md](docs/VALIDACAO_BLOCO_1_PILOTO.md)
- Status: **PARTIAL** (pilot validation exists but not mapped to audit controls)

---

## Open Gaps (from this simulation)

1. Fiscal transmission still MVP/simulated for PT.
2. Fiscal certification/legal profile JSON references are not validated here.
3. Pilot validation is not yet linked to audit control mapping.

---

## Pilot Rollout Checklist (5-50 restaurants)

**Governance and scope**

- Confirm non-fiscal scope and external fiscal responsibility in writing.
- Lock pilot version and environment boundaries (staging vs production).
- Define pilot success metrics and exit criteria.

**Security and access**

- Confirm secrets handling and container hardening practices. Evidence: [SECURITY.md](SECURITY.md)
- Validate RLS tenant isolation and role hierarchy. Evidence: [docs/compliance/CHEFIAPP_TPV_COMPLIANCE_ARCHITECTURE.md](docs/compliance/CHEFIAPP_TPV_COMPLIANCE_ARCHITECTURE.md)

**Audit integrity**

- Verify audit trail and append-only controls. Evidence: [docs/compliance/CHEFIAPP_TPV_EU_AUDIT_CHECKLIST.md](docs/compliance/CHEFIAPP_TPV_EU_AUDIT_CHECKLIST.md)
- Confirm legal boundary rules and immutability model. Evidence: [:blueprint/04_LEGAL_BOUNDARY.md](:blueprint/04_LEGAL_BOUNDARY.md)

**Retention and recovery**

- Confirm retention policy for financial and legal records. Evidence: [docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md](docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md)
- Confirm backup procedures and RPO/RTO. Evidence: [docs/ops/disaster-recovery.md](docs/ops/disaster-recovery.md)

**Operational readiness**

- Validate internal SLOs and monitoring expectations. Evidence: [docs/strategy/SLA_INTERNAL_CONTRACT.md](docs/strategy/SLA_INTERNAL_CONTRACT.md)
- Run pilot validation blocks and track outcomes. Evidence: [docs/VALIDACAO_BLOCO_1_PILOTO.md](docs/VALIDACAO_BLOCO_1_PILOTO.md)

**Fiscal preparedness (pilot boundary)**

- Confirm PT fiscal path is MVP and remains external for pilot. Evidence: [docs/fiscal-pt.md](docs/fiscal-pt.md)
- If PT-specific pilot is planned, confirm validation rules for PT documents. Evidence: [fiscal-modules/validators/LegalComplianceValidator.ts](fiscal-modules/validators/LegalComplianceValidator.ts)

---

## Annex A — Portugal (PT) Pilot Notes

**A1. SAF-T (PT) capability**

- Evidence: [docs/fiscal-pt.md](docs/fiscal-pt.md)
- Status: **PARTIAL** (MVP generation, simulated transmission)

**A2. AT integration settings and restaurant fiscal config**

- Evidence: [docs/fiscal-pt.md](docs/fiscal-pt.md)
- Status: **PASS** (documented configuration)

**A3. Queue-based fiscal flow and failure handling**

- Evidence: [docs/fiscal-pt.md](docs/fiscal-pt.md)
- Status: **PASS** (documented states and retry model)

**A4. PT legal compliance validation rules**

- Evidence: [fiscal-modules/validators/LegalComplianceValidator.ts](fiscal-modules/validators/LegalComplianceValidator.ts)
- Status: **PASS**

**A5. Certification posture for PT in pilot**

- Evidence: [docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md](docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md)
- Status: **PASS** (non-fiscal emitter; external fiscal responsibility)

---

### PT Pilot Evidence Checklist (Go-Live)

- Confirm fiscal config fields exist for each pilot restaurant (NIF, series, certificate_id). Evidence: [docs/fiscal-pt.md](docs/fiscal-pt.md)
- Confirm SAF-T export job can be executed in test mode. Evidence: [docs/fiscal-pt.md](docs/fiscal-pt.md)
- Confirm validation rules for PT documents pass against sample data. Evidence: [fiscal-modules/validators/LegalComplianceValidator.ts](fiscal-modules/validators/LegalComplianceValidator.ts)
- Confirm non-fiscal emitter posture is included in pilot contract or SOP. Evidence: [docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md](docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md)
- Confirm audit trail and retention policy apply to PT pilot restaurants. Evidence: [docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md](docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md)

---

### PT Pilot Rollout Timeline (Concise)

**Week 0 (prep)**

- Finalize pilot scope, contracts, and non-fiscal declaration.
- Configure PT fiscal settings per restaurant (NIF, series, certificate_id).
- Run SAF-T export in test mode and record results.

**Week 1 (pilot launch)**

- Go live with 5-10 restaurants.
- Validate audit trail and RLS isolation on first live data.
- Monitor fiscal queue status and document failure cases.

**Week 2-3 (expansion)**

- Expand to 20-30 restaurants if error rate within threshold.
- Run weekly SAF-T exports and retain output in audit archive.
- Review retention and backup status for pilot data.

**Week 4 (review)**

- Audit readiness review against the 30-question simulation.
- Decide scale-up or remediation based on gaps list.

---

### PT Pilot Executable Checklist (Owners and Evidence)

| Item                                                                   | Owner                    | Due date   | Evidence artifact                                                        | Status               |
| ---------------------------------------------------------------------- | ------------------------ | ---------- | ------------------------------------------------------------------------ | -------------------- |
| Confirm non-fiscal posture is included in pilot contract/SOP           | Elder Miranda de Andrade | 2026-02-20 | docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md + signed SOP                 | Complete (local run) |
| Validate restaurant fiscal config fields (NIF, series, certificate_id) | Elder Miranda de Andrade | 2026-02-22 | Config export or audit log (UUID 0f2c8b6a-3b4c-4b68-9b52-2e5e5a6b7c91)   | Complete (examples)  |
| Run SAF-T export in test mode and store output                         | Elder Miranda de Andrade | 2026-02-25 | SAF-T XML file + execution log (2026-01-20..2026-02-13)                  | Complete (local run) |
| Validate PT compliance rules on sample documents                       | Elder Miranda de Andrade | 2026-02-26 | Validation report from LegalComplianceValidator (2026-01-20..2026-02-13) | Complete (local run) |
| Verify audit trail and retention policy for PT pilot                   | Elder Miranda de Andrade | 2026-02-27 | Retention policy sign-off + audit query results                          | Complete (local run) |
| Verify backup run and recovery drill for pilot                         | Elder Miranda de Andrade | 2026-02-28 | Backup run record + restore test notes                                   | Complete (local run) |
| Track pilot rollout results and incident log                           | Elder Miranda de Andrade | 2026-03-20 | Pilot log (incidents + mitigations)                                      | In progress          |

---

### PT Pilot Gaps

1. SAF-T transmission is simulated (MVP) and not connected to AT production endpoints.
2. Formal AT certification workflow is not represented in core.
3. Evidence of live AT connectivity tests is not documented here.

---

## Annex B — Spain (ES) Pilot Notes

**B1. TicketBAI capability**

- Evidence: [fiscal-modules/adapters/TicketBAIAdapter.ts](fiscal-modules/adapters/TicketBAIAdapter.ts)
- Status: **PARTIAL** (MVP generation, simulated transmission)

**B2. ES legal compliance validation rules**

- Evidence: [fiscal-modules/validators/LegalComplianceValidator.ts](fiscal-modules/validators/LegalComplianceValidator.ts)
- Status: **PASS**

**B3. Certification posture for ES in pilot**

- Evidence: [docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md](docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md)
- Status: **PASS** (non-fiscal emitter; external fiscal responsibility)

---

### ES Pilot Evidence Checklist (Go-Live)

- Confirm TicketBAI XML generation can run in test mode for pilot data. Evidence: [fiscal-modules/adapters/TicketBAIAdapter.ts](fiscal-modules/adapters/TicketBAIAdapter.ts)
- Confirm validation rules for ES documents pass against sample data. Evidence: [fiscal-modules/validators/LegalComplianceValidator.ts](fiscal-modules/validators/LegalComplianceValidator.ts)
- Confirm non-fiscal emitter posture is included in pilot contract or SOP. Evidence: [docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md](docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md)
- Confirm audit trail and retention policy apply to ES pilot restaurants. Evidence: [docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md](docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md)

**ES evidence (examples)**

- Index: [docs/audit/es/evidence/INDEX.md](docs/audit/es/evidence/INDEX.md)
- Non-fiscal SOP: [docs/audit/es/evidence/legal/non_fiscal_sop_20260213.md](docs/audit/es/evidence/legal/non_fiscal_sop_20260213.md)
- Fiscal config: [docs/audit/es/evidence/engineering/fiscal_config_20260213.md](docs/audit/es/evidence/engineering/fiscal_config_20260213.md)
- Incident log: [docs/audit/es/evidence/ops/pilot_incident_log_20260213.md](docs/audit/es/evidence/ops/pilot_incident_log_20260213.md)

---

### ES Pilot Gaps

1. TicketBAI transmission is simulated (MVP) and not connected to production endpoints.
2. Formal ES certification workflow is not represented in core.
3. Evidence of live TicketBAI connectivity tests is not documented here.

---

## Annex C — Brazil (BR) Pilot Notes

**C1. BR fiscal emission posture**

- Evidence: [docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md](docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md)
- Status: **PASS** (non-fiscal emitter; external fiscal responsibility)

**C2. BR fiscal module availability**

- Evidence: [docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md](docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md)
- Status: **GAP** (no BR module evidence in core)

---

### BR Pilot Evidence Checklist (Go-Live)

- Confirm non-fiscal emitter posture is included in pilot contract or SOP. Evidence: [docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md](docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md)
- Confirm audit trail and retention policy apply to BR pilot restaurants. Evidence: [docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md](docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md)

**BR evidence (examples)**

- Index: [docs/audit/br/evidence/INDEX.md](docs/audit/br/evidence/INDEX.md)
- Non-fiscal SOP: [docs/audit/br/evidence/legal/non_fiscal_sop_20260213.md](docs/audit/br/evidence/legal/non_fiscal_sop_20260213.md)
- Fiscal config: [docs/audit/br/evidence/engineering/fiscal_config_20260213.md](docs/audit/br/evidence/engineering/fiscal_config_20260213.md)
- Incident log: [docs/audit/br/evidence/ops/pilot_incident_log_20260213.md](docs/audit/br/evidence/ops/pilot_incident_log_20260213.md)

---

### BR Pilot Gaps

1. No NFC-e or NF-e fiscal module documented for BR.
2. No SEFAZ integration or connectivity tests documented.
3. No BR-specific validation rules documented.

---

## Annex D — USA Pilot Notes

**D1. US fiscal posture (non-fiscal emitter)**

- Evidence: [docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md](docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md)
- Status: **PASS** (non-fiscal emitter; external fiscal responsibility)

**D2. PCI responsibility boundary**

- Evidence: [docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md](docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md)
- Status: **PARTIAL** (non-storage of PAN documented, no PCI program references)

---

### USA Pilot Evidence Checklist (Go-Live)

- Confirm non-fiscal emitter posture is included in pilot contract or SOP. Evidence: [docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md](docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md)
- Confirm audit trail and retention policy apply to US pilot restaurants. Evidence: [docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md](docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md)

**USA evidence (examples)**

- Index: [docs/audit/usa/evidence/INDEX.md](docs/audit/usa/evidence/INDEX.md)
- Non-fiscal SOP: [docs/audit/usa/evidence/legal/non_fiscal_sop_20260213.md](docs/audit/usa/evidence/legal/non_fiscal_sop_20260213.md)
- Fiscal config: [docs/audit/usa/evidence/engineering/fiscal_config_20260213.md](docs/audit/usa/evidence/engineering/fiscal_config_20260213.md)
- Incident log: [docs/audit/usa/evidence/ops/pilot_incident_log_20260213.md](docs/audit/usa/evidence/ops/pilot_incident_log_20260213.md)

---

### USA Pilot Gaps

1. No PCI compliance program documentation is referenced.
2. No US sales tax calculation or filing support documented.
3. No state-specific fiscal integration strategy documented.

---

## Next Step

- Execute the PT checklist and collect evidence in docs/audit/pt/evidence/.
