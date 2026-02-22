# 🚀 PRODUCTION ROLLOUT - QUICK REFERENCE

**Date:** 2026-02-22
**Status:** ✅ Release Gate PASSED → Ready for deployment

---

## ⚡ INSTANT ACCESS LINKS

```bash
# Sentry Dashboard
open https://sentry.io/organizations/chefiapp/projects/merchant-portal/

# Vercel Dashboard
open https://vercel.com/your-team/merchant-portal

# Supabase Dashboard
open https://supabase.com/dashboard/project/your-project-ref
```

---

## 🎯 CRITICAL THRESHOLDS

| Metric                   | 🟢 Good | 🟡 Warning | 🔴 Critical          |
| ------------------------ | ------- | ---------- | -------------------- |
| **Error Rate**           | < 1%    | 1-5%       | > 5% 🚨 **ROLLBACK** |
| **LCP**                  | < 2.5s  | 2.5-4s     | > 4s                 |
| **FID**                  | < 100ms | 100-300ms  | > 300ms              |
| **Core RPC**             | > 99%   | 95-99%     | < 95% 🚨             |
| **Browser Block Bypass** | 0       | 1-5        | > 5 🚨 **ROLLBACK**  |

---

## ⏱️ TIMELINE

```
T+0h  → Deploy (Vercel)
T+1h  → Internal test (2 devices)
T+6h  → Pilot customers (3-5)
T+24h → Full rollout
T+48h → Normal ops
```

---

## 🧪 SMOKE TEST SCRIPT

```bash
# 1. Deploy
pnpm run build
vercel --prod

# 2. Verify environment
curl https://your-domain.com/health

# 3. Test browser block (should see block screen)
open https://your-domain.com/op/tpv

# 4. Install PWA on device
# → Open Safari → Share → Add to Home Screen

# 5. Test installed app
# → Should access /op/tpv successfully
```

---

## 🚨 EMERGENCY ROLLBACK

```bash
# Option 1: Vercel Dashboard
# → Deployments → Previous → Promote to Production

# Option 2: CLI
vercel rollback <previous-deployment-url> --prod

# Option 3: Git revert + redeploy
git revert HEAD
git push origin main
# Vercel auto-deploys
```

---

## 📊 MONITORING COMMANDS

```bash
# Check Sentry errors (last 1h)
# → Sentry Dashboard → Issues → Filter: "Last hour"

# Check Vercel logs (real-time)
vercel logs --prod --follow

# Check build status
vercel ls --prod

# Check environment variables
vercel env ls production
```

---

## ✅ T+1h CHECKLIST (Internal Test)

- [ ] Deploy successful
- [ ] Sourcemaps uploaded to Sentry
- [ ] Install PWA on iPhone (test)
- [ ] Install PWA on Android (test)
- [ ] Test TPV: Create order → Pay → Confirm ✅
- [ ] Test KDS: View orders → Mark complete ✅
- [ ] Test AppStaff: Payment modal → Receipt ✅
- [ ] **Browser block test:** Open /op/tpv in Safari → Blocked ✅
- [ ] Sentry: 0 unhandled errors ✅

**Go/No-Go:** \***\*\_\_\_\*\***
**Timestamp:** \***\*\_\_\_\*\***

---

## ✅ T+6h CHECKLIST (Pilot)

Pilot Restaurants: **\*\***\_\_**\*\***

- [ ] Sent installation links
- [ ] Confirmed PWA installed
- [ ] First order processed successfully
- [ ] Error rate < 2% ✅
- [ ] Performance green ✅
- [ ] Direct support channel active

**Issues Found:** \***\*\_\_\_\*\***
**Continue to Full Rollout:** \***\*\_\_\_\*\***

---

## 🐛 COMMON ISSUES & FIXES

### Issue: Sentry not receiving errors

**Fix:**

```bash
# Check DSN configured
vercel env ls production | grep SENTRY_DSN

# Check sourcemaps uploaded
# → Vercel build logs should show "Sentry sourcemaps uploaded"
```

---

### Issue: Performance degraded (LCP > 4s)

**Fix:**

```bash
# Clear Vercel cache
vercel --prod --force

# Check bundle size
pnpm run build
ls -lh merchant-portal/dist/assets/*.js
```

---

### Issue: Browser block not working

**Actions:**

1. Verify test passing: `pnpm test BrowserBlockGuard.test`
2. Check guard in routes: `merchant-portal/src/routes/OperationalRoutes.tsx`
3. **If bypassed → IMMEDIATE ROLLBACK**
4. Re-run release gate: `npm run audit:release:portal`

---

### Issue: Core RPC timeouts

**Fix:**

```bash
# Check Supabase status
open https://status.supabase.com

# Check connection pool
# → Supabase Dashboard → Database → Connection Pooler

# Increase pool size (if exhausted)
# → Settings → Database → Max Connections → 100
```

---

## 📞 INCIDENT ESCALATION

**Level 1:** Error rate 1-5% → Investigate
**Level 2:** Performance red → Plan hotfix
**Level 3:** Error rate > 5% OR browser block bypass → **ROLLBACK NOW**

---

## 📋 POST-ROLLOUT REPORT TEMPLATE

```markdown
# Production Rollout Report - [DATE]

## Summary

- **Deployment Time:** T+0h = [timestamp]
- **Full Rollout:** T+24h = [timestamp]
- **Total Devices:** [count]
- **Total Orders:** [count]

## Metrics

- **Error Rate:** [%]
- **LCP:** [seconds]
- **Core RPC Success:** [%]
- **Browser Block Bypasses:** [count] (should be 0)

## Issues Encountered

1. [Issue 1]
   - Severity: [Low/Med/High]
   - Resolution: [description]

## Lessons Learned

- [What went well]
- [What needs improvement]

## Next Steps

- [ ] [Action item 1]
- [ ] [Action item 2]
```

---

**Full Plan:** [`docs/ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md`](./PRODUCTION_ROLLOUT_MONITORING_PLAN.md)
