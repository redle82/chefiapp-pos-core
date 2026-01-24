# 🗺️ CHEFIAPP POS — ROADMAP Q2 2026

**Período:** Dias 91-180 (Q2 2026)
**Base:** ROADMAP_90D.md (Q1 Complete)
**Objetivo:** Expansão Comercial e Pagamentos Reais

---

## 🎯 VISÃO GERAL (Expansão)

### Estado em Q1 (Atual)
- ✅ Beta Privado (3 pilotos)
- ✅ TPV + KDS integrados (Simulados)
- ✅ Infraestrutura de Observabilidade

### Estado Alvo (Dia 180)
- ✅ Pagamentos Reais (Stripe Integrado)
- ✅ 10+ Restaurantes Ativos
- ✅ App Mobile (Manager/Waiter)
- ✅ Relatórios Financeiros Básicos

---

## 🗓️ CRONOGRAMA

### SPRINT 4: Gateway de Pagamentos (Dias 91-120)
**Meta:** Processar pagamentos reais com cartão de crédito via Stripe.

#### Tasks
- [ ] **Stripe Integration**
  - Integração Backend (Intents, Webhooks)
  - UI de Checkout no TPV
  - Reembolsos e disputas
- [ ] **Billing Automatizado**
  - Cobrança de assinatura SaaS (Sovereign Plan)
  - Portal do Cliente (Stripe Customer Portal)
- [ ] **Relatórios de Vendas**
  - Dashboard financeiro diário
  - Exportação CSV

### SPRINT 5: Mobile & Multi-location (Dias 121-150)
**Meta:** Permitir operação móvel e gestão de múltiplas unidades.

#### Tasks
- [ ] **Mobile App (PWA First -> Native)**
  - Otimização extrema para mobile (Garçom)
  - CapacitorJS ou React Native wrapper
- [x] **Multi-location Architecture** ✅ **COMPLETO (2026-01-15)**
  - ✅ Schema SQL (restaurant_groups, restaurant_group_memberships)
  - ✅ Backend Service (RestaurantGroupService)
  - ✅ API Endpoints (6 endpoints)
  - ✅ UI Components (RestaurantGroupManager, GroupDashboard)
  - ✅ Dashboard consolidado (Sales global)
  - ✅ Sincronização de menu entre localizações
  - ⏳ Seletor de unidade no Dashboard (futuro)
  - ⏳ Gestão de equipe por unidade (futuro)

### SPRINT 6: Public Beta Expansion (Dias 151-180)
**Meta:** Abrir para o mercado (Self-service).

#### Tasks
- [ ] **Onboarding Self-service**
  - Wizard de configuração automática
  - Importação de menu (CSV/JSON)
- [ ] **Marketing Site**
  - Landing page pública com preços
  - Blog para SEO
- [ ] **Suporte 1.0**
  - Chat Intercom/Zendesk integrado
  - Base de conhecimento (Docs públicos)

---

## 🚫 FORA DO ESCOPO (Q2)
- ❌ Integração Fiscal (NFC-e/SAT) - Q3
- ❌ Hardware proprietário
- ❌ Delivery integrations (iFood/UberEats) - Q3
- ❌ Loyalty Program complexo

---

## ✅ CHECKLIST DE APROVAÇÃO (DIA 180)
- [ ] $10k TPV processado via Stripe
- [ ] 10 restaurantes ativos e pagantes
- [ ] Mobile App em uso por garçons
- [ ] Zero incidentes de segurança financeira

---

**Última atualização:** 2026-01-11
**Status:** DRAFT
