# Variáveis de ambiente — Vercel (merchant-portal)

**Propósito:** Lista exata das variáveis que o projeto **chefiapp-pos-core** (www.chefiapp.com) precisa na Vercel para o build e runtime não falharem.

**Build no monorepo:** O build na Vercel usa a raiz do repo; em `vercel.json` estão `installCommand` (corepack + pnpm) e `buildCommand` (pnpm run build). O ficheiro **`.npmrc`** na raiz com `node-linker=hoisted` evita falhas de symlinks do pnpm no ambiente Vercel.

O `config.ts` do merchant-portal exige estas variáveis ao arranque. Sem elas aparecem:

- `❌ CRITICAL: Missing or invalid VITE_CORE_URL`
- `❌ CRITICAL: Missing VITE_CORE_ANON_KEY`
- e o erro `Cannot access 'jt' before initialization` (consequência do crash do config).

---

## Obrigatórias (Settings → Environment Variables)

No projeto **chefiapp-pos-core** na Vercel, adiciona:

| Nome | Valor (exemplo) | Notas |
|------|------------------|--------|
| `VITE_MODE` | `production` ou `trial` | `production` = modo operacional; `trial` = landing/demo sem Core obrigatório |
| `VITE_CORE_URL` | URL do Core (PostgREST) | Local: `http://localhost:3001`. Produção: `https://<TEU_PROJETO>.supabase.co` (sem `/rest/v1`) |
| `VITE_CORE_ANON_KEY` | Chave anónima do Core | Supabase: Project Settings → API → anon public |
| `VITE_API_BASE` | URL do integration-gateway | Produção: `https://chefiapp-pos-core-6qmv.onrender.com` (ou `https://api.chefiapp.com` quando tiveres domínio) |

---

## Onde obter os valores

- **VITE_CORE_URL** e **VITE_CORE_ANON_KEY:** projeto Supabase (local = docker-core com a mesma key que usas em `.env.local`; produção = projeto Supabase na nuvem). Enquanto não tiveres Supabase produção, podes criar um projeto gratuito em [supabase.com](https://supabase.com) só para staging e usar esse URL + anon key.
- **VITE_API_BASE:** backend no Render — `https://chefiapp-pos-core-6qmv.onrender.com`.

---

## Depois de adicionar

1. Guardar as variáveis na Vercel (todas para **Production** e, se quiseres, para Preview).
2. **Redeploy:** Deployments → ⋮ no último deploy → **Redeploy** (ou fazer um novo push). As variáveis `VITE_*` são injetadas em **build time**; um redeploy é necessário para entrarem no bundle.
3. Abrir www.chefiapp.com e confirmar que os erros de CRITICAL e o `Cannot access 'jt'` desapareceram.

---

## Opcionais (Stripe, etc.)

Se usares billing/Stripe no portal:

- `VITE_STRIPE_PUBLIC_KEY` ou `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_PRICE_ID` (se aplicável)

Outras variáveis opcionais estão em `merchant-portal/src/config.ts` e em `docs/ops/DEPLOYMENT.md`.

---

## Subir tudo (deploy)

1. **Git:** Commit e push para `main` — a integração GitHub → Vercel dispara o deploy automaticamente (projeto **chefiapp-pos-core**).
2. **CLI:** Na raiz do repo, `npx vercel --prod` (com projeto ligado via `.vercel`).
3. **MCP Vercel (Cursor):** Usar as ferramentas MCP para listar projetos, ver deployments e logs de build (`list_projects`, `list_deployments`, `get_deployment_build_logs`). O deploy em si é acionado por push ou por `vercel deploy`.
