# CHEFIAPP TPV — EU AUDIT CHECKLIST

> **Classification:** INSTITUTIONAL — AUDIT SENSITIVE
> **Version:** 1.0
> **Date:** 2026-02-13
> **System Version:** 1.4.0 (`PRODUCTION_READINESS_HARDENED`)
> **Status:** DB Core Hardening v1.0 — FROZEN

---

## 1. PURPOSE

This checklist provides an audit-ready, evidence-mapped validation of the ChefIApp POS Core for EU governmental technical audit (TPV non-fiscal emitter). It links each control to documentary evidence and, where applicable, to verification queries.

---

## 2. EXECUTIVE SUMMARY

- ChefIApp is an operational TPV system, formally positioned as a non-fiscal emitter.
- Compliance relies on defense-in-depth controls covering identity, access, legal boundary, and operational integrity.
- Legal seals and hash-chain verification provide immutable, reproducible audit evidence.
- Tenant isolation and privileged operations are enforced by RLS and role-gated functions.
- Retention, backup, export, and recovery controls are documented and verifiable.
- Fiscal emission, tax rules, and authority integrations are explicitly out of scope and handled externally.

---

## 3. AUDIT SCOPE

**In scope:**

- Operational POS core (orders, payments, cash register, shifts)
- Data integrity, audit trail, and legal boundary (immutability)
- Access control (RLS, role gating, auth functions)
- Data retention, backup, and export processes

**Out of scope:**

- Fiscal emission, tax calculation, SAF-T generation, and tax authority integrations

---

## 4. EVIDENCE INDEX

| Evidence ID | Artifact                     | Path                                                      |
| ----------- | ---------------------------- | --------------------------------------------------------- |
| E-01        | Legal scope declaration      | `docs/compliance/CHEFIAPP_TPV_LEGAL_SCOPE.md`             |
| E-02        | Compliance architecture      | `docs/compliance/CHEFIAPP_TPV_COMPLIANCE_ARCHITECTURE.md` |
| E-03        | Retention and backup policy  | `docs/compliance/DATA_RETENTION_AND_BACKUP_POLICY.md`     |
| E-04        | Legal boundary specification | `:blueprint/04_LEGAL_BOUNDARY.md`                         |
| E-05        | Security baseline            | `SECURITY.md`                                             |
| E-06        | System version stamp         | `VERSION`                                                 |

---

## 5. CHECKLIST

### A. SYSTEM IDENTITY AND FISCAL POSITION

| ID  | Requirement                                                          | Evidence   | Verification                                        |
| --- | -------------------------------------------------------------------- | ---------- | --------------------------------------------------- |
| A1  | System is classified as TPV operational system (non-fiscal emitter). | E-01       | Manual review of E-01 Section 4.                    |
| A2  | Fiscal capabilities are not implemented in core.                     | E-01       | Manual review of E-01 Section 3.                    |
| A3  | Fiscal integration path exists but is external.                      | E-01, E-02 | Manual review of E-01 Section 4.3 and E-02 Layer 5. |

### B. DATA INTEGRITY AND LEGAL BOUNDARY

| ID  | Requirement                                       | Evidence   | Verification                                   |
| --- | ------------------------------------------------- | ---------- | ---------------------------------------------- |
| B1  | Legal boundary seals exist and are immutable.     | E-02, E-04 | Verify immutability rules described in E-04.   |
| B2  | Financial events can be sealed into legal states. | E-04       | Review seal state derivation model.            |
| B3  | Hash chain integrity can be verified.             | E-02, E-03 | Run integrity check query (see Q-04).          |
| B4  | Core logic is not modified by legal layer.        | E-04       | Manual review ("CORE remains pure" principle). |

### C. ACCESS CONTROL AND MULTI-TENANCY

