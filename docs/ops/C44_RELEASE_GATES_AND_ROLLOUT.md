# C4.4 — Release gates, observabilidade e rollout

**Objetivo:** Plano operacional mínimo de monitorização, critérios de promoção para release, critérios de rollback e tabela de gates.  
**Referência Fase 4:** [FASE_4_EXPANSAO_CONTROLADA.md](../roadmap/FASE_4_EXPANSAO_CONTROLADA.md); alinhamento: [WORKSPACES_ALIGNMENT.md](../roadmap/WORKSPACES_ALIGNMENT.md).

---

## 1. Estado atual (observabilidade)

| Elemento | Onde | Nota |
|----------|------|------|
| **Sentry** | merchant-portal (`Logger.ts`, `VITE_SENTRY_DSN`); mobile-app (`logging.ts`, `EXPO_PUBLIC_SENTRY_DSN`) | Configuração documentada em [OBSERVABILITY_SETUP.md](./OBSERVABILITY_SETUP.md), [SENTRY_SETUP_COMPLETE.md](../../SENTRY_SETUP_COMPLETE.md). |
| **Logging estruturado** | merchant-portal: `Logger`; mobile: `logError` / `logEvent` | Sem plataforma centralizada; logs no cliente e Sentry. |
| **Health endpoints** | Core: `http://localhost:3001/rest/v1/` (PostgREST); script: `bash scripts/core/health-check-core.sh` | [MONITORING_GUIDE.md](../architecture/MONITORING_GUIDE.md) descreve `/health` e `/api/health` (backend). |
| **Smoke / audit** | `scripts/audit/run-staging-smoke-gate.sh`; `scripts/staging/smoke.sh`; [STAGING_SMOKE_CHECKLIST.md](./STAGING_SMOKE_CHECKLIST.md) | Staging smoke com evidência em `tmp/staging-smoke-*`. |
| **Rollout / rollback** | [PRODUCTION_ROLLOUT_MONITORING_PLAN.md](./PRODUCTION_ROLLOUT_MONITORING_PLAN.md), [ROLLOUT_QUICK_REFERENCE.md](./ROLLOUT_QUICK_REFERENCE.md), [rollback-procedure.md](./rollback-procedure.md) | Fases T+0h–T+48h; rollback Vercel/EAS/migrations. |
| **CI gates** | `.github/workflows/ci.yml`: validate (typecheck, lint, tests, sovereignty, financial-supabase, **audit:fase3-conformance**, **audit:billing-core** quando secret definido) | [WORKSPACES_ALIGNMENT.md](../roadmap/WORKSPACES_ALIGNMENT.md) §4 e §5; F5.2. |

**Gaps assumidos:** Sentry/DSN opcional por ambiente; customer-portal removido do workspace (F5.1); métricas de negócio (ex.: Core RPC %) dependem de dashboards externos (Sentry, Vercel) já referenciados no plano de rollout. **Gaps explícitos e decisões:** [OBSERVABILITY_AND_RUNBOOKS_MAP.md](./OBSERVABILITY_AND_RUNBOOKS_MAP.md) §3. **Runbooks e rollout:** [RUNBOOKS.md](./RUNBOOKS.md); [PRODUCTION_ROLLOUT_MONITORING_PLAN.md](./PRODUCTION_ROLLOUT_MONITORING_PLAN.md); [ROLLOUT_QUICK_REFERENCE.md](./ROLLOUT_QUICK_REFERENCE.md). **Incidente em produção:** [OBSERVABILITY_AND_RUNBOOKS_MAP.md](./OBSERVABILITY_AND_RUNBOOKS_MAP.md) §4 + [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) + [rollback-procedure.md](./rollback-procedure.md).

---

## 2. Definição explícita: required before merge / before deploy / recommended manual

