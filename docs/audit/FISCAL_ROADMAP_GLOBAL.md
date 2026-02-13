# Global Fiscal Roadmap (PT/ES/BR/USA)

Owner: Elder Miranda de Andrade
Date: 2026-02-13
Status: Draft roadmap with evidence checklist

## Scope

This roadmap defines the fiscal capabilities required to compete globally in restaurant POS, separated by jurisdiction. Each section lists phases and evidence artifacts expected by regulators and enterprise customers.

## PT (Portugal)

### Phase 0 - Legal setup and data

- Register NIF, fiscal series, certificate
- Define emitter posture (non-fiscal TPV or certified emitter)

Evidence

- Config export or audit log (NIF, series, certificate_id)
- SOP for non-fiscal posture (if applicable)
- Data retention and backup policy

### Phase 1 - Fiscal document generation

- Generate SAF-T XML compliant with PT schema
- ATCUD, hash chain, sequential numbering
- VAT calculations and rounding rules

Evidence

- Sample SAF-T XML validated
- Hash chain logs and series sequencing
- Tax calculation test cases

### Phase 2 - Real AT communication

- Submit invoices/SAF-T to AT endpoints
- Handle rejections and retries
- Store protocols and receipts

Evidence

- AT protocol receipts
- Retry logs and DLQ evidence
- End-to-end invoice flow logs

### Phase 3 - Certification

- AT certification process for software
- Audit readiness and compliance evidence

Evidence

- AT certification record
- External audit report (if required)

### Phase 4 - Operations

- DR tested, backup verification, monitoring

Evidence

- Backup and restore drill
- Monitoring dashboards and alerts
- Incident log

## ES (Spain)

### Phase 0 - Legal setup and data

- CIF/NIF, fiscal series, certificate
- Region determination (TicketBAI vs AEAT general)

Evidence

- Config export or audit log
- Non-fiscal posture SOP (if external emitter)
- Data retention and backup policy

### Phase 1 - Fiscal document generation

- TicketBAI XML generation where required
- IVA rules per regime

Evidence

- Sample TicketBAI XML validated
- VAT rules test cases

### Phase 2 - Communication and compliance

- Submit TicketBAI to regional endpoints
- AEAT reporting where applicable

Evidence

- Submission protocols and receipts
- Retry logs and DLQ evidence

### Phase 3 - Certification and operations

- Regional certification, ongoing compliance

Evidence

- Certification records
- DR and monitoring evidence

## BR (Brazil)

### Phase 0 - Legal setup and data

- CNPJ, IE, certificate A1/A3
- Series for NF-e/NFC-e

Evidence

- Config export or audit log
- Non-fiscal posture SOP (if external emitter)
- Data retention and backup policy

### Phase 1 - Fiscal document generation

- NF-e/NFC-e XML generation with signature
- Support SAT/MFE where required

Evidence

- Sample NF-e/NFC-e XML validated
- Signature verification logs

### Phase 2 - SEFAZ communication

- Authorization, cancellation, inutilizacao
- Contingency flows

Evidence

- SEFAZ protocol receipts
- Contingency logs and retry evidence

### Phase 3 - SPED and obligations

- SPED files and state obligations

Evidence

- SPED exports
- Audit trail reports

### Phase 4 - Operations

- DR tested, backup verification, monitoring

Evidence

- Backup and restore drill
- Monitoring dashboards and alerts
- Incident log

## USA

### Phase 0 - Legal setup and data

- EIN, sales tax permits by state
- Tax nexus determination

Evidence

- Config export or audit log
- Non-fiscal posture SOP (if external tax system)
- Data retention and backup policy

### Phase 1 - Tax calculation engine

- State and local sales tax rates
- Exemptions and taxability rules

Evidence

- Tax calculation test cases by state
- Configuration audit logs

### Phase 2 - Filing and compliance

- Returns and remittance by state
- Reporting and reconciliation

Evidence

- Filing reports
- Reconciliation logs

### Phase 3 - Operations

- DR tested, backup verification, monitoring

Evidence

- Backup and restore drill
- Monitoring dashboards and alerts
- Incident log

## Global shared requirements

- Certificate lifecycle management (vault, rotation)
- Immutable audit trail and hash chain
- Access controls and segregation of duties
- PCI or payment compliance if applicable
- Observability and SLA reporting

## Next actions

1. Confirm per-country scope (pilot vs production)
2. Populate official identifiers when available
3. Execute certification paths for PT, ES, BR
4. Build tax engine and compliance pipeline for USA
