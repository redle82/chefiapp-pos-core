# UI/UX SPEC MASTER — ChefIApp POS Core

**Versão:** 1.0 | **Data:** 2025-12-24 | **Status:** IMPLEMENTAÇÃO INICIADA

---

## 1. ARQUITETURA DE EXPERIÊNCIA

### 1.1 Mapa de Rotas (Sitemap Completo)

```
chefidapp.app/
├── @ [Public Routes]
│   ├── /@slug                    → Landing do restaurante (hero + menu CTA + contato)
│   ├── /@slug/menu               → Cardápio (mobile-first, leve, order intent)
│   ├── /@slug/reservas           → Sistema de reservas (se habilitado)
│   └── /@slug/contato            → Contato (WhatsApp, mapa, horários)
│
├── /app [Merchant Portal]
│   ├── / (home)                  → Dashboard (estado: ghost/live, próxima ação, impacto)
│   ├── /bootstrap                → Assistente de setup (wizard) - DEPRECATED (usar /start)
│   ├── /start/*
│   │   ├── /identity             → Passo 1: Nome + descrição do restaurante
│   │   ├── /slug                 → Passo 2: URL slug + preview
│   │   ├── /menu                 → Passo 3: Cardápio (carregar ou criar básico)
│   │   ├── /payments             → Passo 4: Pagamentos (opcional com explicação)
│   │   └── /publish              → Passo 5: Checklist final + publicar
│   ├── /tpv-ready                → Estado pós-publicação (checklist, link público, TPV)
│   ├── /setup
│   │   ├── /identity             → Editar identidade (pós-publicação)
│   │   ├── /menu                 → Gerenciar cardápio
│   │   ├── /appearance           → Customização visual (cores, logo, etc)
│   │   ├── /schedule             → Horários de funcionamento
│   │   ├── /team                 → Gerenciar staff (AppStaff integration)
│   │   └── /compliance           → Legal/HACCP/formação
│   ├── /orders                   → Histórico de pedidos
│   └── /analytics                → KPIs (vendas, fairness, compliance)
│
├── /app/tpv [Point of Sale]
│   ├── /                         → Dashboard (pedidos ativos)
│   ├── /mesas-[id]               → Mesa específica (pedidos + carrinho)
│   ├── /pedido-[id]              → Detalhe do pedido (admin + operação)
│   ├── /checkout                 → Fecho de conta
│   └── /admin                    → Config do TPV (modos, impressoras, etc)
│
└── /app/staff [AppStaff — Staff OS]
    ├── /                         → Check-in + próximas tarefas
    ├── /turno                    → Detalhes do turno + timing
    ├── /tarefas                  → Lista de tarefas (filtro por risco)
    ├── /risco                    → Visão de risco (score pessoal + comparado)
    ├── /formacao                 → Cursos + compliance obrigatório
    ├── /manager
    │   ├── /pessoas              → Lista de staff em turno
    │   ├── /risco-equipe         → Risco agregado + alertas
    │   └── /pendencias           → HACCP + compliance + auditoria
    └── /owner
        ├── /sistema              → Health + audit trail
        ├── /compliance-audit     → Compliance por período
        └── /fairness             → Distribuição de carga por worker
```

---

## 2. DESIGN SYSTEM (Tokens + Componentes)

### 2.1 Paleta de Cores

| Função | Cor | Hex | Uso |
|--------|-----|-----|-----|
| **Primary** | Verde Chefiapp | `#2A9D3E` | CTAs, badges de sucesso |
| **Secondary** | Azul Administrativo | `#1A4D7A` | Panels, headers, destaques |
| **Success** | Verde Claro | `#4CAF50` | Status "OK", publicado, live |
| **Warning** | Âmbar | `#FF9800` | Alertas, pendências, ações necessárias |
| **Error** | Vermelho | `#EF5350` | Erros, violações, ghost (não publicado) |
| **Neutral-900** | Quase preto | `#1A1A1A` | Texto principal |
| **Neutral-500** | Cinza médio | `#757575` | Texto secundário, disabled |
| **Neutral-100** | Branco/gelo | `#F5F5F5` | Backgrounds leves |
| **Neutral-0** | Branco puro | `#FFFFFF` | Cards, inputs |

