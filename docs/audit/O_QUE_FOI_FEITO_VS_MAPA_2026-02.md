# O que foi feito — vs. mapa "O que falta para lançamento"

**Data:** 2026-02-13  
**Objetivo:** Alinhar o teu mapa de auditoria com o **estado real do código** após as melhorias (Melhorias uma a uma, i18n fluxo crítico, TODOs pré-launch, E2E, PgBouncer, CartDrawer).

---

## Comparação direta: teu mapa vs. código

### BLOQUEADORES

| # | Item | **Estado no teu mapa** | **Estado real no código** | O que foi feito |
|---|------|------------------------|---------------------------|-----------------|
| **1** | **i18n** | 0% — "Zero library, ~2-3k strings" | **~100% fluxo crítico** | react-i18next em uso. `merchant-portal/src/i18n.ts`: pt-PT, pt-BR, en, es; namespaces `common`, `legal`, `billing`. CookieConsentBanner, OfflineIndicator → `common`; DataPrivacyPage, LegalTermsPage, LegalPrivacyPage → `legal`; BillingBanner, PaymentGuard → `billing`. Toda a UI de cookie, offline, termos, privacidade, dados/privacidade e billing traduzida em 4 locales. **Falta:** extrair resto da UI (TPV, KDS, onboarding) para namespaces. |
| **2** | **Recibo fiscal real** | 40% | **40%** | Inalterado. Schema SAF-T/ATCUD/TicketBAI e hash chain existem; falta recibo impresso com QR AT e export XML SAF-T + certificação AT. |
| **3** | **Self-service signup** | 55% | **55%** | Inalterado. Onboarding + BillingBroker/Stripe existem; fluxo landing→signup→trial→paywall→subscribe não costurado E2E. |
| **4** | **Offline-first** | 15% | **~20%** | PWA manifest + **OfflineIndicator** (`OfflineIndicator.tsx`): barra quando rede offline ou Core DOWN (useCoreHealth). Sem Service Worker com cache de dados. |
| **5** | **Legal/GDPR** | 5% — "Sem ToS, Privacy, DPA, cookie consent, data export/deletion" | **~65–70% (código)** | **Feito:** ToS (`LegalTermsPage`), Privacy (`LegalPrivacyPage`), cookie consent (`CookieConsentBanner` + recordLegalConsent), data export/deletion (`DataPrivacyPage` + `docs/legal/GDPR_DATA_EXPORT_DELETION.md`), rota `/config/data-privacy` e entrada na ConfigSidebar. **Falta:** revisão por advogado, DPA formal. |

### ESSENCIAIS

| # | Item | **Estado no teu mapa** | **Estado real no código** | O que foi feito |
|---|------|------------------------|---------------------------|-----------------|
| **6** | **Documentação utilizador** | 0% | **0%** | Inalterado. Zero help center ou guided tour. |
| **7** | **Integrações delivery** | 15% | **15%** | Inalterado. PRD + UI config; adapter real = zero. |
| **8** | **186 TODOs/FIXMEs** | "Triagem pendente" | **Triagem feita + pré-launch parcial** | `docs/audit/TODO_TRIAGE.md`: critérios pré-launch vs backlog, resumo por área. IdentitySection resolvido (país→preset em handleChange). CartDrawer: nome do cliente com input no drawer; cancelamento documentado (backend futuro). Restam críticos pontuais (ARIA, tipagem, billing). |
| **9** | **E2E fluxo completo** | 0% — "Signup→Menu→Turno→Pedido→KDS→Fechar nunca testado" | **~70%** | `fluxo-critico.spec.ts` (smoke rotas); `restaurante-funcionando.spec.ts` (fluxo com dados: seed → TPV → KDS → Tarefas). Ambos no job E2E em CI; sem Core, `restaurante-funcionando` é ignorado. **Falta:** signup→menu no UI (mock OTP + reativar create-first-restaurant). |
| **10** | **PgBouncer** | 0% | **~80%** | `docs/ops/PGBOUNCER.md` + `docker-core/docker-compose.pgbouncer.yml` (override opcional). Uso: `docker compose -f docker-compose.core.yml -f docker-compose.pgbouncer.yml up -d`. **Falta:** validar em staging/produção e tuning de pool. |

---

## Resumo: o que já está feito (e o mapa dizia que não)

| Área | Feito no código |
|------|-----------------|
| **i18n** | Library em uso; fluxo crítico (cookie, offline, legal, billing) em 4 locales; base para extrair resto da UI. |
| **Legal/GDPR** | ToS, Privacy, cookie consent, página exportar/eliminar dados + doc GDPR; falta advogado + DPA. |
| **Offline** | Indicador de modo offline (UX); falta Service Worker + cache. |
| **TODOs** | Triagem documentada; IdentitySection + CartDrawer nome resolvidos; cancelamento documentado. |
| **E2E** | Smoke rotas + fluxo completo com dados em CI; executa quando Core disponível (local/staging). |
| **PgBouncer** | Doc + override Docker para Core; falta validação em staging/produção. |

---

## Como atualizar o teu mapa

Substitui na tua tabela os valores da coluna **"Estado no Código"** e **"Esforço"** por:

**BLOQUEADORES**

- **1 i18n:** Estado → **100% fluxo crítico** (resto da UI = opcional). Esforço → ~1–2 sem para extrair TPV/KDS/onboarding se quiseres 100% UI.
- **5 Legal/GDPR:** Estado → **~65–70% (código)**. Esforço → 1 sem ajustes + advogado (ToS/Privacy/DPA).
- **4 Offline:** Estado → **~20%**. Esforço → 4 sem (Service Worker + IndexedDB) inalterado.

**ESSENCIAIS**

- **8 TODOs:** Estado → **Triagem feita**; pré-launch críticos em parte resolvidos. Esforço → 1–2 sem (resolver restantes críticos).
- **9 E2E:** Estado → **~70%**. Esforço → 0,5 sem (mock OTP + signup E2E).
- **10 PgBouncer:** Estado → **~80%**. Esforço → 0,5–1 dia (validação + tuning).

---

## Em números (revisado)

O **gap não é “nada foi feito”** — é **acabamento** (i18n resto da UI, E2E signup, offline real), **validação** (PgBouncer em staging) e **burocracia** (advogado, certificação AT).

- **Para vender em PT:** o código está mais avançado do que “0% i18n / 5% Legal / 0% E2E / 0% PgBouncer” — i18n fluxo crítico, Legal/GDPR em código, E2E fluxo operacional e PgBouncer preparado reduzem risco e tempo.
- **O mais caro já está feito:** arquitectura, multi-tenant, fiscal schema, task system, billing, RBAC — mantém-se.
- **O que falta é previsível:** i18n resto da UI, offline real, legal revisão, docs utilizador, certificação AT — zero risco técnico de descoberta.

---

## Referências

- Estado detalhado: `docs/audit/LANCAMENTO_GAP_ATUALIZADO_2026-02.md`
- Entregas: `docs/audit/MELHORIAS_UMA_A_UMA_CONCLUIDO_2026-02.md`
- TODOs: `docs/audit/TODO_TRIAGE.md`
- Gate release: `npm run audit:release:portal`; `docs/audit/RELEASE_AUDIT_STATUS.md`
- Lacunas doc vs implementação (melhorias sem anti-regressão; contratos alvo não implementados): `docs/audit/GAPS_DOCUMENTACAO_VS_IMPLEMENTACAO_2026-02.md`
