# GATE11 — Health Real (Backend → Core Truth)

Purpose: Feed `core.truth.backendIsLive` from a real endpoint; no retries or magic. Pages remain consumers only; router guard protects navigation.

## Endpoint

- Path: `/api/health`
- Method: `GET`
- Response (JSON): `{ "status": "ok" }` or `{ "status": "down" }`
- Status codes: `200` for ok/down; non-200 treated as `down`.

## Client (Implemented)

- Location: merchant-portal/src/core/health.ts
- Function: `fetchHealth(basePath?: string): Promise<'ok'|'down'>`
- Behavior: Fetch once; map `status|health` to `'ok'|'down'`; errors → `'down'`.

## Provider Integration (Implemented)

- Location: merchant-portal/src/core/useWebCore.tsx
- On mount: calls `fetchHealth('')` and sets local `health` state.
- Core: `computeWebCoreState(wizardState, health)`; pages read via `useWebCore()`.

## Governance

- No retries, no backoff, no heuristics.
- Health only influences `core.truth.backendIsLive` and derived truths.
- Contracts and flow remain unchanged.

## Future (Optional)

- Polling: add a slow poll interval (e.g., 30s) if UX needs live updates.
- Server: `/api/health` should reflect backend readiness truthfully.

## Testing

- Manual: Serve an endpoint that returns `{ "status": "ok" }` and validate pages show live preview only when published + ok.
- Gate: Existing contract + flow validations remain authoritative.
