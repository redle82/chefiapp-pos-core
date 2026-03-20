# Runbook: High API Error Rate

**Alert Rule**: `api_error_rate`
**Severity**: CRITICAL
**Threshold**: API error rate > 5% (minimum 10 total calls)
**Cooldown**: 30 minutes

---

## Symptoms

- Alert "High API Error Rate" triggered on the Monitoring dashboard
- `api.error` counter rising in Metrics section
- Multiple features failing simultaneously (orders, payments, menu loading)
- Users seeing error messages or empty screens
- Console filled with network errors

## Impact

- **Service degradation**: core features may be partially or fully unavailable
- **Data integrity risk**: failed writes may leave data in inconsistent states
- **Customer experience**: visible errors, slow or broken workflows

## Investigation Steps

### 1. Identify the error pattern (2 min)

- Open the Monitoring page
- Check the Counters section for `api.error`
- Check the Timings section for `api.latency` -- are response times also elevated?
- Open browser DevTools > Console, filter for errors
- Note the specific endpoints failing and the HTTP status codes:
  - `401/403` -- authentication/authorization issue
  - `404` -- endpoint misconfiguration or missing resource
  - `409` -- conflict (duplicate operations, RLS violations)
  - `422` -- validation error (bad request payload)
  - `429` -- rate limiting
  - `500/502/503` -- server-side failure

### 2. Check Sentry for new errors (2 min)

- Open [Sentry Dashboard](https://sentry.io) for the ChefIApp project
- Sort issues by "First Seen" to find new errors
- Check if errors correlate with a recent deployment
- Look at the error stacktraces for the root cause

### 3. Check deploy correlation (1 min)

- Was there a deployment in the last hour?
- Check Vercel deployment history for recent deploys
- If errors started immediately after a deploy, this is likely a deploy-related regression

### 4. Check Supabase health (1 min)

- In System Health widget, check "Database" status
- Check [Supabase Status](https://status.supabase.com/)
- If Supabase is experiencing issues:
  - All database operations will fail
  - This cascades to all features that read or write data

### 5. Check circuit breaker states (1 min)

- In System Health widget, check for OPEN circuit breakers
- An OPEN breaker means a service has been isolated due to failures
- This is protective -- it prevents cascading failures
- The breaker will auto-recover to HALF_OPEN after the timeout

### 6. Check third-party service status (1 min)

- [Stripe Status](https://status.stripe.com/) -- payment processing
- [Supabase Status](https://status.supabase.com/) -- database and auth
- [Vercel Status](https://www.vercel-status.com/) -- hosting and edge functions

## Resolution

### If deploy-related (regression)

1. **Rollback immediately**:
   - In Vercel dashboard, go to Deployments
   - Find the last known-good deployment
   - Click "Promote to Production" (instant rollback)
2. Verify errors stop after rollback
3. Investigate the broken deploy in a development environment
4. Fix the issue and redeploy after testing

### If Supabase is down

1. Check [Supabase Status](https://status.supabase.com/) for ETA
2. The POS should continue to work offline (offline-first architecture)
3. Sync queue will accumulate -- monitor per [SYNC-QUEUE-OVERFLOW](./SYNC-QUEUE-OVERFLOW.md)
4. Once Supabase is back, the queue will drain
5. If this is a regional outage, check if the Supabase project can be failed over

### If rate limited (429)

1. This means the application is making too many requests
2. Check for:
   - Polling loops with too-short intervals
   - Retry storms (failed requests being retried aggressively)
   - Missing request deduplication
3. Reduce polling frequency or implement exponential backoff
4. Check if Supabase project limits need to be increased

### If authentication errors (401/403)

1. Check if the Supabase anon key or service role key has been rotated
2. Check if JWT tokens are expiring and not being refreshed
3. Check if RLS policies have been modified recently
4. Verify the auth configuration in environment variables

### If validation errors (422)

1. These are application logic errors, not infrastructure issues
2. Check Sentry for the specific payloads causing validation failures
3. Fix the client-side validation to prevent bad payloads
4. This is not an emergency unless it is blocking critical workflows

## Escalation

| Condition | Action |
|---|---|
| Error rate > 5% for 10 min | Notify restaurant manager of degraded service |
| Error rate > 20% | Page on-call engineer |
| Deploy-related, rollback fails | Escalate to engineering lead |
| Supabase outage > 30 min | Monitor offline queue, prepare manual reconciliation |

## Post-Incident

- [ ] Document the root cause and timeline
- [ ] If deploy-related, add test coverage for the regression
- [ ] Review error handling in affected code paths
- [ ] Update alert thresholds if false-positive
- [ ] Check if any data was lost or corrupted during the incident
- [ ] Update this runbook if the resolution was not covered
