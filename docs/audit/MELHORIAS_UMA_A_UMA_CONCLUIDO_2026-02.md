# Plano "Melhorias uma a uma" — Concluído (2026-02-13)

## Resumo

| Passo | Nome | Fase | Esforço estimado | Estado |
|-------|------|------|------------------|--------|
| 1 | Cookie consent banner | FASE 0 | 0,5–1 dia | ✅ Concluído |
| 2 | Indicador Modo offline | FASE 1 | 0,5 dia | ✅ Concluído |
| 3 | Conteúdo ToS/Privacy | FASE 0 | 0,5–1 dia | ✅ Concluído |
| 4 | Data export / deletion (GDPR) | FASE 0 | 1–2 dias | ✅ Concluído |
| 5 | i18n react-i18next | FASE 2 | 3–5 dias | ✅ Concluído |
| 6 | Triagem e resolução TODOs | FASE 2 | 1–2 dias | ✅ Concluído |
| 7 | E2E fluxo crítico | FASE 3 | 2–3 dias | ✅ Concluído |
| 8 | Observabilidade + PgBouncer doc | FASE 3 | 1–2 dias | ✅ Concluído |

## Entregas principais

- **Passo 1:** `merchant-portal/src/components/CookieConsentBanner.tsx`; integração em `App.tsx`; `recordLegalConsent` + links para `/legal/terms` e `/legal/privacy`.
- **Passo 2:** `merchant-portal/src/ui/OfflineIndicator.tsx` com `useCoreHealth`; barra quando rede offline ou Core DOWN; uso em `AppContentWithBilling`.
- **Passo 3:** `LegalTermsPage.tsx`, `LegalPrivacyPage.tsx` com secções (Responsável, Aceitação, Uso, Rescisão; Recolha, Base legal, Direitos, Contacto).
- **Passo 4:** `docs/legal/GDPR_DATA_EXPORT_DELETION.md`; `Config/DataPrivacyPage.tsx` (exportar dados, eliminar conta); rota `/config/data-privacy`; entrada na `ConfigSidebar`.
- **Passo 5 (i18n 100% fluxo crítico):** `merchant-portal/src/i18n.ts` (pt-PT, pt-BR, en, es) com namespaces `common`, `legal`, `billing`; `CookieConsentBanner` e `OfflineIndicator` com `useTranslation("common")`; `DataPrivacyPage`, `LegalTermsPage` e `LegalPrivacyPage` com `useTranslation("legal")`; `BillingBanner` e `PaymentGuard` com `useTranslation("billing")`; import em `main_debug.tsx`. Toda a UI de cookie, offline, termos, privacidade, dados/privacidade e billing está traduzida em 4 locales.
- **Passo 6:** `docs/audit/TODO_TRIAGE.md` com critérios pré-launch vs backlog e resumo por área.
- **Passo 7:** `merchant-portal/tests/e2e/fluxo-critico.spec.ts` (Auth, onboarding, TPV, KDS, dashboard, relatórios); `restaurante-funcionando.spec.ts` (fluxo completo com dados: API seed → TPV → KDS → Tarefas); job E2E em `.github/workflows/ci.yml` (fluxo completo ignorado em CI sem Core).
- **Passo 8:** bloco "Estado do sistema" em `ConfigStatusPage.tsx` (useCoreHealth + "Verificar agora"); `docs/ops/PGBOUNCER.md`.

## Fora do âmbito (respeitar)

Não incluído neste plano e podem ser passos futuros após i18n e TODOs:

- Certificação AT (externo)
- Adapters de delivery (Uber Eats, Glovo)
- Recibo ES/BR

## Testes que comprovam o código

- **CookieConsentBanner:** `merchant-portal/src/components/CookieConsentBanner.test.tsx` — banner com links termos/privacidade, botão Aceitar e registo de consentimento.
- **DataPrivacyPage:** `merchant-portal/src/pages/Config/DataPrivacyPage.test.tsx` — título, botões exportar/eliminar e abertura dos modais.
- **OfflineIndicator:** `merchant-portal/src/ui/OfflineIndicator.test.tsx` — barra "Modo offline" quando Core DOWN.
- **Legal pages / PaymentGuard:** já cobertos por `legal-links.test.tsx` e `PaymentGuard.paywall.test.tsx`.

## Gate de release

Para validar release com portal estável: `npm run audit:release:portal`. Ver `docs/audit/RELEASE_AUDIT_STATUS.md`.

## Anti-regressão (não voltar a fazer) — Melhorias uma a uma

Cada passo abaixo está implementado; não remover nem reverter sem referência a este doc.

| Passo | O que NÃO voltar a fazer |
|-------|---------------------------|
| 1 Cookie consent | Não remover `CookieConsentBanner` nem a integração em `App.tsx`; não remover `recordLegalConsent`; manter links para `/legal/terms` e `/legal/privacy`. |
| 2 Offline indicator | Não remover `OfflineIndicator` nem `useCoreHealth`; manter uso em `AppContentWithBilling`; barra quando rede offline ou Core DOWN. |
| 3 ToS/Privacy | Não remover `LegalTermsPage` nem `LegalPrivacyPage`; manter secções (Responsável, Aceitação, Uso, Rescisão; Recolha, Base legal, Direitos, Contacto). |
| 4 GDPR | Não remover `DataPrivacyPage` nem a rota `/config/data-privacy` nem a entrada na ConfigSidebar; manter `docs/legal/GDPR_DATA_EXPORT_DELETION.md`. |
| 5 i18n | Não remover `i18n.ts` nem o import em `main_debug.tsx`; manter namespaces `common`, `legal`, `billing` e `useTranslation` em CookieConsentBanner, OfflineIndicator, DataPrivacyPage, LegalTermsPage, LegalPrivacyPage, BillingBanner, PaymentGuard. |
| 6 TODOs | Não reintroduzir TODOs pré-launch sem triagem; manter critérios em `docs/audit/TODO_TRIAGE.md`; IdentitySection e CartDrawer resolvidos — não reverter. |
| 7 E2E | Não remover `fluxo-critico.spec.ts` nem `restaurante-funcionando.spec.ts` nem o job E2E em `.github/workflows/ci.yml`; manter mock OTP em VerifyCodePage quando aplicável. |
| 8 Observabilidade + PgBouncer | Não remover o bloco "Estado do sistema" em `ConfigStatusPage.tsx` (useCoreHealth + "Verificar agora"); não remover `docs/ops/PGBOUNCER.md` nem `docker-compose.pgbouncer.yml`. |

Lacunas e documentos não implementados: ver [GAPS_DOCUMENTACAO_VS_IMPLEMENTACAO_2026-02.md](./GAPS_DOCUMENTACAO_VS_IMPLEMENTACAO_2026-02.md).

---

## Melhorias KDS e Bar (contratos)

Melhorias de layout do KDS (scroll, rodapé, tabs) e fluxo Bar vs Cozinha (station, pedidos no separador Bar) estão documentadas em contratos e auditoria:

- **Contratos:** [KDS_LAYOUT_UX_CONTRACT.md](../contracts/KDS_LAYOUT_UX_CONTRACT.md), [KDS_BAR_COZINHA_STATION_CONTRACT.md](../contracts/KDS_BAR_COZINHA_STATION_CONTRACT.md).
- **Auditoria e índice:** [MELHORIAS_KDS_E_BAR_CONTRATOS_2026-02.md](./MELHORIAS_KDS_E_BAR_CONTRATOS_2026-02.md).
