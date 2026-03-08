# ADR-002: AppStaff V1/V2 Scope and Surface Authority

**Status:** Accepted
**Date:** 2026-03-02
**Decision makers:** Product + Core + Merchant Portal + Mobile

## Context

AppStaff needs a stable operational boundary and a pragmatic V1 scope that is feasible under real connectivity constraints.
There were conflicting interpretations in legacy docs regarding:

- whether AppStaff web is informational only vs operational,
- whether printing should be direct from mobile,
- whether offline payment and custom facial recognition belong to V1,
- whether GPS should always run in background.

Operational requirements and risk profile favor a constrained V1 and explicit contracts.

## Decision

### Product scope decisions

1. BYOD for couriers in V1: **YES**
2. AppStaff V1 architecture: **single super-app with role-based modular access**
3. Printing direct from mobile: **NO** (Print Brain/Desktop Agent authority)
4. Offline payment in V1: **NO**
5. Custom face recognition in V1: **NO** (system biometric + PIN fallback)
6. Background GPS always-on: **NO** (route-active only)
7. V1 authentication primary path: **Admin-issued PIN (6 digits) + QR activation**
8. Re-open app challenge default: **OFF** (profile policy can enforce PIN on resume)
9. Federated auth (`Google/Apple`) deferred to V1.1/V2

### Surface authority decision

Operational AppStaff authority in the current stack is `/app/staff/*`.

- AppStaff must not expose TPV/KDS/Admin operational surfaces.
- Invalid deep-links must be denied, logged, and redirected to AppStaff home.

## Architectural implications

### Runtime boundary

- AppStaff execution remains operational and isolated from owner/admin web flows.
- Runtime/device contracts must be enforced consistently in mobile and web operational surfaces.
- Module visibility and action authority are controlled by role/permission matrix in a single app shell.

### Printing architecture

- AppStaff emits `PrintJobRequest` intent events only.
- Core validates authorization and order state.
- Print Brain/Desktop Agent executes and returns status (`claimed`, `printed`, `retrying`, `failed`).
- Reprint requires explicit permission and is always auditable.

### Offline model

- Outbox-based event queue with idempotency keys is mandatory.
- Sync flow: push outbox -> pull deltas -> local apply -> UI refresh.
- Payment operations are rejected offline by policy.

### Authentication/session model

- Activation credential is generated in Admin and consumed in AppStaff (QR preferred, `PIN6` fallback).
- Activation credential is short-lived and one-time.
- AppStaff stores session token in secure OS storage (Keychain/Keystore).
- Session revocation is remote-controllable from Admin.

### Super-app navigation baseline (V1)

- Minimum operational screens are fixed for V1: `Home`, `Orders`, `Tasks`, `Map`, `Drivers`, `Reviews`, `Notifications`, `Side Menu`.
- Role-based enablement decides visibility and access per module/action.
- `Delivery` capabilities are provided as module permissions, not a separate app path.

### Delivery tracking

- Background location permission is activated only for active route lifecycle.
- App must record delivery proof artifacts with traceable metadata.

## Trade-offs accepted

- Delaying direct printing and custom face matching reduces V1 complexity and operational incidents.
- Restricting GPS background windows reduces battery risk and permission friction.
- No offline payment reduces edge-case coverage but protects financial consistency in V1.
- Choosing PIN6+QR removes third-party auth setup burden while keeping secure, revocable access.
- Single-shell modular design reduces cognitive and operational overhead for mixed-role teams.

## Consequences

- V1 is strongly executable with lower operational risk.
- V2 remains open for advanced features once V1 reliability metrics are stable.
- Documentation and routing guidance must consistently treat `/app/staff/*` as operationally canonical.

## Related documents

- `docs/product/PRD_APPSTAFF_V1_V2_SCOPE.md`
- `docs/strategy/CHECKLIST_APPSTAFF_V1_V2_ACCEPTANCE.md`
- `docs/contracts/EXECUTION_CONTEXT_CONTRACT.md`
- `docs/contracts/OPERATIONAL_DEVICE_ONLY_CONTRACT.md`
- `docs/architecture/CORE_APPSTAFF_CONTRACT.md`
