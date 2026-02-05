# Mobile-first checklist

**Propósito:** Garantir que o fluxo Landing → Trial → Onboarding → Operação funciona em mobile: viewport, breakpoints, alvos de toque (mín. 44px), navegação e modais utilizáveis em ecrã pequeno. Sem novo backend; apenas front-end.

**Ref:** [WIREFLOW_10_TELAS.md](WIREFLOW_10_TELAS.md), [ONBOARDING_FLOW_CONTRACT.md](../contracts/ONBOARDING_FLOW_CONTRACT.md), [FUNIL_VIDA_CLIENTE.md](../contracts/FUNIL_VIDA_CLIENTE.md).

---

## 1. Viewport e meta

| Item | Estado | Ficheiro / nota |
|------|--------|-----------------|
| `meta viewport` com `width=device-width, initial-scale=1` | OK | [merchant-portal/index.html](../../merchant-portal/index.html) — `width=device-width, initial-scale=1.0, maximum-scale=5.0` |
| `mobile-web-app-capable` / `apple-mobile-web-app-capable` | OK | index.html — `yes` |
| `theme-color` | OK | index.html — `#121212` |
| Body `min-width` para evitar colapso em ecrãs muito pequenos | OK | [merchant-portal/src/index.css](../../merchant-portal/src/index.css) — `min-width: 320px` |

---

## 2. Breakpoints (design system)

| Breakpoint | Valor | Uso |
|------------|--------|-----|
| sm | 640px | [tokens.css](../../merchant-portal/src/ui/design-system/tokens.css) |
| tablet | 768px | idem |
| md | 860px | idem |
| desktop | 1024px | idem |
| lg | 1100px | idem |
| wide | 1440px | idem |

Componentes que já usam `@media (max-width: 767px)` ou similar: AppShell, TopBar, MobileNav, Toast, OrderCard, KpiCard, ShiftCard, TaskCard, Stepper, CoreStatusBanner, product-landing.css. Landing tem breakpoints em 1024, 768, 480, 400, 360.

---

## 3. Alvos de toque (mín. 44px)

| Componente | Estado | Ficheiro / nota |
|------------|--------|-----------------|
| Button (height) | OK | [Button.css](../../merchant-portal/src/ui/design-system/Button.css) — `height: 44px`; tokens `--button-height: 44px` |
| Input (height) | OK | [Input.css](../../merchant-portal/src/ui/design-system/Input.css) — `height: 44px`; tokens `--input-height: 44px` |
| TopBar / ícones | OK | TopBar.css — `min-width: 48px`, `min-width: 44px` em media |
| MobileNav (bottom nav) | OK | MobileNav.css — `min-width: 64px` por item; media `min-width: 768px` esconde em desktop |

Botões e inputs do design system já cumprem 44px. Verificar páginas que usam estilos inline ou componentes custom sem tokens.

---

## 4. Telas críticas (10 telas) — ajustes por tela

| # | Tela | Rota / componente | Ajustes necessários |
|---|------|--------------------|---------------------|
| 1 | Landing | ProductFirstLandingPage, product-landing.css | Já tem @media 1024, 768, 480, 400, 360. Verificar CTAs com min-height em mobile. |
| 2 | Login / Signup | AuthPage | Garantir formulário e CTAs com 44px; sem largura fixa que quebre em 320px. |
| 3 | Criar restaurante | BootstrapPage | Formulário e botões; garantir stack vertical em mobile e toque 44px. |
| 4 | Menu mínimo | FirstProductPage, /app/setup/menu | Idem; modais ou páginas utilizáveis em altura pequena. |
| 5 | Escolher modo | (ainda pode ser parte de wizard) | Quando implementado: dois botões/cartões com 44px+ de altura de toque. |
| 6 | Primeira venda | TPV (TPVMinimal) + guia | TPV já usado em tablets; garantir botoes de acção com 44px em mobile. |
| 7 | Dashboard | DashboardPortal | Sidebar colapsa / MobileNav em 767px; cartões empilhados. |
| 8 | TPV | TPVMinimal | Grelha de produtos e carrinho utilizáveis; botoes de pagamento 44px. |
| 9 | KDS | KDSMinimal | Colunas/cartões que empilham ou scroll horizontal em mobile. |
| 10 | AppStaff | AppStaffMobileOnlyPage / TaskDashboard | Lista e acções com 44px. |

---

## 5. Navegação em mobile

| Item | Estado | Nota |
|------|--------|------|
| MobileNav (bottom) para /op ou app | OK | MobileNav.css — visível em max-width 767px; min-width 64px por item |
| Sidebar colapsa em ecrã pequeno | OK | AppShell, SideNav — media 767px |
| Links e botões de navegação com área de toque suficiente | Verificar | Evitar links só com ícone pequeno sem padding; usar min-height/min-width 44px onde faltar |

---

## 6. Modais de onboarding em ecrã pequeno

| Item | Estado | Nota |
|------|--------|------|
| Modais com max-width e scroll interno | OK em StripePaymentModal | StripePaymentModal.module.css — max-width 500px; conteúdo scrollável |
| BootstrapPage como página única | Actual | Não é modal; garantir que formulário não transborda em 320px e botões são 44px |
| FirstProductPage / setup | Actual | Garantir que steps e formulários são utilizáveis em altura reduzida (scroll, sem overflow fixo) |

---

## 7. Implementação mínima aplicada

- **Viewport / meta:** Já correctos; nenhuma alteração.
- **Body min-width:** Já 320px; nenhuma alteração.
- **Design system (Button, Input):** Já 44px; nenhuma alteração.
- **Breakpoints e media:** Já existem em tokens e em múltiplos componentes; nenhuma alteração estrutural.
- **Ajustes pontuais (se necessário):** Em páginas que não usem o design system (ex.: BootstrapPage com estilos próprios), garantir que botões e inputs tenham pelo menos 44px de altura e que formulários usem width 100% ou max-width 100% em containers para não transbordar em mobile. Se houver elementos com largura fixa > 100vw, corrigir para max-width: 100% ou 100vw.

---

## 8. Resumo

- **Viewport e PWA meta:** OK.
- **Breakpoints:** Definidos e em uso.
- **Alvos de toque 44px:** OK para Button e Input do design system; páginas que usam estes componentes herdam o comportamento. Páginas com componentes custom devem seguir o mesmo critério.
- **Navegação mobile:** MobileNav e sidebar já respondem a 767px.
- **Próximos passos (opcional):** Ao implementar os 4 passos de onboarding como modais, garantir que cada modal tem max-height em mobile (ex.: 90vh) com scroll interno e CTAs com 44px. Auditar BootstrapPage e FirstProductPage em viewport 390x844 e 320x568 para confirmar que não há overflow horizontal ou botões demasiado pequenos.
