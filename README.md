# 🧠 ChefIApp - POS That Thinks

**Official Positioning:** **POS THAT THINKS**
**The system that guides your operation in real-time.**

---

## ⚠️ Status in 30 Seconds

**Version:** `1.2.0` — Production Ready
**Status:** 🟢 **READY FOR PRODUCTION**

> **🌍 Language:** All code, commits, and canonical documentation are in **English**.
> See [`docs/LANGUAGE_POLICY.md`](docs/LANGUAGE_POLICY.md) for complete rules.

| Component                 | Status         |
| ------------------------- | -------------- |
| 🏪 Merchant Portal        | ✅ Operational |
| 📱 Mobile App (Staff)     | ✅ Operational |
| 🌐 Customer Portal        | ✅ Operational |
| 💳 Billing (Stripe)       | ✅ Integrated  |
| 📊 Observability (Sentry) | ✅ Active      |
| 📈 Growth (SEO + Pixel)   | ✅ Configured  |

### 👉 If you are

- **👔 Owner/Manager** → Read [`docs/audit/ONE_PAGER.md`](docs/audit/ONE_PAGER.md) (30 sec)
- **👨‍💼 Waiter/Staff** → Read [`docs/GUIA_RAPIDO_GARCOM.md`](docs/GUIA_RAPIDO_GARCOM.md) (10 min)
- **👨‍💻 Developer** → Read [`ONBOARDING.md`](ONBOARDING.md) (15 min)
- **🏛️ Core Developer** → Read [`CORE_MANIFESTO.md`](CORE_MANIFESTO.md) (30 min) ⭐
- **🔍 Validator/QA** → Read [`docs/audit/HUMAN_TEST_QUICK_REFERENCE.md`](docs/audit/HUMAN_TEST_QUICK_REFERENCE.md) (5 min)

### What's New (v1.4.x / 2026-02)

- ✅ **Deploy só marketing** — Build `build:marketing` e output `dist-marketing` para subir na Vercel apenas landing, blog, pricing (sem app/config/TPV). Ver [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md).
- ✅ **Estado atual documentado** — [docs/ESTADO_ATUAL_2026_02.md](docs/ESTADO_ATUAL_2026_02.md) reflete a estrutura e os dois caminhos de deploy.
- ✅ **Sentry** — Error tracking in all apps
- ✅ **Metrics Dashboard** — Orders/hour, average ticket in real-time
- ✅ **SEO** — Dynamic meta tags + Schema.org
- ✅ **Pixel Tracking** — Meta + Google Analytics
- ✅ **Background Timer** — Immediate recalculation when returning to app
- ✅ **Pressure Banner** — Smooth animation, no flickering
- ✅ **Urgency Colors** — Dynamic update based on priority

---

## 🎯 What It Is

ChefIApp is not just a POS. It is an **Operational Nervous System** that:

- ⚡ **Charges in 2 taps** (< 5 seconds)
- 🗺️ **Shows urgency in real-time** (live map)
- 🍽️ **Adapts the menu** based on kitchen pressure
- 📋 **Manages reservations** simply

**Philosophy:** _"Last.app organizes the restaurant. ChefIApp guides it."_

**Positioning:** ChefIApp is the only POS that thinks before the human. While other systems only record sales, ChefIApp observes the operational context and suggests the next most important action.

**📋 Strategy:** [`docs/strategy/POSITIONING.md`](docs/strategy/POSITIONING.md) | [`docs/strategy/SCOPE_FREEZE.md`](docs/strategy/SCOPE_FREEZE.md) | [`docs/audit/EXECUTABLE_ROADMAP.md`](docs/audit/EXECUTABLE_ROADMAP.md)

**ChefIApp OS – Como funciona de verdade:** [`docs/strategy/CHEFIAPP_OS_COMO_FUNCIONA.md`](docs/strategy/CHEFIAPP_OS_COMO_FUNCIONA.md) — narrativa (Docker = mundo, Kernel = leis, Core Finance = coração, TPV/KDS = braços, ERO = consciência). **Mapa Vivo do Sistema:** [`docs/CHEFIAPP_SYSTEM_MAP.html`](docs/CHEFIAPP_SYSTEM_MAP.html) — documento único no browser (visão, camadas, papéis, SystemTree, rotas, offline). **Doutrina do produto:** [`docs/CHEFIAPP_PRODUCT_DOCTRINE.md`](docs/CHEFIAPP_PRODUCT_DOCTRINE.md) — princípios imutáveis e contrato com o futuro. **Modo seguro para IA:** [`docs/CHEFIAPP_SYSTEM_SAFE_MODE.md`](docs/CHEFIAPP_SYSTEM_SAFE_MODE.md) — prompt canónico para qualquer IA trabalhar no projeto sem quebrar o sistema. Links: [ERO_CANON](docs/ERO_CANON.md), [BOOTSTRAP_CANON](docs/boot/BOOTSTRAP_CANON.md), [checklist operacional](docs/strategy/CHECKLIST_OPERACIONAL_TPV_KDS_CLIENTE.md), [CLI](docs/strategy/CLI_CHEFIAPP_OS.md).

