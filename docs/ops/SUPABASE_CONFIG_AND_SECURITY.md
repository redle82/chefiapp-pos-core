# Supabase — Verificação de configuração e segurança

Estado da configuração e da segurança quando o backend é Supabase (PostgREST + Auth).  
**Conclusão:** Supabase **não** está 100% configurado para produção até a anon key real estar definida e as migrações aplicadas no projeto live.

---

## 1. Configuração (env)

### 1.1 Variáveis usadas pelo merchant-portal

O portal usa um único par de variáveis para o backend PostgREST:

| Variável canónica | Fallback (Supabase) | Uso |
|-------------------|---------------------|-----|
| `VITE_CORE_URL` | `VITE_SUPABASE_URL` | URL base do backend (Docker Core ou Supabase project URL) |
| `VITE_CORE_ANON_KEY` | `VITE_SUPABASE_ANON_KEY` | Chave anónima (JWT) para PostgREST |

- **Local (Docker Core):** `VITE_CORE_URL=http://localhost:3001`, `VITE_CORE_ANON_KEY=chefiapp-core-secret-key-min-32-chars-long`.
- **Produção com Supabase:** Definir `VITE_CORE_URL` = `https://<project-ref>.supabase.co` (ou usar só `VITE_SUPABASE_URL`) e `VITE_CORE_ANON_KEY` = anon key do Dashboard (ou usar `VITE_SUPABASE_ANON_KEY`). O client acrescenta `/rest/v1` automaticamente.

### 1.2 Estado atual em produção

- **`.env.production`** contém:
  - `VITE_SUPABASE_URL=https://kwgsmbrxfcezuvkwgvuf.supabase.co` ✅
  - `VITE_SUPABASE_ANON_KEY=your-production-anon-key-here` ❌ **placeholder**

Enquanto a anon key for placeholder, o Supabase **não** está 100% configurado para produção. O portal tem fallback para `VITE_SUPABASE_*` quando `VITE_CORE_*` não estão definidos, portanto basta substituir `your-production-anon-key-here` pela anon key real (Supabase Dashboard → Project Settings → API → `anon` `public`) nas variáveis de deploy (Vercel/outro) ou em `.env.production` (nunca commitar a chave real).

### 1.3 Checklist de configuração 100%

- [ ] Anon key real definida em produção (`VITE_CORE_ANON_KEY` ou `VITE_SUPABASE_ANON_KEY`) — **obrigatório**
- [ ] URL do projeto definida (`VITE_CORE_URL` ou `VITE_SUPABASE_URL`) — já existe em .env.production
- [ ] Migrações aplicadas no projeto Supabase live (ver `docs/ops/SUPABASE_EXCELLENCE.md` e `scripts/apply-migrations-supabase.sh`)
- [ ] Auth (Supabase Auth ou Keycloak) alinhado com o JWT que o PostgREST espera (RLS usa `auth.uid()` ou equivalente)

---

## 2. Segurança

### 2.1 Chaves e roles

| Item | Estado |
|------|--------|
| **service_role no frontend** | ✅ Não usado no código do portal (apenas anon) |
| **service_role em scripts** | Apenas em scripts de backend/Deno (ex.: `verify_recipe_deduction.ts`) com variável de ambiente — nunca no bundle do browser |
| **Anon key** | Pública por design; acesso real é limitado por RLS |

### 2.2 RLS e hardening

- **RLS:** Documentado em `docs/RLS_POLICIES.md`; políticas por tabela (gm_restaurants, gm_orders, gm_order_items, gm_payments, gm_restaurant_members) com `has_restaurant_access(restaurant_id)` e `service_role` com bypass apenas para uso server-side.
- **Migração de hardening:** `supabase/migrations/20260222113000_security_hardening.sql`:
  - REVOKE ALL ON TABLES/SEQUENCES/FUNCTIONS FROM PUBLIC
  - ALTER DEFAULT PRIVILEGES para não dar acesso por defeito
  - FORCE ROW LEVEL SECURITY em tabelas com RLS
  - SECURITY DEFINER com `search_path = pg_catalog, public` para evitar search_path hijacking

### 2.3 Auth (Supabase)

- **config.toml:** `enable_anonymous_sign_ins = false`, `enable_signup = true`, `minimum_password_length = 6`.
- **Rate limits** definidos em `[auth.rate_limit]` (emails, SMS, token refresh, sign-in/sign-up, etc.).
- Quando o backend for Supabase, o JWT de sessão (Supabase Auth) deve ser enviado nas chamadas PostgREST para RLS aplicar `auth.uid()` corretamente; confirmar que o client (dockerCoreFetchClient ou equivalente) envia o header `Authorization: Bearer <jwt>` quando há sessão.

### 2.4 Checklist de segurança

- [x] Nenhum uso de service_role no frontend
- [x] RLS documentado e migrações com políticas
- [x] Hardening (REVOKE, FORCE RLS, search_path em SECURITY DEFINER)
- [ ] Anon key real em produção (sem placeholder) — necessário para estar “100% configurado”
- [ ] Confirmar que o JWT de Auth é enviado ao PostgREST em todas as rotas que exigem tenant/restaurant

---

## 3. Quando ativar o Supabase

Conforme `docs/SUPABASE_QUANDO_ATIVAR.md`: ativar **no mesmo dia ou logo após o primeiro pagamento real**. Até lá, usar Docker Core em desenvolvimento e em ambientes de validação.

---

## 4. Resumo

| Área | 100%? | Ação |
|------|--------|------|
| **Env (URL)** | ✅ | URL já definida; fallback VITE_SUPABASE_URL no config |
| **Env (anon key)** | ❌ | Substituir placeholder pela anon key real em produção |
| **Migrações no projeto live** | ⏳ | Aplicar com `scripts/apply-migrations-supabase.sh` quando ativar |
| **Segurança (RLS, hardening, sem service_role no frontend)** | ✅ | Conforme documentação e migrações |
| **Auth ↔ PostgREST (JWT)** | ⏳ | Verificar envio do token nas chamadas quando usar Supabase Auth |

**Conclusão:** Supabase está **seguro** por design (RLS, hardening, sem service_role no frontend) e **parcialmente configurado**: falta definir a anon key real em produção e aplicar migrações no projeto Supabase live para considerar 100% configurado.
