# Mapa de observabilidade e runbooks (F7.2)

**Objetivo:** Referência operacional única para sinais de saúde, resposta a incidentes e runbooks — onde ver cada sinal, qual runbook usar, e gaps assumidos.  
**Referências:** [C44_RELEASE_GATES_AND_ROLLOUT.md](./C44_RELEASE_GATES_AND_ROLLOUT.md), [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md), [RUNBOOKS.md](./RUNBOOKS.md).

---

## 1. Sinais por superfície

| Superfície | Sinal | Onde ver / como verificar | Ação em falha |
|------------|--------|---------------------------|----------------|
| **merchant-portal** | Release gate | `npm run audit:release:portal`; pre-flight-check.sh | Corrigir até passar; não fazer deploy sem verde. |
| **merchant-portal** | Erros em produção | Sentry (VITE_SENTRY_DSN); dashboard Sentry | Investigar; rollback se taxa > 5% (ver [ROLLOUT_QUICK_REFERENCE.md](./ROLLOUT_QUICK_REFERENCE.md)). |
| **merchant-portal** | Build / env | pre-flight-check.sh (env vars, browser-block) | Corrigir env ou build antes de deploy. |
| **Core** | Health REST | `bash scripts/core/health-check-core.sh` ou `curl -s -o /dev/null -w "%{http_code}" $CORE_URL/rest/v1/` | Verificar Core/Postgres/rede; rollback se indisponível. |
| **Core** | Billing estado | `DATABASE_URL=... npm run audit:billing-core` | Corrigir DRIFT/BAD_VALUE ou migrações. |
| **mobile-app** | Erros / sessão | Sentry (EXPO_PUBLIC_SENTRY_DSN); testes em audit:fase3-conformance | Investigar; ver [OBSERVABILITY_SETUP.md](./OBSERVABILITY_SETUP.md). |
| **desktop-app** | Estrutura / conformidade | audit:fase3-conformance (probe) | Ajustar desktop-app ou probe. |
| **Conformidade (Fase 3)** | Portal + mobile + desktop | `npm run audit:fase3-conformance` (CI) | Corrigir conformidade; não fazer merge com falha. |
| **Rollout pós-deploy** | T+0h–T+48h | [PRODUCTION_ROLLOUT_MONITORING_PLAN.md](./PRODUCTION_ROLLOUT_MONITORING_PLAN.md); [ROLLOUT_QUICK_REFERENCE.md](./ROLLOUT_QUICK_REFERENCE.md) | Seguir thresholds (erro < 1%, LCP < 2.5s, Core RPC > 99%); rollback se crítico. |

---

## 2. Runbooks existentes — quando usar

| Situação | Runbook / doc | Onde está |
|----------|----------------|-----------|
| **Deploy / release** | Gates e checklist de rollout | [C44_RELEASE_GATES_AND_ROLLOUT.md](./C44_RELEASE_GATES_AND_ROLLOUT.md) §4; [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md) |
| **Rollback (app ou migration)** | Procedimento de rollback | [rollback-procedure.md](./rollback-procedure.md); [C44](./C44_RELEASE_GATES_AND_ROLLOUT.md) §5 |
| **Incidente geral (segurança, indisponibilidade, abuso)** | Processo de resposta a incidentes | [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) |
| **Dispositivo roubado/perdido** | Playbook específico | [INCIDENT_PLAYBOOK_STOLEN_DEVICE.md](./INCIDENT_PLAYBOOK_STOLEN_DEVICE.md) |
| **Health check falha** | Endpoints e triagem | [health-checks.md](./health-checks.md) |
| **Alertas (Sentry, etc.)** | Configuração e interpretação | [alerts.md](./alerts.md) |
| **Índice completo de runbooks** | Todas as categorias | [RUNBOOKS.md](./RUNBOOKS.md) |
| **Rollout e métricas T+0h–T+48h** | Plano e referência rápida | [PRODUCTION_ROLLOUT_MONITORING_PLAN.md](./PRODUCTION_ROLLOUT_MONITORING_PLAN.md), [ROLLOUT_QUICK_REFERENCE.md](./ROLLOUT_QUICK_REFERENCE.md) |

---

## 3. Gaps de observabilidade — decisão

| Gap | Decisão | Nota |
|-----|---------|------|
| **Sentry/DSN opcional por ambiente** | **Aceite** | Configurar em produção quando usar; documentado em [OBSERVABILITY_SETUP.md](./OBSERVABILITY_SETUP.md). Checklist F7.1 item 9. |
| **Métricas de negócio (ex.: Core RPC %)** | **Aceite** | Dependem de Sentry/Vercel/dashboards externos já referenciados em [PRODUCTION_ROLLOUT_MONITORING_PLAN.md](./PRODUCTION_ROLLOUT_MONITORING_PLAN.md) e [ROLLOUT_QUICK_REFERENCE.md](./ROLLOUT_QUICK_REFERENCE.md). |
| **Logging centralizado** | **Aceite** | Sem plataforma centralizada; logs no cliente e Sentry. Documentado em C44 §1. |
| **customer-portal** | **N/A** | Removido do workspace (F5.1); não há superfície a monitorizar. |
| **Runbook “incidente em produção” genérico** | **Resolvido** | Secção 4 abaixo + [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) + [rollback-procedure.md](./rollback-procedure.md). |
| **Docs de operação dispersas** | **Mitigado** | [RUNBOOKS.md](./RUNBOOKS.md) é o índice; este mapa liga C44, checklist F7.1 e runbooks de rollout/incidente. |

---

## 4. Incidente em produção — primeiros passos

1. **Deteção:** Alerta (Sentry, health, utilizador) ou monitorização (ROLLOUT_QUICK_REFERENCE thresholds).
2. **Classificar:** Tipo (indisponibilidade, erro em massa, segurança, dados) e severidade — ver [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) §2.
3. **Contenção imediata:**
   - **Frontend em falha / regressão:** Rollback Vercel (Promote previous deployment) ou `vercel rollback <url> --prod` — [rollback-procedure.md](./rollback-procedure.md), [C44](./C44_RELEASE_GATES_AND_ROLLOUT.md) §5.
   - **Core inacessível:** Verificar rede/Postgres; escalar infra; comunicar estado.
   - **Sessão/identidade comprometida:** [INCIDENT_PLAYBOOK_STOLEN_DEVICE.md](./INCIDENT_PLAYBOOK_STOLEN_DEVICE.md) e [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) §3.2.
4. **Registo e comunicação:** Documentar ações; dono do incidente e comunicação conforme [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) §4.
5. **Pós-incidente:** Post-mortem; atualizar runbooks se necessário — [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) §3.5.

---

*Mapa F7.2 — Observabilidade e runbooks. Última atualização: 2026-03.*
