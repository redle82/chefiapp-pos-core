# TERMINAL_IDENTITY_CONTRACT (Disposable Identity Model)

This contract defines the relationship between physical device identity and the ChefIApp Core.

## 1. Nature of Identity

- **Volatility**: Terminal Identity is **volatile by design**. It resides in the client's local storage and is NOT tied to hardware serial numbers or non-erasable biometric data.
- **Persistence**: A terminal's ID MUST persist across tab reloads but MAY be lost upon clear of browser data.
- **Disposable Nature**: Terminals are treated as disposable operational units. Clearing a terminal's identity creates a "New Terminal" from the Core's perspective.

## 2. Trust Protocol

- **Implicit Trust**: A terminal presenting a valid `terminalId` is trusted to report liveness (Heartbeat) for its declared type (TPV, KDS, etc.).
- **Session Scoping**: Terminal identity is bounded by the restaurant's active session. A terminal cannot "float" between restaurants unless re-provisioned.
- **Core Authority**: The Core is the sole authority for translating a `terminalId` into an "Online/Offline" state.

## 3. Operational Integrity

- **Identification**: Every operational action (Order creation, Payment) SHOULD be tagged with the `terminalId` that originated it for audit purposes.
- **Expiration**: The Core MAY prune terminal identities that have not reported a Heartbeat for more than 7 days.

## 4. Rationale

This model prioritizes **ease of deployment** and **privacy**. By avoiding hardware-level tracking, we enable rapid scaling across generic devices (Tablets, Phones, PCs) without complex provisioning ceremonies, while maintaining sufficient operational traceability for the Pilot phase.

---

_Status: CANONIZED - 2026-01-31_
