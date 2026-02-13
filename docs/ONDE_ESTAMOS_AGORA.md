# Onde Estamos Agora — ChefIApp

**Data:** 2026-02
**Status:** ✅ **REPOSITÓRIO ALINHADO COM A CARA ATUAL DO PROJETO**

> **Estado detalhado:** Ver **[ESTADO_ATUAL_2026_02.md](ESTADO_ATUAL_2026_02.md)** — estrutura, builds (marketing vs completo), deploy Vercel.  
> **Estrutura Enterprise (todas as áreas explícitas):** Ver **[ESTRUTURA_PROJETO_ENTERPRISE.md](ESTRUTURA_PROJETO_ENTERPRISE.md)**.

---

## ⚡ Em 30 Segundos

- **Merchant-portal** = app web única: **marketing** (LandingV2, blog, pricing, changelog, security, status, legal) **+ app operacional** (TPV, KDS, Staff, Config).
- **Deploy só marketing:** Build `build:marketing` → output `dist-marketing` — sobe na Vercel **apenas** a área de vendas (sem app/config/TPV). Ver [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md).
- **Deploy completo:** `npm run build` (raiz) → `public/app` — app inteiro.
- Dashboard em modo venda, LandingV2, testes e documentação organizados. **Billing (webhook → live)** implementado.

---

## 🎯 O Que Mudou Hoje

### Antes

- ❌ Dashboard: "🔒 Módulo não instalado" (bloqueio)
- ❌ Landing: Não existia
- ❌ Narrativa: Técnica demais
- ❌ Testes: Falhando

### Depois

- ✅ Dashboard: "✨ Disponível para ativação" (oportunidade)
- ✅ Landing: Ponto de entrada comercial (`/`)
- ✅ Narrativa: Comercial (sem perder precisão)
- ✅ Testes: Todos passando

---

## 📍 Onde Está Cada Coisa

### Para Visitantes (Marketing)

- **Landing / Marketing:** `http://localhost:5175/` (ou deploy Vercel só marketing)
- **Rotas:** `/`, `/v2`, `/pricing`, `/blog`, `/changelog`, `/security`, `/status`, `/legal/*`, `/app/trial-tpv`
- **Deploy só marketing:** Vercel com Root=`merchant-portal`, Build=`npm run build:marketing`, Output=`dist-marketing` — ver [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md)

### Para Usuários (Produto)

- **App / Dashboard:** `http://localhost:5175/app/staff/home` (e rotas `/config`, `/op/tpv`, etc.)
- **Estado:** Modo venda; app operacional (TPV, KDS, Staff) funcional com Core ligado

### Para Desenvolvedores (Técnico)

- **Estado atual (cara do projeto):** [ESTADO_ATUAL_2026_02.md](ESTADO_ATUAL_2026_02.md)
- **Estrutura Enterprise (todas as áreas):** [ESTRUTURA_PROJETO_ENTERPRISE.md](ESTRUTURA_PROJETO_ENTERPRISE.md)
- **Documentação:** [DOC_INDEX.md](DOC_INDEX.md)
- **Deploy:** [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md)
- **Roadmap:** [ANALISE_ROADMAP.md](ANALISE_ROADMAP.md)

---

## 🚀 Próximos Passos (Prioridade)

### 1. Testar Agora (5 minutos)

- [ ] Acessar `http://localhost:5175/` (Landing)
- [ ] Clicar "Ver Demo" → Validar redirecionamento
- [ ] Acessar `/dashboard` → Validar badges "Disponível para ativação"

### 2. Billing (webhook → live) — ✅ Implementado

**O que está feito**

- Webhook `POST /webhooks/billing` no servidor valida eventos Stripe e, quando `subscription_update.status === 'ACTIVE'`, chama `server/core-client.ts` para atualizar `gm_restaurants.product_mode` para `'live'`.
- Variáveis de ambiente no servidor: `DOCKER_CORE_URL`, `DOCKER_CORE_SERVICE_KEY` (ou `SUPABASE_SERVICE_ROLE_KEY`).
- Contrato: [BILLING_PRODUCT_MODE_CONTRACT.md](BILLING_PRODUCT_MODE_CONTRACT.md).

**Opcional (futuro):** Fluxo redirect + "confirmar assinatura" no merchant-portal após checkout.

### 3. Completar FASE 2 — Onboarding (1-2 semanas)

- [ ] Menu de exemplo ou demo
- [ ] Tutorial de primeira venda
- [ ] Primeira venda em <10 minutos

---

## 📊 Status por Componente

| Componente       | Status        | Próximo Passo                |
| ---------------- | ------------- | ---------------------------- |
| **Landing Page** | ✅ Criada     | Testar e melhorar (opcional) |
| **Dashboard**    | ✅ Modo venda | Validar fluxo                |
| **Testes**       | ✅ Passando   | Manter                       |
| **Documentação** | ✅ Organizada | Manter                       |
| **Billing**      | ✅ Implementado (webhook → live) | Opcional: redirect + confirmar assinatura |
| **Onboarding**   | 🟡 60%        | Completar após Billing       |

---

## 🎯 Critérios de "Pronto para Vender"

### ✅ Já Temos

- Sistema funcional
- Dashboard não assusta
- Landing page criada
- Demo clara
- Narrativa alinhada

### ✅ Billing (webhook → live)

- Webhook server-side implementado; assinatura ACTIVE ativa modo live no Core.

### 🟡 Falta (Importante)

- **Onboarding fluido** (FASE 2 — 1-2 semanas)

---

## 📚 Documentação Essencial

### Para Entender Estado Atual

- `docs/ESTADO_ATUAL_2026_01_28.md` — Checkpoint consolidado
- `docs/TRANSFORMACAO_PRODUTO_COMPLETA.md` — O que foi feito hoje

### Para Entender Próximos Passos

- `docs/ANALISE_ROADMAP.md` — Análise completa do roadmap
- `docs/audit/EXECUTABLE_ROADMAP.md` — Roadmap executável por fases

### Para Navegar Documentação

- `docs/DOC_INDEX.md` — Índice central (ponto de entrada único)

---

## ✅ Conclusão

**Sistema está pronto para demonstração.**

**O que funciona:**

- Landing page recebe visitantes
- Dashboard convida à ativação (não bloqueia)
- Sistema operacional funcional
- Testes garantem qualidade

**O que falta:**

- Onboarding fluido (1-2 semanas) — Importante
- Opcional: fluxo redirect + "confirmar assinatura" pós-checkout

**Recomendação:** Billing (webhook → live) está implementado; próximo foco pode ser onboarding ou operar/vender.

---

**Última atualização:** 2026-02
**Status:** ✅ Repositório com cara atual — build só marketing, deploy Vercel documentado, estado em ESTADO_ATUAL_2026_02.md
