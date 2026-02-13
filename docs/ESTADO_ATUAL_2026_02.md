# Estado Atual do Projeto — Checkpoint 2026-02

**Data:** 2026-02
**Status:** ✅ **REPOSITÓRIO ALINHADO COM A CARA ATUAL DO PROJETO**

---

## 🎯 Resumo em 30 Segundos

- **Merchant-portal** é a app web única: landing (LandingV2), blog, pricing, changelog, security, status, legal **e** app operacional (TPV, KDS, Staff, Config).
- **Deploy separado:** existe build **só de marketing** (`build:marketing` → `dist-marketing`) para subir na Vercel **apenas** a área de vendas, sem app/config/TPV.
- **Deploy completo:** `npm run build` (raiz) → `public/app` — app inteiro (para outro projeto Vercel ou self-host).
- **Docs de deploy:** [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md) — passo a passo para marketing-only e build completo.
- **MCP Vercel** configurado em `.cursor/mcp.json` para o agente ver logs e deploys na Vercel.

---

## 📁 Estrutura Atual (o que temos no repo)

### Merchant-portal (app web)

| Caminho | O que é |
|--------|--------|
| `src/main_debug.tsx` | Entry point **completo** (app + marketing + auth + runtime) |
| `src/main-marketing.tsx` | Entry point **só marketing** (landing, blog, pricing, changelog, security, status, legal) |
| `index.html` | HTML do build completo (Buffer polyfill, PWA, etc.) |
| `index-marketing.html` | HTML mínimo do build só marketing |
| `vite.config.ts` | Build completo → `dist/` |
| `vite.config.marketing.ts` | Build só marketing → `dist-marketing/` |
| `vercel.json` | Rewrites SPA para deploy (aponta para `index-marketing.html` quando se usa `dist-marketing`) |
| `package.json` | `build` = build completo; `build:marketing` = build só marketing |

### Rotas de marketing (incluídas em ambos os builds)

- `/` — LandingV2
- `/v2`, `/landing-v2` — Mesma landing
- `/pricing`, `/features` — Preços e funcionalidades
- `/blog`, `/blog/tpv-restaurantes`, `/blog/tpv-vs-pos-fiscal`, `/blog/quando-abrir-fechar-caixa` — Blog SEO
- `/changelog`, `/security`, `/status` — Institucionais
- `/legal/terms`, `/legal/privacy` — Legal
- `/app/trial-tpv` — Trial TPV (ProductFirstLanding)

### App operacional (apenas no build completo)

- `/app/staff/*` — App Staff (launcher, operação, TPV, KDS, etc.)
- `/op/tpv`, `/op/kds` — TPV e KDS
- `/config/*` — Configuração
- `/auth/*`, `/bootstrap` — Auth e bootstrap

---

## 🚀 Deploy na Vercel (dois cenários)

### 1. Só marketing (landing + blog + pricing — site público)

- **Root Directory:** `merchant-portal`
- **Build Command:** `npm run build:marketing`
- **Output Directory:** `dist-marketing`
- **Resultado:** Site só com as rotas de marketing; sem app, config, TPV, auth.
- **Doc:** [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md) — secção "Deploy SOMENTE marketing".

### 2. Build completo (app + marketing)

- **Root Directory:** _(vazio — raiz do repo)_
- **Build Command:** `npm run build`
- **Output Directory:** `public/app`
- **Resultado:** App completo (marketing + operacional); requer variáveis de ambiente para auth/backend se quiseres usar o app.
- **Doc:** [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md) — secção "O que fazer para o site ChefIApp (build completo)".

---

## 📚 Documentação Essencial

| O que | Onde |
|-------|------|
| Estado atual (este doc) | [ESTADO_ATUAL_2026_02.md](ESTADO_ATUAL_2026_02.md) |
| Onde estamos agora (resumo) | [ONDE_ESTAMOS_AGORA.md](ONDE_ESTAMOS_AGORA.md) |
| Deploy Vercel (marketing + completo) | [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md) |
| Índice da documentação | [DOC_INDEX.md](DOC_INDEX.md) |
| README do projeto | [../README.md](../README.md) |

---

## ✅ O Que Foi Consolidado Nesta Atualização

- Build e deploy **só de marketing** (main-marketing, index-marketing, vite.config.marketing, build:marketing).
- Docs de deploy atualizados (DEPLOY_VERCEL.md) com passos para marketing-only e completo.
- Estrutura do merchant-portal documentada (dois entry points, dois outputs).
- MCP Vercel e regra Cursor para uso do agente com a Vercel.
- Repositório reflete a **cara atual do projeto**: marketing separável para site público; app completo disponível para outro deploy ou self-host.

---

**Última atualização:** 2026-02
**Próximo push:** deixa o repositório com esta cara consolidada.
