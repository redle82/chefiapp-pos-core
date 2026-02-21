# Render — Sincronização GitHub e deploy

**Propósito:** Ligar o repositório GitHub ao Render para deploy automático e gestão via MCP.  
**Referência:** [Blueprint Spec](https://render.com/docs/blueprint-spec) · [Monorepo](https://render.com/docs/monorepo-support) · [Render MCP Server](https://render.com/docs/mcp-server)

---

## Implementado no repo

| Item | Ficheiro / local |
|------|-------------------|
| Blueprint Render | `render.yaml` (raiz) — **dois serviços:** backend + merchant-portal |
| Backend (API Node) | `chefiapp-backend` — Docker, `server/integration-gateway.ts` |
| Frontend (SPA) | `chefiapp-merchant-portal` — static site, `merchant-portal/dist` |
| Node 20 (raiz) | `.node-version` (raiz) |
| Node 20 (portal) | `merchant-portal/.node-version` |
| MCP Cursor | `.cursor/mcp.json` (servidor `render`) |
| Doc deploy | `docs/ops/RENDER.md`, referência em `DEPLOYMENT.md` |

Após push para o GitHub, ligar o repo ao Render via Blueprint e configurar env vars no Dashboard.

---

## 0. Configurar Render (integration-gateway) — agora

**Serviço no Render:** ChefIApp-POS-CORE (integration-gateway).  
**Local:** continuas a usar Docker + Supabase (docker-core) para desenvolvimento.  
**Produção:** Supabase na nuvem fica para o final; quando estiveres pronto, alteras no Render só `CORE_URL` e `CORE_SERVICE_KEY`.

### Variáveis no Dashboard (Environment)

No Render → teu serviço **ChefIApp-POS-CORE** → **Environment** → **Add Environment Variable**.

| Variável | Obrigatório | Valor agora (Render) | Valor local (Docker) | Valor produção (final) |
|----------|-------------|----------------------|----------------------|-------------------------|
| `PORT` | — | Render injeta automaticamente | 4320 | — |
| `CORE_URL` | Sim (para API v1 e internos) | URL do Core acessível da internet. Por agora podes usar um projeto Supabase de staging ou deixar; sem isto, `/api/v1/*` e webhooks não funcionam. | `http://localhost:3001` (ou host do PostgREST) | `https://<TEU_PROJETO>.supabase.co` (sem `/rest/v1`) |
| `CORE_SERVICE_KEY` ou `CORE_ANON_KEY` | Sim (com CORE_URL) | Service role key ou anon key do Supabase/Core | A mesma que usas no docker-core / Supabase local | Service role do projeto Supabase produção |
| `INTERNAL_API_TOKEN` | Sim | Token forte (ex.: `openssl rand -hex 32`) para `POST /internal/events`, `POST /internal/product-images` e `POST /internal/billing/create-checkout-session` | Ex.: `chefiapp-internal-token-dev` em local | Token forte único em produção |
| `STRIPE_SECRET_KEY` | Para checkout | Chave secreta Stripe (sk_test_ ou sk_live_). Sem ela, o checkout de assinatura devolve 503. | sk_test_... em local | sk_live_... em produção |

**Opcionais (imagens de produtos e WhatsApp):**

| Variável | Quando usar |
|----------|-------------|
| `MINIO_ENDPOINT` | S3/MinIO para upload de imagens (POST /internal/product-images). Local: `http://localhost:9000`. Produção: URL do bucket. |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | Credenciais do MinIO/S3. |
| `MINIO_BUCKET` | Nome do bucket (default: `chefiapp-products`). |
| `MINIO_PUBLIC_BASE` | URL pública para links das imagens (se diferente do endpoint). |
| `WHATSAPP_APP_SECRET` | Só se usares webhook WhatsApp; validação da assinatura Meta. |

### Resumo

1. **Agora:** No Render, define pelo menos `INTERNAL_API_TOKEN` (valor seguro). Se tiveres um Supabase de staging já na nuvem, define também `CORE_URL` e `CORE_SERVICE_KEY`; senão o gateway fica no ar mas chamadas ao Core falham até configurares.
2. **Local:** Segue a usar `docker-core`; no teu `.env` ou docker-compose usas `CORE_URL=http://localhost:3001` e a key do Core local.
3. **Para o final:** Criar (ou usar) projeto Supabase produção → aplicar migrations → no Render, atualizar `CORE_URL` e `CORE_SERVICE_KEY` para esse projeto.

---

## 1. Visão geral

| Item | Descrição |
|------|-----------|
| **Blueprint** | `render.yaml` na raiz do repo define o serviço **chefiapp-merchant-portal** (static site). |
| **Sincronização** | Ao ligar o repo ao Render, cada push na branch configurada (ex.: `main`) dispara build e deploy automático. |
| **MCP** | Cursor/Claude podem gerir workspaces, serviços, logs e métricas via [Render MCP Server](https://mcp.render.com/mcp). Config em `.cursor/mcp.json`. |

---

## 2. Ligar o GitHub ao Render

1. **Render Dashboard** → [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
2. **Connect account** → escolher **GitHub** e autorizar o repositório `chefiapp-pos-core` (ou o teu fork).
3. Render detecta o `render.yaml` e mostra o serviço **chefiapp-merchant-portal**.
4. **Create Web Service** (ou equivalente para Blueprint).
5. Configurar **Environment Variables** no Dashboard para as chaves marcadas com `sync: false` no Blueprint:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE`
   - `VITE_STRIPE_PUBLIC_KEY` (se aplicável)

A partir daí, **cada push na branch `main`** (ou a que definires no serviço) gera um novo deploy.

---

## 3. Estrutura do `render.yaml` (implementado)

### 3.1 Backend — `chefiapp-backend`

- **Tipo:** web service (`runtime: docker`)
- **Imagem:** construída a partir do `Dockerfile` na raiz (contexto `.`).
- **Entrypoint:** `node dist/server/integration-gateway.js` — API pública (`/api/v1/*`), eventos internos (`POST /internal/events`), upload de imagens, health (`GET /health`).
- **Porta:** Render injeta `PORT`; a aplicação usa `PORT` ou 4320.
- **buildFilter:** alterações em `server/**`, `core-engine/**`, `fiscal-modules/**`, `types/**`, `migrations/**`, `package.json`, `package-lock.json`, `tsconfig.server.json`, `Dockerfile` disparam deploy.
- **Variáveis de ambiente (configurar no Dashboard):**
  - `CORE_URL` — URL do Core (PostgREST), ex.: `https://api.chefiapp.com` ou URL de um Render Postgres + PostgREST.
  - `CORE_SERVICE_KEY` ou `CORE_ANON_KEY` — chave de serviço/anónima do Core.
  - `INTERNAL_API_TOKEN` — token para `POST /internal/events` (ex.: webhooks Stripe → eventos ChefIApp).

O **Core** (Postgres + PostgREST) pode ficar noutro host (ex.: Render Postgres + serviço PostgREST em Docker, ou Supabase). O backend `chefiapp-backend` apenas chama o Core via HTTP; não inclui a base de dados.

**Se o deploy falhar com** `Cannot find module '/app/dist/_legacy_isolation/server/webhook-server.js'`: o serviço está a usar um comando de arranque antigo. No **Render Dashboard** → **chefiapp-backend** → **Settings** → **Start Command**, define exatamente: `node dist/server/integration-gateway.js` (ou apaga o valor para usar o CMD do Dockerfile). Guarda e faz **Manual Deploy** para re-deployar.

### 3.2 Frontend — `chefiapp-merchant-portal`

- **Serviço:** `chefiapp-merchant-portal`
- **Tipo:** static site (`runtime: static`)
- **Runtime:** Node.js 20 — versão definida por `NODE_VERSION` no Blueprint e por `.node-version` na raiz do repo. Ver [Render — Set your language version](https://render.com/docs/languages#set-your-language-version).
- **Monorepo:** build na **raiz do repo** (sem `rootDir`) para resolver o workspace `@chefiapp/core-design-system`. Comando: `corepack enable && pnpm install && pnpm --filter merchant-portal run build`.
- **buildFilter:** só alterações em `merchant-portal/**` e `core-design-system/**` disparam deploy; ficheiros `*.md` e dotfiles são ignorados.
- **Output:** `merchant-portal/dist` (path relativo à raiz do repo).
- **SPA:** regra de rewrite `/*` → `/index.html` para rotas client-side.

**Ficheiros no repo que suportam o deploy:**
- Raiz: `render.yaml`, `.node-version`, `Dockerfile`
- `merchant-portal/.node-version` (para dev local e consistência)

---

## 4. MCP — Gestão a partir do Cursor

Com o [Render MCP Server](https://render.com/docs/mcp-server) configurado em `.cursor/mcp.json` (e API key definida):

1. **Definir workspace:** *"Set my Render workspace to [NOME_DO_WORKSPACE]"*
2. **Listar serviços:** *"List my Render services"*
3. **Logs:** *"Pull the most recent error-level logs for chefiapp-merchant-portal"*
4. **Métricas:** *"What was the busiest traffic day for my service this month?"*
5. **Variáveis:** o MCP permite atualizar environment variables do serviço (única operação destrutiva suportada).

A API key do Render obtém-se em [Account Settings → API Keys](https://dashboard.render.com/settings#api-keys).

---

## 5. Sincronização total GitHub ↔ Render

| Ação | Onde | Resultado |
|------|------|-----------|
| Push para `main` | GitHub | Render faz build + deploy dos serviços com alterações (buildFilter por serviço). |
| Alterar `render.yaml` | GitHub | No Dashboard: **Blueprint** → **Apply** ou criar/atualizar serviços conforme o YAML. |
| Alterar env vars | Render Dashboard ou MCP | Só no Render; não altera o repo. Para “single source of truth” no repo, documentar em `DEPLOYMENT.md` ou `docs/ops/` e usar MCP/Dashboard para valores reais. |

Não é necessário um workflow de GitHub Actions para “avisar” o Render: a ligação GitHub → Render (via Dashboard) já dispara o deploy em cada push na branch configurada.

---

## 6. Referências

- [Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Monorepo Support](https://render.com/docs/monorepo-support)
- [Render MCP Server](https://render.com/docs/mcp-server) e [repo](https://github.com/render-oss/render-mcp-server)
- [DEPLOYMENT.md](./DEPLOYMENT.md) — visão geral de deploy (Vercel, Docker, etc.)