**📚 Technical Documentation:** Organized in layers — see [`docs/DOC_INDEX.md`](docs/DOC_INDEX.md)  
**🏢 Project Areas (Enterprise):** All areas explicit — see [`docs/ESTRUTURA_PROJETO_ENTERPRISE.md`](docs/ESTRUTURA_PROJETO_ENTERPRISE.md)  
**📍 Current Status:** See [`docs/ONDE_ESTAMOS_AGORA.md`](docs/ONDE_ESTAMOS_AGORA.md) and [`docs/ESTADO_ATUAL_2026_02.md`](docs/ESTADO_ATUAL_2026_02.md). **Deploy (marketing-only or full):** [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md).

---

## 🚀 Quick Start

### ⚡ Super Quick (2 minutes)

1. Read **[ONE_PAGER.md](ONE_PAGER.md)** - Everything in one page
2. Follow **[PRIMEIROS_PASSOS.md](PRIMEIROS_PASSOS.md)** - What to do now

### For Developers

```bash
# Clone and install
git clone <repo>
cd chefiapp-pos-core/mobile-app
npm install

# Configure .env
cp .env.example .env

# Validate
../scripts/validate-system.sh

# Run
npm start
```

**Read:** [ONBOARDING.md](ONBOARDING.md) (15 minutes)

### For Users

**Read:** [docs/GUIA_RAPIDO_GARCOM.md](docs/GUIA_RAPIDO_GARCOM.md) (10 minutes)

### For Validation

**Read:** [docs/VALIDACAO_RAPIDA.md](docs/VALIDACAO_RAPIDA.md) (17 tests)

---

## 📚 Documentation

### 📖 Essential (Start Here)

- **[PROJETO_COMPLETO.md](PROJETO_COMPLETO.md)** ⭐ - Consolidated overview
- **[docs/RESUMO_EXECUTIVO.md](docs/RESUMO_EXECUTIVO.md)** - Executive summary
- **[ONBOARDING.md](ONBOARDING.md)** - For new developers

### 🏛️ Core (Operating System)

- **[CORE_MANIFESTO.md](CORE_MANIFESTO.md)** ⭐⭐ - System law (read first)
- **[docs/CORE_OVERVIEW.md](docs/CORE_OVERVIEW.md)** ⭐⭐⭐ - **CORE MENTAL MAP** (what is untouchable)
- **[START_HERE.md](START_HERE.md)** - Core entry point
- **[ROADMAP.md](ROADMAP.md)** - Next levels roadmap
- **[EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md)** - Core executive summary
- **[docs/LEVEL_1_IMPLEMENTATION.md](docs/LEVEL_1_IMPLEMENTATION.md)** - Level 1 implemented
- **[docs/testing/MEGA_OPERATIONAL_SIMULATOR.md](docs/testing/MEGA_OPERATIONAL_SIMULATOR.md)** - Complete simulator
- **[docs/testing/FAIL_FAST_MODE.md](docs/testing/FAIL_FAST_MODE.md)** - Quick validation

**Core Status:** ✅ v1.0-core-sovereign (Validated, Protected, Shielded)

**Detailed Status:**

- **[docs/STATUS_TECH.md](docs/STATUS_TECH.md)** - Technical status (stability)
- **[docs/STATUS_OPERATION.md](docs/STATUS_OPERATION.md)** - Operational status (real-world impact)

### 🏗️ Technical

- [docs/EXECUCAO_30_DIAS.md](docs/EXECUCAO_30_DIAS.md) - Detailed implementation
- [docs/ARQUITETURA_VISUAL.md](docs/ARQUITETURA_VISUAL.md) - Diagrams and flows
- [docs/SETUP_DEPLOY.md](docs/SETUP_DEPLOY.md) - Setup and deploy
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Debug and resolution

### 🚀 SaaS Implementation (7-day checklist)

