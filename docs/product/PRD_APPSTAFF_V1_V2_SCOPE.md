# PRD — AppStaff V1/V2 Scope

**Status:** Draft (implementation-aligned)
**Last updated:** 2026-03-02
**Owners:** Product + Core + Merchant Portal + Mobile

## 1) Objective

AppStaff is the operational **super-app** surface for staff execution in ChefIApp.
It is focused on:

- task execution with evidence,
- order operational flow (without offline payment),
- delivery execution with route-active GPS,
- resilient offline-first synchronization.

`Delivery` is a role-enabled module inside the same AppStaff app, not a separate product/app.

AppStaff does **not** replace TPV/KDS and does **not** expose owner/admin control surfaces.

## 2) Product decisions (locked)

- BYOD for couriers in V1: **YES**
- AppStaff architecture in V1: **single super-app with modular access by role**
- Printing direct from mobile app: **NO** (V1 through Print Brain/Desktop Agent)
- Offline payment: **NO** (payment online-only in V1)
- Primary V1 authentication: **Admin-issued PIN (6 digits) + QR activation**
- Social SSO (`Google/Apple`) in V1: **NO** (candidate for V1.1/V2)
- Custom facial recognition: **NO** (system biometrics remains optional hardening path)
- Always-on background GPS: **NO** (only while route is active)
- Re-open app PIN challenge default: **OFF** (configurable by profile policy)

## 3) V1 scope

### 3.0 Super-app modular model (V1)

- One AppStaff app shell with module access controlled by permission matrix
- Same account can enable one or many modules based on role/profile policy
- Delivery is enabled as module capability (`delivery:*`), not as separate app identity
- Navigation adapts to authorized modules; unauthorized modules are hidden/blocked

### 3.1 Tasks and routines (with evidence)

- Shift-oriented task stream (kitchen/floor/delivery)
- Task lifecycle: `OPEN -> IN_PROGRESS -> COMPLETED -> REOPENED` (with reason)
- Evidence support: photo + comment + timestamp + responsible user
- Online notifications for assignment/deadline/overdue

### 3.2 Orders (no offline payment)

- Create/edit order items, modifiers, notes
- Track order states (`SENT`, `PREPARING`, `READY`, `DELIVERED/PICKED_UP`)
- Offline support for create/edit queueing
- Payment action blocked offline with explicit UX feedback

### 3.3 Deliveries with route-active GPS

- Delivery board: `PENDING`, `ACCEPTED`, `EN_ROUTE`, `DELIVERED`, `ISSUE`
- Background location enabled only in `EN_ROUTE`
- Delivery proof: photo + geotag + timestamp
- Full status timeline for operational audit

### 3.4 Printing via Print Brain/Desktop Agent

- AppStaff emits print intent event, not direct printer control
- Core validates request and routes through print agent
- Reprint action requires explicit permission and audit event
- Offline print intents remain queued until sync

### 3.5 Authentication and BYOD security

- Activation/login in V1: Admin-generated one-time activation credential (QR preferred, PIN6 fallback)
- Activation token expiry: short-lived (target 15 minutes) + one-time consumption
- Session persisted securely in Keychain/Keystore after successful activation
- Optional re-open challenge by policy (PIN challenge OFF by default; role/profile can enforce)
- Role-permission enforcement on sensitive actions
- Optional device binding by role policy

### 3.6 Offline-first baseline

- Local storage for operational entities and permissions snapshots
- Outbox queue for actions (`orders`, `tasks`, `delivery`, `print-intents`, `evidence`)
- Conflict strategy:
  - critical fields: server authority,
  - collaborative fields (comments/evidence): additive merge where possible
- Explicit runtime state in UI: `ONLINE`, `OFFLINE`, `SYNCING`, `SYNC_ERROR`

### 3.7 V1 role × module matrix

| Role           | Home | Orders | Tasks | Delivery Map | Drivers | Reviews | Notifications | Print Intents |
| -------------- | ---- | ------ | ----- | ------------ | ------- | ------- | ------------- | ------------- |
| Owner/Admin    | ✅   | ✅     | ✅    | ✅ (view)    | ✅      | ✅      | ✅            | ✅            |
| Manager        | ✅   | ✅     | ✅    | ✅           | ✅      | ✅      | ✅            | ✅            |
| Waiter/Floor   | ✅   | ✅     | ✅    | ❌           | ❌      | ✅      | ✅            | ✅ (limited)  |
| Kitchen        | ✅   | ✅     | ✅    | ❌           | ❌      | ✅      | ✅            | ✅ (limited)  |
| Courier/Driver | ✅   | ✅     | ✅    | ✅           | ❌      | ✅      | ✅            | ❌            |

