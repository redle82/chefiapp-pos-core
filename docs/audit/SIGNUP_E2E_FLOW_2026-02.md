# Fluxo E2E Self-Service Signup — Mapa e Gaps

**Data:** 2026-02-13  
**Objetivo:** Documentar o fluxo landing→signup→trial→paywall→subscribe e o que está costurado vs. o que falta (Bloqueador 3).

---

## Fluxo pretendido

1. **Landing** — Utilizador clica "Começar agora" / "Ver sistema em 3 min" → `/auth` (redirect `/auth/phone`).
2. **Auth** — Login/registo (telefone ou email conforme rota). Após sucesso → destino conforme tipo: **novo signup** → `/setup/restaurant-minimal`; **login** → `getLastRoute()` (ex.: `/app/dashboard`).
3. **Bootstrap / Setup mínimo** — Sem restaurante: FlowGate redireciona para `/setup/restaurant-minimal` (ou `/bootstrap`). Utilizador cria primeiro restaurante (identidade, etc.). Após sucesso → tem organização → pode aceder ao dashboard/operação.
4. **Trial** — Restaurante novo entra em trial (coreBillingApi + getBillingStatusWithTrial). PaymentGuard não bloqueia; BillingBanner pode mostrar aviso.
5. **Paywall** — Quando trial expira ou conta em atraso: PaymentGuard mostra GlobalBlockedView e ação "Escolher plano" → `/app/billing`.
6. **Subscribe** — Em `/app/billing` utilizador escolhe plano e completa pagamento (Stripe). Após sucesso → redirect para `/billing/success` ou dashboard; PaymentGuard passa a considerar conta ativa.

---

## Estado atual no código

| Etapa | Estado | Notas |
|-------|--------|--------|
| Landing → Auth | ✅ | Hero/Footer/ProductFirstLandingPage e LandingV2: CTA para `/auth`. `/signup` e `/login` → `/auth/phone`. |
| Auth → destino | ✅ (após melhoria) | Com `chefiapp_signup_intent`: novo signup vai para `/setup/restaurant-minimal`. Login usa `getLastRoute()`. |
| Sem restaurante → Setup | ✅ | CoreFlow: `!hasOrg` → REDIRECT `/setup/restaurant-minimal`. LifecycleState: BOOTSTRAP_REQUIRED → mesmo destino. FlowGate aplica. |
| Bootstrap / Setup | ✅ | Rotas `/bootstrap` (BootstrapPage) e `/setup/restaurant-minimal` (RestaurantMinimalSetupPage). RequireApp sem tenant → `/bootstrap`. |
| Trial | ✅ | coreBillingApi.getBillingStatusWithTrial; PaymentGuard usa trial_expired; BillingBanner. |
| Paywall (trial expirado) | ✅ | PaymentGuard: status past_due + trialExpired → GlobalBlockedView → "Escolher plano" → `/app/billing`. |
| Subscribe (Stripe) | ⚠️ | Página `/app/billing` e BillingBroker/Stripe existem; **validar** URL de retorno após pagamento e que PaymentGuard reconhece subscrição ativa. |

---

## O que falta (costura fina)

1. **Auth (email + telefone):** *Implementado.* Novo signup com `mode=signup` define sessionStorage `chefiapp_signup_intent` antes de signIn (AuthPage) ou ao montar PhoneLoginPage quando URL tem `?mode=signup`. Redirect global (`SignupIntentRedirect` em App.tsx): quando sessão fica definida e intent existe, redireciona para `/setup/restaurant-minimal` e limpa o intent. CTAs de registo na LandingV2 (HeroV2, CTABannerV2) usam `/auth/phone?mode=signup`.
2. **Stripe return URL:** Garantir que após checkout Stripe o redirect vai para `/billing/success` ou `/app/dashboard` e que o PaymentGuard revalida estado (polling ou reload).
3. **E2E automatizado:** Teste Playwright que percorra landing → auth (mock OTP se necessário) → setup mínimo → dashboard/trial → (opcional) paywall. Ver Essencial 9 (mock OTP + reativar create-first-restaurant).

---

## Referências

- CoreFlow: `merchant-portal/src/core/flow/CoreFlow.ts` (REDIRECT quando !hasOrg).
- LifecycleState: `merchant-portal/src/core/lifecycle/LifecycleState.ts` (BOOTSTRAP_REQUIRED, destino canónico).
- FlowGate: `merchant-portal/src/core/flow/FlowGate.tsx`.
- PaymentGuard: `merchant-portal/src/core/billing/PaymentGuard.tsx`.
- Rotas auth/setup: `merchant-portal/src/routes/MarketingRoutes.tsx`.
- Mapa lançamento: `docs/audit/LANCAMENTO_GAP_ATUALIZADO_2026-02.md` (Bloqueador 3).