| ID  | Requirement                                                    | Evidence   | Verification                             |
| --- | -------------------------------------------------------------- | ---------- | ---------------------------------------- |
| C1  | RLS enforces restaurant isolation.                             | E-02, E-05 | Inspect policies and functions (Q-01).   |
| C2  | User access is resolved from `restaurant_users` or JWT claims. | E-02       | Review current_user_restaurants() logic. |
| C3  | Admin actions are gated by SECURITY DEFINER functions.         | E-02       | Review privileged RPC list.              |

### D. AUDIT TRAIL AND NON-REPUDIATION

| ID  | Requirement                                       | Evidence   | Verification                                                      |
| --- | ------------------------------------------------- | ---------- | ----------------------------------------------------------------- |
| D1  | Payment events are logged and append-only.        | E-02, E-03 | Verify `gm_payment_audit_logs` retention and immutability (Q-02). |
| D2  | Legal seals provide immutable audit truth.        | E-04       | Review sealing rules and stream hash.                             |
| D3  | Export jobs are tracked with checksum and expiry. | E-02, E-03 | Inspect `gm_export_jobs` entries (Q-03).                          |

### E. RETENTION, BACKUP, AND DISASTER RECOVERY

| ID  | Requirement                                              | Evidence | Verification                   |
| --- | -------------------------------------------------------- | -------- | ------------------------------ |
| E1  | Retention periods defined for all critical data.         | E-03     | Manual review of Section 3.    |
| E2  | Backups are tracked with completion status and checksum. | E-03     | Query `gm_backup_runs` (Q-05). |
| E3  | Restore testing is defined and periodic.                 | E-03     | Manual review of Section 7.    |
| E4  | RPO/RTO defined for production.                          | E-03     | Manual review of Section 7.    |

### F. GDPR/RGPD DATA SUBJECT RIGHTS

| ID  | Requirement                                                  | Evidence | Verification                         |
| --- | ------------------------------------------------------------ | -------- | ------------------------------------ |
| F1  | Data subject erasure process is defined.                     | E-03     | Manual review of Section 6.2.        |
| F2  | Financial records are preserved while PII can be anonymized. | E-03     | Review anonymization logic guidance. |

---

## 6. VERIFICATION QUERIES

> Run queries with appropriate privileged access (service role) in a controlled environment.

### Q-01: List RLS policies and verify restaurant isolation

```sql
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname IN ('public', 'core')
ORDER BY schemaname, tablename, policyname;
```

### Q-02: Verify immutable audit tables (no DELETE grants)

```sql
SELECT table_schema, table_name, privilege_type, grantee
FROM information_schema.role_table_grants
WHERE table_name IN ('event_store', 'legal_seals', 'gm_payment_audit_logs')
ORDER BY table_name, grantee, privilege_type;
```

### Q-03: Export jobs status and integrity

```sql
SELECT id, export_type, status, checksum, expires_at, created_at
FROM gm_export_jobs
ORDER BY created_at DESC
LIMIT 20;
```

### Q-04: Hash chain integrity check (example)

```sql
SELECT check_hash_chain_integrity('example-stream-uuid');
```

### Q-05: Backup runs verification

```sql
SELECT id, status, scope, backup_type, checksum, completed_at
FROM gm_backup_runs
ORDER BY created_at DESC
LIMIT 20;
```

---

## 7. AUDITOR NOTES

- ChefIApp is an operational TPV system. It is not a certified fiscal emitter.
- The legal boundary layer provides legal immutability without fiscal rules.
- All jurisdiction-specific fiscal obligations are external modules.

---

## 8. APPENDIX A — ONE-PAGE AUDIT OVERVIEW

**Scope:** Operational POS core, audit trail, access control, retention/backup, export.
**Out of scope:** Fiscal emission, tax rules, SAF-T, tax authority integrations.

### A. System Position

| Item            | Statement                                |
| --------------- | ---------------------------------------- |
| Fiscal role     | Non-fiscal emitter (operational TPV)     |
| Core purpose    | Orders, payments, cash registers, shifts |
| Fiscal handling | External modules only                    |

