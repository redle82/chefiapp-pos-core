# Fase 4 — Expansão controlada

**Status:** Épico ativo  
**Tipo:** Scale — workspaces, billing produção, observabilidade, readiness  
**Última atualização:** 2026-03

---

## 1. Objetivo

Reabrir e alinhar **mobile-app** e **customer-portal**, fechar **billing/provisioning em produção**, e garantir **observabilidade** e **readiness** para staging/produção. Todos os workspaces devem obedecer aos mesmos contratos Core; docs AS-IS atualizadas; readiness real para rollout.

---

## 2. Épicos

| Épico | Descrição |
|-------|-----------|
| **C4.1** | Mobile-app alignment & contracts — alinhar ao mesmo contrato de identidade/pairing; evidence/conformidade (completar Fase 3 evidence para mobile). |
| **C4.2** | Customer-portal alignment — onde vive, como testar, contrato mínimo com o Core; sem duplicar lógica financeira. |
| **C4.3** | Billing & provisioning de produção — Stripe/gateway/sidecar; `audit:billing-core` em pipeline; migrações aplicadas em BD de produção. |
| **C4.4** | Observability & rollout readiness — Sentry, logs, métricas; plano de rollout; gates de CI/CD claros. |

---

## 3. Definition of Done (Fase 4)

- **Workspaces alinhados:** Documento que indica onde vive cada um (merchant-portal, desktop-app, mobile-app, customer-portal), como testar, e contrato mínimo com o Core.
- **Docs AS-IS atualizadas:** ARQUITETURA_GERAL, AppStaff, TPV/KDS, billing, mapa de fluxos críticos refletem o estado atual.
- **Readiness para staging/produção:** Plano de rollout definido; métricas e alertas configurados; gates de CI/CD documentados e executados antes de release.

---

## 4. Checklist resumido

- [x] **Workspaces alinhados:** Doc [WORKSPACES_ALIGNMENT.md](./WORKSPACES_ALIGNMENT.md) — onde vive cada um, como testar, contrato mínimo com o Core.
- [x] C4.1: mobile-app — evidence pack formal em [C41_MOBILE_PHASE3_EVIDENCE.md](./C41_MOBILE_PHASE3_EVIDENCE.md); classificação **ALIGNED** (teste explícito role-from-backend, recovery/reinstall automatizado, evidência fluxo ativação). Probe `audit:fase3-conformance` inclui mobile-app.
- [x] C4.2: customer-portal — estado confirmado **MISSING**; **resolvido em F5.1 (Opção A: removido do workspace)**; evidência e decisão em [C42_CUSTOMER_PORTAL_STATE.md](./C42_CUSTOMER_PORTAL_STATE.md) §8; WORKSPACES_ALIGNMENT §2, §6 e §7 atualizados.
- [x] C4.3: billing produção — `audit:billing-core` em pipeline real (`.github/workflows/ci.yml`); gate opcional quando secret `CORE_BILLING_AUDIT_DATABASE_URL` está definido; doc em `docs/ops/AUDIT_BILLING_CORE_RUN.md` e `docs/roadmap/WORKSPACES_ALIGNMENT.md` §5.
- [x] C4.4: observabilidade e rollout — Sinais por workspace e tabela de gates em [C44_RELEASE_GATES_AND_ROLLOUT.md](../ops/C44_RELEASE_GATES_AND_ROLLOUT.md); checklists rollout/rollback; WORKSPACES_ALIGNMENT §6; plano existente em PRODUCTION_ROLLOUT_MONITORING_PLAN e ROLLOUT_QUICK_REFERENCE.

---

## 5. Referências

- [WORKSPACES_ALIGNMENT.md](./WORKSPACES_ALIGNMENT.md) — onde vive cada app, como testar, contrato Core, gates de release.
- [FASE_3_CONFORMANCE_INTER_APP.md](./FASE_3_CONFORMANCE_INTER_APP.md) — conformance inter-app (base para C4.1).
- [AUDIT_BILLING_CORE_RUN.md](../ops/AUDIT_BILLING_CORE_RUN.md) — como executar audit billing (C4.3).
- [PRODUCTION_ROLLOUT_MONITORING_PLAN.md](../ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md) — plano de rollout (C4.4).
- [C44_RELEASE_GATES_AND_ROLLOUT.md](../ops/C44_RELEASE_GATES_AND_ROLLOUT.md) — tabela de gates, checklist rollout, checklist rollback (C4.4 operacional).
- [C42_CUSTOMER_PORTAL_STATE.md](./C42_CUSTOMER_PORTAL_STATE.md) — estado do customer-portal (C4.2): removido do workspace (F5.1); evidência e decisão §8; contrato Core quando houver código.
- [C41_MOBILE_PHASE3_EVIDENCE.md](./C41_MOBILE_PHASE3_EVIDENCE.md) — evidence pack mobile-app (C4.1): Fase 3 conformance; classificação **ALIGNED**; comandos, contratos.
- [ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md](../architecture/ARQUITETURA_GERAL_CHEFIAPP_AS_IS.md) — doc AS-IS a manter atualizada.
- [FASE_5_CONVERGENCIA_OPERACIONAL.md](./FASE_5_CONVERGENCIA_OPERACIONAL.md) — próxima fase: convergência operacional (F5.1–F5.4 fechados).

---

*Épico Fase 4 — Expansão controlada. Estado consolidado; próxima fase: [Fase 5 — Convergência operacional](./FASE_5_CONVERGENCIA_OPERACIONAL.md).*