### 3.8 V1 screen map (minimum)

- `Home`: operational launcher with role-based cards
- `Orders`: create/edit/track and offline queue status
- `Tasks`: assigned routines, evidence capture, reopen with reason
- `Map`: route-active delivery execution and proof actions
- `Drivers`: manager/admin visibility for allocation and status
- `Reviews`: quality checks and exception follow-up
- `Notifications`: assignment/deadline/system alerts
- `Side Menu`: profile/session/sync diagnostics/logout

## 4) Out of V1 scope

- Offline payments
- Custom face matching pipeline
- Smart dispatch and route optimization
- Advanced multi-unit analytics inside AppStaff

## 5) V2 candidates

- Face matching (if still justified by business and compliance)
- Advanced operational analytics and multi-unit dashboards
- Route optimization and ETA communication
- Expanded offline operation depth for edge scenarios

## 6) Non-functional requirements

- **Reliability:** no silent data loss in offline transitions
- **Idempotency:** all retried operations must be replay-safe
- **Observability:** each critical action emits traceable operational events
- **Security:** protected token storage (Keychain/Keystore), session controls, permission gating
- **Boundary:** AppStaff cannot render TPV/KDS/Admin surfaces

## 6.1 Authentication model extensibility

AppStaff auth core must support three methods at architecture level:

1. Admin-issued credentials (PIN/QR)
2. System biometrics (device-level unlock challenge)
3. Federated login (Google/Apple)

V1 enables only method (1) as mandatory path, with (2) optional by policy and (3) deferred.

## 7) Runtime and surface authority

- Canonical operational surface authority for AppStaff in current stack: `/app/staff/*`
- Any invalid deep-link to non-authorized operational surface must:
  1. deny access,
  2. log boundary violation,
  3. redirect to AppStaff home.

## 8) Milestone roadmap

### Sprint 1 — Foundation

- Auth + role permissions + runtime/device guard
- Local DB + outbox + baseline sync loop
- Tasks module with offline evidence capture

### Sprint 2 — Orders + print intent pipeline

- Order create/edit/track
- Print intent events + status feedback
- Basic diagnostics and operational telemetry

### Sprint 3 — Deliveries + route-active GPS

- Delivery state machine
- Background GPS only while en route
- Delivery proof with geotag and timeline

### V1.1 — Hardening

- BYOD hardening (session policies, optional jailbreak/root policy, remote session revoke)
- Conflict UX improvements and sync reliability refinements
- Crash/perf hardening for production readiness

## 9) Success criteria (V1)

- Staff executes tasks and submits evidence online/offline without silent loss
- Orders can be created/edited offline and synced reliably
- Print requests are auditable end-to-end via Core + Print Brain
- Delivery run with route-active GPS and proof artifacts works in production constraints
- Permission and boundary model prevents cross-surface operation leaks
- Role-based module visibility and action authorization behave deterministically

## 10) Related contracts and references

- `docs/contracts/EXECUTION_CONTEXT_CONTRACT.md`
- `docs/contracts/OPERATIONAL_DEVICE_ONLY_CONTRACT.md`
- `docs/architecture/CORE_APPSTAFF_CONTRACT.md`
- `docs/architecture/BOOT_CHAIN.md`
- `docs/architecture/CODE_AND_DEVICE_PAIRING_CONTRACT.md`

## 11) Minimum V1 API/events contract

### 11.1 Device/session auth

- `POST /appstaff/devices/activate`
  - input: `activationPin` or `activationQrToken`, `deviceFingerprint`, `deviceRuntime`, `appVersion`
  - output: `sessionToken`, `refreshToken?`, `role`, `permissions`, `sessionPolicy`
- `POST /appstaff/sessions/revoke`
  - input: `sessionId` or `userId + deviceId` (admin action)
  - effect: remote logout enforcement
- `POST /appstaff/sessions/refresh`
  - input: `refreshToken`, `deviceId`
  - effect: rotates session token safely

### 11.2 Operational events (idempotent)

- `POST /appstaff/tasks/events`
- `POST /appstaff/deliveries/events`
- `POST /appstaff/orders/events`
- all requests carry `idempotencyKey`, `deviceId`, `actorId`, `occurredAt`

### 11.3 Evidence upload

- `POST /appstaff/evidence/upload-url` (obtain signed upload target)
- `POST /appstaff/evidence/commit` (bind uploaded asset to task/delivery event)
- offline behavior: metadata/event is outboxed first; upload retried until committed
