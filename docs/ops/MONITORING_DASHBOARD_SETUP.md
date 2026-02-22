# 🎛️ MONITORING DASHBOARD SETUP GUIDE

**Project:** ChefIApp Merchant Portal
**Environment:** Production
**Date:** 2026-02-22

---

## 🎯 OBJECTIVES

Set up real-time monitoring dashboards before first production deployment to:

1. Detect errors instantly (Sentry)
2. Track performance metrics (Vercel Analytics)
3. Monitor Core RPC health (Supabase)
4. Validate browser-block enforcement (Custom analytics)

---

## 📊 SENTRY SETUP

### 1. Create Production Environment

**URL:** https://sentry.io/organizations/chefiapp/projects/

**Steps:**

1. Create new project: "merchant-portal"
2. Platform: "React"
3. Environment: "production"

**Copy DSN:**

```
https://[your-key]@[your-org].ingest.sentry.io/[project-id]
```

---

### 2. Configure Vercel Environment Variables

```bash
# Via Vercel CLI
vercel env add VITE_SENTRY_DSN production
# Paste DSN when prompted

# For sourcemap uploads (CI/CD)
vercel env add VITE_SENTRY_AUTH_TOKEN production
# Get token from: Sentry → Settings → Auth Tokens → Create New Token
# Scopes: project:read, project:releases, org:read

vercel env add VITE_SENTRY_ORG production
# Enter: chefiapp

vercel env add VITE_SENTRY_PROJECT production
# Enter: merchant-portal
```

**Verify:**

```bash
vercel env ls production | grep SENTRY
```

---

### 3. Create Sentry Alert Rules

**Navigate to:** Sentry → Alerts → Create Alert

#### Alert 1: High Error Rate (Critical)

```yaml
Name: "[Production] High Error Rate"
Environment: production
Metric: Error rate
Condition: > 5% in 1 hour
Actions:
  - Send email to: your-team@example.com
  - Slack notification: #prod-alerts
Priority: Critical
```

#### Alert 2: New Unhandled Error (High)

```yaml
Name: "[Production] New Unhandled Error"
Environment: production
Metric: New issue created
Filter: Error type = "UnhandledError"
Condition: first seen
Actions:
  - Send email to: your-team@example.com
  - Slack notification: #prod-errors
Priority: High
```

#### Alert 3: Performance Degradation (Medium)

```yaml
Name: "[Production] Performance Degradation"
Environment: production
Metric: Transaction duration (p95)
Condition: > 3 seconds in 30 minutes
Actions:
  - Send email to: your-team@example.com
Priority: Medium
```

#### Alert 4: Browser Block Bypass (Critical)

```yaml
Name: "[Production] Browser Block Bypass"
Environment: production
Metric: Breadcrumb event
Filter: message contains "BrowserBlockScreen"
Condition: > 0 occurrences in 1 hour
Actions:
  - Send email immediately
  - Slack notification: #prod-alerts
Priority: Critical
Notes: Should never trigger if enforcement working
```

---

### 4. Sentry Dashboard Widgets

**Navigate to:** Sentry → Dashboards → Create Dashboard

**Name:** "Production Monitoring - Merchant Portal"

**Widgets to add:**

1. **Error Overview**

   - Type: Line chart
   - Metric: Event count
   - Group by: Error type
   - Time: Last 24 hours

2. **Top Errors**

   - Type: Table
   - Metric: Event count
   - Group by: Issue
   - Limit: 10

3. **Performance (P95)**

   - Type: Line chart
   - Metric: Transaction duration
   - Percentile: p95
   - Time: Last 24 hours

4. **Session Replays**

   - Type: List
   - Filter: Has replay
   - Sort: Most recent
   - Limit: 10

5. **Browser Block Events**
   - Type: Table
   - Filter: breadcrumb.message = "BrowserBlockScreen"
   - Group by: User
   - Time: Last 7 days

---

## 🚀 VERCEL ANALYTICS SETUP

### 1. Enable Speed Insights

**Navigate to:** Vercel Dashboard → merchant-portal → Analytics

**Enable:**

- [x] Speed Insights
- [x] Audience Insights
- [x] Web Analytics

**Cost:** Free tier (10k events/month)

---

### 2. Configure Real User Monitoring (RUM)

**In code** (already configured):

```typescript
// merchant-portal/vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // Vercel analytics automatically injected
  ],
});
```

**Verify after deploy:**

```bash
# Check Vercel Analytics tab
# Should show data within 5 minutes of first visit
```

---

### 3. Set Up Performance Budgets

**Navigate to:** Vercel → Project Settings → Performance

**Budgets:**

```yaml
Lighthouse Performance Score: > 90
First Contentful Paint: < 1.8s
Largest Contentful Paint: < 2.5s
Time to Interactive: < 3.5s
Total Blocking Time: < 300ms
Cumulative Layout Shift: < 0.1
```

**Alert on:** Budget exceeded in production

---

## 🗄️ SUPABASE MONITORING

### 1. Enable Database Logs

**Navigate to:** Supabase Dashboard → Logs

**Enable:**

- [x] Database logs
- [x] API logs
- [x] Auth logs

**Retention:** 7 days (free tier) or 30 days (pro)

---

### 2. Monitor Connection Pool

**Navigate to:** Database → Connection Pooler

**Current Settings:**

- Mode: Transaction (recommended)
- Pool Size: 15 (default)
- Max Connections: 100

