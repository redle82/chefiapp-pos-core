# Variáveis de produção (Vercel e ambiente)

Passos para configurar o frontend e o backend em produção. **Nunca commitar chaves reais.**

---

## 1. Frontend (Vercel) — merchant-portal

### Variáveis obrigatórias para Supabase como backend

| Variável | Descrição | Onde obter |
|----------|-----------|------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Chave anónima (JWT) | Dashboard → Project Settings → API → `anon` `public` |

**Alternativa (mesmo efeito):** usar `VITE_CORE_URL` = URL do projeto Supabase e `VITE_CORE_ANON_KEY` = anon key. O portal aceita ambos (fallback no `config.ts`).

### Como definir na Vercel

1. Vercel → teu projeto → **Settings** → **Environment Variables**.
2. Adicionar cada variável:
   - **Name:** `VITE_SUPABASE_URL`  
     **Value:** `https://<project-ref>.supabase.co`  
     **Environment:** Production (e Preview se quiseres).
3. Adicionar a anon key como **sensitive**:
   - **Name:** `VITE_SUPABASE_ANON_KEY`  
     **Value:** (colar a anon key do Dashboard Supabase)  
     **Environment:** Production (e Preview se quiseres)  
     Marcar como **Sensitive**.
4. **Redeploy** o projeto para as variáveis serem aplicadas ao build.

### Outras variáveis úteis (opcional)

- `VITE_API_BASE` — URL do integration-gateway (ex.: `https://teu-gateway.onrender.com`) para billing/checkout.
- `VITE_MODE` = `production` para ativar modo produção no frontend.

---

## 2. Integration Gateway (Render ou outro)

Variáveis críticas (ver DEPLOYMENT_RUNBOOK.md §1):

- `CORE_URL` — URL do Core (Supabase: `https://<project-ref>.supabase.co` ou PostgREST).
- `CORE_SERVICE_KEY` — Service role key do Supabase (só no gateway, nunca no frontend).
- `INTERNAL_API_TOKEN` — Token para chamadas `/internal/events`.
- `SUMUP_WEBHOOK_SECRET` — (opcional) para validar webhooks SumUp.
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_*` — Billing.

---

## 3. Migrações Supabase (quando o projeto estiver ativo)

Aplicar todas as migrações do Core ao projeto Supabase:

1. Obter a connection string: Supabase Dashboard → **Project Settings** → **Database** → **Connection string** → **URI**. Substituir `[YOUR-PASSWORD]` pela password da base.
2. Na raiz do repo:
   ```bash
   export DATABASE_URL="postgresql://postgres:PASSWORD@db.XXX.supabase.co:5432/postgres"
   pnpm run supabase:finalize
   ```
   Ou: `./scripts/apply-migrations-supabase.sh`

**Pré-requisito:** `psql` instalado (`brew install libpq` no macOS). Ver `docs/ops/SUPABASE_EXCELLENCE.md` para mais detalhes.

---

## 4. Verificação pós-configuração

- Health Core: `curl -s -o /dev/null -w "%{http_code}" "https://<project-ref>.supabase.co/rest/v1/"`
- Smoke em produção: `bash scripts/smoke-test.sh --prod`
- Teste de integração: `bash scripts/test-integration.sh` (com Core e Gateway no ar)

Ref: **DEPLOYMENT_RUNBOOK.md** §3.
