# Contract + Flow Code Review Checklist

Use this checklist to enforce the system nervous architecture in UI and service code. Code that does not consult the core is a bug, even if it appears to work.

- Ontology Source: Use core-computed state only (e.g., `core.entity.published`, `core.entity.menuDefined`, `core.truth.backendIsLive`). Never infer state from component props or local data.
- No Implicit Contracts: Avoid direct checks such as `published`, `menu.length`, `health === 'ok'`, `wizardState.*`, `localStorage.getItem(...)`. Route via the core and formal contracts.
- Router Guard: On every navigation, run `validateFlow()` and `validatePageContract()` before committing the route. Redirect or block with clear reason when violations are detected.
- Page Templates: Critical pages (`Publish`, `Menu`, `TPV`) must declare their required `contractIds` and consult allowed preview states. No exceptions.
- Flow Causality: Respect identity → slug (derived) → menu → publish → tpv-ready. Payments are optional for TPV. Slug remains derived and non-blocking.
- Promise Discipline: Do not expose public URL or live preview unless `core.entity.published` and `core.truth.backendIsLive`.
- Capability Boundaries: Orders require published + menu + payments; TPV only requires published + menu.
- Audit Artifacts: Run the gate script with `--report` and attach the generated JSON/MD to PRs.

## Quick Commands

```bash
# Run gate with reports
npm run audit:twelve-contracts -- --report
# Custom output directory
npm run audit:twelve-contracts -- --report --out=./audit-reports
```

## PR Requirements

- Include gate report artifacts.
- Link to any intentional exceptions (should be rare) and justify via contracts.
- Confirm router guard enforcement on new/changed routes.
