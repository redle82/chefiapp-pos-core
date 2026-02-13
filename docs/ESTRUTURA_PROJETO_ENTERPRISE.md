# Estrutura do Projeto — Enterprise (Silicon Valley Style)

**Objetivo:** Separar e deixar explícitas **todas as áreas** do projeto. Cada área tem propósito, código e documentação claros. Único ponto de entrada para "onde está o quê".

**Última revisão:** 2026-02  
**Base:** [ESTADO_ATUAL_2026_02.md](ESTADO_ATUAL_2026_02.md), [AUDITORIA_REFATORACAO_2026_02.md](audit/AUDITORIA_REFATORACAO_2026_02.md), [FRAGMENTACAO_PROJETO_2026_02.md](audit/FRAGMENTACAO_PROJETO_2026_02.md)

---

## 1. Mapa de Áreas (visão geral)

| # | Área | Propósito | Código principal | Docs de referência |
|---|------|-----------|------------------|--------------------|
| 1 | **Product & GTM** | Landing, blog, pricing, narrativa comercial | merchant-portal (main-marketing, LandingV2) | Business, strategy, DEPLOY_VERCEL |
| 2 | **Engineering — Merchant Portal (Full)** | App operacional (TPV, KDS, Staff, Config) | merchant-portal (main_debug, App.tsx, pages/, features/) | ESTADO_ATUAL, architecture |
| 3 | **Engineering — Customer Portal** | Menu digital (QR) | customer-portal/ | — |
| 4 | **Engineering — Core** | Backend (Postgres, PostgREST) | docker-core/ | DEV_CORE_DOWN, scripts |
| 5 | **Operations & DevOps** | Deploy, CI/CD, health | vercel.json, .github/, scripts/ | DEPLOY_VERCEL, SETUP_DEPLOY |
| 6 | **Documentation** | Contratos, índices, estado | docs/ | DOC_INDEX, ESTADO_ATUAL |
| 7 | **Quality & Testing** | E2E, unit, auditoria humana | merchant-portal/e2e, tests, *.test.* | HUMAN_TEST_QUICK_REFERENCE |
| 8 | **Observability & Growth** | Sentry, métricas, SEO, pixel | merchant-portal (Sentry, GA, Meta) | OBSERVABILITY_SETUP, GROWTH |
| 9 | **Compliance & Legal** | Termos, privacidade, segurança | merchant-portal (Legal, Security pages) | — |
| 10 | **Audit & Governance** | Refatoração, fragmentação, legado | docs/audit, docs/ops | AUDITORIA_REFATORACAO, FRAGMENTACAO, LEGACY_CODE_BLACKLIST |

---

## 2. Áreas explícitas (detalhe)

### 2.1 Product & Go-to-Market (GTM)

| Campo | Conteúdo |
|-------|----------|
| **Propósito** | Área de vendas e marketing: landing, blog, pricing, changelog, security, status, legal. Narrativa comercial e conversão. |
| **Código** | `merchant-portal/src/main-marketing.tsx` (entry), `merchant-portal/index-marketing.html`, páginas em `pages/Landing/`, `pages/LandingV2/`, Blog, Pricing, Changelog, Security, Status, Legal. |
| **Build** | `npm run build:marketing` → `dist-marketing/`. |
| **Deploy** | Vercel: Root=merchant-portal, Build=`npm run build:marketing`, Output=`dist-marketing`. Ver [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md). |
| **Docs** | [docs/Business/](Business/), [docs/strategy/](strategy/) (pitch, sales), [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md). |

---

### 2.2 Engineering — Merchant Portal (Full App)

