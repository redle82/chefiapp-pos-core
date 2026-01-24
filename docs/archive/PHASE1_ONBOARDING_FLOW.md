# Phase 1 — Restaurant Onboarding Flow

**Goal:** Restaurant goes from 0 to live in <5 minutes (core setup) + <10 minutes (marketplace sync).

---

## Total Time Target: 15 Minutes End-to-End

```
Sign up           → 2 min
Email confirm     → 1 min
Restaurant setup  → 3 min
Marketplace sync  → 5 min
Page live         → 2 min
First order demo  → 2 min
```

---

## Step 1: Sign Up (2 minutes)

**URL:** chefiapp.com/sign-up

**Form Fields**
```
[ Email                    ]
[ Password (8+ chars)      ]
[ Restaurant Name          ]
[ Phone Number             ]
[ I accept Terms of Service ] (checkbox)
```

**On Submit**
- Validate email (not duplicate).
- Hash password.
- Create restaurant record.
- Generate UUID (restaurant_id).
- Send confirmation email.
- Redirect to "Check Your Email" page.

**Confirmation Email**
```
Subject: Confirm Your ChefIApp Account

Hi {Restaurant Name},

Click here to confirm: 
chefiapp.com/confirm?token={jwt_token}&email={email}

Valid for 24 hours.
```

---

## Step 2: Email Confirmation (1 minute)

**URL:** chefiapp.com/confirm?token=...

**On Load**
- Validate token (signed JWT, not expired).
- Mark email as confirmed.
- Create default entities:
  - `identityConfirmed: false`
  - `menuDefined: false`
  - `published: false`
  - `previewState: 'none'`
- Set `wizard-state` in localStorage.
- Redirect to dashboard.

---

## Step 3: Restaurant Setup (3 minutes)

**URL:** chefiapp.com/dashboard

**Onboarding Wizard** (auto-shown if incomplete)

### Section 1: Identity (1 minute)

**Fields**
```
[ Restaurant Name       ]
[ Description (100 ch)  ]
[ Phone Number          ]
[ Address               ]
[ Hours (e.g., 12-23h)  ]
```

**On Save**
- Validate required fields.
- Update core.entity.identityConfirmed = true.
- Move to next section.

### Section 2: Menu (1 minute)

**Quick Start Options**
- [ ] Add items manually (pre-filled templates).
- [ ] Import from marketplace (if connected).
- [ ] Use default menu (5 items).

**Action: "Add Item"**
```
[ Item Name    ]
[ Description  ]
[ Price (€)    ]
[ Category     ]
[ Photo (opt)  ]
```

**On Add 1+ Items**
- Set core.entity.menuDefined = true.
- Move to next section.

### Section 3: Publish (1 minute)

**Preview**
- Show restaurant page as it will appear.
- Show public URL: chefiapp.com/{slug}

**Button: "Publish Your Page"**
- Validate: identity + menu exist.
- Set core.entity.published = true.
- Redirect to marketplace setup.

---

## Step 4: Marketplace Sync (5 minutes)

**URL:** chefiapp.com/dashboard/marketplaces

**Goal:** Connect at least 1 marketplace.

**Card Per Marketplace**

```
┌─────────────────────────┐
│ Just Eat                │
│ 📡 Status: Not connected│
│                         │
│ [ Connect with Just Eat]│
│ ? Help                  │
└─────────────────────────┘
```

### Connection Flow (Per Marketplace)

**Click "Connect"**
1. Redirect to marketplace OAuth login (or show API key form).
2. User authorizes ChefIApp.
3. Marketplace returns token.
4. ChefIApp saves token securely (encrypted in DB).
5. Marketplace health checked.
6. If OK: redirect back to dashboard, show "✓ Connected".

**Example: Just Eat**
```
User clicks "Connect with Just Eat"
  → Redirect to: https://oauth.justeat.io/authorize?client_id=...&redirect_uri=chefiapp.com/auth/justeat/callback
  → User logs in to Just Eat account
  → User sees "ChefIApp wants to access your orders"
  → User clicks "Allow"
  → Redirect back to chefiapp.com/auth/justeat/callback?code=...
  → ChefIApp exchanges code for access token
  → Token stored in DB (encrypted)
  → Health check: call Just Eat API
  → If OK: show "✓ Connected" + "Orders will start syncing in ~30s"
  → If fail: show error with support link
```