| Categoria | Onde corre | O que é | Bloqueia se falhar? |
|----------|------------|--------|----------------------|
| **Required before merge** | CI job `validate` (`.github/workflows/ci.yml`) | typecheck (simulate-failfast), lint, testes (test:ci), sovereignty gate, check-financial-supabase, **audit:fase3-conformance**, (opcional) audit:billing-core se secret definido | **Sim** — pipeline vermelho; não fazer merge com job falhado. |
| **Required before deploy** | Manual / pre-flight | `npm run audit:release:portal` — web-e2e, typecheck, Vitest merchant-portal, server coverage 80%, audit:laws. Script: `bash scripts/deploy/pre-flight-check.sh` | **Sim** — não fazer deploy do portal sem este gate verde. |
| **Recommended manual** | Local | `npm run audit:pre-release` (F5.3: opcional health Core + obrigatório fase3 + opcional billing; ver [F53_GOLDEN_PATH_EVIDENCE.md](../roadmap/F53_GOLDEN_PATH_EVIDENCE.md)). `DATABASE_URL=... npm run audit:billing-core` quando não há secret no CI. | Recomendado antes de release ou tag; evidência inter-app centralizada. |

---

## 3. Tabela de gates (superfície × comando × quando × bloqueia release? × ação em falha)

| Superfície | Comando / check | Quando usar | Bloqueia release? | Ação em falha |
|------------|-----------------|-------------|-------------------|---------------|
| **merchant-portal** | `npm run audit:release:portal` | Antes de PR/deploy do portal; pre-flight de release | **Sim** | Corrigir até passar (web-e2e, typecheck, testes Vitest, server coverage 80%, leis). |
| **merchant-portal** | `pnpm --filter merchant-portal run test -- --run` | CI; validação rápida de testes unitários/componente | Sim (incluído em audit:release:portal) | Corrigir testes ou cobertura. |
| **Core (health)** | `bash scripts/core/health-check-core.sh` ou `curl -s -o /dev/null -w "%{http_code}" $CORE_URL/rest/v1/` | Pós-deploy; smoke de staging/prod; verificar Core acessível | Depende do contexto (smoke pós-deploy: sim) | Verificar Core/Postgres e rede; rollback se indisponível. |
| **Core (billing)** | `DATABASE_URL=... npm run audit:billing-core` | Após alterações a billing; antes de release com billing ativo | **Opcional** (sim se secret `CORE_BILLING_AUDIT_DATABASE_URL` no CI) | Corrigir DRIFT/BAD_VALUE no Core ou migrações; sem secret no CI o step é ignorado. |
| **Conformidade (Fase 3)** | `npm run audit:fase3-conformance` | CI (job validate); antes de release | **Sim** (no CI desde F5.2) | Corrigir conformidade ou documentar exceção. |
| **desktop-app** | Estrutura + README (probe em audit:fase3-conformance) | Com audit:fase3-conformance | Não | Ajustar desktop-app ou probe. |
| **mobile-app** | `pnpm --filter mobile-app test` (incl. mobileActivationApi); probe em audit:fase3-conformance | CI; antes de release mobile | Recomendado | Corrigir testes ou conformidade. |
| **customer-portal** | Removido do workspace (F5.1); não é app no repo ([C42](../roadmap/C42_CUSTOMER_PORTAL_STATE.md)) | — | — | — |
| **Inter-app (F5.3)** | `npm run audit:pre-release` (health Core opcional + audit:fase3-conformance + audit:billing-core opcional) | Antes de release; evidência golden path; ver [F53](../roadmap/F53_GOLDEN_PATH_EVIDENCE.md) | Recomendado | Corrigir conformidade ou Core/billing; script: `scripts/pre-release-gate.sh` |
| **Sofia operacional (Docker/Core)** | Checklist Sofia operacional; ver [SOFIA_GASTROBAR_ROTINA_CHECKLIST_OPERACIONAL.md](./SOFIA_GASTROBAR_ROTINA_CHECKLIST_OPERACIONAL.md) | Semanal (recomendado); pré-release; após mudanças Core/portal/AppStaff; antes de demo | Recomendado | Executar checklist; registar no doc Fase 3 §6; em falha: corrigir ou documentar exceção (ver rotina). |
| **Sentry / erros** | Dashboard Sentry; alertas (taxa de erro, novos erros) | Contínuo; pós-rollout T+1h–T+48h | Não (monitorização) | Investigar; rollback se > 5% erro (ver ROLLOUT_QUICK_REFERENCE). |
| **Vercel (frontend)** | `vercel ls --prod`; promote previous deployment para rollback | Deploy e rollback | Não (operacional) | Rollback: Promote to Production no dashboard ou `vercel rollback`. |