| Campo | Conteúdo |
|-------|----------|
| **Propósito** | App operacional: TPV, KDS, Staff (launcher, operação), Config, Auth, Dashboard, Onboarding, Backoffice. |
| **Código** | `merchant-portal/src/main_debug.tsx` (entry), `merchant-portal/src/App.tsx` (rotas), `pages/`, `features/`, `core/`, `context/`. |
| **Build** | `npm run build` (raiz) → `public/app` ou `merchant-portal/dist/`. |
| **Rotas** | `/app/staff/*`, `/op/tpv`, `/op/kds`, `/config/*`, `/auth/*`, `/bootstrap`, etc. Ver [ESTADO_ATUAL_2026_02.md](ESTADO_ATUAL_2026_02.md). |
| **Docs** | [ESTADO_ATUAL_2026_02.md](ESTADO_ATUAL_2026_02.md), [docs/architecture/](architecture/) (AppStaff, Menu, contracts), [CHEFIAPP_PRODUCT_DOCTRINE.md](CHEFIAPP_PRODUCT_DOCTRINE.md). |

---

### 2.3 Engineering — Customer Portal

| Campo | Conteúdo |
|-------|----------|
| **Propósito** | Menu digital para o cliente (QR code). |
| **Código** | `customer-portal/` (package separado no monorepo). |
| **Docs** | Referência em README e DOC_INDEX; sem doc dedicado nesta estrutura. |

---

### 2.4 Engineering — Core (Backend)

| Campo | Conteúdo |
|-------|----------|
| **Propósito** | Stack de backend: Postgres, PostgREST, serviços. Fonte de verdade operacional. |
| **Código** | `docker-core/` (docker-compose, configuração). Health: `http://localhost:3001/rest/v1/`. |
| **Scripts** | `scripts/core/health-check-core.sh`, `scripts/flows/` para fluxos críticos. |
| **Docs** | [DEV_CORE_DOWN.md](DEV_CORE_DOWN.md), [AGENTS.md](../AGENTS.md) (local core stack). |

---

### 2.5 Operations & DevOps

| Campo | Conteúdo |
|-------|----------|
| **Propósito** | Deploy (Vercel), CI/CD (GitHub Actions), health checks, automação. |
| **Código** | `vercel.json`, `.github/workflows/`, `scripts/`, `merchant-portal/vercel.json`. |
| **Docs** | [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md), [SETUP_DEPLOY.md](SETUP_DEPLOY.md). |

---

### 2.6 Documentation

| Campo | Conteúdo |
|-------|----------|
| **Propósito** | Contratos ativos, índices, estado atual, histórico. Nada é apagado; o que não é atual fica arquivado. |
| **Local** | `docs/` — architecture, contracts, audit, strategy, archive, Business, ops, routes. |
| **Entrada** | [DOC_INDEX.md](DOC_INDEX.md) — índice central. [ESTADO_ATUAL_2026_02.md](ESTADO_ATUAL_2026_02.md) — cara do projeto. [ONDE_ESTAMOS_AGORA.md](ONDE_ESTAMOS_AGORA.md) — resumo. |
| **Contratos** | docs/architecture (AppStaff, Menu), docs/contracts (Execution, Status, etc.). |

---

### 2.7 Quality & Testing

| Campo | Conteúdo |
|-------|----------|
| **Propósito** | E2E, unit tests, auditoria humana, validação de fluxos. |
| **Código** | `merchant-portal/e2e/`, `merchant-portal/tests/`, `*.test.ts`, `*.spec.ts`. Scripts: `scripts/flows/run-critical-flow.sh`, `scripts/flows/validate-onboarding-data.sh`. |
| **Docs** | [docs/audit/HUMAN_TEST_QUICK_REFERENCE.md](audit/HUMAN_TEST_QUICK_REFERENCE.md), [VALIDACAO_RAPIDA.md](VALIDACAO_RAPIDA.md). CI: `.github/workflows`. |

---

### 2.8 Observability & Growth

| Campo | Conteúdo |
|-------|----------|
| **Propósito** | Sentry (erros), métricas (orders/hour, etc.), SEO, Meta/Google Pixel. |
| **Código** | Integração em merchant-portal (Sentry, GA, Meta Pixel). |
| **Docs** | [docs/ops/OBSERVABILITY_SETUP.md](ops/OBSERVABILITY_SETUP.md), [docs/ops/GROWTH_MARKETING_SETUP.md](ops/GROWTH_MARKETING_SETUP.md). |

---

### 2.9 Compliance & Legal

