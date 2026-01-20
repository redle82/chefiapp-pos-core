# Problematic Buttons & UI Risks (Audit M)

**Status:** ✅ CLEAN (Production Wizard)
**Audit Date:** 2025-12-25

## Summary
The "Mass Audit 360º" inspected the codebase for "Button Reality" — separating real, functional buttons from mocks or dead prototypes.
The finding is that the **Production Wizard** (`/app/setup/*`) is highly disciplined and free of the mock tools found in the Developer Playground (`App.tsx`).

## 1. Production Wizard (`/app/setup`)
| Component | Status | Finding |
|-----------|--------|---------|
| `IdentityStep` | ✅ SAFE | No "Google Import (Mock)" buttons found. Clean forms only. |
| `MenuStep` | ✅ SAFE | Strict phase flow (Category -> Item). No "Seed Menu" shortcuts. |
| `PaymentsStep` | ✅ SAFE | Real Stripe Connect integration. No "Fake Success" buttons. |
| `PublishStep` | ✅ SAFE | Real server-side validation. |

## 2. Developer Tools (`/app/demo` - `App.tsx`)
> **Note:** These are internal tools, not reachable by normal navigation.

| Component | Status | Finding | Action Required |
|-----------|--------|---------|-----------------|
| `App.tsx` | ⚠️ INTERNAL | Contains "Import Google (mock)", "Import URL (mock)". | **Keep as Dev Tool** (Safe if hidden). |
| `PublicPages.tsx` | 💀 DEAD | Orphaned code (React implementation of SSR page). | **Delete** in cleanup phase. |

## 3. Recommended Actions
1.  **Delete** `merchant-portal/src/pages/Public/PublicPages.tsx` to avoid confusion.
2.  **Protect** `/app/demo` with an env var or remove it from `main.tsx` in Production build.
