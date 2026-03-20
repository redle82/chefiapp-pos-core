# Code Ownership -- ChefiApp POS Core

> Defines who owns each bounded context and infrastructure area.
> Each owner is responsible for code quality, test coverage, documentation, and on-call.
>
> Last updated: 2026-03-20

---

## Rules

1. **Each context MUST have exactly one owner.** No orphaned code.
2. **Owner reviews ALL PRs** touching their context. No merge without owner approval.
3. **Owner can delegate** review to a trusted contributor, but **stays accountable**.
4. **Owner is responsible for:** code quality, test coverage (>80%), documentation currency, on-call rotation for incidents in their area.
5. **Ownership transfers** require a written handoff (PR description + knowledge-transfer session).
6. **Disputes** escalate to Tech Lead, then CTO.

---

## Bounded Context Ownership

| # | Bounded Context | Owner | Canonical Spec | Key Paths |
|---|---|---|---|---|
| 1 | **Order Management** | [owner TBD] | `docs/DOMAIN-SPEC.md` section 1 | `merchant-portal/src/domain/order/`, `application/OrderUseCases.ts` |
| 2 | **Payments** | [owner TBD] | `docs/DOMAIN-SPEC.md` section 2 | `merchant-portal/src/domain/payment/`, `application/PaymentUseCases.ts` |
| 3 | **Floor & Service** | [owner TBD] | `docs/DOMAIN-SPEC.md` section 3 | `merchant-portal/src/domain/floor/`, `components/TableMap/` |
| 4 | **Kitchen Operations** | [owner TBD] | `docs/DOMAIN-SPEC.md` section 4 | `merchant-portal/src/domain/kitchen/`, `mobile-app/components/KDS*` |
| 5 | **Staff & Shifts** | [owner TBD] | `docs/DOMAIN-SPEC.md` section 5 | `merchant-portal/src/domain/staff/`, `core/security/RBACService.ts` |
| 6 | **Catalog & Pricing** | [owner TBD] | `docs/DOMAIN-SPEC.md` section 6 | `merchant-portal/src/domain/catalog/`, `MenuBuilder/` |
| 7 | **Inventory** | [owner TBD] | `docs/DOMAIN-SPEC.md` section 7 | `merchant-portal/src/domain/inventory/` |
| 8 | **Reservations** | [owner TBD] | `docs/DOMAIN-SPEC.md` section 8 | `core/reservations/ReservationEngine.ts` |
| 9 | **CRM & Loyalty** | [owner TBD] | `docs/DOMAIN-SPEC.md` section 9 | `merchant-portal/src/domain/crm/` |
| 10 | **Fiscal & Compliance** | [owner TBD] | `docs/DOMAIN-SPEC.md` section 10 | `legal-boundary/`, `fiscal-pt.md` |

---

## Infrastructure Ownership

| Area | Owner | Key Paths | Runbook |
|---|---|---|---|
| **Frontend / UI** | [owner TBD] | `merchant-portal/src/ui/`, `ui/design-system/` | -- |
| **Sync & Offline** | [owner TBD] | `merchant-portal/src/core/sync/`, `core/infra/` | `runbooks/SYNC-QUEUE-OVERFLOW.md` |
| **Payments Infrastructure** | [owner TBD] | `core/infra/CircuitBreaker.ts`, `RetryPolicy.ts`, payment adapters | `runbooks/PAYMENT-FAILURE.md` |
| **CI/CD & Release** | [owner TBD] | `.github/workflows/`, `scripts/` | `docs/RELEASE-CHECKLIST.md` |
| **Database & Migrations** | [owner TBD] | `docker-core/schema/migrations/`, `supabase/migrations/` | `runbooks/BACKUP-RESTORE.md` |
| **Security** | [owner TBD] | `core/security/`, RLS policies, auth | `docs/SECURITY-CHECKLIST.md` |
| **Observability** | [owner TBD] | `core/monitoring/`, Sentry config, structured logger | `runbooks/HIGH-ERROR-RATE.md` |

---

## On-Call Responsibilities

When an incident touches your context:

