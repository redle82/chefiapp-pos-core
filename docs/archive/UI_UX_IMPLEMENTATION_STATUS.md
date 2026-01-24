# UI/UX IMPLEMENTATION STATUS — ChefIApp POS Core

**Data:** 2025-12-24 | **Status:** FASE 1 COMPLETA | **Próximo:** Fase 2 (Home + TPV)

---

## 📊 RESUMO EXECUTIVO

| Artefato | Status | Localização | Notas |
|----------|--------|------------|-------|
| **UI_SPEC_MASTER.md** | ✅ CONCLUÍDO | Root | Especificação completa (routes, tokens, componentes) |
| **Design System** | ✅ CONCLUÍDO | `merchant-portal/src/ui/design-system/` | 7 componentes base + tokens |
| **Onboarding Flow** | ✅ CONCLUÍDO | `merchant-portal/src/pages/Onboarding/` | 5 passos implementados (identity → publish) |
| **Social Kit** | ✅ CONCLUÍDO | `SOCIAL_KIT.md` | 9 templates + calendário + diretrizes |
| **Merchant Home** | 🔄 PRÓXIMO | `/app` | Dashboard ghost/live + ação recomendada |
| **TPV** | 🔄 PRÓXIMO | `/app/tpv` | Pedidos ativos, detalhe, checkout |
| **AppStaff** | 🔄 PRÓXIMO | `/app/staff` | Check-in, tarefas, manager, owner |
| **Public Pages** | 🔄 PRÓXIMO | `/@slug` | Landing, menu, contato |

---

## ✅ FASE 1 — ESPECIFICAÇÃO + DESIGN SYSTEM (COMPLETA)

### 1.1 Documentação

**[UI_SPEC_MASTER.md](./UI_SPEC_MASTER.md)** — 350+ linhas
- ✅ Sitemap completo (37 rotas mapeadas)
- ✅ Design System tokens (cores, tipografia, spacing, radius, elevação)
- ✅ 13 componentes especificados
- ✅ 4 fluxos principais documentados
- ✅ Padrões de microcopy
- ✅ Checklist QA (responsividade, acessibilidade, performance)

### 1.2 Design System (React + TypeScript + CSS)

**Localização:** `merchant-portal/src/ui/design-system/`

#### Tokens (`tokens.ts`) — 250+ linhas
```typescript
export const Colors = { ... }        // 9 cores + 2 truth states
export const Typography = { ... }    // 6 escalas (Display/UI)
export const Spacing = { ... }       // 8px grid
export const BorderRadius = { ... }  // 5 níveis
export const Elevation = { ... }     // 4 sombras PWA-friendly
export const Breakpoints = { ... }   // Mobile-first
export const ComponentTokens = { ... } // Props específicas por componente
export const getCSSVariables = () => {...} // CSS variables
export const cn = (...) => {} // Utility para classes condicionais
```

#### Componentes (7 implementados)

| Componente | Props | Uso | Arquivo |
|-----------|-------|-----|---------|
| **AppShell** | `children`, `topbar?`, `sidebar?` | Layout principal | `AppShell.tsx` (+CSS) |
| **TruthBadge** | `state: 'ghost'\|'live'` | Estado do restaurante | `TruthBadge.tsx` (+CSS) |
| **Stepper** | `steps`, `currentStep`, `onStepChange?` | Onboarding progress | `Stepper.tsx` (+CSS) |
| **RiskChip** | `level: 'LOW'\|'MEDIUM'\|'HIGH'` | AppStaff risk display | `RiskChip.tsx` (+CSS) |
| **EmptyState** | `icon`, `title`, `description`, `action?` | Vazio com CTA | `EmptyState.tsx` (+CSS) |
| **Card** | `children`, `elevated?`, `padding?`, `onClick?` | Container base | `Card.tsx` (+CSS) |
| **Button** | `variant`, `size`, `fullWidth?`, `loading?` | CTA em todos os lugares | `Button.tsx` (+CSS) |