### B. Integrity and Audit Truth

| Control                  | Evidence   | Verification                |
| ------------------------ | ---------- | --------------------------- |
| Legal seals immutable    | E-02, E-04 | Review legal boundary rules |
| Hash chain integrity     | E-02, E-03 | Q-04                        |
| Append-only payment logs | E-02, E-03 | Q-02                        |

### C. Access Control and Isolation

| Control                    | Evidence   | Verification           |
| -------------------------- | ---------- | ---------------------- |
| Tenant isolation (RLS)     | E-02, E-05 | Q-01                   |
| Role-gated admin functions | E-02       | Review privileged RPCs |

### D. Retention and Backup

| Control                      | Evidence | Verification     |
| ---------------------------- | -------- | ---------------- |
| Retention periods defined    | E-03     | Section 3 review |
| Backups tracked and verified | E-03     | Q-05             |
| RPO/RTO defined              | E-03     | Section 7 review |

### E. GDPR/RGPD

| Control                 | Evidence | Verification         |
| ----------------------- | -------- | -------------------- |
| Erasure process defined | E-03     | Section 6.2 review   |
| PII anonymization path  | E-03     | Section 6.3 guidance |

### F. Primary Evidence

| Evidence ID | Artifact                     |
| ----------- | ---------------------------- |
| E-01        | Legal scope declaration      |
| E-02        | Compliance architecture      |
| E-03        | Retention and backup policy  |
| E-04        | Legal boundary specification |
| E-05        | Security baseline            |
| E-06        | System version stamp         |

---

## 9. APPENDIX B — RESUMO (PT)

**Escopo:** nucleo operacional do TPV, trilha de auditoria, controle de acesso, retencao/backup, exportacao.
**Fora do escopo:** emissao fiscal, regras fiscais, SAF-T, integracoes com autoridades.

### A. Posicionamento do sistema

| Item         | Declaracao                           |
| ------------ | ------------------------------------ |
| Papel fiscal | Emissor nao-fiscal (TPV operacional) |
| Proposito    | Pedidos, pagamentos, caixa, turnos   |
| Fiscal       | Modulos externos apenas              |

### B. Integridade e verdade auditavel

| Controle                      | Evidencia  | Verificacao                           |
| ----------------------------- | ---------- | ------------------------------------- |
| Selos legais imutaveis        | E-02, E-04 | Revisao das regras da fronteira legal |
| Cadeia de hash                | E-02, E-03 | Q-04                                  |
| Logs de pagamento append-only | E-02, E-03 | Q-02                                  |

### C. Controlo de acesso e isolamento

| Controle                          | Evidencia  | Verificacao                   |
| --------------------------------- | ---------- | ----------------------------- |
| Isolamento por restaurante (RLS)  | E-02, E-05 | Q-01                          |
| Funcoes administrativas com papel | E-02       | Revisao de RPCs privilegiados |

### D. Retencao e backup

| Controle                         | Evidencia | Verificacao        |
| -------------------------------- | --------- | ------------------ |
| Periodos de retencao definidos   | E-03      | Revisao da Secao 3 |
| Backups rastreados e verificados | E-03      | Q-05               |
| RPO/RTO definidos                | E-03      | Revisao da Secao 7 |

### E. RGPD

| Controle               | Evidencia | Verificacao          |
| ---------------------- | --------- | -------------------- |
| Processo de eliminacao | E-03      | Revisao da Secao 6.2 |
| Anonimizacao de PII    | E-03      | Revisao da Secao 6.3 |

---

## 10. DOCUMENT CONTROL

| Attribute         | Value                           |
| ----------------- | ------------------------------- |
| Last Updated      | 2026-02-13                      |
| Core Version      | 1.4.0                           |
| Hardening Version | DB Core Hardening v1.0 — FROZEN |
| Review Cycle      | Annually or on major change     |
| Owner             | ChefIApp Engineering            |
| Classification    | Institutional — Audit Sensitive |
