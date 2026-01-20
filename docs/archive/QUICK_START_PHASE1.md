# 🚀 QUICK START — UI/UX Phase 1

**TL;DR:** Design System + Onboarding completos. Ready for Phase 2.

---

## 📁 O QUE FOI CRIADO

### Documentação (Ler em ordem)
1. **[PHASE1_UI_UX_SUMMARY.txt](./PHASE1_UI_UX_SUMMARY.txt)** — Resumo visual (este arquivo)
2. **[UI_SPEC_MASTER.md](./UI_SPEC_MASTER.md)** — Especificação completa (350+ linhas)
3. **[SOCIAL_KIT.md](./SOCIAL_KIT.md)** — Templates sociais (9 templates)
4. **[UI_UX_IMPLEMENTATION_STATUS.md](./UI_UX_IMPLEMENTATION_STATUS.md)** — Rastreamento

### Código (Pronto para usar)
```
✅ merchant-portal/src/ui/design-system/
   • tokens.ts                    — Colors, typography, spacing, etc.
   • AppShell.tsx + .css          — Layout principal
   • Button.tsx + .css            — CTAs
   • Card.tsx + .css              — Containers
   • TruthBadge.tsx + .css        — Estado ghost/live
   • Stepper.tsx + .css           — Onboarding progress
   • RiskChip.tsx + .css          — Risk levels
   • EmptyState.tsx + .css        — Placeholder com CTA
   • index.ts                     — Exports centralizados

✅ merchant-portal/src/pages/Onboarding/
   • Onboarding.tsx + .css        — Container
   • steps/Step1Identity.tsx      — Nome + descrição
   • steps/Step2Slug.tsx          — URL + preview
   • steps/Step3Menu.tsx          — Cardápio (5+ itens)
   • steps/Step4Payments.tsx      — Stripe vs Cash
   • steps/Step5Publish.tsx       — Checklist + publicar
```

---

## 🎯 COMEÇAR A USAR AGORA

### 1. Importar componentes
```typescript
import { AppShell, Button, Card, TruthBadge } from '../../ui/design-system';
import { Colors, Spacing } from '../../ui/design-system/tokens';
```

### 2. Usar em uma página
```tsx
<AppShell>
  <Card padding="lg">
    <h1>Bem-vindo</h1>
    <TruthBadge state="ghost" showLabel={true} />
    <Button onClick={handleNext}>Continuar</Button>
  </Card>
</AppShell>
```

### 3. Customizar com CSS
```css
.my-element {
  background-color: var(--color-primary, #2a9d3e);
  padding: var(--spacing-lg, 24px);
  border-radius: var(--radius-sm, 8px);
  transition: var(--transition-standard, 200ms cubic-bezier(0.4, 0, 0.2, 1));
}
```

---

## 📊 ARQUIVOS POR FUNÇÃO

| Função | Arquivo | Linhas | Leitura |
|--------|---------|--------|---------|
| **Especificação** | UI_SPEC_MASTER.md | 350+ | 20 min |
| **Design System** | tokens.ts | 250+ | 10 min |
| **Design System** | AppShell/Button/Card | 850+ | código |
| **Onboarding** | Onboarding + steps | 1150+ | código |
| **Social Kit** | SOCIAL_KIT.md | 400+ | 30 min |
| **Status** | UI_UX_IMPLEMENTATION_STATUS.md | 400+ | ref |

---

## 🔄 PRÓXIMA FASE (Dias 3-4)

### Tasks Recomendadas (em ordem)

1. **Merchant Home** (4h)
   - Dashboard com TruthBadge (ghost/live)
   - Checklist se ghost
   - KPIs se live
   - Usar Card, Button, AppShell

2. **TPV** (6h)
   - Pedidos ativos
   - OrderCard component (novo)
   - Detalhe + carrinho + checkout
   - Hold-to-confirm actions

3. **AppStaff** (8h)
   - 3 views: Worker, Manager, Owner
   - TaskCard, ShiftCard (novos)
   - RiskChip integrado

4. **Public Pages** (5h)
   - /@slug (landing)
   - /@slug/menu (cardápio)
   - /@slug/contato (maps + whatsapp)

---

## 🎨 DESIGN SYSTEM HIGHLIGHTS

### Colors
```
Primary:   #2A9D3E (Verde Chefiapp)
Secondary: #1A4D7A (Azul Administrativo)
Ghost:     #EF5350 (Vermelho — não publicado)
Live:      #4CAF50 (Verde — publicado)
```

### Typography
```
Display Large:  32px / 700 weight
Display Medium: 24px / 700 weight
Display Small:  20px / 600 weight
UI Large:       16px / 500 weight
UI Medium:      14px / 500 weight
UI Small:       12px / 400 weight
```

### Spacing (8px base)
```
xs:  4px    sm:  8px    md:  16px   lg:  24px
xl: 32px   2xl: 48px   3xl: 64px
```

---

## ✅ CHECKLIST ANTES DE PHASE 2

- [ ] Leia [PHASE1_UI_UX_SUMMARY.txt](./PHASE1_UI_UX_SUMMARY.txt) (este arquivo)
- [ ] Leia [UI_SPEC_MASTER.md](./UI_SPEC_MASTER.md) (rotas + componentes)
- [ ] Explore `/src/ui/design-system/` (código)
- [ ] Explore `/src/pages/Onboarding/` (onboarding pronto)
- [ ] Revise [SOCIAL_KIT.md](./SOCIAL_KIT.md) (templates sociais)
- [ ] Decida ordem Phase 2 (home → tpv → appstaff → public)
- [ ] Comece em Home (foundational)

---

## 🎯 DECISÕES DE DESIGN RATIFICADAS

| Item | Escolha | Razão |
|------|---------|-------|
| **Framework UI** | Nenhum (React + CSS) | Full control, zero overhead |
| **Tokens** | Sim | Reutilização + consistência |
| **Mobile-first** | Sim | Usuários em campo (mobile priority) |
| **Truth State** | ghost/live | Diferencial + claro visualmente |
| **Onboarding steps** | 5 | Sweet spot (friction vs. completude) |
| **Social templates** | 9 | Coverage + praticamente |
| **Accessibility** | WCAG AA | Standards + inclusão |

---

## 📞 PRÓXIMO PASSO

**Quer começar Phase 2 agora ou prefere revisar Phase 1?**

Se começar Phase 2:
1. Qual prioridade? (Home → TPV → AppStaff → Public)
2. Qual timeline? (48h? 1 semana?)
3. Alguém vai ajudar ou é solo?

Se revisar Phase 1:
- Qual feedback?
- Ajustar algo no design system?
- Mais templates sociais?

---

## 🔗 LINKS RÁPIDOS

- [Spec completa](./UI_SPEC_MASTER.md)
- [Design System código](./merchant-portal/src/ui/design-system/)
- [Onboarding código](./merchant-portal/src/pages/Onboarding/)
- [Social Kit](./SOCIAL_KIT.md)
- [Status rastreamento](./UI_UX_IMPLEMENTATION_STATUS.md)

---

**Status:** 🟢 PHASE 1 CONCLUÍDA | 🔄 PHASE 2 AGUARDANDO GO