**Truth States (Assinatura do Produto):**
- `ghost`: Vermelho (`#EF5350`) — Não publicado, em setup
- `live`: Verde (`#4CAF50`) — Publicado e pronto para TPV

### 2.2 Tipografia

| Escala | Font | Size | Weight | Linha | Uso |
|--------|------|------|--------|-------|-----|
| **Display-L** | Inter/system | 32px | 700 | 1.2 | Títulos de página (h1) |
| **Display-M** | Inter/system | 24px | 700 | 1.3 | Seções (h2) |
| **Display-S** | Inter/system | 20px | 600 | 1.4 | Subtítulos (h3) |
| **UI-L** | Inter/system | 16px | 500 | 1.5 | Corpo principal, labels |
| **UI-M** | Inter/system | 14px | 500 | 1.5 | UI secundária, hints |
| **UI-S** | Inter/system | 12px | 400 | 1.4 | Micro-copy, timestamps |

**Implementação:** CSS custom properties + fallback para system fonts

### 2.3 Spacing Grid (8px base)

```
xs:   4px   (2 × 8px)
sm:   8px   (1 × 8px)
md:   16px  (2 × 8px)
lg:   24px  (3 × 8px)
xl:   32px  (4 × 8px)
2xl:  48px  (6 × 8px)
3xl:  64px  (8 × 8px)
```

### 2.4 Raio de Borda

```
none:   0px
xs:     4px   (inputs, chips)
sm:     8px   (cards)
md:     12px  (modals, panels)
lg:     16px  (buttons, large containers)
full:   9999px (pills, avatares)
```

### 2.5 Elevação (PWA-friendly, sutil)

```
none:   sem sombra
sm:     0 2px 4px rgba(0,0,0,0.08)
md:     0 4px 8px rgba(0,0,0,0.12)
lg:     0 8px 16px rgba(0,0,0,0.15)
xl:     0 12px 24px rgba(0,0,0,0.18)
```

### 2.6 Breakpoints (Mobile-first)

```
mobile:  0px (default)
tablet:  768px
desktop: 1024px
wide:    1440px
```

---

## 3. COMPONENTES DO DESIGN SYSTEM (Biblioteca)

### 3.1 Componentes Base

| Componente | Props | Comportamento | Notas |
|------------|-------|---------------|-------|
| **AppShell** | `children`, `topbar`, `sidebar?`, `mobile?` | Layout container (header + sidebar/bottom-nav + main) | Responsivo: sidebar desktop, bottom-nav mobile |
| **TopBar** | `title`, `action?`, `back?` | Topo (logo/título + ação) | CTA principal à direita |
| **SideNav** | `items`, `active` | Menu lateral com ícones + labels | Desktop only, colapsável |
| **BottomNav** | `items`, `active` | Menu inferior (5 abas max) | Mobile only |
| **Stepper** | `steps`, `current`, `onChange` | Indicador de progresso (onboarding) | Visual + microcopy |
| **StepCard** | `title`, `description`, `children`, `status` | Container de step (identity/slug/menu/etc) | Status: active/complete/pending |
| **TruthBadge** | `state: 'ghost'\|'live'` | Badge com ícone + tooltip | ghost=vermelho, live=verde |
| **ContractGateCard** | `contractId`, `satisfied`, `blocker`, `action` | Card de contrato (bloqueado ou OK) | Mostra por quê está bloqueado |
| **RiskChip** | `level: 'LOW'\|'MED'\|'HIGH'`, `value?` | Badge de risco (cor + ícone) | HIGH=vermelho, MED=âmbar, LOW=cinza |
| **ShiftCard** | `shift`, `worker`, `onClick` | Card de turno (worker + horário + status) | Mostra check-in/out, pendências |
| **TaskCard** | `task`, `riskLevel`, `status`, `onClick` | Card de tarefa (título + risco + botão ação) | Status: pending/in-progress/done |
| **OrderCard** | `order`, `status`, `items`, `total` | Card de pedido (TPV) | Status visual óbvio (novo/preparo/pronto/pago) |
| **EmptyState** | `icon`, `title`, `description`, `action` | Estado vazio com guia + CTA | Sempre com próximo passo claro |
| **DataTable** | `columns`, `rows`, `onRowClick`, `filters?` | Tabela com sort/filter | Responsivo: stack em mobile |
| **QuickFilter** | `filters`, `active`, `onChange` | Filtros rápidos (pills) | Sticky top em listas |
| **Modal** | `open`, `title`, `children`, `actions` | Dialog com título + footer | Fundo escuro, overlay |
| **Toast** | `type: 'success'\|'error'\|'info'`, `message`, `action?` | Notificação inline | Auto-dismiss em 4s |

