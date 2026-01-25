# ⚖️ ENGINEERING CONSTITUTION — ChefIApp

> **The Operating System of ChefIApp Engineering.**
> Effective immediately. **Mandatory. Non-negotiable.**

---

## PREAMBLE

This document defines the absolute rules that govern ChefIApp development.

**Violation = Critical Incident.**

These are not guidelines. These are laws.

---

## PART I — FUNDAMENTAL PRINCIPLES

### Art. 1. Authority Hierarchy

```
DATABASE > BACKEND > FRONTEND > UI
```

1. **DATABASE_AUTHORITY**: The database is the sole source of final truth.
2. **Backend validates**: All business rules are enforced in the backend.
3. **Frontend projects**: The UI is a projection of state, not the authority.
4. **Client never decides**: Permissions, prices, and final states come from the server.

### Art. 2. Definition of "Done"

Work is only **DONE** when:

- [x] Code committed (`git status` clean)
- [x] Build passes without errors
- [x] Deployed or with explicit justification
- [x] Documentation updated if necessary

**"Almost ready" = "Not done"**

### Art. 3. Absolute Reversibility

Nothing enters the system that cannot be reverted.

- Migrations have rollback
- Features have feature flags
- Deploys have immediate rollback

---

## PART II — ABSOLUTE INVARIANTS

> **Rules that can NEVER be violated, regardless of context.**

### Art. 4. Order Invariants

| ID      | Invariant                                   |
| ------- | -------------------------------------------- |
| ORD-001 | Order does not exist without valid `restaurant_id` |
| ORD-003 | Closed order is **IMMUTABLE**                |
| ORD-005 | `idempotency_key` guarantees unique creation      |

### Art. 5. Financial Invariants

| ID      | Invariant                                          |
| ------- | --------------------------------------------------- |
| PAY-001 | Payment cannot be applied twice          |
| PAY-002 | Sum of payments ≤ order total                |
| FIN-001 | Cash register closure is **IRREVERSIBLE**              |
| FIN-003 | **Offline NEVER alters already synchronized financial** |

### Art. 6. Synchronization Invariants

| ID      | Invariant                                 |
| ------- | ------------------------------------------ |
| SYN-001 | Backend is ALWAYS the final source             |
| SYN-003 | Conflict never results in silent loss |
| SYN-004 | Replay respects chronological order          |

**📚 Complete reference**: [BUSINESS_INVARIANTS.md](docs/BUSINESS_INVARIANTS.md)

---

## PART III — SECURITY CLAUSES

### Art. 7. RBAC Violation = Critical Incident

```typescript
if (rbac_violation_count > 0) {
  status = "CRITICAL";
  action = "STOP_DEPLOY";
}
```

**Consequences of RBAC violation**:

1. 🚨 Immediate alert on Conflict Dashboard
2. ⛔ Deploy blocked until resolution
3. 📝 Mandatory postmortem

### Art. 8. Financial Conflict = Mandatory Postmortem

Any conflict involving:

- Payments
- Cash register closure
- Order totals

**Requires**:

- Documented investigation
- Root cause identified
- Correction committed

### Art. 9. Conflict Policy

| Scenario                             | Who Wins                      |
| ----------------------------------- | ------------------------------- |
| Two waiters edit order          | Last event                   |
| Offline vs Online                   | Online wins                    |
| Offline action, order closed online | Offline discarded              |
| Duplicate payment                 | Second ignored (idempotency) |

**📚 Complete reference**: [CONFLICT_POLICY.md](docs/CONFLICT_POLICY.md)

---

## PART IV — QUALITY GOVERNANCE

### Art. 10. Universal Test is Mandatory

**No client enters production without passing PHASE 4 (Total Offline).**

| Phase     | Mandatory For |
| -------- | ---------------- |
| PHASE 0   | Every deploy      |
| PHASE 1-2 | Every deploy      |
| PHASE 3-4 | New client     |
| PHASE 5-6 | Major release    |
| PHASE 7   | Before scaling |

**📚 Reference**: [UNIVERSAL_TEST_PLAN.md](docs/testing/UNIVERSAL_TEST_PLAN.md)

### Art. 11. Conflict Dashboard is Source of Truth

The conflict dashboard:

- Is continuously monitored
- Defines system health
- Generates automatic alerts

**Alert limits**:
| Metric | Limit | Action |
|---------|--------|------|
| RBAC violations | > 0 | CRITICAL |
| Conflict rate | > 5% | DEGRADED |
| Sync conflicts/24h | > 10 | DEGRADED |

---

## PART V — OPERATIONAL FLOW

### Art. 12. Standard Daily Flow

```bash
1. git pull                    # Sync with reality
2. Implement                 # Change reality
3. npm run typecheck && npm run build  # Verify
4. git commit                  # Save
5. Deploy                      # Deliver
6. Update PROXIMOS_PASSOS.md
```

### Art. 13. Commit Convention

```
type(scope): description

Types: feat, fix, docs, refactor, test, chore
```

### Art. 14. Clean State Law

**Cannot declare task finished with `git status` dirty.**

---

## PART VI — CODE HYGIENE

### Art. 15. Absolute Prohibitions

- ❌ Commit of `*.log` or debug dumps
- ❌ Commented code (Git has history)
- ❌ `console.log` in production (use Logger)
- ❌ Temporary files in repo
- ❌ Hardcoded secrets

### Art. 16. Mandatory Standards

- ✅ TypeScript strict mode
- ✅ ESLint without warnings
- ✅ Organized absolute imports
- ✅ Error boundaries in critical components

---

## PART VII — SYSTEM PROTECTION

### Art. 17. Who Can Use ChefIApp

Minimum criteria for client:

1. Real restaurant with physical operation
2. Willingness to train team
3. Accept that offline does not alter closed financial
4. Understand that backend is authority

**Client who does not accept the rules = Client who does not enter.**

### Art. 18. What We Don't Do

- ❌ Allow permission fraud
- ❌ Overwrite closed financial
- ❌ Ignore conflicts silently
- ❌ Deploy without passing minimum tests

---

## PART VIII — ENFORCEMENT

### Art. 19. Violation = Incident

| Violation Type    | Severity | Action                    |
| ------------------- | ---------- | ----------------------- |
| Broken invariant | CRITICAL    | Stop development   |
| RBAC violation      | CRITICAL    | Block deploy         |
| Financial conflict | GRAVE      | Postmortem              |
| Lint/Type error     | MÉDIO      | Fix before merge |
| Clean state dirty   | LOW      | Cannot declare done  |

### Art. 20. Mandatory Postmortem

Critical incidents require:

1. Timeline of what happened
2. Root cause analysis
3. Implemented correction
4. Preventive measures
5. Document archived in `docs/incidents/`

---

## SIGNATURES

This document is law.

Last updated: **2026-01-23**

---

## REFERENCES

| Document                                                                                      | Purpose                |
| ---------------------------------------------------------------------------------------------- | ------------------------ |
| [BUSINESS_INVARIANTS.md](docs/BUSINESS_INVARIANTS.md)                                          | 26 absolute invariants |
| [EVENT_MODEL.md](docs/EVENT_MODEL.md)                                                          | 35+ domain events   |
| [CONFLICT_POLICY.md](docs/CONFLICT_POLICY.md)                                                  | Resolution matrix      |
| [UNIVERSAL_TEST_PLAN.md](docs/testing/UNIVERSAL_TEST_PLAN.md)                                  | Sovereign test plan  |
| [ConflictMetricsDashboard.tsx](merchant-portal/src/pages/Reports/ConflictMetricsDashboard.tsx) | Conflict dashboard   |