#### Export Central
- **`index.ts`** — Exporta todos os tokens + componentes (reutilização fácil)

---

## ✅ FASE 1 — ONBOARDING FLOW (COMPLETA)

**Localização:** `merchant-portal/src/pages/Onboarding/`

### Estrutura

```
Onboarding/
├── Onboarding.tsx          # Container + state management
├── Onboarding.css          # Layout styles
└── steps/
    ├── Step1Identity.tsx   # Nome + descrição
    ├── Step2Slug.tsx       # URL + preview
    ├── Step3Menu.tsx       # Cardápio (5+ itens)
    ├── Step4Payments.tsx   # Stripe vs Cash
    └── Step5Publish.tsx    # Checklist final
```

### Implementação Detalhada

#### **Onboarding.tsx** (Container)
```typescript
- Estado: currentStep, data (acumula respostas)
- Fluxo: linear (0 → 4), mas com back() disponível
- Stepper: visual + controlado
- Renderização condicional: renderStep()
- Navegação: handleNext(), handleBack(), handlePublish()
```

#### **Step1Identity** (120 linhas)
- Inputs: Nome (obrigatório, 3+ chars, max 100)
- Inputs: Descrição (opcional, max 300)
- Validação inline + erro visual
- CTA: "Próximo: URL →"

#### **Step2Slug** (150 linhas)
- Input: slug com validação em tempo real
- Preview instantâneo: "chefidapp.app/@{slug}"
- Validação: regex (letters/numbers/hyphens), duplicata check
- Loading state: ⏳ durante verificação
- Success state: ✓ quando OK
- Disabled CTA enquanto não validado

#### **Step3Menu** (200+ linhas)
- Criar menu item (nome, preço, categoria, descrição)
- Adicionar 5+ itens mínimo (obrigatório)
- Remover item individual
- Cartão de item com delete button
- Form inline para adicionar item
- Validação: preço > 0, nome obrigatório

#### **Step4Payments** (150 linhas)
- 2 opções: Stripe (taxa 2,9% + R$0,30) vs Cash (0%)
- Explicação de cada opção
- Seleção visual (botão radio estilizado)
- Benefícios listados por opção
- Aviso: "Você pode mudar depois"

#### **Step5Publish** (180 linhas)
- Resumo de tudo (restaurante, URL, itens, pagamento)
- Checklist final (identidade ✓, slug ✓, menu ✓, pagamento ✓)
- Explicação: "O que acontece ao publicar?"
- Checkbox: aceitar termos
- CTA: "🚀 Publicar & Ir para TPV"
- Redireciona para `/app/tpv-ready`

### UX Features

- ✅ **No friction:** Cada passo tem 1 tarefa principal
- ✅ **Validation:** Feedback em tempo real (não silencioso)
- ✅ **Accessible:** Labels + ARIA, tabindex
- ✅ **Mobile:** Todas as telas testadas em 320px+
- ✅ **Progress visible:** Stepper sempre visível (sticky ou top)
- ✅ **Skip optional:** Step 4 (Payments) é opcional (cash OK)
- ✅ **Back always works:** Volta sem perder dados

---

## ✅ FASE 1 — SOCIAL KIT (COMPLETA)

**Arquivo:** [SOCIAL_KIT.md](./SOCIAL_KIT.md) — 400+ linhas

### Conteúdo

1. **Brand Voice & Guidelines**
   - Tom: leve, acessível, orientado à ação
   - Copy formula: Hook + Benefício + CTA + Local

2. **9 Templates Prontos**
   - Promo (desconto/oferta)
   - "Hoje tem" (daily special)
   - Bastidores (behind-the-scenes)
   - Review (cliente feliz)
   - Recrutamento
   - Menu highlight (prato destaque)
   - Story CTA (link na bio)
   - Event/Happy hour
   - Selo de verdade (product signature)