### 3.2 Padrões de Interação

**Loading States:**
- Skeleton loaders em cards
- Spinner centralizado em telas inteiras
- Placeholder de texto cinza 50%

**Error States:**
- Ícone de erro + mensagem clara
- Sugestão de ação (retry, contact support)
- Toast com erro detalhado

**Success States:**
- Ícone de check + mensagem confirmação
- Highlight breve em verde
- Redirect automático ou CTA para próximo passo

**Disabled States:**
- Opacity 50% + cursor não-permitido
- Tooltip explicativo (hover)

**Protecting Critical Actions:**
"Segure para confirmar" em:
- Deletar cardápio/staff
- Despublicar restaurante
- Fechar conta (TPV)

---

## 4. MICROCOPY + COPY GUIDELINES

### 4.1 Tone & Voice

- **Tom:** Claro, direto, amigável, sem jargão
- **Para Cliente (público):** "Peça agora", "Ver cardápio", "Chamar garçom"
- **Para Merchant:** "Falta [X]", "Próximo: [Y]", "Isso libera [Z]"
- **Para Staff:** "Você tem [X] tarefas", "Risco: [LEVEL]", "Formação obrigatória"

### 4.2 Padrões de Microcopy

| Contexto | Padrão | Exemplo |
|----------|--------|---------|
| **CTA Principal** | Verbo + substantivo | "Começar setup", "Publicar agora", "Enviar cozinha" |
| **CTA Secundária** | Ação mais suave | "Voltar", "Pular", "Mais tarde" |
| **Bloqueio** | "[Contrato] bloqueado. Falta: [X]. Impacto: [Y]" | "Menu bloqueado. Falta: 3 itens. Impacto: Não pode publicar." |
| **Sucesso** | "✓ [Ação] concluída! Próximo: [Y]" | "✓ Identidade salva! Próximo: criar slug" |
| **Erro** | "Erro: [Razão]. [Ação recomendada]" | "Erro: slug já existe. Tente outro." |
| **Empty State** | "Nenhum [X] ainda. [CTA para criar]" | "Nenhuma tarefa concluída. Voltar à lista." |
| **Pendência** | "⚠ [X] obrigatório pendente" | "⚠ Formação obrigatória pendente (HACCP)" |

---

## 5. FLUXOS PRINCIPAIS

### 5.1 Onboarding (Novo Merchant)

```
entrada: /app → redireciona para /start/identity (ghost state)
      ↓
step 1: identity
  • Nome do restaurante
  • Descrição curta
  • Imagem logo (opcional)
  → salva em RestaurantIdentity
  → TruthState: ghost
      ↓
step 2: slug
  • URL slug (e.g., "meu-restaurante")
  • Preview: "chefidapp.app/@meu-restaurante"
  • Validação (não pode duplicar)
      ↓
step 3: menu
  • Criar menu básico (5 itens mínimo)
  • Ou importar de template
  • Cada item: nome, preço, categoria
  → Contract: MenuContract (min 5 items)
      ↓
step 4: payments (OPCIONAL)
  • "Quer receber pagamentos agora?"
  • SIM → Stripe integration + demo account
  • NÃO → Cash only (válido, TPV funciona normal)
      ↓
step 5: publish
  • Checklist: identity ✓ slug ✓ menu ✓
  • Explicação: "Ao publicar, seu restaurante fica visível. TPV fica pronto."
  • Botão: "Publicar e ir para TPV"
  → TruthState: live
  → redireciona /app/tpv-ready

timeline: 5–10 minutos (sem paradas, "no-friction")
```

