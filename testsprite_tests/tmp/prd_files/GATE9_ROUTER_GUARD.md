# GATE9 — Router Guard (Global)

Purpose: Enforce flow causality and page contracts before navigation. Architecture remains closed; guard is a consumer only.

- Inputs: `core` (ontology + truth + capabilities + previewState), `pageMeta` (declared `contractIds`, `allowedPreviewStates`).
- Outcomes: Allow navigation, or redirect to the next required step with a clear reason.
- Non-invasive: No mutation; consult and decide.

## Guard Algorithm

1. Read current `core` from the provider.
2. Evaluate flow causality:
   - If violations exist, redirect to `getNextRequiredStep(core)`.
3. Evaluate page contract:
   - Resolve required `contractIds` and `allowedPreviewStates` from route meta.
   - Run contract validation; deny if any required contract is unsatisfied.
   - Check `core.previewState` against allowed states (when applicable).
4. Outcome:
   - `{ allowed: true }` → proceed.
   - `{ allowed: false, reason, redirectTo }` → block and navigate to `redirectTo`.

## Pseudo-code (TypeScript)

```ts
// Types are illustrative; adapt to your router framework.

type Core = {
  entity: { identityConfirmed: boolean; menuDefined: boolean; published: boolean },
  capabilities: { canUseTPV: boolean; canReceiveOrders: boolean; canPreview: boolean },
  truth: { backendIsLive: boolean; urlExists: boolean; previewIsReal: boolean },
  previewState: 'none' | 'ghost' | 'live',
}

type RouteMeta = {
  contractIds?: string[]
  allowedPreviewStates?: Array<'none' | 'ghost' | 'live'>
  redirectOnFail?: string // path or route name
}

type GuardResult = { allowed: true } | { allowed: false; reason: string; redirectTo: string }

function evaluateRoute(core: Core, meta: RouteMeta): GuardResult {
  // Flow causality
  const flowViolations = validateFlowCausality(core)
  if (flowViolations.length > 0) {
    const next = getNextRequiredStep(core) // e.g., 'identity' | 'menu' | 'publish' | 'tpv'
    return { allowed: false, reason: flowViolations[0], redirectTo: routeForStep(next) }
  }

  // Contracts
  const required = meta.contractIds || []
  const results = validateAllContracts(core)
  const unsatisfied = results.filter(r => required.includes(r.id) && !r.satisfied)
  if (unsatisfied.length > 0) {
    const first = unsatisfied[0]
    const rt = meta.redirectOnFail || routeForContract(first.id) // map contracts to remediation routes
    return { allowed: false, reason: `[${first.id}] ${first.name}: ${first.reason}`, redirectTo: rt }
  }

  // Preview state constraints
  if (meta.allowedPreviewStates && meta.allowedPreviewStates.length > 0) {
    if (!meta.allowedPreviewStates.includes(core.previewState)) {
      const rt = meta.redirectOnFail || routeForStep('publish')
      return { allowed: false, reason: `Preview state not allowed: ${core.previewState}`, redirectTo: rt }
    }
  }

  return { allowed: true }
}

// Helpers (framework-agnostic)
function validateFlowCausality(core: Core): string[] {
  const v: string[] = []
  if (core.entity.menuDefined && !core.entity.identityConfirmed) v.push('Menu exists but identity not confirmed')
  if (core.entity.published && !core.entity.menuDefined) v.push('Published but menu not defined')
  if (core.capabilities.canUseTPV && !core.entity.published) v.push('TPV ready but not published')
  if (core.truth.previewIsReal && !core.entity.published) v.push('Preview is real but not published')
  return v
}

function getNextRequiredStep(core: Core): 'identity' | 'menu' | 'publish' | 'tpv' {
  if (!core.entity.identityConfirmed) return 'identity'
  if (!core.entity.menuDefined) return 'menu'
  if (!core.entity.published) return 'publish'
  return 'tpv'
}

function routeForStep(step: 'identity' | 'menu' | 'publish' | 'tpv'): string {
  const map = { identity: '/setup/identity', menu: '/setup/menu', publish: '/setup/publish', tpv: '/tpv' }
  return map[step]
}

function routeForContract(id: string): string {
  const map: Record<string, string> = {
    'ONT-001': '/setup/identity',
    'ONT-002': '/setup/menu',
    'ONT-003': '/setup/publish',
    'CAP-004': '/tpv',
  }
  return map[id] || '/'
}
```

## Integration Patterns

- React Router v6: Wrap routes with a `GuardedRoute` component that calls `evaluateRoute()` in a `useEffect` and redirects using `navigate()` before rendering children.
- Next.js (App Router): Use `middleware.ts` to read `core` via a lightweight store or cookie-backed snapshot and short-circuit to the remediation route; or wrap page components with a guard HOC.
- Vue Router: Use `router.beforeEach((to, from, next) => { ... })` and call `evaluateRoute()`, then `next(redirectTo)`.

## Telemetry

- On block: log `reason` and `redirectTo` to the event log for auditability.
- On allow: optionally cache the evaluation result for UX.

## Performance

- Cache contract results until `core` changes.
- Guard runs fast; avoid network in the guard path.

## Governance

- No exceptions in guard logic.
- Payments remain optional for TPV; slug remains derived.