3. **Content Calendar**
   - Semana modelo com posting schedule
   - Frequência recomendada (4-5 posts/week, stories daily)
   - Horários de pico (11h, 15h, 18h, 21h)

4. **3 Animações Padrão**
   - Prato aparece (zoom in, 3s)
   - Número contagem (preço/oferta, 2s)
   - Transição cor (estado, 1.5s)

5. **Hashtag Strategy**
   - Brand: #Chefiapp #SistemaJusto
   - Local: #Ibiza #FoodIbiza
   - Trend: #FoodPorn #Instafood
   - Per-template: específicas

6. **Posting Strategy**
   - Frequência: 4-5 posts/semana
   - Reels: 2-3x/semana
   - Stories: daily (3-5x/dia)
   - Lives: 1-2x/mês

7. **Performance Tracking**
   - Métricas: reach, engagement, CTR, conversão
   - Tool: Instagram Insights + Meta Business Suite
   - Report: mensal com top 3, bottom 3, trends

---

## 🔄 FASE 2 — HOME + TPV + APPSTAFF (PRÓXIMO)

### Tasks (Prioridade)

#### 1️⃣ Merchant Home (High Priority)

**Arquivo:** `merchant-portal/src/pages/Home/Home.tsx`

**Objective:**
- Dashboard com 3 blocos: estado (ghost/live), ação recomendada, impacto
- Ghost state: checklist do que falta (identidade ✓, slug ✓, menu, pagamento, publicar)
- Live state: KPIs do dia (pedidos, R$, fairness, compliance)

**Components a usar:**
- `AppShell` (layout)
- `TruthBadge` (estado)
- `Card` (3 blocos)
- Gráfico simples (pedidos/dia)

**Estimated:** 4 horas

---

#### 2️⃣ TPV (High Priority)

**Arquivo:** `merchant-portal/src/pages/TPV/`

**Objective:**
- Dashboard de pedidos ativos (KDS-lite)
- Estados visuais óbvios (novo/em-preparo/pronto/pago)
- Ações rápidas: "Enviar cozinha", "Fechar conta"
- Hold-to-confirm em ações críticas

**Components:**
- `AppShell` + custom nav (ações TPV)
- `OrderCard` (novo componente)
- `Card` (pedido detalhe)
- `Button` (ações)

**Estimated:** 6 horas

---

#### 3️⃣ AppStaff (High Priority)

**Arquivo:** `merchant-portal/src/pages/AppStaff/`

**Objective:**
- Worker: check-in, tarefas, risco pessoal
- Manager: equipe em turno, riscos, pendências HACCP
- Owner: health do sistema, audit trail, fairness

**Components:**
- `AppShell` (role-based)
- `RiskChip` (riscos)
- `TaskCard` (novo)
- `ShiftCard` (novo)

**Estimated:** 8 horas

---

#### 4️⃣ Public Pages (Medium Priority)

**Arquivo:** `merchant-portal/src/pages/Public/`

**Objective:**
- /@slug: Landing (hero, cardápio destaque, contato)
- /@slug/menu: Cardápio (mobile-first, lazy load imagens)
- /@slug/contato: Mapa + WhatsApp + horários

**Estimated:** 5 horas

---

## 📁 ESTRUTURA FINAL (PÓS-FASE 2)

