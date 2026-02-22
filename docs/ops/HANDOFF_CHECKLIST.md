# ChefIApp — Handoff Checklist (Ops/Support)

Preencher e manter atualizado ao entregar o sistema à equipa de operações.  
Ref: DEPLOYMENT_RUNBOOK.md §6.

---

## 0. Variáveis de produção e Supabase

- [ ] **Frontend (Vercel):** Definir `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (ou `VITE_CORE_URL` / `VITE_CORE_ANON_KEY`). Guia: **docs/ops/PRODUCTION_ENV_SETUP.md**.
- [ ] **Gateway:** Definir `CORE_URL`, `CORE_SERVICE_KEY`, `INTERNAL_API_TOKEN`; opcional: `SUMUP_WEBHOOK_SECRET`, Stripe. Ver DEPLOYMENT_RUNBOOK.md §1.
- [ ] **Migrações Supabase:** Quando o projeto Supabase estiver ativo, executar `export DATABASE_URL="..."; pnpm run supabase:finalize` (ver docs/ops/PRODUCTION_ENV_SETUP.md §3 e docs/ops/SUPABASE_EXCELLENCE.md).

---

## 1. Runbook e incidentes

- [ ] Equipa tem acesso a **DEPLOYMENT_RUNBOOK.md** (repo raiz).
- [ ] Secção **Incidentes comuns** (§5) conhecida (PostgREST 401, webhook SumUp, gateway 500).
- [ ] Comando de smoke em produção documentado: `bash scripts/smoke-test.sh --prod`.

---

## 2. Monitorização

- [ ] **Dashboard / ferramenta**: _________________________________ (ex.: Sentry, Vercel, Render, Grafana).
- [ ] **Quem tem acesso**: _________________________________.
- [ ] **Alertas** (opcional): PostgREST down, gateway 5xx, erro rate > X%.
- [ ] Script de health: `bash scripts/monitoring-health.sh` (opcional cron).

Ref: docs/ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md, docs/ops/ROLLOUT_QUICK_REFERENCE.md.

---

## 3. Backup da base de dados

- [ ] **Frequência**: _________________________________ (ex.: diário, semanal).
- [ ] **Retenção**: _________________________________ (ex.: 7 dias, 30 dias).
- [ ] **Responsável / processo**: _________________________________.
- [ ] Supabase: usar painel Backups ou política do projeto.

---

## 4. On-call

- [ ] **Rotação definida**: sim / não.
- [ ] **Ferramenta**: _________________________________ (ex.: PagerDuty, Opsgenie, calendário).
- [ ] **Contactos de escalação**: _________________________________.

---

## 5. Resposta a incidentes

- [ ] **Quem decide rollback**: _________________________________.
- [ ] **Quem comunica** (clientes/internos): _________________________________.
- [ ] Documento de referência: **docs/ops/ROLLOUT_QUICK_REFERENCE.md**.
- [ ] Passos de rollback: DEPLOYMENT_RUNBOOK.md §4.

---

## 6. Procedimento de deploy

- [ ] Ordem de deploy documentada (DB → Core → Gateway → Frontend); ver DEPLOYMENT_RUNBOOK.md §2.
- [ ] **Quem faz deploy**: _________________________________.
- [ ] Verificação pós-deploy: `bash scripts/verify-local-stack.sh` (adaptar URLs) e `bash scripts/test-integration.sh` (com JWT se auth ativo). Smoke: `bash scripts/smoke-test.sh --prod`.

Scripts úteis: scripts/verify-local-stack.sh, scripts/monitoring-health.sh, scripts/test-integration.sh, scripts/smoke-test.sh.

---

**Última atualização**: 2026-02-22  
**Responsável**: _______________
