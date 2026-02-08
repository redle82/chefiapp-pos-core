# ChefIApp POS - Deployment Guide

> Complete guide for deploying ChefIApp POS to production.

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/your-org/chefiapp-pos-core.git
cd chefiapp-pos-core

# 2. Install
cd merchant-portal && npm install

# 3. Build
npm run build

# 4. Preview
npm run preview
```

---

## Architecture Overview

| Component | Port (Dev) | Production URL |
|-----------|-----------|----------------|
| Merchant Portal | 5175 | `app.chefiapp.com` |
| API Server | 4320 | `api.chefiapp.com` |
| Supabase | - | `*.supabase.co` |

---

## Environment Variables

### Frontend (Vite)

Create `.env.production`:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Runtime Mode
VITE_RUNTIME_MODE=production

# API Base (for fiscal proxy)
VITE_API_BASE=https://api.chefiapp.com

# PWA
VITE_APP_NAME=ChefIApp POS
```

### Backend (Server)

```env
# Supabase Service Role (server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# InvoiceXpress (fetched per-restaurant from DB)
# Note: API keys are stored encrypted in gm_restaurants.fiscal_config
```

---

## Vercel Deployment

### Option 1: Merchant Portal Only

```bash
cd merchant-portal
vercel --prod
```

### Option 2: Monorepo (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com)
2. Import repository
3. Set **Root Directory** to `merchant-portal`
4. Set **Build Command** to `npm run build`
5. Set **Output Directory** to `dist`
6. Add environment variables

### vercel.json (Already Configured)

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Go-Live Checklist

### 1. Infrastructure

- [ ] Supabase project created (production)
- [ ] RLS policies verified
- [ ] Backup schedule configured
- [ ] Domain DNS configured

### 2. Environment

- [ ] `VITE_RUNTIME_MODE=production` set
- [ ] `VITE_SUPABASE_URL` points to production
- [ ] Service role key in server environment

### 3. Fiscal

- [ ] InvoiceXpress credentials configured per restaurant
- [ ] Test connection successful
- [ ] First invoice emission verified

### 4. Business Data

- [ ] At least one restaurant created
- [ ] Menu imported/created
- [ ] Operators configured
- [ ] Tables configured

### 5. PWA

- [ ] HTTPS enabled
- [ ] `manifest.json` icons correct
- [ ] Service worker caching works

---

## Database Migrations

Migrations are managed via Supabase:

```bash
# Apply all migrations
cd supabase
supabase db push

# Check status
supabase db diff
```

---

## Monitoring

### Logs

- **Frontend:** Browser console + Sentry (if configured)
- **Backend:** Server logs + Supabase dashboard
- **Fiscal:** `fiscal_event_store` table

### Health Checks

- `/app/dashboard` loads without errors
- TPV can create orders
- KDS receives realtime updates
- Fiscal invoices are emitted

---

## Rollback Plan

1. Revert Vercel deployment to previous version
2. Supabase: Revert migration via dashboard
3. Notify operations team

---

## Security Notes

| Item | Status |
|------|--------|
| API keys server-side only | ✅ |
| RLS on all tables | ✅ |
| `assertNoMock()` guards | ✅ |
| HTTPS enforced | Required |
| CSP headers | Recommended |

---

## Support

- **Issues:** GitHub Issues
- **Urgent:** Contact dev team directly
