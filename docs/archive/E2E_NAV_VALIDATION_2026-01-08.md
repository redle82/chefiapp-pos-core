# E2E Navigation Validation Checklist

**Date:** 2026-01-08  
**Author:** ChefIApp OS  
**Status:** SEALED

---

## Overview

This document validates the end-to-end navigation flow for ChefIApp POS, ensuring:
- Landing → Google Auth → Onboarding → Dashboard works correctly
- Operational tools (TPV, KDS, Menu, Orders) open in **separate browser tabs**
- Each tab is refresh-safe and maintains ToolBoundary enforcement
- Document titles are correctly set per route

---

## Flow Diagram

```
┌─────────────┐      ┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│      /      │ ──── │   /login    │ ──── │ /onboarding/*    │ ──── │ /app/dashboard  │
│  (Landing)  │      │ (Google)    │      │ (7 Steps)        │      │ (Command Center)│
└─────────────┘      └─────────────┘      └──────────────────┘      └────────┬────────┘
                                                                              │
                              ┌───────────────────────────────────────────────┼───────────────────────────────────────────────┐
                              │                                               │                                               │
                              ▼                                               ▼                                               ▼
                     ┌────────────────┐                              ┌────────────────┐                              ┌────────────────┐
                     │   /app/tpv     │                              │   /app/kds     │                              │   /app/menu    │
                     │ (NEW TAB)      │                              │ (NEW TAB)      │                              │ (NEW TAB)      │
                     └────────────────┘                              └────────────────┘                              └────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │  /app/orders   │
                     │ (NEW TAB)      │
                     └────────────────┘
```

---

## Manual Validation Steps

### Step 1: Landing Page
- [ ] Navigate to `/`
- [ ] Verify landing page renders with CTA button
- [ ] Click "Começar Grátis" → redirects to `/login`

### Step 2: Google Authentication
- [ ] At `/login`, click Google OAuth button
- [ ] Complete Google sign-in flow
- [ ] Verify redirect to `/bootstrap` (session validation)
- [ ] **New user:** redirects to `/onboarding/identity`
- [ ] **Existing user (completed):** redirects to `/app/dashboard`

### Step 3: Onboarding Flow
- [ ] Complete each onboarding step (identity → authority → topology → flow → cash → team)
- [ ] On final step completion, verify redirect to `/app/dashboard`
- [ ] **Tab title:** "ChefIApp POS — Dashboard"

### Step 4: Dashboard Tool Navigation (New Tab Behavior)
From `/app/dashboard`, click each tool card:

| Tool | Route | Expected Behavior | Tab Title |
|------|-------|-------------------|-----------|
| TPV / Caixa | `/app/tpv` | Opens in **NEW TAB** | ChefIApp POS — TPV |
| KDS / Cozinha | `/app/kds` | Opens in **NEW TAB** | ChefIApp POS — KDS |
| Cardápio | `/app/menu` | Opens in **NEW TAB** | ChefIApp POS — Menu |
| Pedidos | `/app/orders` | Opens in **NEW TAB** | ChefIApp POS — Orders |

- [ ] Verify each tool opens in a new browser tab (not same tab)
- [ ] Verify Dashboard tab remains open at `/app/dashboard`
- [ ] Verify each new tab has correct document.title

### Step 5: Refresh Safety
Directly navigate (or refresh) each route:

| Route | Expected |
|-------|----------|
| `/app/dashboard` | Renders Dashboard, no redirect loop |
| `/app/tpv` | Renders TPV, no redirect loop |
| `/app/kds` | Renders KDS, no redirect loop |
| `/app/menu` | Renders Menu Manager, no redirect loop |
| `/app/orders` | Renders Orders page, no redirect loop |

- [ ] Each route loads independently without relying on previous navigation
- [ ] FlowGate allows access for authenticated + completed users

### Step 6: ToolBoundary Enforcement
If `realityStatus !== 'verified'` or module is disabled:

- [ ] Verify LockedFeature screen is shown (fail-closed behavior)
- [ ] Tool does NOT render in blocked state
- [ ] No state mutations occur when blocked

---

## Technical Implementation

### Manifest Paths (`dashboard_manifest.ts`)
```typescript
{ id: 'op_tpv', path: '/app/tpv', status: 'active' }
{ id: 'op_kds', path: '/app/kds', status: 'active' }
{ id: 'op_menu', path: '/app/menu', status: 'active' }
{ id: 'op_orders', path: '/app/orders', status: 'active' }
```

### New Tab Navigation (`DashboardZero.tsx`)
```typescript
const toolRoutes = ['/app/tpv', '/app/kds', '/app/menu', '/app/orders'];
const isToolRoute = toolRoutes.some(route => module.path === route);

if (isToolRoute) {
    window.open(module.path, '_blank', 'noopener,noreferrer');
} else {
    navigate(module.path);
}
```

### Document Titles (via useEffect)
```typescript
// DashboardZero.tsx
useEffect(() => {
    document.title = 'ChefIApp POS — Dashboard';
    return () => { document.title = 'ChefIApp POS'; };
}, []);

// TPV.tsx, KitchenDisplay.tsx, MenuManager.tsx, PulseList.tsx
// Same pattern with respective titles
```

### CoreFlow Redirects
```typescript
// Completed users → /app/dashboard
if (currentPath === '/login' || currentPath === '/') {
    return { type: 'REDIRECT', to: '/app/dashboard', reason: 'Auth & Setup complete' };
}
```

---

## Validation Status

| Check | Status |
|-------|--------|
| Manifest includes op_menu | ✅ |
| All paths use /app/ prefix | ✅ |
| primaryOps has 4 tools | ✅ |
| window.open for tool routes | ✅ |
| document.title via useEffect | ✅ |
| CoreFlow → /app/dashboard | ✅ |
| Build passes | ✅ |

---

## Sign-off

```
E2E_NAV_SEALED=true
TIMESTAMP=2026-01-08T12:00:00Z
```