**Monitor:**

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds';
```

---

### 3. Set Up Supabase Alerts

**Navigate to:** Project Settings → Alerts

**Enable:**

- [x] Database CPU > 80% for 5 minutes
- [x] Database memory > 90%
- [x] Database disk > 80%
- [x] Connection pool > 90% utilization

---

## 📈 CUSTOM ANALYTICS (Local Analytics Service)

### Already Configured

**File:** `merchant-portal/src/analytics/track.ts`

**Events tracked:**

- `page_view` - Route navigation
- `order_created` - Order completion
- `payment_completed` - Payment success
- `browser_block_triggered` - Enforcement active

**Storage:** LocalStorage queue → Future backend upload

**Dashboard:** Future integration with GA4 or Mixpanel

---

## 🧪 VERIFY MONITORING SETUP

### Pre-Deployment Test

```bash
# 1. Deploy to staging first
vercel --env staging

# 2. Trigger test error
# → Open any page → Open DevTools Console
window.throwTestError = () => { throw new Error('Sentry test'); }
window.throwTestError();

# 3. Check Sentry Dashboard (should appear in ~30 seconds)
# → Issues → Filter: Environment = staging

# 4. Check Vercel Analytics
# → Should show page views in Real-Time tab

# 5. Check Supabase Logs
# → Should show API requests
```

---

### Post-Deployment Validation

```bash
# 1. Open production URL
open https://your-domain.com

# 2. Check browser console (should be clean)
# 3. Check network tab (Core RPC calls 200 OK)
# 4. Install PWA → Test operational module access

# 5. Verify Sentry receiving events
# → Sentry Dashboard → Issues (should show 0 unhandled)

# 6. Verify Vercel Analytics showing traffic
# → Vercel Dashboard → Analytics (real-time graph)

# 7. Verify Supabase logs
# → Supabase → Logs (API calls visible)
```

---

## 📱 MOBILE MONITORING (Expo/React Native)

**File:** `mobile-app/services/logging.ts`

**Setup:**

```bash
# Configure Sentry DSN for mobile
cd mobile-app
npx expo install @sentry/react-native

# Add to app.json
{
  "expo": {
    "extra": {
      "sentryDsn": "https://[your-mobile-dsn]@sentry.io/[mobile-project]"
    }
  }
}
```

**Note:** Mobile app monitoring is separate from web portal. Create distinct Sentry project for mobile.

---

## 🔔 NOTIFICATION CHANNELS

### Slack Integration (Recommended)

**Setup:**

1. Sentry → Settings → Integrations → Slack
2. Connect workspace
3. Choose channel: `#prod-alerts`
4. Test notification

**Channels:**

- `#prod-alerts` - Critical errors, rollback triggers
- `#prod-errors` - All production errors (lower priority)
- `#prod-deploys` - Deployment notifications (Vercel)

---

### Email Alerts

**Setup:**

1. Sentry → Alerts → Each rule → Actions → Add email
2. Vercel → Project Settings → Notifications → Enable email
3. Supabase → Project Settings → Alerts → Add email

**Recipients:**

- Critical alerts: All developers + on-call
- Warning alerts: Team lead + DevOps
- Info alerts: DevOps only

---

## 🎯 MONITORING CHECKLIST

### Before First Deploy

- [ ] Sentry project created
- [ ] VITE_SENTRY_DSN configured in Vercel
- [ ] Sentry alert rules created (4 rules)
- [ ] Sentry dashboard widgets configured
- [ ] Vercel Speed Insights enabled
- [ ] Vercel performance budgets set
- [ ] Supabase logs enabled
- [ ] Supabase connection pool monitored
- [ ] Slack integration connected
- [ ] Email notifications configured

### After First Deploy

- [ ] Sentry receiving events (check dashboard)
- [ ] Sourcemaps uploaded (check Releases)
- [ ] Vercel Analytics showing data
- [ ] Supabase logs showing API calls
- [ ] Test alert triggered successfully
- [ ] Slack notification received
- [ ] Email alert received
- [ ] All dashboards accessible

---

## 📚 DASHBOARD QUICK LINKS

```bash
# Save these as bookmarks
Sentry Dashboard:   https://sentry.io/organizations/chefiapp/projects/merchant-portal/
Vercel Analytics:   https://vercel.com/[team]/merchant-portal/analytics
Supabase Logs:      https://supabase.com/dashboard/project/[ref]/logs
Vercel Deployments: https://vercel.com/[team]/merchant-portal/deployments
```

---

## 🆘 TROUBLESHOOTING

### Issue: Sentry not receiving events

**Diagnosis:**

```bash
# Check DSN configured
vercel env ls production | grep SENTRY_DSN

# Check sourcemaps uploaded
vercel logs --prod | grep "Sentry sourcemaps"
```

**Fix:**

1. Verify DSN is correct
2. Check auth token has correct scopes
3. Redeploy with `vercel --prod --force`

---

### Issue: Vercel Analytics shows no data

**Diagnosis:**

- Check if Speed Insights enabled in project settings
- Verify production deployment successful
- Wait 5-10 minutes for data propagation

**Fix:**

1. Open production URL in new tab (to trigger event)
2. Refresh Vercel Analytics page
3. If still no data, contact Vercel support

---

### Issue: Supabase logs not showing

**Diagnosis:**

- Check project tier (logs require Pro tier for retention)
- Verify API requests are actually being made

**Fix:**

1. Upgrade to Pro tier if needed
2. Check network tab for Core RPC calls
3. Verify Supabase client configured correctly

---

## 📖 REFERENCES

- **Sentry React Docs:** https://docs.sentry.io/platforms/javascript/guides/react/
- **Vercel Analytics:** https://vercel.com/docs/analytics
- **Supabase Logging:** https://supabase.com/docs/guides/platform/logs

---

**Status:** Ready for production deployment ✅
**Next:** Follow [`PRODUCTION_ROLLOUT_MONITORING_PLAN.md`](./PRODUCTION_ROLLOUT_MONITORING_PLAN.md)