**Status States Per Marketplace**
- ❌ Not connected
- 🔄 Connecting...
- ✓ Connected (green)
- ⚠️ Health warning (yellow — auth expired or API issue)
- ❌ Disconnected (red)

**Action: "View Orders"**
- If marketplace connected: redirect to TPV.
- Show placeholder: "Waiting for orders from Just Eat..."

---

## Step 5: Page Live (2 minutes)

**URL:** chefiapp.com/dashboard (summary)

**Display**
```
Your restaurant page: chefiapp.com/sofia-gastrobar
✓ Identity complete
✓ Menu complete (12 items)
✓ Published
✓ Marketplace connected: Just Eat
🔄 Waiting for first order...

[ View Your Page ] [ Manage ]
```

**"View Your Page"**
- Open in new tab: chefiapp.com/sofia-gastrobar
- Shows live restaurant page (menu, direct order form, info).

---

## Step 6: First Order Demo (2 minutes)

**Tutorial Modal (Shows Once)**

```
Great! Your page is live.

Let's do a test order so you see how orders appear in your dashboard.

[ Test Order ] [ Skip ]
```

**Click "Test Order"**
- Pre-fill demo order (1 Hamburger, 1 Cola).
- Submit (no real payment; just demo).
- Redirect to TPV.
- Show: "📦 New Order: Test Order from John Doe" (green notification).
- Tutorial: "Here's where your customers' orders appear. Confirm when ready."
- [ Confirm Order ]
- TPV shows: status updated to "confirmed".
- Tutorial: "Done! Your customer will see 'confirmed' on their order."
- [ Close Tutorial ]

---

## Post-Onboarding

### Dashboard Overview
```
Your Restaurant
├─ Status: Live ✓
├─ Page: sofia-gastrobar (chefiapp.com/sofia-gastrobar)
├─ Marketplaces: Just Eat (✓), Glovo (❌), UberEats (❌), Deliveroo (❌)
├─ Orders Today: 0
├─ First Order: -
└─ Actions:
   [ Connect More Marketplaces ]
   [ Edit Menu ]
   [ View Analytics ]
   [ Support ]
```

### Email Sent (After Onboarding)

```
Subject: Your ChefIApp page is live! 🎉

Hi Sofia,

Congratulations! Your restaurant page is live:
chefiapp.com/sofia-gastrobar

Next steps:
1. Connect all your marketplaces (Just Eat, Glovo, Uber Eats, Deliveroo).
2. Share your page with customers.
3. Monitor orders in your dashboard.

Questions? Reply to this email or visit our help center.

Cheers,
ChefIApp Team
```

---

## Success Metrics (Onboarding Funnel)

| Step | Target Completion | What We Monitor |
|------|-------------------|-----------------|
| Sign up | 100% | Conversion rate |
| Email confirm | 95%+ | Email delivery + click |
| Identity setup | 95%+ | Form completion |
| Menu setup | 90%+ | At least 1 item added |
| Publish | 85%+ | Page goes live |
| Marketplace 1+ | 70%+ | At least 1 connected |
| First order | 40%+ | Orders flowing |

**Target:** 100 sign-ups → 85 published → 60 with marketplace → 25 with first order (Phase 1 success).

---

## Error Handling

| Error | Message | Action |
|-------|---------|--------|
| Email already exists | "Email already registered. [Forgot Password?]" | Link to reset |
| Password too weak | "Password must be 8+ chars, 1 number, 1 symbol." | Clear; retry |
| Marketplace auth fails | "Just Eat login failed. Try again or contact support." | Retry or support link |
| Network error (order sync) | "Marketplace connection lost. Orders will sync when restored." | Auto-retry |
| Email not confirmed (>24h) | "Link expired. [Send New Link]" | Resend email |

---

## Accessibility

- [ ] Form labels linked to inputs (for screen readers).
- [ ] Error messages in plain language (not codes).
- [ ] Colors not sole indicator (use icons + text).
- [ ] Mobile-first (buttons ≥48px).
- [ ] Keyboard navigation works.

---

## Localization (Future)

Phase 1: English only.  
Phase 2: Add Portuguese, Spanish, French (for European expansion).