### 5.2 Home Dashboard (Merchant)

```
estado ghost:
  ┌──────────────────────────────────┐
  │ Você está em setup               │
  │ (Vermelho = não publicado)       │
  ├──────────────────────────────────┤
  │ 1. Identidade        ✓ Completo  │
  │ 2. Slug              ✓ Completo  │
  │ 3. Menu              ⚠ 3/5 itens │
  │ 4. Payments          ⊘ Opcional  │
  │ 5. Publicar          → AÇÃO      │
  │                                  │
  │ [Continuar setup]                │
  └──────────────────────────────────┘
  
  impacto:
  • Publicar libera: Link público + TPV ready
  • Menu completo (5+) garante: clientes veem oferecimento mínimo

estado live:
  ┌──────────────────────────────────┐
  │ Restaurante publicado (Verde)    │
  │ Link: chefidapp.app/@seu-slug    │
  ├──────────────────────────────────┤
  │ Hoje:                            │
  │ • 12 pedidos                     │
  │ • R$ 380,00 total                │
  │ • Fairness: ✓ Equilibrado        │
  │ • Compliance: ✓ OK               │
  │                                  │
  │ [Ir para TPV] [Mais]             │
  └──────────────────────────────────┘
```

### 5.3 TPV (Point of Sale)

```
tela principal:
  ┌─────────────────────────────────────┐
  │ PEDIDOS ATIVOS (KDS-lite)           │
  ├─────────────────────────────────────┤
  │ [NOVO] [EM PREPARO] [PRONTO]        │
  │                                     │
  │ Mesa 1 - R$ 45,00    [Enviar]       │
  │ • 2x Pastel                         │
  │ • 1x Suco                           │
  │                                     │
  │ Mesa 3 - R$ 120,00   [Fechar]       │
  │ • Moqueca completa                  │
  │ • 2x Água com gás                   │
  │ [Status: PRONTO]                    │
  └─────────────────────────────────────┘

ações críticas (com "hold to confirm"):
  • "Enviar cozinha" → bloqueia edição do pedido
  • "Fechar conta" → calcula total + método pagamento
  • "Deletar item" → requer 2s hold

estados visuais óbvios:
  • novo = fundo branco (atenção imediata)
  • em-preparo = fundo azul (processando)
  • pronto = fundo verde (pronto para servir)
  • pago = fundo cinza (arquivo)
```

### 5.4 AppStaff (Worker View)

```
check-in:
  ┌────────────────────────────────┐
  │ Bem-vindo, João!               │
  │                                │
  │ Turno: 10:00 — 18:00           │
  │ Tempo online: 2h 15m           │
  │                                │
  │ [CHECK-IN] [VER TURNO]          │
  └────────────────────────────────┘
      ↓ clica check-in
  → abre tarefas do dia

tarefas:
  ┌────────────────────────────────┐
  │ HOJE - 4 tarefas (1 urgente)    │
  ├────────────────────────────────┤
  │ ⚠ [HIGH] Auditoria HACCP       │
  │          até 15:00              │
  │          [INICIAR]              │
  │                                │
  │ [MED] Verificar estoque         │
  │       [MARCADO] ✓               │
  │                                │
  │ [LOW] Limpar área comum         │
  │       [PENDENTE]                │
  │                                │
  │ Seu risco de hoje: 6            │
  │ Média da equipe: 2.8            │
  │ Status: ⚠ ACIMA DA MÉDIA        │
  └────────────────────────────────┘

manager dashboard:
  ┌────────────────────────────────┐
  │ EQUIPE EM TURNO (6 pessoas)     │
  ├────────────────────────────────┤
  │ João (Cozinha)   — Risco: 6    │
  │ Maria (Atendimento)  — Risco: 2  │
  │ Pedro (Gerente)  — Risco: 1    │
  │                                │
  │ ⚠ Pendências HACCP:            │
  │  • Auditoria 15:00 (João)       │
  │  • Limpeza 16:00 (aberto)       │
  │                                │
  │ Fairness score: 3.2 (OK)        │
  └────────────────────────────────┘
```

---

## 6. PÁGINAS PÚBLICAS (/@slug)

