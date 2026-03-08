## Desktop Security Changelog - 2026-03-07

Scope of this hardening phase:

- `desktop-app/src/main.ts`
- `server/integration-gateway.ts`
- `desktop-app/electron-builder.yml`

### Executive Summary

Status moved from:

- "promising architecture with critical trust gaps"

To:

- "Electron base hardened on critical boot, handshake and privileged command paths"

### Implemented Mitigations

1. Packaged runtime determinism

- Removed dangerous packaged fallback to dev server.
- `USE_DEV_SERVER` is now strictly tied to dev mode.
- Packaged app now fails explicitly when bundled frontend is missing.
- Result: deterministic shell startup behavior in packaged builds.

1. Launch ACK trust hardening

- Desktop ACK now supports optional HMAC signature headers:
  - `x-chefiapp-ack-ts`
  - `x-chefiapp-ack-signature`
- Gateway validates signature and timestamp skew when secret is configured.
- Added explicit rejection paths:
  - `ack_signature_required`
  - `ack_signature_invalid`
  - `ack_signature_expired`
- Added signature format guard (`64 hex chars`) before `timingSafeEqual`.

1. IPC/bridge payload validation hardening

- Critical handlers now enforce strict input validation in main process:
  - `set-terminal-config`
  - `navigate-to-app`
  - `open-kds-panel`
  - `print-label-html`
- Invalid payloads return deterministic validation errors.
- Local desktop bridge returns `400` for validation/syntax failures instead of generic `500`.

1. Build/runtime alignment

- Electron builder/runtime version aligned:
  - `electronVersion: 37.3.1`

### Validation Evidence (This Phase)

Passed:

- Desktop build succeeds (`pnpm run build` in `desktop-app`).
- Packaged build path no longer depends on dev server fallback.
- ACK signed flow accepted (`202`) and poll confirms `found: true`.
- ACK with missing signature headers rejected (`401`) when secret is enabled.
- ACK with invalid signature rejected (`401`).
- ACK with expired timestamp rejected (`401`).
- Compatibility mode without secret accepts ACK (`202`) and poll returns `found: true`.

### Residual Risk / Open Items

Still open in this front:

1. Runtime Electron smoke for real renderer->IPC flows.
1. Authentication hardening for local desktop HTTP bridge.
1. Full schema validation coverage for all privileged commands.
1. macOS release signing/hardened runtime/entitlements in final pipeline.

### Recommended Next Sequence

1. Execute runtime smoke in real Electron for:
   - `navigate-to-app`
   - `open-kds-panel`
   - `set-terminal-config`
   - `print-label-html`
1. Add local bridge authentication (ephemeral token or shared secret).
1. Enable signing + hardened runtime + entitlements for macOS distribution.
1. Continue with cross-surface sync contract (Admin <-> Staff <-> TPV/KDS).
