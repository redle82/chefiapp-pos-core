# Variáveis de ambiente — Vercel (merchant-portal)

**Propósito:** Lista exata das variáveis que o projeto **chefiapp-pos-core** (www.chefiapp.com) precisa na Vercel para o build e runtime não falharem.

---

## Arquitetura de Deploy (Consolidada)

O ChefIApp usa **um único projeto na Vercel** para o frontend:

```
chefiapp-pos-core (monorepo)
├── merchant-portal/     → Vercel (chefiapp-pos-core) → www.chefiapp.com
├── integration-gateway/ → Render → https://chefiapp-pos-core-6qmv.onrender.com
├── mobile-app/          → Expo/App Store (não Vercel)
└── core-design-system/  → Pacote interno (não deployado)
```

### Projeto Vercel Único

| Projeto | ID | Domínios |
|---------|-----|----------|
| **chefiapp-pos-core** | `prj_hQ4hyfAM1KRC3u4FM9ZAZZ4QQWYM` | `chefiapp-pos-core-goldmonkeys-projects.vercel.app`, `www.chefiapp.com` (a configurar) |

**Nota:** Projetos obsoletos (`merchant-portal`, `integration-gateway`) devem ser eliminados da Vercel — o merchant-portal já é deployado via `chefiapp-pos-core`, e o gateway deve estar no Render.

---

## Build no Monorepo

O build na Vercel usa a raiz do repo; em `vercel.json` estão `installCommand` (corepack + pnpm) e `buildCommand` (pnpm run build). O ficheiro **`.npmrc`** na raiz com `node-linker=hoisted` evita falhas de symlinks do pnpm no ambiente Vercel.

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
| `VITE_INTERNAL_API_TOKEN` | Token para chamadas internas ao gateway | Deve coincidir com `INTERNAL_API_TOKEN` no Render. Local: `chefiapp-internal-token-dev`. Usado para checkout (POST /internal/billing/create-checkout-session). |

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

## Stripe — Billing ChefIApp (chaves de teste)

Para ativar a billing com Stripe no portal (checkout, assinaturas, TPV com cartão):

### No projeto Vercel (chefiapp-pos-core) — apenas chave pública

| Nome | Valor | Notas |
|------|--------|--------|
| `VITE_STRIPE_PUBLIC_KEY` | `pk_test_51SgVOwEOB1Od9eibf8oYe7VQ6BIuf5ROPuhi56cR3C0cWxg5WqxXd3uFdNhh0ZsNMxUnqp8eKgcHPRIyjqjVvLKu00Tr53iHcs` | Chave de teste (publishable); segura no frontend. |
| `VITE_STRIPE_PRICE_ID` | (opcional) | ID do preço do plano em Stripe (ex.: `price_xxx`) para a página de assinatura. |

### ⚠️ Chave secreta (sk_test_*) — NUNCA no frontend nem no repositório

A **secret key** (`sk_test_...`) deve ser configurada **apenas no backend** (variáveis de ambiente do Render, Supabase Edge Functions ou Core), para:

- Criar sessões de Checkout / Payment Intents
- Receber e validar webhooks do Stripe

No **Render** (ChefIApp-POS-CORE), se o integration-gateway ou outro serviço criar sessões Stripe, adiciona aí uma variável tipo `STRIPE_SECRET_KEY` com o valor da sk_test_. Não a coloques em ficheiros do repo nem em env vars do frontend (Vercel) que comecem por `VITE_`.

---

## Outras opcionais

Outras variáveis opcionais estão em `merchant-portal/src/config.ts` e em `docs/ops/DEPLOYMENT.md`.

---

## Subir tudo (deploy)

1. **Git:** Commit e push para `main` — a integração GitHub → Vercel dispara o deploy automaticamente (projeto **chefiapp-pos-core**).
2. **CLI:** Na raiz do repo, `npx vercel --prod` (com projeto ligado via `.vercel`).
3. **MCP Vercel (Cursor):** Usar as ferramentas MCP para listar projetos, ver deployments e logs de build (`list_projects`, `list_deployments`, `get_deployment_build_logs`). O deploy em si é acionado por push ou por `vercel deploy`.

---

## Configurar Domínio Customizado (www.chefiapp.com)

Para apontar o domínio `www.chefiapp.com` para o projeto:

1. **Vercel Dashboard:** Settings → Domains → Add Domain
2. Adicionar `chefiapp.com` e `www.chefiapp.com`
3. Configurar DNS no registrador:
   - `A` record: `76.76.21.21` (Vercel)
   - `CNAME` para `www`: `cname.vercel-dns.com`
4. Aguardar propagação DNS (até 48h, normalmente minutos)

---

## Limpeza de Projetos Obsoletos

Se existirem projetos duplicados na Vercel (ex.: `merchant-portal`, `integration-gateway`), eliminar:

1. **Vercel Dashboard:** Selecionar projeto obsoleto
2. **Settings → General → Delete Project**
3. Confirmar eliminação

**Projetos a manter:** Apenas `chefiapp-pos-core`.

---

## Troubleshooting

### Erro: ENOENT symlinks pnpm

```
ENOENT: no such file or directory, mkdir '/vercel/path0/merchant-portal/node_modules/@capacitor'
```

**Causa:** pnpm usa symlinks por defeito, incompatível com Vercel.

**Solução:** Garantir que `.npmrc` na raiz tem:
```
node-linker=hoisted
```

### Erro: Cannot access 'X' before initialization

**Causa:** Variáveis de ambiente em falta ou config.ts com referência circular.

**Solução:** Verificar que todas as variáveis `VITE_*` estão definidas na Vercel e fazer redeploy.