### 6.1 Landing (/@slug)

```
hero:
  • Imagem background
  • Nome restaurante
  • Descrição curta
  • Horários + "aberto agora?"
  • Botões: "[Ver cardápio]" "[Fazer reserva]" "[Chamar]"

seções:
  • Cardápio destaques (3 itens)
  • Reviews (últimos 3, se houver)
  • Localização (mapa + endereço)
  • Contato (WhatsApp, telefone, horários)

mobile-first: tudo em 1 coluna, abas scrolláveis
```

### 6.2 Menu (/@slug/menu)

```
layout:
  • Categorias como abas (Entrada, Prato, Bebida, Sobremesa)
  • Cada item: foto, nome, preço, descrição
  • Clique → detalhe + "Adicionar ao carrinho"
  • Carrinho flutuante (sticky bottom)

performance:
  • Lazy load de fotos
  • Sem JavaScript pesado
  • PWA-friendly (offline capable)
```

---

## 7. PADRÕES DE QA/TESTES UI

### 7.1 Checklist Responsividade

- [ ] Mobile (320px) — sem overflow, toque >= 44px
- [ ] Tablet (768px) — 2 colunas, sidebar visível
- [ ] Desktop (1024px+) — layout completo
- [ ] Modo escuro (prefers-color-scheme) — todo testado

### 7.2 Acessibilidade

- [ ] Contraste >= 4.5:1 (WCAG AA)
- [ ] Labels em inputs, buttons com aria-label
- [ ] Keyboard navigation completa (tab, enter, esc)
- [ ] Sem "color only" para status (ícone + cor)

### 7.3 Performance

- [ ] Tela carrega em < 3s (mobile 4G)
- [ ] Interações são responsivas (< 100ms feedback)
- [ ] Nenhuma render desnecessária (React profiler)
- [ ] Bundle < 150KB (gzipped)

### 7.4 Comportamento

- [ ] Loading states aparecem instantaneamente
- [ ] Erros não desaparecem sozinhos (requer ação)
- [ ] CTAs desabilitadas têm tooltip
- [ ] Dados não são perdidos (form recovery)

---

## 8. PRÓXIMAS FASES

### Fase 1 (Agora)
- ✅ UI_SPEC_MASTER (este documento)
- ✅ Design System (tokens, componentes base)
- 🔄 Onboarding screens (identity → publish)

### Fase 2
- Merchant home (ghost/live states)
- TPV (lista pedidos, detalhe, checkout)
- AppStaff (check-in, tarefas, manager)

### Fase 3
- Public pages (/@slug, /@slug/menu)
- Social kit (templates + calendário)
- Analytics dashboard

---

## 9. CONVENTIONS & NAMING

### File Structure
```
merchant-portal/src/
├── ui/
│   ├── design-system/
│   │   ├── tokens.ts           # Cores, tipografia, spacing
│   │   ├── components.ts       # Exports todos os componentes
│   │   └── [ComponentName].tsx # Um arquivo por componente
│   ├── [PageName]/
│   │   ├── [PageName].tsx      # Componente de página
│   │   └── hooks/              # Hooks específicos da página
│   └── shared/
│       ├── AppShell.tsx
│       ├── TopBar.tsx
│       └── ...
├── pages/
│   ├── Onboarding/
│   ├── Home.tsx
│   ├── TPV/
│   └── AppStaff/
├── hooks/
│   ├── useMerchant.ts
│   ├── useAppStaff.ts
│   └── ...
└── utils/
    ├── classNames.ts           # Utility para classes condicionais
    └── validators.ts
```

### Component Naming
- Components: PascalCase (`AppShell`, `TruthBadge`)
- Props: camelCase (`isActive`, `onClick`)
- Events: on + Verb (`onChange`, `onSubmit`)
- Booleans: is/has prefix (`isLoading`, `hasError`)

---

## 10. CHANGELOG

| Data | Versão | Mudança |
|------|--------|---------|
| 2025-12-24 | 1.0 | Documento criado, rotas mapeadas, tokens definidos, componentes listados |

---

**Próximo:** Implementação do Design System em `merchant-portal/src/ui/design-system/`
