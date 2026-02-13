# Deploy Vercel — chefiapp-pos-core (Produto / merchant-portal)

**Projeto:** `chefiapp-pos-core` (ID: `prj_hQ4hyfAM1KRC3u4FM9ZAZZ4QQWYM`)

Configuração para o Build and Deployment na Vercel servir o **merchant-portal** (SPA) na raiz do domínio — domínio típico: **app.chefiapp.com**. **Todo o marketing** está no mesmo build: raiz `/` = LandingV2 (narrativa), blog, pricing, changelog, security, status, legal. Contrato canónico: [strategy/LANDING_CANON.md](strategy/LANDING_CANON.md).

---

## Deploy SOMENTE marketing (landing, blog, pricing — sem app/config/TPV)

Para subir **apenas** a área de marketing/vendas (LandingV2, blog, pricing, changelog, security, status, legal) **sem** o aplicativo, config, TPV ou auth:

1. **Criar um projeto na Vercel** (ou usar um existente só para marketing).
2. **Ligar o mesmo repositório** `chefiapp-pos-core`.
3. **Configurar assim:**
   - **Root Directory:** `merchant-portal`
   - **Build Command:** `npm run build:marketing`
   - **Output Directory:** `dist-marketing`
   - **Install Command:** `npm install` (default).
4. **Deploy:** push para a branch ligada; a Vercel faz deploy automático.

O build `build:marketing` usa **apenas** `index-marketing.html` e `main-marketing.tsx`: só as rotas de marketing. Não inclui app, config, TPV, auth, runtime. O `vercel.json` dentro de `merchant-portal` aplica rewrites SPA (todas as rotas → `/index.html`).

Rotas disponíveis nesse deploy: `/`, `/v2`, `/landing-v2`, `/pricing`, `/features`, `/blog`, `/blog/*`, `/changelog`, `/security`, `/status`, `/legal/terms`, `/legal/privacy`, `/app/trial-tpv`.

---

## O que fazer para o site ChefIApp (build completo) estar online na Vercel

1. **Ter o código no GitHub** (ou GitLab/Bitbucket) e uma **conta na [Vercel](https://vercel.com)**.

2. **Ligar o repositório à Vercel**
   - Em [vercel.com/new](https://vercel.com/new), clica **Import Git Repository** e escolhe o repo `chefiapp-pos-core` (ou faz **Import** do projeto existente com ID `prj_hQ4hyfAM1KRC3u4FM9ZAZZ4QQWYM` se já existir).
   - Se o projeto já foi criado antes, em **Dashboard → teu projeto → Settings → Git** confirma que o repo está ligado.

3. **Configurar o build** (Settings → General ou no primeiro import):
   - **Root Directory:** deixar vazio (raiz do repo).
   - **Build Command:** `npm run build`
   - **Output Directory:** `public/app`
   - **Install Command:** `npm install` (ou deixar default).
   - **Node.js Version:** 20.x ou 24.x (em Settings → General).

4. **Fazer deploy**
   - **Se ligaste o Git:** faz push para a branch ligada (ex. `main`); a Vercel faz deploy automático.
   - **Sem Git (só CLI):** na raiz do projeto corre `npx vercel` (login se pedido) e depois `npx vercel --prod` para produção.

5. **Ver o site**
   - Após o deploy, a Vercel mostra um URL tipo `https://chefiapp-pos-core-xxx.vercel.app`. Abre esse URL no browser: a **landing de marketing** (LandingV2) aparece na raiz `/`.
   - Para usar um domínio teu (ex. `app.chefiapp.pt`): **Settings → Domains** → Add e segue as instruções (DNS). HTTPS é gerido pela Vercel.

6. **Variáveis de ambiente (opcional para só marketing)**
   - Para **só a landing e o blog** aparecerem, não precisas de variáveis: o site funciona sem backend.
   - Para **auth, app e billing**, em **Settings → Environment Variables** define `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (e Stripe se usares billing). Ver tabela abaixo.

Resumo: **repo no Git → importar na Vercel → Build Command `npm run build`, Output `public/app` → deploy → abrir o URL. A página web do ChefIApp fica online.**

---

## Vercel MCP (agente no Cursor)

O projeto tem o **MCP oficial da Vercel** configurado em `.cursor/mcp.json` (`https://mcp.vercel.com`). Com isso, o agente no Cursor pode:

- **Ver logs de build** quando um deploy falha (`get_deployment_build_logs`)
- **Listar e inspecionar deploys** (`list_deployments`, `get_deployment`)
- **Pesquisar a documentação** da Vercel (`search_documentation`)
- **Fazer deploy** (`deploy_to_vercel`) ou obter links de acesso a previews protegidos

**Primeira utilização:** Recarrega a janela do Cursor (ou reinicia). Ao usar ferramentas Vercel, aparece "Needs login" — clica e autoriza com OAuth na Vercel. Depois disso o agente pode usar as ferramentas acima para diagnosticar falhas de build e deploys.

---

## Rotas de marketing (na Vercel)

| Rota | Conteúdo |
|------|----------|
| `/` | Landing de marketing (LandingV2) |
| `/v2`, `/landing-v2` | Mesma landing (LandingV2) |
| `/pricing` | Preços |
| `/blog`, `/blog/tpv-restaurantes`, `/blog/tpv-vs-pos-fiscal`, `/blog/quando-abrir-fechar-caixa` | Blog SEO |
| `/changelog`, `/security`, `/status` | Páginas institucionais |
| `/legal/terms`, `/legal/privacy` | Legal |
| `/app/trial-tpv` | Trial TPV (ProductFirstLanding) |

---

## Build and Deployment (Settings)

| Campo                | Valor           | Override          |
| -------------------- | --------------- | ----------------- |
| **Root Directory**   | _(vazio)_       | —                 |
| **Build Command**    | `npm run build` | ✅ On             |
| **Output Directory** | `public/app`    | ✅ On             |
| **Install Command**  | `npm install`   | Off (default)     |
| **Node.js Version**  | 24.x (ou 20.x)  | Conforme desejado |

**Se usares Root Directory = merchant-portal:** o build corre só dentro de `merchant-portal` e o output é `dist`. O `merchant-portal/vercel.json` define `outputDirectory: "dist"`; nas definições do projeto na Vercel não uses Output Directory = `app` (causa o erro "No Output Directory named 'app' found") — usa `dist` ou deixa o `vercel.json` prevalecer.

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

1. Abrir `https://<teu-dominio>/` → landing de marketing (LandingV2).
2. Abrir `https://<teu-dominio>/blog` → blog.
3. Clicar "Começar agora" (ou equivalente) → `/auth`.
4. Abrir `https://<teu-dominio>/app/billing` → preço e botão "Ativar agora" (se env vars definidas).

Refs: [VALIDACAO_DOMINIO_PRODUCAO.md](VALIDACAO_DOMINIO_PRODUCAO.md) · [VALIDACAO_ONBOARDING_PRIMEIRO_CLIENTE.md](VALIDACAO_ONBOARDING_PRIMEIRO_CLIENTE.md)
