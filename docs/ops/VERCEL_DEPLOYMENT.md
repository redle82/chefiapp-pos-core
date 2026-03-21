# Deploy ChefIApp no Vercel

**Objetivo:** O projeto está configurado para correr plenamente na Vercel como SPA estática. Este doc descreve a configuração e o checklist de variáveis.

---

## Configuração (vercel.json)

- **framework:** `null` — evita auto-detecção; usamos build customizado
- **installCommand:** `corepack enable pnpm && pnpm install`
- **buildCommand:** `pnpm run build`
- **outputDirectory:** `public/app`
- **rewrites:** SPA — todas as rotas não-estáticas → `/index.html`
- **headers:** segurança (X-Content-Type-Options, X-Frame-Options, etc.) + Permissions-Policy para camera/microphone (AppStaff barcode/PWA)

---

## Fluxo de Build

1. `build:core` — tsc (types)
2. `merchant-portal build` — Vite + prebuild (validate:constitution)
3. `export:portal` — copia `merchant-portal/dist` → `public/app`

---

## Variáveis de ambiente obrigatórias (Production / Preview)

| Variável | Descrição | Já configurado? |
|----------|-----------|-----------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Chave anon do Supabase | ✅ |
| `VITE_API_BASE` | URL das Edge Functions (`https://<ref>.supabase.co/functions/v1`) | ✅ |
| `VITE_INTERNAL_API_TOKEN` | Token para chamadas internas (checkout, billing). Deve coincidir com `INTERNAL_API_TOKEN` nas Edge Functions | ⚠️ Adicionar manualmente |

### Como adicionar VITE_INTERNAL_API_TOKEN

```bash
echo "seu-token-seguro-min-32-chars" | bash scripts/vercel-cli.sh env add VITE_INTERNAL_API_TOKEN production
echo "seu-token-seguro-min-32-chars" | bash scripts/vercel-cli.sh env add VITE_INTERNAL_API_TOKEN preview
```

---

## Variáveis opcionais

- `VITE_SENTRY_DSN`, `VITE_SENTRY_AUTH_TOKEN`, `VITE_SENTRY_ORG`, `VITE_SENTRY_PROJECT` — monitorização
- `VITE_STRIPE_PUBLISHABLE_KEY` — checkout Stripe
- `VITE_STRIPE_PUBLIC_KEY` — alias usado em alguns componentes

---

## Backend

O frontend na Vercel é **estático**. O backend corre em:

- **Supabase** — PostgREST, Auth, Edge Functions
- **Edge Functions** — billing, webhooks, pagamentos (SumUp, Stripe, PIX)

Sem `VITE_API_BASE` e `VITE_INTERNAL_API_TOKEN` corretos, o checkout e billing não funcionam; o resto da app (landing, dashboard, TPV sem pagamentos) funciona.

---

## Checklist pré-deploy

- [ ] `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` configurados
- [ ] `VITE_API_BASE` = `https://<project-ref>.supabase.co/functions/v1`
- [ ] `VITE_INTERNAL_API_TOKEN` igual ao configurado nas Edge Functions
- [ ] Redeploy após alterar variáveis (o build injecta VITE_* em tempo de build)
