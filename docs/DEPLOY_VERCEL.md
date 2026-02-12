# Deploy Vercel — chefiapp-pos-core

**Projeto:** `chefiapp-pos-core` (ID: `prj_hQ4hyfAM1KRC3u4FM9ZAZZ4QQWYM`)

Configuração para o Build and Deployment na Vercel servir o merchant-portal (SPA) na raiz do domínio.

---

## Build and Deployment (Settings)

| Campo                | Valor           | Override          |
| -------------------- | --------------- | ----------------- |
| **Root Directory**   | _(vazio)_       | —                 |
| **Build Command**    | `npm run build` | ✅ On             |
| **Output Directory** | `public/app`    | ✅ On             |
| **Install Command**  | `npm install`   | Off (default)     |
| **Node.js Version**  | 24.x (ou 20.x)  | Conforme desejado |

---

## O que o build faz

1. `npm run build` (na raiz do repo) executa:
   - `build:core` (TypeScript core)
   - `npm -w merchant-portal run build` (Vite → `merchant-portal/dist`)
   - `export:portal` (copia `merchant-portal/dist` → `public/app`)
2. A Vercel serve o conteúdo de **`public/app`** como raiz do site.
3. O `vercel.json` na raiz aplica rewrites: todas as rotas → `/index.html` (SPA).

---

## Variáveis de ambiente (produção)

Definir em **Settings → Environment Variables** para **Production** (e Preview se usares).

### Comportamento conforme variáveis

- **Sem** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`: apenas a **landing** (`/`) e o **trial** (`/op/tpv?mode=trial`) funcionam; `/auth` e rotas de app mostram a mensagem "Backend não configurado" (sem crash).
- **Com** estas variáveis definidas (Supabase cloud ou Core em produção): fluxo completo (auth, app, billing) funciona.

### Para auth, app e primeiro cliente (obrigatórias)

| Variável                 | Valor                               | Onde obter                                                |
| ------------------------ | ----------------------------------- | --------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | `https://<teu-projeto>.supabase.co` | Supabase Dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (chave longa)              | Supabase Dashboard → Project Settings → API → anon public |

### Opcionais (billing)

| Variável                                                  | Valor                           |
| --------------------------------------------------------- | ------------------------------- |
| `VITE_STRIPE_PRICE_ID`                                    | Price ID do plano (ex. €79/mês) |
| `VITE_STRIPE_PUBLISHABLE_KEY` ou `VITE_STRIPE_PUBLIC_KEY` | Chave pública Stripe            |

---

## Domínio

Após o deploy, em **Settings → Domains** adicionar o domínio real (ex. `app.chefiapp.pt`).
HTTPS é gerido pela Vercel.

---

## Checklist pós-deploy

1. Abrir `https://<teu-dominio>/` → landing (TPV trial + overlay).
2. Clicar "Começar agora" → `/auth`.
3. Abrir `https://<teu-dominio>/app/billing` → preço e botão "Ativar agora" (se env vars definidas).

Refs: [VALIDACAO_DOMINIO_PRODUCAO.md](VALIDACAO_DOMINIO_PRODUCAO.md) · [VALIDACAO_ONBOARDING_PRIMEIRO_CLIENTE.md](VALIDACAO_ONBOARDING_PRIMEIRO_CLIENTE.md)
