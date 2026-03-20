# Release Checklist

Use this checklist for every production release of chefiapp-pos-core.
Copy this into your release PR description and check off each item.

---

## Pre-Release Checks

- [ ] All CI gates green (typecheck, lint, build, test, bundle-size, domain-integrity, security, e2e-smoke)
- [ ] TypeScript: zero errors (`npm run typecheck`)
- [ ] ESLint: zero warnings in critical paths (`npm -w merchant-portal run lint`)
- [ ] Prettier: all files formatted (`npx prettier --check .`)
- [ ] Build: completes under 2 minutes
- [ ] Bundle size: under 20MB total (`du -sk merchant-portal/dist/`)
- [ ] No secrets in build output (verified by smoke test and CI security gate)
- [ ] Domain integrity: sovereignty check passes (`bash scripts/sovereignty-gate.sh`)
- [ ] Financial domain uses Core only (`bash scripts/check-financial-supabase.sh`)
- [ ] Fase 3 conformance audit passes (`npm run audit:fase3-conformance`)
- [ ] Database migrations reviewed and tested against staging
- [ ] No `continue-on-error` in required CI gates
- [ ] npm audit shows no high/critical vulnerabilities

## Release Steps

- [ ] Create release branch from `main` (`release/vX.Y.Z`)
- [ ] Run full test suite locally (`npm run test:ci`)
- [ ] Run E2E suite locally (`cd merchant-portal && npx playwright test`)
- [ ] Deploy to staging/preview environment
- [ ] Smoke test critical flows:
  - [ ] Restaurant onboarding completes
  - [ ] Order creation via Core (sovereignty)
  - [ ] Payment processing (Stripe checkout)
  - [ ] Receipt generation and display
  - [ ] KDS order display and status updates
- [ ] Verify Stripe webhook endpoint responds (200 OK)
- [ ] Check Supabase connectivity (auth + database)
- [ ] Verify service worker registers correctly
- [ ] Verify PWA manifest is valid
- [ ] Tag release with semver (`git tag vX.Y.Z`)
- [ ] Deploy to production
- [ ] Verify production health endpoint
- [ ] Monitor Sentry for 30 minutes post-deploy

## Post-Release

- [ ] Update CHANGELOG.md with release notes
- [ ] Notify team (Slack/Discord/email)
- [ ] Monitor error rates in Sentry for 24 hours
- [ ] Monitor Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Verify analytics events are firing correctly
- [ ] Check billing/subscription flows in production
- [ ] Close related GitHub issues and milestones

---

## Emergency Rollback

If a critical issue is found post-deploy:

1. Revert to previous Vercel deployment (Vercel dashboard > Deployments > Promote)
2. Or revert the merge commit: `git revert <merge-sha> && git push`
3. Create a hotfix branch: `hotfix/vX.Y.Z-fix`
4. Notify team immediately
5. Post-mortem within 48 hours
