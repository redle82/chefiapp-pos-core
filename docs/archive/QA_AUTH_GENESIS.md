# QA Checklist: End-to-End Auth & Genesis Flow

Follow these steps to verify that the "No Password" architecture is fully operational after configuring Supabase.

## 🟢 Pre-Requisites
- [ ] Supabase Dashboard: Google/Apple Providers ENABLED with Client IDs/Secrets.
- [ ] Supabase Dashboard: Redirect URL configured to `http://localhost:5173/onboarding`.

## 🧪 Test Case: New Restaurant Signup (The Genesis Ritual)
1. **Initial Entry**
   - [ ] Navigate to `/signup`.
   - [ ] Enter a unique restaurant name (e.g., "The Audit Bistro").
   - [ ] Click **"Continuar →"**.
   - [ ] *Expect*: Redirect to Step 2 (Identity Choice).
   
2. **Identity Decision**
   - [ ] Verify that no password fields are visible.
   - [ ] Click **"Criar com Google"**.
   - [ ] *Expect*: Redirect to Google OAuth Consent screen.

3. **Post-OAuth Return (The Genesis)**
   - [ ] Complete Google Login.
   - [ ] *Expect*: Redirect back to `/onboarding`.
   - [ ] Check Browser Console for logs: `[Genesis] Creating tenant for returning OAuth user...`
   - [ ] Check Browser Console for logs: `[Genesis] Success: { tenant_id: ..., ... }`

4. **Onboarding Ritual**
   - [ ] Complete Step 1 (Identity): Enter your name.
   - [ ] Complete Step 2 (Restaurant): Enter City (e.g., "Porto").
   - [ ] Complete Step 3 (Team): Choose size and "Gamified".
   - [ ] Complete Step 4 (Ready): Click **"Entrar no Sistema"**.
   - [ ] *Expect*: Smooth transitions and final redirect to `/app/dashboard`.

5. **Dashboard Verification**
   - [ ] Verify that the restaurant name in the header is "The Audit Bistro".
   - [ ] Verify that the header shows: `SYSTEM OVERSEER // PORTO // RESTAURANTE`.
   - [ ] Verify that the "System Health" widget shows "Heartbeat: Healthy".

## 🧪 Test Case: Existing User Login (Zero Loop Check)
1. Navigate to `/login`.
2. Click **"Continuar com Google"**.
3. *Expect*: Immediate redirect to `/app/dashboard` (since restaurant already exists).
4. *Expect*: No call to `create-tenant` (Idempotency check).

## �️ Technical Maturity Checks (Post-Onboarding)
- [ ] **Supabase Integrity Check**:
  - [ ] `gm_restaurants` has exactly 1 record for the owner.
  - [ ] `restaurant_members` links user → restaurant with `role = 'owner'`.
  - [ ] `profiles` row exists and contains the correct email.
- [ ] **LocalStorage Hygiene**:
  - [ ] `chefiapp_pending_signup` is REMOVED after Genesis success.
  - [ ] `chefiapp_restaurant_id` is SET correctly after onboarding.

## �🛑 Failure Recovery Check
1. Start signup again with a new name.
2. Close the browser tab *after* Google OAuth but *before* completing onboarding.
3. Re-open and go to `/onboarding`.
4. *Expect*: System should pick up where you left off (Identity Step 1).