| Campo | Conteúdo |
|-------|----------|
| **Propósito** | Termos de uso, política de privacidade, página de segurança. |
| **Código** | Páginas em merchant-portal: Legal, Security (rotas de marketing). |
| **Docs** | Referência em DOC_INDEX; sem doc dedicado nesta estrutura. |

---

### 2.10 Audit & Governance

| Campo | Conteúdo |
|-------|----------|
| **Propósito** | Auditoria de refatoração, análise de fragmentação, one-pager, blacklist de legado, roadmap executável. |
| **Local** | `docs/audit/`, `docs/ops/`. |
| **Docs** | [AUDITORIA_REFATORACAO_2026_02.md](audit/AUDITORIA_REFATORACAO_2026_02.md), [FRAGMENTACAO_PROJETO_2026_02.md](audit/FRAGMENTACAO_PROJETO_2026_02.md), [ONE_PAGER.md](audit/ONE_PAGER.md), [docs/ops/LEGACY_CODE_BLACKLIST.md](ops/LEGACY_CODE_BLACKLIST.md), [EXECUTABLE_ROADMAP.md](audit/EXECUTABLE_ROADMAP.md). |

---

## 3. Estrutura de pastas (repo)

```
chefiapp-pos-core/
├── merchant-portal/          # Áreas 1 (GTM) + 2 (Full App) + 7, 8, 9
│   ├── src/
│   │   ├── main_debug.tsx    # Full app entry
│   │   ├── main-marketing.tsx # Marketing-only entry
│   │   ├── App.tsx           # Rotas (full)
│   │   ├── pages/            # Páginas por domínio
│   │   ├── features/         # Admin, config, catalog, etc.
│   │   ├── core/             # Kernel, auth, flow, etc.
│   │   └── ...
│   ├── e2e/                  # Área 7
│   ├── index.html / index-marketing.html
│   ├── vite.config.ts / vite.config.marketing.ts
│   └── vercel.json
├── customer-portal/         # Área 3
├── docker-core/             # Área 4
├── docs/                    # Áreas 6, 10
│   ├── architecture/        # Contratos técnicos
│   ├── audit/               # Auditorias, one-pager, fragmentação
│   ├── Business/            # GTM
│   ├── contracts/          # Contratos de execução
│   ├── ops/                 # Ops, observability, legacy blacklist
│   ├── strategy/            # Pitch, sales
│   ├── DOC_INDEX.md         # Índice central
│   ├── ESTADO_ATUAL_2026_02.md
│   ├── ESTRUTURA_PROJETO_ENTERPRISE.md  # Este doc
│   └── ...
├── scripts/                 # Área 5 (parte)
├── .github/workflows/       # Área 5
├── README.md                # Entrada do repo (GitHub)
├── AGENTS.md                # Dicas para agentes
└── CHANGELOG.md
```

---

## 4. Entradas únicas (single source of truth)

| O que | Onde |
|-------|------|
| **Estrutura Enterprise (todas as áreas)** | Este doc: [ESTRUTURA_PROJETO_ENTERPRISE.md](ESTRUTURA_PROJETO_ENTERPRISE.md) |
| **Estado atual (builds, deploy)** | [ESTADO_ATUAL_2026_02.md](ESTADO_ATUAL_2026_02.md) |
| **Onde estamos (resumo)** | [ONDE_ESTAMOS_AGORA.md](ONDE_ESTAMOS_AGORA.md) |
| **Índice da documentação** | [DOC_INDEX.md](DOC_INDEX.md) |
| **Deploy Vercel** | [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md) |
| **Refatoração (precisamos?)** | [audit/AUDITORIA_REFATORACAO_2026_02.md](audit/AUDITORIA_REFATORACAO_2026_02.md) |
| **Fragmentação (quão fragmentado)** | [audit/FRAGMENTACAO_PROJETO_2026_02.md](audit/FRAGMENTACAO_PROJETO_2026_02.md) |
| **README (GitHub)** | [../README.md](../README.md) |

---

**Data:** 2026-02  
**Próxima revisão:** Quando houver nova área ou mudança de fronteira entre áreas.