---

## 4. Checklist de rollout (mínimo)

**Checklist de production readiness (F7.1):** [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md) — itens obrigatórios e recomendados com “como verificar”; usar antes de cada release. Comando único opcional: `npm run audit:readiness` (pre-flight-check.sh) cobre parte dos itens.

- [ ] **Pré-deploy:** `npm run audit:release:portal` passou (verde).
- [ ] **CI:** `audit:fase3-conformance` já corre no job validate; garantir que está verde antes de merge.
- [ ] **Opcional (billing):** `DATABASE_URL=... npm run audit:billing-core` passou (ou secret não usado no CI).
- [ ] **Ambiente:** Variáveis de produção configuradas (Vercel/env); Sentry DSN se usado.
- [ ] **Deploy:** Build e deploy (ex.: Vercel) concluídos.
- [ ] **T+0h–T+1h:** Health/smoke: Core acessível; frontend responde; browser-block verificado em `/op/tpv` (ver [ROLLOUT_QUICK_REFERENCE.md](./ROLLOUT_QUICK_REFERENCE.md)).
- [ ] **T+1h–T+48h:** Monitorizar Sentry (taxa de erro < 1%); LCP/performance (Vercel Speed Insights); critérios em [PRODUCTION_ROLLOUT_MONITORING_PLAN.md](./PRODUCTION_ROLLOUT_MONITORING_PLAN.md).
- [ ] **Opcional (Sofia):** Se o ambiente Docker/Core for usado para demo ou validação, executar o [checklist Sofia operacional](./SOFIA_GASTROBAR_ROTINA_CHECKLIST_OPERACIONAL.md) e registar no doc da Fase 3 §6.

Detalhe completo: [PRODUCTION_ROLLOUT_MONITORING_PLAN.md](./PRODUCTION_ROLLOUT_MONITORING_PLAN.md), [ROLLOUT_QUICK_REFERENCE.md](./ROLLOUT_QUICK_REFERENCE.md).

---

## 5. Checklist de rollback (mínimo)

- [ ] **Decisão:** Critérios de rollback acionados (ex.: taxa de erro > 5%, Core inacessível, regressão crítica).
- [ ] **Frontend (Vercel):** Promote previous deployment to Production no dashboard; ou `vercel rollback <url> --prod`.
- [ ] **Alternativa:** `git revert` + push; Vercel re-deploy.
- [ ] **Mobile (EAS):** `eas update:rollback --channel production` (ver [rollback-procedure.md](./rollback-procedure.md)).
- [ ] **Migrations (Core/Supabase):** `./scripts/rollback-migration.sh` se a causa for migration (ver [rollback-procedure.md](./rollback-procedure.md)).
- [ ] **Comunicação:** Equipa e stakeholders informados; incidente registado.
- [ ] **Pós-rollback:** Re-executar smoke; verificar Sentry; planejar correção e novo deploy.

Detalhe: [rollback-procedure.md](./rollback-procedure.md), [ROLLBACK_OPERATIONAL_FREEZE.md](./ROLLBACK_OPERATIONAL_FREEZE.md) (rollback de estado operacional/freeze).

---

## 6. Quem / qual gate bloqueia release

- **Required before merge (CI):** Job `validate` em `.github/workflows/ci.yml` — typecheck, lint, testes, sovereignty gate, check-financial-supabase, **audit:fase3-conformance** (F5.2), opcionalmente `audit:billing-core` se secret definido. Falha do job = pipeline vermelho; não fazer merge com pipeline falhado.
- **Required before deploy:** `npm run audit:release:portal` (ou `bash scripts/deploy/pre-flight-check.sh`) antes de deploy do portal para produção. Todos os checks do audit:release:portal devem estar verdes.
- **Recommended manual:** `audit:billing-core` local quando o secret não está configurado no CI; rodar antes de release se houve alterações a billing.

---

*Doc operacional C4.4 — Observability & rollout. F5.2: audit:fase3-conformance no CI; definição explícita §2 e §6. Última atualização: 2026-03.*
