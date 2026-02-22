# CRM Setup & Deployment Guide

## Quick Start (Development)

### 1. Environment Configuration

Environment variables are pre-configured in `.env`:

```bash
VITE_INSFORGE_BASE_URL=https://vv5bwyz6.us-east.insforge.app
VITE_INSFORGE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Start Development Server

```bash
cd insforge-crm
pnpm install
npm run dev
```

Access at: `http://localhost:5173`

---

## Database Setup (InsForge Dashboard)

Run these SQL commands in your InsForge Database Console:

### Create Tables

```sql
-- Contacts Table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tags JSON DEFAULT '[]',
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Companies Table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Deals Table
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  amount DECIMAL(12,2),
  stage TEXT DEFAULT 'lead',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Deal Activity Log
CREATE TABLE deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  old_stage TEXT,
  new_stage TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Tasks/Follow-ups
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- File Attachments
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Create Storage Buckets

Create these buckets in InsForge Storage Console:

- `deals` — For deal attachments
- `contacts` — For contact files (optional)

### Enable Row Level Security (Optional but Recommended)

```sql
-- Enable RLS on all tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;

-- Contacts: Users can only see their own
CREATE POLICY "Users can only view own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  USING (auth.uid() = user_id);

-- Similar policies for companies, deals, tasks, attachments
```

---

## Production Build

### Build Optimization

```bash
npm run build
```

Output structure:

```
dist/
├── index.html           # Entry point (474 B)
├── assets/
│   ├── index-*.css      # Tailwind CSS bundle (~4.2 KB gzipped)
│   └── index-*.js       # React + InsForge SDK bundle (~129 KB gzipped)
└── vite.svg             # Static asset
```

### Build Size

- **CSS**: 16.01 kB (4.18 kB gzipped)
- **JS**: 453.44 kB (129.38 kB gzipped)
- **Total gzipped**: ~133 kB

---

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel auto-detects Vite projects and handles deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd insforge-crm
vercel deploy
```

**Environment Variables** (set in Vercel Dashboard):

```
VITE_INSFORGE_BASE_URL=https://vv5bwyz6.us-east.insforge.app
VITE_INSFORGE_ANON_KEY=your-production-anon-key
```

### Option 2: Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### Option 3: InsForge Deployment

InsForge provides built-in hosting:

```bash
# Using InsForge CLI
pnpm dlx insforge create-deployment \
  --name "my-crm" \
  --source ./dist
```

### Option 4: Docker (Self-hosted)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN pnpm install && npm run build
EXPOSE 3000
CMD ["pnpm", "preview"]
```

```bash
docker build -t insforge-crm .
docker run -p 3000:3000 \
  -e VITE_INSFORGE_BASE_URL=https://vv5bwyz6.us-east.insforge.app \
  -e VITE_INSFORGE_ANON_KEY=your-key \
  insforge-crm
```

---

## Monitoring & Debugging

### Check Health

```bash
# Test InsForge connectivity
curl https://vv5bwyz6.us-east.insforge.app/rest/v1/

# Expected response: OpenAPI 3.0 spec with routes
```

### Browser DevTools

- **Console**: Check for CORS errors, SDK initialization issues
- **Network**: Verify API calls to InsForge (`/rest/v1/*` or `/auth/v1/*`)
- **Application**: Check stored auth tokens in localStorage

### Server Logs

```bash
# Check Vercel logs
vercel logs [deployment-url]

# Check browser console for InsForge SDK logs
const client = createClient({ ..., debug: true })
```

---

## Common Issues & Fixes

### Authentication Fails

- ✅ Verify `VITE_INSFORGE_BASE_URL` is correct
- ✅ Check `VITE_INSFORGE_ANON_KEY` is valid in InsForge Dashboard
- ✅ Ensure InsForge project allows email/password auth (Settings > Authentication)

### Database Queries Return Empty

- ✅ Run health check: `curl https://vv5bwyz6.us-east.insforge.app/rest/v1/contacts`
- ✅ Verify tables exist in InsForge Database Console
- ✅ Check RLS policies don't block queries

### File Upload Fails

- ✅ Verify storage buckets exist (`deals`, `contacts`)
- ✅ Check file size limits for your InsForge tier
- ✅ Ensure anon key has storage permissions

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules dist .turbo
pnpm install
npm run build
```

---

## Performance Tips

### Bundle Analysis

```bash
npm run build -- --analyze  # Creates dist/analysis.html
```

### Code Splitting

Already configured in `vite.config.ts`:

- Route-based splitting (pages are lazy-loaded)
- Vendor separation (InsForge SDK in separate chunk)

### Caching

- Browser caches assets for 1 year (hashed filenames)
- Database queries cached in React state
- LocalStorage for auth tokens (auto-managed by InsForge)

---

## Security Considerations

✅ **Never commit `.env` files** — Store in deployment platform
✅ **Use HTTPS only** — InsForge enforces this
✅ **Enable RLS** — Prevents unauthorized data access
✅ **Rotate keys periodically** — In InsForge Dashboard
✅ **Validate file uploads** — Check MIME types and size
✅ **Use CORS headers** — InsForge handles this automatically

---

## Scaling Considerations

### Database Optimization

- Index frequently-filtered fields (`user_id`, `stage`)
- Archive old deals/tasks periodically
- Use pagination for large result sets

### Frontend Optimization

- Lazy-load components (`React.lazy()`)
- Implement virtual scrolling for large lists
- Cache API responses in React Query/SWR

### Storage

- Compress files before upload
- Set expiration policies for old attachments
- Use CDN for public files

---

## Support & Resources

- **InsForge Docs**: https://insforge.dev
- **PostgREST API**: https://postgrest.org
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Vite**: https://vitejs.dev

---

**Deployment Status**: ✅ Ready for Production

Last updated: 2025-02-21
