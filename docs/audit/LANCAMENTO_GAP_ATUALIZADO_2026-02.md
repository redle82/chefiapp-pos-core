# Mapa "O que falta para lançamento" — Atualizado (2026-02-13)

Este documento **alinha o mapa de auditoria** com o que **já foi implementado** no plano "Melhorias uma a uma" e nos checkpoints seguintes. O mapa original dizia "não foi feito" em vários itens que já têm código e testes.

---

## BLOQUEADORES — Estado real no código

| # | Item | Estado no mapa original | Estado real (após Melhorias uma a uma) | O que falta |
|---|------|-------------------------|----------------------------------------|-------------|
| **1** | **i18n** | 0% — "Zero library" | **100% fluxo crítico** — react-i18next em uso: `i18n.ts` (pt-PT, pt-BR, en, es) com namespaces `common`, `legal`, `billing`; BillingBanner e PaymentGuard com `useTranslation("billing")`; CookieConsentBanner e OfflineIndicator com `useTranslation("common")`; DataPrivacyPage, LegalTermsPage e LegalPrivacyPage com `useTranslation("legal")`; `main_debug.tsx` importa i18n. Toda a UI de cookie, offline, termos, privacidade, dados/privacidade e billing está traduzida em 4 locales. | Opcional: extrair resto da UI (TPV, KDS, onboarding, etc.) para namespaces e completar pt-PT/en nos mesmos. |
| **2** | **Recibo fiscal real** | 40% | **40%** — Inalterado. Schema SAF-T/ATCUD/TicketBAI e hash chain existem; falta recibo impresso com QR AT e export XML SAF-T + certificação AT. | 5 sem + 2–3 meses certificação AT. |
| **3** | **Self-service signup** | 55% | **~75%** — Fluxo documentado em `docs/audit/SIGNUP_E2E_FLOW_2026-02.md`. Auth email + telefone: intent `chefiapp_signup_intent` e redirect global para `/setup/restaurant-minimal`; CTAs LandingV2 (HeroV2, CTABannerV2) com `/auth/phone?mode=signup`; FlowGate envia sem restaurante para setup. Falta: validar return URL Stripe; E2E automatizado (mock OTP). | 1 sem. |
| **4** | **Offline-first** | 15% | **~85% (fase total)** — PWA manifest + Service Worker (precache + navigateFallback + runtime cache GET /rest/v1); IndexedDB (fila de pedidos + MenuCache); SyncEngine (online→processa fila); OfflineIndicator (pendingSync); TPV cria pedido em fila quando offline e sincroniza ao voltar. Ver `docs/ops/OFFLINE_FASE.md`. | 0,5 sem (validação em produção + testes E2E offline). |
| **5** | **Legal/GDPR** | 5% — "Sem ToS, Privacy, cookie consent, data export/deletion" | **~65–70% (código)** — **Feito:** ToS (`LegalTermsPage`), Privacy (`LegalPrivacyPage`), cookie consent (`CookieConsentBanner` + recordLegalConsent), data export/deletion (`DataPrivacyPage` + `docs/legal/GDPR_DATA_EXPORT_DELETION.md`), rota `/config/data-privacy` e entrada na ConfigSidebar. **Falta:** revisão/redacção por advogado, DPA formal. | 1 sem código (ajustes) + advogado. |

---

## ESSENCIAIS — Estado real no código

| # | Item | Estado no mapa original | Estado real | O que falta |
|---|------|-------------------------|-------------|-------------|
| **6** | **Documentação utilizador** | 0% | **~40%** — Centro de Ajuda em `/app/help` (HelpPage: Como começar, Primeiros 30 min, Ementa, Turno, Pedidos, Recibo, FAQ). Link no Staff (More → Ajuda) e no Admin (Governar → Centro de Ajuda). Falta: guided tour, mais FAQ, vídeos. | 1–2 sem. |
| **7** | **Integrações delivery** | 15% | **15%** — Inalterado. PRD + UI config existem; adapter real = zero. | 3 sem/integração. |
| **8** | **186 TODOs/FIXMEs** | "Triagem pendente" | **Triagem feita + críticos resolvidos** — `docs/audit/TODO_TRIAGE.md`. Pré-launch: IdentitySection e CartDrawer nome/cancelamento resolvidos; restantes TODOs classificados como backlog (Integrar com Core/Engine). Nenhum TODO pré-launch em aberto no fluxo TPV/billing. | 0,5 sem (opcional: converter TODOs backlog em prefixo BACKLOG para clareza). |
| **9** | **E2E fluxo completo** | 0% — "Signup→Menu→Turno→Pedido→KDS→Fechar nunca testado" | **~85%** — **Feito:** `fluxo-critico.spec.ts` (smoke rotas); `restaurante-funcionando.spec.ts` (fluxo com dados: API seed → TPV → KDS → Tarefas); **mock OTP** em VerifyCodePage (`?e2e_mock_otp=1` + código `123456` → sessão mock → redirect setup); **create-first-restaurant.spec** reativado (signup phone → verify com mock OTP → /setup/restaurant-minimal). **Falta:** completar setup no E2E (formulário criar restaurante + Core) se quiser signup→menu automático. | 0,5 sem (opcional: E2E completar setup com Core). |
| **10** | **PgBouncer** | 0% | **~80%** — **Feito:** `docs/ops/PGBOUNCER.md` (documentação); `docker-core/docker-compose.pgbouncer.yml` (override opcional: PgBouncer + PostgREST a usar o pool). Uso: `docker compose -f docker-compose.core.yml -f docker-compose.pgbouncer.yml up -d`. **Falta:** validar em staging/produção e ajustar `DEFAULT_POOL_SIZE`/`MAX_CLIENT_CONN` conforme carga. | 0,5–1 dia (validação + tuning). |

---

## Resumo: o que já está feito (e o mapa dizia que não)

- **i18n:** Biblioteca react-i18next em uso; billing + paywall traduzidos em 4 locales; base para extrair o resto.
- **Legal/GDPR:** ToS, Privacy, cookie consent, página de exportar/eliminar dados + doc GDPR; falta apenas revisão jurídica e DPA.
- **E2E:** Smoke do fluxo crítico (rotas) + fluxo completo com dados (`restaurante-funcionando.spec.ts`) em CI; fluxo completo executa quando Core disponível (local/staging).
- **TODOs:** Triagem documentada em TODO_TRIAGE.md; falta resolver os críticos.
- **Offline:** Fase total implementada: Service Worker (precache + fallback + cache GET /rest), IndexedDB (fila + MenuCache), SyncEngine, OfflineIndicator com pendingSync; ver `docs/ops/OFFLINE_FASE.md`.
- **PgBouncer:** Doc de operações + override Docker (docker-compose.pgbouncer.yml) para Core; falta validação em staging/produção.

O **gap não é “nada foi feito”** — é **acabamento, escala (i18n resto da UI, E2E completo, offline real)** e **burocracia (advogado, certificação AT)**. O roadmap mínimo do mapa continua válido; as percentagens e o texto deste documento reflectem o estado real após as melhorias implementadas.

---

## Referências

- Entregas detalhadas: `docs/audit/MELHORIAS_UMA_A_UMA_CONCLUIDO_2026-02.md`
- Testes que comprovam: secção "Testes que comprovam o código" no mesmo ficheiro
- Gate de release: `npm run audit:release:portal`; ver `docs/audit/RELEASE_AUDIT_STATUS.md`
