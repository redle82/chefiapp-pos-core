# Production Readiness Checklist (F7.1)

**Objetivo:** Checklist **verificável** e **auditável** para decidir se o sistema está pronto para release/deploy de produção. Cada item tem critério sim/não e forma de verificação (comando ou passo).  
**Referência:** [C44_RELEASE_GATES_AND_ROLLOUT.md](./C44_RELEASE_GATES_AND_ROLLOUT.md) §2 e §4; [pre-flight-check.sh](../scripts/deploy/pre-flight-check.sh); [FASE_7_READINESS_ESCALA_OPERACIONAL.md](../roadmap/FASE_7_READINESS_ESCALA_OPERACIONAL.md).

---

## Como usar

Antes de cada release ou deploy para produção, percorrer a secção **Obrigatório** e marcar cada item. Se algum obrigatório falhar, não fazer deploy até estar verde ou ter decisão explícita documentada. A secção **Recomendado** reduz risco mas não bloqueia por defeito.

**Comando que cobre parte dos gates:** `npm run audit:readiness` (ou `bash scripts/deploy/pre-flight-check.sh`) — release gate, env, build, ficheiros críticos, browser block. Complementar com os itens abaixo que não estão no script (ex.: CI verde, rollout/rollback lidos).

**Disciplina operacional (F6.1):** Usar este checklist e o [mapa de observabilidade/runbooks](./OBSERVABILITY_AND_RUNBOOKS_MAP.md) em **toda** release; manter gates no CI verdes; não desativar steps sem justificação documentada.

---

## 1. Obrigatório (bloqueia release se falhar)

| # | Item | Sim/Não | Como verificar |
|---|------|---------|----------------|
| 1 | **CI job `validate` verde** | ☐ | Pipeline no GitHub: job "Validate Code Quality" passou; ou local: `npm run audit:fase3-conformance` e lint/typecheck passam. Ver C44 §2 "Required before merge". |
| 2 | **Release gate portal verde** | ☐ | `npm run audit:release:portal` termina com exit 0; ou correr `bash scripts/deploy/pre-flight-check.sh` (inclui este passo). Ver C44 §2 "Required before deploy". |
| 3 | **Build de produção do portal OK** | ☐ | `pnpm --filter merchant-portal run build` termina sem erro; ou pre-flight-check.sh secção 4. |
| 4 | **Variáveis de ambiente de produção** | ☐ | Vercel (ou target) tem `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE` (e opcionalmente Sentry). Ver pre-flight-check.sh secção 2; ou verificar no dashboard do target. |
| 5 | **Browser-block sem bypass DEV** | ☐ | Nenhuma linha no guard pode usar `import.meta.env.DEV` para permitir render em DEV (bypass). Uso legítimo (ex.: isDev para telemetria) é aceite. Verificar com `bash scripts/deploy/pre-flight-check.sh` secção 7. |
| 6 | **Rollout e rollback lidos** | ☐ | Equipa leu [PRODUCTION_ROLLOUT_MONITORING_PLAN.md](./PRODUCTION_ROLLOUT_MONITORING_PLAN.md) e [ROLLOUT_QUICK_REFERENCE.md](./ROLLOUT_QUICK_REFERENCE.md); sabe critérios de rollback (ex.: taxa erro > 5%, Core inacessível). |

---

## 2. Recomendado (reduz risco; não bloqueia por defeito)

| # | Item | Sim/Não | Como verificar |
|---|------|---------|----------------|
| 7 | **Pre-release gate verde** | ☐ | `npm run audit:pre-release` (opcional: CORE_URL e DATABASE_URL se aplicável). Ver [F53_GOLDEN_PATH_EVIDENCE.md](../roadmap/F53_GOLDEN_PATH_EVIDENCE.md). |
| 8 | **Billing Core audit (se billing ativo)** | ☐ | `DATABASE_URL=... npm run audit:billing-core` → OK; ou CI com secret `CORE_BILLING_AUDIT_DATABASE_URL` já passou. Ver C44 §3. |
| 9 | **Sentry/DSN configurado (se usado)** | ☐ | Variáveis de produção incluem DSN Sentry para merchant-portal/mobile conforme [OBSERVABILITY_SETUP.md](./OBSERVABILITY_SETUP.md). |
| 10 | **Working directory limpo / tag de release** | ☐ | `git status` limpo ou deploy a partir de tag; branch correto (ex.: main). Pre-flight-check.sh secção 6. |

---

## 3. Pós-deploy (T+0h – T+48h)

| # | Item | Sim/Não | Como verificar |
|---|------|---------|----------------|
| 11 | **Frontend responde** | ☐ | URL de produção devolve 200; SPA carrega. |
| 12 | **Core acessível (se aplicável)** | ☐ | `curl -s -o /dev/null -w "%{http_code}" $CORE_URL/rest/v1/` → 200; ou [health-check-core.sh](../scripts/core/health-check-core.sh). |
| 13 | **Monitorização ativa** | ☐ | Sentry (ou equivalente) a receber eventos; ROLLOUT_QUICK_REFERENCE e PRODUCTION_ROLLOUT_MONITORING_PLAN em uso para T+1h–T+48h. |

---

## 4. Referências rápidas

| Recurso | Uso |
|---------|-----|
| [C44_RELEASE_GATES_AND_ROLLOUT.md](./C44_RELEASE_GATES_AND_ROLLOUT.md) | Definição required before merge / before deploy; tabela de gates; checklist rollout §4. |
| [scripts/deploy/pre-flight-check.sh](../scripts/deploy/pre-flight-check.sh) | Script executado por `npm run audit:readiness`; release gate, env, build, ficheiros críticos, browser block. |
| [PRODUCTION_ROLLOUT_MONITORING_PLAN.md](./PRODUCTION_ROLLOUT_MONITORING_PLAN.md) | Plano de rollout; critérios T+0h–T+48h. |
| [ROLLOUT_QUICK_REFERENCE.md](./ROLLOUT_QUICK_REFERENCE.md) | Referência rápida; rollback; thresholds. |
| [rollback-procedure.md](./rollback-procedure.md) | Procedimento de rollback (Vercel, EAS, migrations). |
| [OBSERVABILITY_AND_RUNBOOKS_MAP.md](./OBSERVABILITY_AND_RUNBOOKS_MAP.md) | Sinais por superfície; runbooks quando usar; gaps; incidente em produção (§4). |
| [RUNBOOKS.md](./RUNBOOKS.md) | Índice canónico de runbooks (alertas, health, incidentes, deploy, rollback, go-live). |

---

*Checklist F7.1 — Production readiness verificável. Última atualização: 2026-03.*