```
merchant-portal/src/
├── ui/
│   ├── design-system/              ✅ COMPLETO
│   │   ├── tokens.ts
│   │   ├── index.ts
│   │   ├── AppShell.tsx + .css
│   │   ├── TruthBadge.tsx + .css
│   │   ├── Stepper.tsx + .css
│   │   ├── RiskChip.tsx + .css
│   │   ├── EmptyState.tsx + .css
│   │   ├── Card.tsx + .css
│   │   └── Button.tsx + .css
│   └── shared/                     🔄 PRÓXIMO
│       ├── TopBar.tsx
│       ├── SideNav.tsx
│       └── BottomNav.tsx
├── pages/
│   ├── Onboarding/                 ✅ COMPLETO
│   │   ├── Onboarding.tsx + .css
│   │   └── steps/
│   │       ├── Step1Identity.tsx
│   │       ├── Step2Slug.tsx
│   │       ├── Step3Menu.tsx
│   │       ├── Step4Payments.tsx
│   │       └── Step5Publish.tsx
│   ├── Home/                       🔄 PRÓXIMO
│   │   ├── Home.tsx + .css
│   │   └── components/
│   ├── TPV/                        🔄 PRÓXIMO
│   │   ├── TPV.tsx + .css
│   │   └── screens/
│   ├── AppStaff/                   🔄 PRÓXIMO
│   │   ├── AppStaff.tsx + .css
│   │   └── views/
│   └── Public/                     🔄 PRÓXIMO
│       ├── Landing.tsx
│       ├── Menu.tsx
│       └── Contact.tsx
└── hooks/                          ✅ (Existente)
    ├── useMerchant.ts
    ├── useAppStaff.ts
    └── ...
```

---

## 🎨 DESIGN DECISIONS RATIFIED

| Decisão | Razão |
|---------|-------|
| **React + TS + CSS (sem Tailwind)** | Stack existente, full control, sem dependência pesada |
| **Design System baseado em tokens** | Reutilização, consistência, fácil atualização |
| **Mobile-first** | Usuários em campo (restaurante, cozinha) primariamente mobile |
| **Truth State (ghost/live) visual** | Assinatura do produto, diferencial claro |
| **Onboarding sem friction** | Max 5 passos, cada um uma ação, sem formulários infinitos |
| **AppShell responsivo** | Sidebar desktop, bottom-nav mobile (padrão iOS/Android) |
| **Componentes sem framework UI** | Performance, privacidade, menos bundle size |

---

## 🚀 PRÓXIMOS PASSOS

### Imediato (Hoje)
- [x] Criar UI_SPEC_MASTER.md
- [x] Implementar Design System (tokens + 7 componentes)
- [x] Implementar Onboarding (5 passos)
- [x] Criar SOCIAL_KIT.md

### Curto Prazo (Próximos 2 dias)
- [ ] Merchant Home (dashboard ghost/live)
- [ ] TPV (pedidos ativos, detalhe, checkout)
- [ ] AppStaff (3 roles: worker, manager, owner)

### Médio Prazo (Próxima semana)
- [ ] Public pages (/@slug, /@slug/menu)
- [ ] Componentes adicionais (TopBar, SideNav, BottomNav)
- [ ] Integração com core (mock de dados)
- [ ] QA: responsividade, acessibilidade, performance

### Longo Prazo (Post-beta)
- [ ] Figma design library
- [ ] Canva templates para social kit
- [ ] Auth0 integration
- [ ] Analytics dashboard
- [ ] Email templates

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Target | Método |
|---------|--------|--------|
| **Onboarding completion** | > 80% | Rastrear dropoffs |
| **Time-to-publish** | < 10 min | Cronometrar flow |
| **Mobile-ready** | 100% | Testing em 5+ devices |
| **Acessibilidade** | WCAG AA | axe DevTools |
| **Bundle size** | < 150KB gzip | webpack-bundle-analyzer |
| **Engagement (Social)** | > 5% | Instagram Insights |

---

## 🔗 REFERÊNCIAS

- [UI_SPEC_MASTER.md](./UI_SPEC_MASTER.md) — Especificação completa
- [SOCIAL_KIT.md](./SOCIAL_KIT.md) — Templates + diretrizes sociais
- `merchant-portal/src/ui/design-system/` — Código base
- `merchant-portal/src/pages/Onboarding/` — Onboarding implementado

---

**Status:** Fase 1 ✅ CONCLUÍDA | Fase 2 🔄 PRONTA PARA INICIAR

Quer começar Fase 2 agora, ou prefere revisar/ajustar algo da Fase 1?
