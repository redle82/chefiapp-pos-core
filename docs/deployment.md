# ChefIApp POS Core — Deployment Guide

## Prerequisites

- Node.js 18+
- Supabase CLI (`npm i -g supabase`)
- Vercel CLI (`npm i -g vercel`)

## Local Development

```bash
# 1. Clone and install
git clone <repo>
cd chefiapp-pos-core/merchant-portal
npm install

# 2. Environment
cp .env.example .env.local
# Edit .env.local with your Supabase keys

# 3. Start dev server
npm run dev
# Open http://localhost:5173
```

## Supabase Setup

```bash
# Login
supabase login

# Link to project
supabase link --project-ref <your-project-id>

# Apply migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy stripe-payment
supabase functions deploy fiscal-retry-worker
```

## Production Deployment (Vercel)

```bash
# 1. Build
npm run build

# 2. Deploy
vercel --prod

# 3. Set environment variables in Vercel dashboard:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_STRIPE_PUBLIC_KEY
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | ✅ |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret (Edge Func) | ✅ |
| `AT_FISCAL_API_KEY` | AT Portugal API key | For PT |

## Health Checks

```bash
# Frontend
curl https://your-domain.vercel.app/health

# Supabase
curl https://your-project.supabase.co/rest/v1/
```

## Troubleshooting

### CORS Errors

Ensure Edge Functions have proper headers:

```typescript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
```

### Migration Failures

```bash
supabase db reset  # Caution: drops all data
supabase db push
```
