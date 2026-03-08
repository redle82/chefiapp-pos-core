# Matriz de variáveis de ambiente — Stack 2026

**Objetivo:** Uma única referência. Nada duplicado entre frontend, Edge e Supabase.

---

## Onde cada variável vive

| Variável | Frontend (Vercel) | Edge (Supabase) | Notas |
|----------|-------------------|-----------------|--------|
| **Supabase** | | | |
| `SUPABASE_URL` | — | ✅ (auto) | Edge tem por defeito |
| `VITE_SUPABASE_URL` | ✅ | — | Client: URL do projeto |
| `SUPABASE_ANON_KEY` | — | — | Edge usa service role quando necessário |
| `VITE_SUPABASE_ANON_KEY` | ✅ | — | Client: anon key |
| **Stripe** | | | |
| `STRIPE_SECRET_KEY` | — | ✅ | Só Edge (webhooks + checkout) |
| `STRIPE_WEBHOOK_SECRET` | — | ✅ | Validação assinatura |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ✅ | — | Client: pk_* |
| **SumUp** | | | |
| `SUMUP_*` (secret, client_id, etc.) | — | ✅ | Só Edge |
| **Pix** | | | |
| Credenciais Pix | — | ✅ | Só Edge / provider |
| **Internal API** | | | |
| `VITE_INTERNAL_API_TOKEN` | ✅ | — | Client → Edge (header) |
| `INTERNAL_API_TOKEN` | — | ✅ | Edge valida o mesmo valor |
| **Sentry** | | | |
| `VITE_SENTRY_DSN` | ✅ | — | Client |
| `SENTRY_DSN` | — | opcional Edge | Se Edge reportar erros |
| `VITE_SENTRY_AUTH_TOKEN` | ✅ (build) | — | Upload sourcemaps; não expor no client |
| `SENTRY_ORG` / `SENTRY_PROJECT` | ✅ (build) | — | Idem |

---

## Frontend (merchant-portal)

**Ficheiros de referência:** `merchant-portal/.env.local.example`, `merchant-portal/.env.production.example`

- **Supabase:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Stripe (client):** `VITE_STRIPE_PUBLISHABLE_KEY`
- **API base:** `VITE_API_BASE` (em prod = URL das Edge Functions)
- **Internal:** `VITE_INTERNAL_API_TOKEN`
- **Sentry:** `VITE_SENTRY_DSN`, `VITE_SENTRY_AUTH_TOKEN` (só build), `VITE_SENTRY_ORG`, `VITE_SENTRY_PROJECT`
- **Core (legado local):** `VITE_CORE_URL`, `VITE_CORE_ANON_KEY` — só dev com Docker Core

**Nunca no frontend:** `STRIPE_SECRET_KEY`, `SUMUP_*` secrets, webhook secrets.

---

## Edge (Supabase Edge Functions)

**Fonte:** Secrets do projeto Supabase (Dashboard → Settings → Edge Functions → Secrets)

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `SUMUP_*` conforme integração
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (ou anon conforme RLS)
- `INTERNAL_API_TOKEN` (mesmo valor que `VITE_INTERNAL_API_TOKEN` do client)

---

## Eliminar / consolidar

- **Render / integration-gateway:** Todas as variáveis que hoje vivem em `integration-gateway/.env.example` passam para Edge + esta matriz.
- **Duplicação:** Não manter `.env.example` com nomes diferentes para o mesmo conceito (ex.: `STRIPE_API_KEY` vs `STRIPE_SECRET_KEY` → usar sempre `STRIPE_SECRET_KEY`).
