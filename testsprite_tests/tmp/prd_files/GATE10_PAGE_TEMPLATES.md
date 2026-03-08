# GATE10 — Canonical Page Templates

Purpose: Provide minimal reference implementations for the three critical pages. These pages consume the system; they do not decide or protect. Navigation protection is handled by the Router Guard.

- Principles:
  - Declare `contractIds` and `allowedPreviewStates` in route meta.
  - Read `core` from the provider (e.g., `useWebCore()`), never infer state locally.
  - No defensive `if` in the UI; render based on `core` while guard ensures routing correctness.

## MenuPage (Reference)

- Intent: Define and manage menu.
- Contracts: Requires identity (`ONT-001`).
- Preview: Allows `ghost`.
- Route meta example:

```ts
// route meta
const meta = {
  contractIds: ['ONT-001'],
  allowedPreviewStates: ['ghost', 'live'],
}
```

- Component sketch:

```tsx
import React from 'react'
// import { useWebCore } from 'merchant-portal/src/core/useWebCore'

export function MenuPage() {
  // const core = useWebCore()
  // UI renders menu editor; no checks — guard already ensured access
  return (
    <section>
      <h1>Menu</h1>
      {/* Menu editor component here */}
    </section>
  )
}
```

## PublishPage (Reference)

- Intent: Publish site.
- Contracts: Requires identity + menu (`ONT-001`, `ONT-002`).
- Preview: Allows `ghost` (pre-publish) and `live` (post-publish).
- Route meta example:

```ts
const meta = {
  contractIds: ['ONT-001', 'ONT-002'],
  allowedPreviewStates: ['ghost', 'live'],
}
```

- Component sketch:

```tsx
import React from 'react'

export function PublishPage() {
  return (
    <section>
      <h1>Publish</h1>
      {/* Publish action UI; guard ensures preconditions */}
    </section>
  )
}
```

## TPVReadyPage (Reference)

- Intent: Operate POS (TPV) — payments optional.
- Contracts: Requires published + menu (`ONT-002`, `ONT-003`) and TPV readiness (`CAP-004`).
- Preview: Typically `live`; guard handles causality.
- Route meta example:

```ts
const meta = {
  contractIds: ['ONT-002', 'ONT-003', 'CAP-004'],
  allowedPreviewStates: ['live'],
}
```

- Component sketch:

```tsx
import React from 'react'

export function TPVReadyPage() {
  return (
    <section>
      <h1>TPV</h1>
      {/* TPV console; payments may be offline/cash */}
    </section>
  )
}
```

## Notes

- No redirects or defensive checks inside pages.
- Router Guard evaluates `meta` before navigation and redirects to remediation routes if needed.
- Payments remain optional for TPV; slug remains derived; health feeds `core.truth.backendIsLive` when implemented.
