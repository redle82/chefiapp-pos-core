# InsForge Deployment Checklist

**Date:** February 11, 2026
**Project:** ChefIApp POS — merchant-portal
**Backend:** InsForge (https://vv5bwyz6.us-east.insforge.app)

---

## 📋 Pre-Deployment Checklist

### 1. Security: Rotate API Key

- [x] ~~API key was exposed in chat: `ik_2296986148e156e83fc16ed4e2652f29`~~
- [ ] **Go to InsForge Dashboard** → Authentication → API Keys
- [ ] **Regenerate anon key** (delete old one)
- [ ] **Copy new key** securely
- [ ] **DO NOT share key in chat/public channels**

### 2. Local Validation

- [x] InsForge SDK installed (`@insforge/sdk@1.1.5`)
- [x] Backend switching logic implemented
- [x] Tests passing (3/3 in `backendClient.test.ts`)
- [ ] **Run local validation script:**

  ```bash
  cd merchant-portal
  # Option A: Via browser console (dev server running)
  pnpm run dev
  # Open http://localhost:5175
  # In browser console: validateInsforge()

  # Option B: Add to src/main.tsx temporarily and check browser console
  ```

### 3. Environment Variables Configuration

#### Vercel Configuration

1. **Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

2. **Add Variable #1:**

   ```
   Name: VITE_INSFORGE_URL
   Value: https://vv5bwyz6.us-east.insforge.app
   Environment: Production + Preview
   ```

3. **Add Variable #2:**

   ```
   Name: VITE_INSFORGE_ANON_KEY
   Value: [YOUR_NEW_ROTATED_KEY]
   Environment: Production + Preview
   ```

4. **Save changes**

#### Local Testing (Optional)

Create `.env.local` with InsForge credentials to test locally:

```dotenv
# InsForge Production Test
VITE_INSFORGE_URL=https://vv5bwyz6.us-east.insforge.app
VITE_INSFORGE_ANON_KEY=[YOUR_NEW_KEY]

# Comment out Docker Core to force InsForge
# VITE_CORE_URL=/rest
```

Then run:

```bash
pnpm run dev
# App should now use InsForge instead of Docker Core
# Check console logs for backend selection
```

### 4. Deployment

- [ ] **Trigger Vercel deployment**

  - Option A: Push to main branch (auto-deploy)
  - Option B: Vercel Dashboard → Deployments → Redeploy

- [ ] **Wait for build to complete** (~2-3 min)
- [ ] **Check deployment logs** for errors

### 5. Post-Deployment Validation

#### Smoke Tests

Run these checks in production:

1. **App Loads:**

   ```
   ✓ Navigate to: https://your-app.vercel.app
   ✓ No blank screen/console errors
   ✓ Login page renders
   ```

2. **Backend Health:**

   ```javascript
   // Browser console on production site:
   import.meta.env.VITE_INSFORGE_URL;
   // Should show: "https://vv5bwyz6.us-east.insforge.app"

   validateInsforge(); // If validation script is exposed
   ```

3. **Database Query:**

   ```
   ✓ Login with test credentials
   ✓ Dashboard loads restaurant data
   ✓ No "Failed to fetch" errors in console
   ```

4. **Auth Flow:**
   ```
   ✓ Registration works
   ✓ Login works
   ✓ Logout works
   ✓ Session persists on refresh
   ```

#### Monitoring

- [ ] **Check Vercel Logs:** Dashboard → Deployments → [Latest] → Logs
- [ ] **Check Browser Console:** No InsForge connection errors
- [ ] **Check InsForge Dashboard:** Database → Table Browser → gm_restaurants (data exists?)

---

## 🔄 Rollback Plan

If InsForge deployment fails:

### Quick Rollback (Keep Docker Core)

1. **Remove InsForge env vars from Vercel:**

   - Delete `VITE_INSFORGE_URL`
   - Delete `VITE_INSFORGE_ANON_KEY`

2. **Redeploy**
   - App will automatically fall back to Docker Core logic
   - No code changes needed (backend switching built-in)

### Rollback to Previous Deployment

1. Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

---

## 📊 Architecture Notes

### Backend Switching Logic

Located in: `merchant-portal/src/core/infra/backendClient.ts`

```typescript
// Automatic backend selection:
export const isInsforge = Boolean(CONFIG.INSFORGE_URL);
export const backendClient = isInsforge
  ? insforge.database
  : getDockerCoreFetchClient();
```

**Behavior:**

- **VITE_INSFORGE_URL set** → InsForge is active backend
- **VITE_INSFORGE_URL empty/undefined** → Docker Core is active backend

**Zero code changes needed** — all 50+ database calls route through `backendClient` automatically.

### Test Coverage

Location: `merchant-portal/src/core/infra/backendClient.test.ts`

```
✓ uses Docker Core when INSFORGE_URL is empty
✓ uses InsForge when INSFORGE_URL is set
✓ aliases dockerCoreClient to backendClient
```

---

## 🎯 Success Criteria

- [ ] No API key exposed in public channels
- [ ] Vercel env vars configured correctly
- [ ] Production deployment succeeds
- [ ] App loads without errors
- [ ] Database queries work (restaurants load)
- [ ] Auth flow works (login/logout)
- [ ] No console errors related to InsForge
- [ ] InsForge dashboard shows API requests

---

## 📝 Post-Deployment Tasks

1. **Update documentation** with production URLs
2. **Monitor error rates** in Vercel/Sentry for 24h
3. **Validate all critical flows:**
   - Order creation (TPV)
   - KDS display
   - Dashboard metrics
4. **Run full E2E tests** against production
5. **Update team** on deployment status

---

## 🆘 Support

**InsForge Issues:**

- Dashboard: https://insforge.app/dashboard
- Docs: https://docs.insforge.app
- Support: Check InsForge dashboard for support contact

**ChefIApp Issues:**

- Check: `merchant-portal/docs/` for architecture docs
- Run: `npm run audit:release` for health check
- Logs: Vercel dashboard → Deployments → Logs

---

## ✅ Completion

Once all checkboxes are marked and smoke tests pass:

- [ ] **Mark deployment as COMPLETE**
- [ ] **Update CHANGELOG.md** with InsForge migration notes
- [ ] **Celebrate 🎉** — You've migrated from Docker Core to production BaaS!

---

**Last Updated:** February 11, 2026
**Status:** Pre-deployment
**Next Action:** Rotate API key → Configure Vercel env vars → Deploy