- **[IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)** — Day-by-day plan (infra, RLS, onboarding, webhooks, testing, docs)
- **Smoke test**: `bash scripts/smoke-test.sh` (integration) or `bash scripts/smoke-test.sh --prod` (frontend)
- **Runbook**: [DEPLOYMENT_RUNBOOK.md](DEPLOYMENT_RUNBOOK.md) — Deploy order, verification, rollback
- **Security audit**: [docs/SECURITY_AUDIT_CHECKLIST.md](docs/SECURITY_AUDIT_CHECKLIST.md) — Pre-release checklist
- **Webhooks**: [docs/WEBHOOK_SPEC.md](docs/WEBHOOK_SPEC.md) — SumUp inbound, events OUT
- **RLS**: [docs/RLS_POLICIES.md](docs/RLS_POLICIES.md) — Row-level security design

### 💼 Commercial

- [docs/MANIFESTO_COMERCIAL.md](docs/MANIFESTO_COMERCIAL.md) - Value proposition
- [docs/PLANO_ROLLOUT.md](docs/PLANO_ROLLOUT.md) - Launch strategy

### 📊 Operational

- [docs/METRICAS_KPIS.md](docs/METRICAS_KPIS.md) - Tracking and metrics
- [docs/MANUTENCAO_CONTINUA.md](docs/MANUTENCAO_CONTINUA.md) - Maintenance
- [docs/GO_LIVE_CHECKLIST.md](docs/GO_LIVE_CHECKLIST.md) - Launch checklist

### 🤝 Transition

- [docs/HANDOFF_EQUIPE.md](docs/HANDOFF_EQUIPE.md) - Complete handoff
- [docs/QUICK_WINS.md](docs/QUICK_WINS.md) - Next improvements
- [docs/RETROSPECTIVA.md](docs/RETROSPECTIVA.md) - Lessons learned

### 🔍 Audit and QA

- **[docs/audit/ONE_PAGER.md](docs/audit/ONE_PAGER.md)** ⭐ - Status in 30 seconds
- **[docs/audit/FINAL_HANDOFF.md](docs/audit/FINAL_HANDOFF.md)** - Complete handoff
- **[docs/audit/MASTER_INDEX.md](docs/audit/MASTER_INDEX.md)** - Master index
- **[docs/audit/HUMAN_TEST_REPORT.md](docs/audit/HUMAN_TEST_REPORT.md)** - Complete human test
- **[docs/audit/ACTION_PLAN_UX_FIXES.md](docs/audit/ACTION_PLAN_UX_FIXES.md)** - UX fixes plan

### 📋 Indexes

- [docs/README.md](docs/README.md) - Main index
- [docs/INDICE_COMPLETO.md](docs/INDICE_COMPLETO.md) - All documents
- [docs/audit/README.md](docs/audit/README.md) - Audit index

---

## ✅ Status

**Version:** 1.2.0 (Production Ready)
**Date:** 2026-01-24

### 🏛️ Core ✅

- ✅ **Core v1.0-core-sovereign:** Clean, Validated, Protected, Shielded
- ✅ **Manifesto Ratified:** CORE_MANIFESTO.md
- ✅ **Automatic Validation:** CI/CD with fail-fast and 24h simulation
- ✅ **Documentation:** 17 complete documents
- ✅ **Level 1 Completed:** Protection and Automation implemented

### System ✅

- ✅ **Infrastructure:** DB + Billing + Auth complete
- ✅ **Mobile App:** KDS, Waiter, Cashier operational
- ✅ **Observability:** Sentry + Real-time metrics
- ✅ **Growth:** SEO + Pixel Tracking

### Quality ✅

- ✅ **Technical Bugs:** 5/5 v1.x issues resolved
- ✅ **Performance:** fetchOrders optimized, dynamic timers
- ✅ **Resilience:** OfflineQueue, auto-save, AppState awareness

### Known Issues

- 🟢 3 low-priority issues (accepted)
- 📋 See: [`docs/KNOWN_ISSUES.md`](docs/KNOWN_ISSUES.md)

**See:** [`docs/audit/ONE_PAGER.md`](./docs/audit/ONE_PAGER.md) - Status in 30 seconds

---

## 📊 Features

### ⚡ Fast Pay (Week 1)

Payment in 2 taps, < 5 seconds.

### 🗺️ Live Map (Week 2)

Timer, urgency colors, contextual icons.

### 🍽️ Smart KDS (Week 3)

Menu adapts based on kitchen pressure.

### 📋 Reservations LITE (Week 4)

Simple digital waiting list.

---

## 🎯 Expected Results

