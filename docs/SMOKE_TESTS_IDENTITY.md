# ChefIApp Smoke Test Checklist (Core Identity & Onboarding)

This document outlines the vital end-to-end tests to ensure the system's "Birth" and "Sovereign Identity" flows are intact. Run these after any changes to Auth, Onboarding, or Dashboard Hydration.

## 1. Full Birth Flow (Cold Signup)
- **Action**: Use a fresh email (or delete existing user) and go through `/login` -> signup.
- **Expected**:
    - [ ] Auth account created.
    - [ ] `gm_restaurants` record created by Genesis.
    - [ ] `restaurant_members` link created (role: owner).
    - [ ] `onboarding_events` shows `GENESIS_SUCCESS`.
    - [ ] Final redirect to `/app/dashboard` works without loops.

## 2. OAuth Continuity (Genesis Recovery)
- **Action**: Sign up via Google/OAuth.
- **Expected**:
    - [ ] OnboardingWizard detects `pending_signup` in localStorage.
    - [ ] `create-tenant` called correctly with `user_id`.
    - [ ] `MEMBERSHIP_FOUND` logged in telemetry.

## 3. Deployment/Migration Robustness (Sudo Fix)
- **Action**: Manually delete the `restaurant_members` entry for an existing owner.
- **Expected**:
    - [ ] Dashboard shows "Erro de Carga" in health card.
    - [ ] Hidden "⚙️ RECONECTAR IDENTIDADE" button appears in the header.
    - [ ] Clicking it calls `repair-membership` function.
    - [ ] Page reloads and Dashboard returns to normal (Online).
    - [ ] `MEMBERSHIP_REPAIRED` event recorded.

## 4. Telemetry Audit
- **Action**: Run the Audit Radar query in `docs/queries/audit_onboarding.sql`.
- **Expected**:
    - [ ] Clear trail of events from `AUTH_SESSION_OK` to `DASHBOARD_HYDRATION_OK`.
    - [ ] Payloads contain correct IDs.

## 📝 Evidence Section (Phase 1.5 Stabilization)
Capture your test results here to confirm the "Code Freeze" readiness.

| Scenario | Date/Time | Tester | Result | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **New (Cold Signup)** | | | | |
| **Old (Login Normal)** | | | | |
| **Broken (Manual Repair)** | | | | |

### Expected Event Sequences
Use these to verify the "Flight Recorder" accuracy:

**Scenario: Cold Signup**
1. `AUTH_SESSION_OK`
2. `GENESIS_PENDING_FOUND`
3. `GENESIS_EXECUTING`
4. `GENESIS_SUCCESS`
5. `MEMBERSHIP_FOUND`
6. `ONBOARDING_COMPLETED_FLAG_SET`
7. `DASHBOARD_HYDRATION_OK`

**Scenario: Manual Repair**
1. `DASHBOARD_HYDRATION_FAIL` (HealthCard shows error)
2. `DASHBOARD_GUARD_REDIRECT` (if flag missing) or Stay (with button)
3. `MEMBERSHIP_REPAIRED` (after clicking Sudo button)
4. `DASHBOARD_HYDRATION_OK` (after reload)

---
**Status**: Phase 1.5 Code Freeze Active ❄️
> [!NOTE]
> No further features allowed in this cycle. Only bugfixes and security hardening.
