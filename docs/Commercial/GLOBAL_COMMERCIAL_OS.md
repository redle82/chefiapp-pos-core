# ChefIApp Global Commercial OS

**Objetivo:** Ataque coordenado a 18M leads segmentados em múltiplos países, com funis por vertical e operação comercial enterprise-ready.

**Versão:** 1.0  
**Data:** 2026-02-25  
**Status:** Estratégia documentada

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Phase 1 — Country Structure](#phase-1--country-structure)
3. [Phase 2 — Segmented Funnel](#phase-2--segmented-funnel)
4. [Phase 3 — CRM Structure](#phase-3--crm-structure)
5. [Phase 4 — Positioning Strategy](#phase-4--positioning-strategy)
6. [Phase 5 — Pricing Document](#phase-5--pricing-document)
7. [Landing Structure](#landing-structure)

---

## 1. Visão geral

| Elemento | Descrição |
|----------|-----------|
| **Target** | 18M leads segmentados por país e vertical |
| **Posicionamento** | ChefIApp OS — POS + Orquestração de Equipe |
| **Diferencial** | Workforce Orchestrator, Plataforma Modular, Automação Comportamental |
| **Mercados prioritários** | BR, ES, GB, US (gateway-first) |
| **Modelo** | SaaS modular, 3 planos (Starter, Pro, Enterprise) |

**Referências:** [STRATEGIC_DECISION_FRAMEWORK.md](../strategy/STRATEGIC_DECISION_FRAMEWORK.md), [PLATFORM_MODULAR_DECISION.md](../strategy/PLATFORM_MODULAR_DECISION.md), [MANIFESTO_COMERCIAL.md](../MANIFESTO_COMERCIAL.md)

---

## Phase 1 — Gateway-led global rollout

ChefIApp expande onde a sua infraestrutura de pagamento está legal e tecnicamente optimizada. Geografia é secundária face ao gateway disponível. Ver [GATEWAY_DEPLOYMENT_MATRIX.md](./GATEWAY_DEPLOYMENT_MATRIX.md).

### 1.1 Mapa de países activos (gateway-first)

| País | Região | Locale | Moeda | Gateway | Rota |
|------|--------|--------|-------|---------|------|
| BR | LATAM | pt-BR | BRL | PIX | `/br` |
| ES | Europa | es | EUR | SumUp | `/es` |
| GB | UK | en | GBP | SumUp | `/gb` |
| US | Americas | en | USD | Stripe | `/us` |

**Bloqueados (até capital):** DE, AT, PT.

**Configuração:** `merchant-portal/src/landings/countries.ts`, `billing-core/gatewayConfig.ts`.

### 1.2 Landing template por país

Cada país deve ter:

- **URL:** `/br`, `/es`, `/gb`, `/us`
- **Idioma:** localizado via `regionLocaleConfig`
- **Pricing:** moeda local (EUR, BRL, USD, GBP)
- **CTA principal:** WhatsApp (número por país)
- **CTA secundário:** Agendar demo (form ou Calendly)
- **SEO:** meta title/description por país; hreflang

### 1.3 SEO pages per country

- `/br` — Brasil
- `/es` — España
- `/gb` — UK
- `/us` — United States

**Estrutura de ficheiros (LandingV2):** `sections/CountryHero.tsx`, `i18n/countryCopy.ts` (pt-PT, es, pt-BR, en por país).

---

## Phase 2 — Segmented Funnel

### 2.1 Três verticais

| Vertical | Perfil | Copy angle | CTA |
|----------|--------|------------|-----|
| **Restaurant small** | 1–2 locais, <10 mesas, dono operacional | "Menos caos. Um sistema. Controlo em tempo real." | Começar grátis |
| **Multi-location** | 2–5 locais, gestor central | "Um comando para todas as casas. Dados em tempo real." | Agendar demo |
| **Enterprise chain** | 6+ locais, franchising/estrutura | "Orquestração de equipa a escala. Compliance e auditoria." | Falar com vendas |

### 2.2 Copy variations por vertical

**Restaurant small:**
- Hero: "O TPV que pensa. Pagamento em 2 toques. Cozinha e salão em sincronia."
- Prova: "Primeira venda em menos de 10 minutos."

**Multi-location:**
- Hero: "Um dashboard. Todas as casas. Dados em tempo real."
- Prova: "Consolida vendas, turnos e tarefas num único lugar."

**Enterprise chain:**
- Hero: "Orquestração de equipa a escala. RBAC, auditoria e compliance."
- Prova: "Multi-tenant robusto. API documentada."

### 2.3 Páginas / rotas por vertical

- `/small` ou `?segment=small` — Restaurant small
- `/multi` ou `?segment=multi` — Multi-location
- `/enterprise` — Enterprise chain

---

## Phase 3 — CRM Structure

### 3.1 Pipeline

```
Lead → Qualified → Demo → Trial → Paid
```

| Etapa | Critérios | Ação automática |
|-------|-----------|-----------------|
| **Lead** | Formulário, chat, WhatsApp | Criação de contacto; notificação vendas |
| **Qualified** | BANT mínimo; segmento confirmado | Atribuição SDR; primeira outreach |
| **Demo** | Demo agendada ou realizada | Envio de follow-up; material pós-demo |
| **Trial** | Trial iniciado (14 dias) | Onboarding assistido; check-ins |
| **Paid** | Checkout concluído | Ativação; onboarding pago |

### 3.2 Triggers de automação

| Trigger | Condição | Ação |
|---------|----------|------|
| Novo lead | Form preenchido | Email welcome + notificação Slack/CRM |
| Lead qualificado | BANT aprovado | Atribuir SDR; criar task "Agendar demo" |
| Demo agendada | Calendly confirmado | Email reminder 24h antes |
| Trial iniciado | `onboarding_completed_at` | Email d+1, d+7; WhatsApp opcional |
| Trial expira em 3 dias | `trial_ends_at - 3d` | Email + CTA upgrade |
| Conversão paga | Webhook Stripe | Ativar plano; email confirmar |

### 3.3 Scripts WhatsApp + Email

**WhatsApp — Novo lead (resposta imediata):**
> Olá! Obrigado pelo interesse no ChefIApp. Em que tipo de restaurante trabalha? (pequeno / multi-local / cadeia) Responda e agendamos uma demo de 15 min.

**Email — Welcome:**
> Assunto: ChefIApp — Obrigado por se inscrever
> 
> Olá [Nome],
> 
> Obrigado pelo interesse no ChefIApp OS. O nosso sistema ajuda restaurantes a operar em menos tempo, com menos erros e mais controlo.
> 
> Próximo passo: [Agendar demo de 15 min] ou responder a este email com a sua disponibilidade.
> 
> Cumprimentos,
> Equipa ChefIApp

**WhatsApp — Pós-demo:**
> Obrigado pela demo! Tem dúvidas? Pode iniciar o trial de 14 dias aqui: [link]. Estamos disponíveis para ajudar.

---

## Phase 4 — Positioning Strategy

### 4.1 Diferenciação vs competidores

| Competidor | O que fazem | ChefIApp faz diferente |
|------------|-------------|-------------------------|
| **Toast** | POS completo, foco em pagamentos e hardware | Orquestração de equipa; tarefas automáticas quando calmo; KDS híbrido (Orders + Tasks) |
| **Square** | Pagamentos, POS simples | Workforce Orchestrator; decisões baseadas em contexto (KDS_LOAD, zona); modular |
| **Last.app** | Organização de restaurante, QR, mesas | ChefIApp guia; Last organiza. TPV que pensa; sugestões contextuais |

### 4.2 Pilares a enfatizar

1. **Workforce Orchestrator** — Tarefas geradas por contexto (cozinha cheia vs vazia); atribuição por zona e role.
2. **Plataforma Modular** — POS, KDS, Staff Orchestrator, Analytics; cobrança por módulo.
3. **Automação Comportamental** — Sistema adapta tarefas ao estado da casa; não é checklist estático.

### 4.3 Anti-posicionamento (o que NÃO somos)

- Não somos "mais um POS barato" — competimos em inteligência, não em preço de hardware.
- Não somos "hub de integrações" — foco operacional, simplicidade.
- Não somos "substituição do Last.app" — podemos coexistir; ChefIApp guia, Last organiza.

---

## Phase 5 — Pricing Document

### 5.1 Planos

| Plano | Preço (EUR/USD/BRL) | Módulos |
|-------|---------------------|---------|
| **Starter** | ~29 € / 32 $ / 149 R$ | Gestão de Equipe (Workforce básico), 1 local |
| **Pro** | ~59 € / 65 $ / 299 R$ | Starter + POS + KDS + Tarefas automáticas, até 3 locais |
| **Enterprise** | ~99 € / 110 $ / 499 R$ | Pro + Inteligência + API + suporte prioritário, locais ilimitados |

**Fonte de preços:** `billing_plan_prices` (seed multi-currency); [20260228_billing_plan_prices_seed_multi_currency.sql](../../docker-core/schema/migrations/20260228_billing_plan_prices_seed_multi_currency.sql)

### 5.2 Module gating logic

| Módulo | Starter | Pro | Enterprise |
|--------|---------|-----|------------|
| Workforce (tarefas, check-in) | ✅ | ✅ | ✅ |
| POS + KDS | ❌ | ✅ | ✅ |
| Orchestrator (tarefas automáticas) | ❌ | ✅ | ✅ |
| Analytics / Intelligence | ❌ | ❌ | ✅ |
| API pública | ❌ | ❌ | ✅ |
| Suporte prioritário | ❌ | ❌ | ✅ |
| Locais | 1 | 3 | Ilimitado |

### 5.3 Trial

- 14 dias grátis em todos os planos.
- Sem cartão para iniciar trial.
- Ao expirar: redirecionamento para checkout ou downgrade para free tier (se existir).

---

## Landing Structure

### Secções obrigatórias (por país/vertical)

1. **Hero:** "ChefIApp OS — POS + Orquestração de Equipe"
2. **Vídeo / demo loop** (opcional)
3. **Três pilares:**
   - POS rápido
   - KDS inteligente
   - Tarefas automáticas quando a casa está calma
4. **Módulos:** POS, KDS, Staff Orchestrator, Analytics (cards)
5. **Integrações:**
   - "Delivery: modo manual assistido hoje"
   - "Agregadores (Deliverect, etc.): em roadmap"
6. **Pricing:** 3 planos (Starter, Pro, Enterprise)
7. **FAQ:** delivery, hardware, offline
8. **CTA:** Agendar demo, WhatsApp, formulário

### Referências técnicas

- [LANDING_COPY_GUIDE.md](../strategy/LANDING_COPY_GUIDE.md)
- [LANDING_CANON.md](../strategy/LANDING_CANON.md)
- [COMMERCIAL_CLAIMS_GUARDRAILS.md](../strategy/COMMERCIAL_CLAIMS_GUARDRAILS.md)

---

## Próximos passos

1. **Implementar:** Rotas `/br`, `/es`, `/gb`, `/us` em LandingV2 com copy localizada.
2. **Configurar:** CRM (HubSpot, Pipedrive ou similar) com pipeline e automações.
3. **Integrar:** Calendly/Cal.com para agendamento de demos.
4. **Validar:** A/B test em CTAs (WhatsApp vs formulário) por país.

---

**Fim do Global Commercial OS**
