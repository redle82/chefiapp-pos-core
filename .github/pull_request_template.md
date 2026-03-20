## Summary
<!-- 1-3 bullet points describing the change -->

## Type
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Chore / maintenance

## Checklist

### Required Gates
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Build succeeds (`npm -w merchant-portal run build`)
- [ ] Smoke test passes (`bash merchant-portal/scripts/smoke-test.sh`)
- [ ] No secrets in build output

### Quality Gates
- [ ] ESLint passes (`npm -w merchant-portal run lint`)
- [ ] No new `console.log` left in code
- [ ] Tested on mobile viewport (375px)

### Domain Gates
- [ ] Sovereignty gate passes (orders via Core, not Supabase RPC)
- [ ] Financial domain uses Core only
- [ ] i18n keys added for all 4 locales (if UI change)

### Data Safety
- [ ] No hardcoded secrets or tokens
- [ ] RLS policies cover new tables (if DB change)
- [ ] Migration tested locally (if DB change)

## Truth Codex Compliance
> *By submitting this PR, I certify that I have read `SYSTEM_TRUTH_CODEX.md` and this code complies with the Law.*

- [ ] **UI is Consequence**: No optimistic "success" toasts before `queue.add` or API confirmation.
- [ ] **Online = Fast Offline**: No split logic. Everything goes through the Queue/Reconciler.
- [ ] **Truth Zero**: No onboarding/critical actions if `useCoreHealth` is DOWN.

## Risk Assessment
<!-- Does this touch the 'Money' path? (Orders, Payments, Sessions) -->
<!-- LOW / MEDIUM / HIGH -->

## Test Plan
<!-- How to verify this change works correctly -->