- ⏱️ **36x faster** payment
- 🗺️ **100% visibility** of the dining room
- 🍽️ **+25% efficiency** in the kitchen
- 📋 **+15% conversion** of reservations

---

## 🛠️ Tools

- **Validation:** `./scripts/validate-system.sh`
- **Issues:** [docs/GITHUB_ISSUES.md](docs/GITHUB_ISSUES.md)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)

---

## 📞 Support

- **Troubleshooting:** [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- **Onboarding:** [ONBOARDING.md](ONBOARDING.md)
- **Handoff:** [docs/HANDOFF_EQUIPE.md](docs/HANDOFF_EQUIPE.md)

---

## 🚀 Next Steps

### System Ready ✅

The system is **complete and stable** for production.

### Action Options

| Action        | Description            |
| ------------- | ---------------------- |
| 🚀 **Deploy** | Publish to production  |
| 🧪 **Tests**  | Run complete E2E suite |
| 📋 **Commit** | Consolidate changes    |

### Post-Deploy Monitoring

1. **Sentry Dashboard** — Real-time errors
2. **Metrics Widget** — Orders/hour in Dashboard
3. **Google Analytics** — Customer portal traffic

### References

- **Next actions (scope & validation):** [docs/strategy/NEXT_ACTIONS.md](docs/strategy/NEXT_ACTIONS.md) — FASE 1–3 validation, FASE 5 polish, FASE 6 print
- **Billing, PIX, SumUp:** [docs/BILLING_PIX_SUMUP_INDEX.md](docs/BILLING_PIX_SUMUP_INDEX.md) — índice e scripts; validação: `./scripts/run-billing-pix-sumup-validation.sh` (gateway em 4320).
- **Observability:** [docs/ops/OBSERVABILITY_SETUP.md](docs/ops/OBSERVABILITY_SETUP.md)
- **GitHub CI/CD setup:** [docs/ops/GITHUB_CICD_SETUP.md](docs/ops/GITHUB_CICD_SETUP.md)
- **Growth:** [docs/ops/GROWTH_MARKETING_SETUP.md](docs/ops/GROWTH_MARKETING_SETUP.md)
- **Known Issues:** [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md)
- **Deploy:** [docs/SETUP_DEPLOY.md](docs/SETUP_DEPLOY.md)

---

## 📈 Statistics

### Technology Stack

| Layer         | Technology                            |
| ------------- | ------------------------------------- |
| Mobile        | React Native + Expo                   |
| Web Portals   | React + Vite + TypeScript             |
| Backend       | Supabase (Postgres + Auth + Realtime) |
| Billing       | Stripe                                |
| Observability | Sentry                                |
| Analytics     | Google Analytics + Meta Pixel         |

### Project Structure (Enterprise)

**All areas of the project are explicit.** See **[docs/ESTRUTURA_PROJETO_ENTERPRISE.md](docs/ESTRUTURA_PROJETO_ENTERPRISE.md)** for the canonical map (Product & GTM, Engineering — Merchant Portal, Customer Portal, Core, Operations, Documentation, Quality, Observability, Compliance, Audit & Governance).

```
chefiapp-pos-core/
├── merchant-portal/    # Product & GTM + Full App (TPV, KDS, Staff, Config)
│   ├── src/main_debug.tsx      # Full app entry
│   ├── src/main-marketing.tsx  # Marketing-only entry (landing, blog, pricing, changelog, security, status, legal)
│   ├── dist/                   # Full build output
│   ├── dist-marketing/         # Marketing-only build output (npm run build:marketing)
│   └── vercel.json             # SPA rewrites for deploy
├── docker-core/        # Core backend (Postgres, PostgREST)
├── docs/               # Documentation (DOC_INDEX, ESTADO_ATUAL, ESTRUTURA_PROJETO_ENTERPRISE)
└── scripts/            # Automation, health, flows
```

**Deploy:** Marketing-only → Root `merchant-portal`, Build `npm run build:marketing`, Output `dist-marketing`. Full app → Root empty, Build `npm run build`, Output `public/app`. See [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md).

### Quality (v1.2.0)

- **Issues Resolved:** 5 (v1.1.0 + v1.2.0)
- **Pending Issues:** 3 (low priority)
- **TypeScript:** 100% typed
- **Observability:** Sentry in all apps

---

**Version:** 1.4.x
**Date:** 2026-02
**Status:** 🟢 **PRODUCTION READY** — Repo state: marketing build separate ([docs/ESTADO_ATUAL_2026_02.md](docs/ESTADO_ATUAL_2026_02.md))

---

_"Last.app organizes the restaurant. ChefIApp guides it."_
