# Auditoria: `return null` perigosos

Lista de `return null` que podem deixar o utilizador com ecrã vazio em rotas/páginas principais. Regra: **nunca** `return null` no conteúdo principal de uma rota; usar sempre um estado visual (EmptyState, loading, ou vista por estado).

## Perigosos (páginas/rotas — corrigir ou documentar)

| Ficheiro | Linha | Contexto | Ação sugerida |
|----------|-------|----------|----------------|
| `merchant-portal/src/pages/Dashboard/DashboardPortal.tsx` | 665 | Redirect `billing=success` | OK — redirect, não conteúdo. |
| `merchant-portal/src/pages/AuthPage.tsx` | 230 | Já tem sessão | ✅ Corrigido: GlobalLoadingView "A redirecionar..." em vez de null. |
| `merchant-portal/src/context/LifecycleStateContext.tsx` | 99 | PublicLifecycleSync | OK — componente de sync (headless), não é conteúdo de rota; irmão do Outlet. |
| `merchant-portal/src/components/Dashboard/OperationalMetricsCards.tsx` | 25 | `!restaurantId` | ✅ Corrigido: bloco "Configure o restaurante para ver as métricas do dia." |
| `merchant-portal/src/components/Dashboard/ShiftHistorySection.tsx` | 33 | `!restaurantId` | ✅ Corrigido: bloco "Configure o restaurante para ver o histórico por turno." |
| `merchant-portal/src/pages/Config/PublicQRSection.tsx` | 44 | `!restaurantId` | ✅ Corrigido: bloco CTA "Complete a configuração do restaurante (Config → Identidade) para gerar QR codes." |
| `merchant-portal/src/pages/Config/PublicPresenceFields.tsx` | 74 | `!restaurantId` | ✅ Corrigido: bloco CTA "Complete a configuração do restaurante para editar a página pública." |
| `merchant-portal/src/components/tasks/ShiftChecklistSection.tsx` | 101 | `!restaurantId` | ✅ Corrigido: bloco "Configure o restaurante para ver o checklist do turno." |
| `merchant-portal/src/components/Layout/AppLayout.tsx` | 43 | IdentityRunner | OK — headless (só corre hook); Outlet sempre renderiza. |
| `merchant-portal/src/core/activation/RequireActivation.tsx` | 147 | !isVerified | ✅ Corrigido: GlobalLoadingView "A verificar acesso...". |
| `merchant-portal/src/components/auth/RequireApp.tsx` | 23 | Loading/session | OK se for loading; senão usar spinner ou EmptyState. |
| `merchant-portal/src/core/tenant/TenantSelector.tsx` | 35 | !isMultiTenant / loading | ✅ Corrigido em TenantSelectorPage: loading + single-tenant com mensagem. |
| `merchant-portal/src/components/OnboardingReminder.tsx` | 26 | loading / completo | ✅ Corrigido: loading mostra placeholder "A carregar estado do onboarding…". |

## Aceitáveis (não são conteúdo principal da rota)

- **Modais / overlays**: `if (!open) return null` (IrreversibilityRitualModal, CreateTaskModal, QuickTaskModal, ExceptionReportModal).
- **Badges / indicadores**: DataModeBanner (live → null), BillingBanner, BillingWarningBadge, EnvBadge, ModeIndicator, CoreUnavailableBanner, FiscalAlertBadge, etc.
- **Componentes headless**: ThemeEngine.
- **Listas/items**: `if (categoryProducts.length === 0) return null` em células de lista; `if (order) return null` em item de lista.
- **PWA/Toast**: InstallAppPrompt, Toast (não visível → null).
- **Service worker / Stripe terminal**: condicionais de capacidade.

## Resumo

- **Corrigidos**: AuthPage, OperationalMetricsCards, ShiftHistorySection, PublicQRSection, PublicPresenceFields, ShiftChecklistSection, RequireActivation, TenantSelectorPage, OnboardingReminder — passam a mostrar estado visual (loading, CTA ou placeholder) em vez de null.
- **OK (headless/sync)**: LifecycleStateContext (PublicLifecycleSync), AppLayout (IdentityRunner), RequireApp (loading).
- **Deixar como está**: modais, badges, headless, items de lista, redirects.
