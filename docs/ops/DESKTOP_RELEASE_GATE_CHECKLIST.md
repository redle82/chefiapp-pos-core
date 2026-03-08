## Desktop Release Gate Checklist (TPV/KDS)

Use this gate before promoting Desktop-related changes to staging or production.

### Gate A - Build and Packaging

- [ ] `desktop-app` build passes (`pnpm run build`).
- [ ] Packaged app does not use dev server fallback.
- [ ] Packaged app fails explicitly when bundled frontend is missing.
- [ ] Electron runtime/builder version is aligned (`desktop-app/electron-builder.yml`).

### Gate B - Launch ACK Protocol

With `CHEFIAPP_DESKTOP_LAUNCH_ACK_SECRET` enabled:

- [ ] Valid signed ACK returns `202`.
- [ ] Polling `GET /desktop/launch-acks/:nonce` returns `found: true` after valid ACK.
- [ ] ACK without signature headers returns `401 ack_signature_required`.
- [ ] ACK with invalid signature returns `401 ack_signature_invalid`.
- [ ] ACK with expired timestamp returns `401 ack_signature_expired`.

Compatibility mode (`CHEFIAPP_DESKTOP_LAUNCH_ACK_SECRET` empty):

- [ ] Unsigned ACK returns `202`.
- [ ] Polling still returns `found: true` for recorded nonce.

### Gate C - Privileged IPC Validation

- [ ] `set-terminal-config` rejects invalid payload with deterministic validation errors.
- [ ] `navigate-to-app` rejects invalid `moduleId`.
- [ ] `open-kds-panel` rejects malformed options and invalid preset values.
- [ ] `print-label-html` rejects invalid payload and oversized HTML.

### Gate D - Runtime Smoke (Real Electron)

- [ ] Real renderer can call `navigate-to-app` successfully.
- [ ] Real renderer can open KDS panel with valid payload.
- [ ] Invalid payloads fail predictably in runtime (not only static/build validation).
- [ ] Printing flow still works for valid `print-label-html` payload.

### Gate E - Local Bridge Security (Required before production)

- [ ] Local desktop bridge has authentication or equivalent trust control.
- [ ] Bridge rejects unauthenticated privileged requests.
- [ ] Bridge logs include enough context for incident investigation.

### Gate F - macOS Distribution Hardening

- [ ] Code signing configured.
- [ ] `hardenedRuntime` enabled.
- [ ] Entitlements configured and verified.
- [ ] Installed app is the effective `chefiapp://` handler.

### Promotion Decision

Staging allowed when:

- Gates A, B, C are fully green.

Production allowed when:

- Gates A, B, C, D, E, F are fully green.
