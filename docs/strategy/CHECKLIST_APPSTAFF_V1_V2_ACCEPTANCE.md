# AppStaff V1/V2 Acceptance Checklist

**Purpose:** objective release gate for AppStaff V1 with explicit V2 deferrals.

## A) Scope lock

- [ ] V1 scope matches `PRD_APPSTAFF_V1_V2_SCOPE.md`
- [ ] V1 keeps single AppStaff super-app shell (no split “courier app” in production path)
- [ ] Out-of-scope items are not partially shipped as hidden features
- [ ] V2 candidates are documented without implicit production commitment

## A.1) Role/module map lock

- [ ] Role × module behavior matches the V1 matrix defined in PRD
- [ ] Unauthorized modules are hidden and blocked by permission checks
- [ ] Delivery capability is enabled via permissions, not via separate app identity

## B) Tasks and evidence

- [ ] Staff can view assigned tasks by shift/area
- [ ] Task lifecycle transitions work end-to-end (`OPEN -> IN_PROGRESS -> COMPLETED`)
- [ ] Reopen flow requires reason and is audited
- [ ] Photo evidence is captured and linked to actor + timestamp
- [ ] Offline evidence capture persists and syncs without silent loss

## C) Orders (offline without payment)

- [ ] Order create/edit works online
- [ ] Order create/edit queues correctly offline
- [ ] Offline payment attempts are blocked with explicit UX messaging
- [ ] Sync replay does not duplicate orders/edits (idempotent behavior)

## D) Printing via Print Brain/Desktop Agent

- [ ] App emits print intent events only (no direct printer dependency in AppStaff)
- [ ] Core validates order state and permissions before forwarding
- [ ] Agent statuses are visible in app (`claimed/printed/retrying/failed`)
- [ ] Reprint is permission-gated and auditable
- [ ] Offline print intents replay correctly after connectivity recovery

## E) Deliveries and GPS

- [ ] Delivery lifecycle state machine works (`PENDING -> ACCEPTED -> EN_ROUTE -> DELIVERED/ISSUE`)
- [ ] Background GPS activates only in `EN_ROUTE`
- [ ] Delivery proof stores photo + geotag + timestamp + actor
- [ ] Permission fallback handling exists for denied location permission

## F) Auth, BYOD and security

- [ ] Admin can generate activation credentials (`PIN 6 digits` and QR token)
- [ ] App activation works through QR-first flow with manual PIN fallback
- [ ] Activation credentials are short-lived and one-time (replay blocked)
- [ ] Session token is persisted securely (Keychain/Keystore)
- [ ] Re-open PIN challenge follows profile policy (default OFF unless enforced)
- [ ] Session timeout/auto-lock policy is enforced on BYOD
- [ ] Sensitive tokens are stored in secure OS storage (Keychain/Keystore)
- [ ] Remote session revocation from Admin forces logout on target device
- [ ] Permission matrix blocks unauthorized operations (cancel/reprint/escalation)
- [ ] Boundary violation attempts are logged

## G) Offline and sync resilience

- [ ] Outbox queue survives app restarts
- [ ] Sync loop supports retries with idempotency keys
- [ ] Conflict handling follows contract (critical fields server authority)
- [ ] UI clearly shows `ONLINE/OFFLINE/SYNCING/SYNC_ERROR`
- [ ] No silent data loss in chaos tests (airplane mode / reconnect)

## H) Surface authority and routing

- [ ] `/app/staff/*` is treated as canonical operational AppStaff surface
- [ ] V1 minimum screen map exists and is navigable (`Home`, `Orders`, `Tasks`, `Map`, `Drivers`, `Reviews`, `Notifications`, `Side Menu`)
- [ ] Deep-links to non-authorized surfaces are denied and redirected safely
- [ ] AppStaff does not expose TPV/KDS/Admin execution paths

## I) Observability and diagnostics

- [ ] Core operational events include correlation/request identifiers
- [ ] Client-side errors are traceable to actor + surface + runtime mode
- [ ] Print and sync failures have actionable diagnostics
- [ ] Delivery location pipeline exposes failure reasons (permission/battery/network)

## J) Release gate (Go/No-Go)

- [ ] Critical flows pass on iOS + Android
- [ ] Crash-free target for pilot is met
- [ ] Offline replay and print audit trails are validated with real pilot scenario
- [ ] Product, engineering, and ops sign-off captured

---

## V2 explicit deferred items (non-blocking for V1)

- [ ] Custom facial recognition pipeline
- [ ] Advanced multi-unit analytics in AppStaff
- [ ] Route optimization and ETA intelligence
- [ ] Expanded offline financial operations
