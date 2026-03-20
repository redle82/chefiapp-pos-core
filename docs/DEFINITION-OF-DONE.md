# Definition of Done -- ChefiApp POS Core

> No feature, bug fix, or hotfix is "done" until every applicable criterion below is satisfied.
> This document is enforced by code review and CI gates.
>
> Last updated: 2026-03-20

---

## Feature -- Definition of Done

A feature is **Done** when ALL of the following are true:

| # | Criterion | Verified By |
|---|---|---|
| 1 | **Code** -- Implemented, peer-reviewed, approved, and merged to `main`. | PR approval + merge |
| 2 | **Types** -- Zero TypeScript errors in changed and dependent files (`npm run typecheck`). | CI `typecheck` gate |
| 3 | **Lint** -- Zero ESLint errors in changed files (`npm -w merchant-portal run lint`). | CI `lint` gate |
| 4 | **Tests** -- Unit tests for domain logic (invariants, state transitions). Contract tests for use cases (input/output shape, error paths). | CI `test` gate |
| 5 | **i18n** -- All user-facing strings present in 4 locales (en, pt, es, fr). No hardcoded strings in UI components. | Manual review + i18n lint (when available) |
| 6 | **Accessibility** -- WCAG 2.1 AA compliance for all interactive elements: keyboard navigation, aria labels, color contrast 4.5:1+. | Manual review |
| 7 | **Documentation** -- `docs/ARCHITECTURE.md`, `docs/DOMAIN-SPEC.md`, or `docs/SCHEMA.md` updated if architecture, domain rules, or schema changed. | PR reviewer checklist |
| 8 | **ADR** -- Architecture Decision Record created in `docs/adr/` if a significant architectural choice was made. Next number: 008. | PR reviewer checklist |
| 9 | **Security** -- RBAC checked for sensitive actions (see `docs/RBAC-FLOW-AUDIT.md`). Audit log entry for financial operations. No secrets in code. | Security gate + manual review |
| 10 | **Observability** -- Structured logs (`StructuredLogger`) for critical paths. Metrics emitted for business events (orders, payments, shifts). | PR reviewer checklist |
| 11 | **Migration** -- SQL migration included in `docker-core/schema/migrations/` if schema changed. Migration tested against staging. | DBA review |
| 12 | **Changelog** -- Entry added to `CHANGELOG.md` under `[Unreleased]` section. | PR reviewer checklist |

---

## Bug Fix -- Definition of Done

A bug fix is **Done** when:

| # | Criterion |
|---|---|
| 1-4 | All code, types, lint, and test criteria from Feature DoD above. |
| 5 | **Regression test** -- A test that reproduces the bug and verifies the fix. This test must fail before the fix and pass after. |
| 6 | **Root cause** -- Root cause documented in the PR description. Pattern: "The bug occurred because X. The fix changes Y so that Z." |

---

## Hotfix -- Definition of Done

A hotfix is **Done** when:

| # | Criterion |
|---|---|
| 1-4 | All code, types, lint, and test criteria from Feature DoD above. |
| 5 | **Deployed** -- Successfully deployed to production. |
| 6 | **Monitored** -- No new errors observed in Sentry for 30 minutes post-deploy. |
| 7 | **Communicated** -- Team notified via incident channel with summary of what changed. |

---

## What Does NOT Count as Done

- "It works on my machine" without CI passing.
- Tests skipped with `.skip` or `xit`.
- TypeScript errors suppressed with `@ts-ignore` or `any` casts (unless documented in ADR).
- i18n keys added in only one locale.
- Schema changes without a migration file.
- Security-sensitive changes without RBAC audit.

---

## CI Gates That Enforce This

These gates are required to pass before merge (zero `continue-on-error`):

| Gate | What It Checks | DoD Criteria |
|---|---|---|
| `typecheck` | TypeScript compilation | #2 |
| `lint` | ESLint rules | #3 |
| `test` | Unit + contract tests | #4 |
| `build` | Production build completes | #1 |
| `bundle-size` | Bundle under 20MB | Performance |
| `domain-integrity` | Sovereignty and boundary checks | #9 |
| `security` | No secrets, dependency audit | #9 |
| `e2e-smoke` | Critical flow smoke tests | End-to-end |

---

## Exceptions

If a criterion genuinely cannot be met for a specific PR, the owner must:

1. Document the exception in the PR description with rationale.
2. Create a follow-up issue tagged `tech-debt` to address it within 2 sprints.
3. Get approval from the relevant context owner (see `docs/OWNERS.md`).

---

## References

- Release process: `docs/RELEASE-CHECKLIST.md`
- Security audit: `docs/SECURITY-CHECKLIST.md`
- RBAC enforcement: `docs/RBAC-FLOW-AUDIT.md`
- Logging conventions: `docs/LOGGING-GUIDE.md`
- Architecture decisions: `docs/adr/README.md`