1. **Acknowledge** within 15 minutes (during business hours) or 1 hour (off-hours).
2. **Triage** using the relevant runbook in `docs/runbooks/`.
3. **Communicate** status in the incident channel every 30 minutes until resolved.
4. **Post-mortem** within 48 hours. Document root cause and corrective actions.

---

## PR Review Protocol

- PRs touching **one context** need approval from that context's owner.
- PRs touching **multiple contexts** need approval from each affected owner.
- PRs touching **infrastructure** need approval from the relevant infrastructure owner.
- PRs touching **security-sensitive code** (RBAC, RLS, auth, payments) require **two approvals**: context owner + Security owner.

---

## Documentation Hygiene

Each owner is responsible for keeping these up to date for their area:

- `docs/DOMAIN-SPEC.md` (domain section)
- `docs/SCHEMA.md` (table definitions)
- Relevant ADRs in `docs/adr/`
- Inline code documentation

---

## Documents Requiring Review or Deprecation

The following documents in `docs/` have overlapping content or are potentially outdated. Each should be reviewed by the relevant owner and either updated, merged into the canonical doc, or moved to `docs/archive/`.

### High Priority (likely superseded)

| Document | Likely Superseded By | Reviewer |
|---|---|---|
| `ARCHITECTURE_OVERVIEW.md` | `docs/architecture/ARCHITECTURE_OVERVIEW.md` (architecture subdir) | Frontend owner |
| `CORE_ARCHITECTURE.md` | `docs/architecture/CORE_SYSTEM_OVERVIEW.md` | Frontend owner |
| `CORE_OVERVIEW.md` | `docs/architecture/CORE_SYSTEM_OVERVIEW.md` | Frontend owner |
| `CORE_LEVEL_2_ARCHITECTURE.md` | `docs/architecture/ARCHITECTURE_OVERVIEW.md` | Frontend owner |
| `CORE_BASELINE_V1.0.md` | `DOMAIN-SPEC.md` + `SCHEMA.md` | Domain owner |
| `STATUS.md`, `STATUS_TECH.md`, `PROJECT_STATUS.md` | `READINESS.md` (this War Plan closure) | Tech Lead |
| `ESTADO_ATUAL_FINAL.md`, `ESTADO_ATUAL_2026_01_28.md`, `ESTADO_ATUAL_2026_02.md` | Latest state doc only | Tech Lead |
| `ROADMAP.md`, `ROADMAP_COMPLETO_FINALIZADO.md`, `ROADMAP_FINAL_COMPLETO.md` | Single canonical roadmap | Product owner |
| `RESUMO_EXECUTIVO.md`, `RESUMO_EXECUTIVO_FINAL.md`, `RESUMO_EXECUTIVO_V1.md` | Single executive summary | Product owner |
| `SECURITY_AUDIT_CHECKLIST.md`, `SECURITY_BEST_PRACTICES.md` | `SECURITY-CHECKLIST.md` (canonical) | Security owner |
| `DEPLOYMENT_CHECKLIST.md` | `RELEASE-CHECKLIST.md` (canonical) | CI/CD owner |

### Medium Priority (Portuguese-era docs, possibly outdated)

| Document | Notes | Reviewer |
|---|---|---|
| `PLANO_3_FASES_NASCIMENTO.md` | Pre-English migration planning doc | Tech Lead |
| `CONSOLIDACAO_MARCO_MATURIDADE.md` | Historical snapshot, may be archivable | Tech Lead |
| `RECONSTRUCAO_DISCIPLINADA_STATUS.md` | Historical reconstruction log | Tech Lead |
| `VARREDURA_PROFUNDA_AUDITORIA_2026_01.md` | January audit, superseded by March audit | Security owner |
| `TESTE_MASSIVO_*.md` (5 files) | Test campaign results, archivable after review | QA owner |

### Action Required

- [ ] Each owner reviews their listed documents within 2 sprints
- [ ] Superseded docs get a deprecation header: `> **DEPRECATED** -- See [canonical doc](link) instead.`
- [ ] Archivable docs move to `docs/archive/`
- [ ] Update `docs/DOC_INDEX.md` after cleanup
