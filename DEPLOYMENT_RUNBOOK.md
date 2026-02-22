# ChefIApp — Deployment Runbook

**Objetivo**: Guia operacional para deploy, rollback e verificação do stack SaaS.  
**Última atualização**: 2026-02-22

---

## 1. Pré-requisitos

- **Frontend (Vercel)**: Build do `merchant-portal` (React + Vite).
- **Core**: Supabase (PostgreSQL + PostgREST + Auth) ou stack local (`docker-core/docker-compose.core.yml`).
- **Gateway**: Node.js (porta 4320), ex.: Render ou outro host.

Variáveis críticas:

- `CORE_URL` / `CORE_SERVICE_KEY` (gateway → Core).
- `INTERNAL_API_TOKEN` (chamadas a `/internal/events`).
- `SUMUP_WEBHOOK_SECRET` (opcional, webhook SumUp).
- `STRIPE_SECRET_KEY` e `STRIPE_PRICE_*` (billing).

---

## 2. Deploy em sequência recomendada

1. **Base de dados**: Aplicar migrations (Supabase Dashboard ou `supabase db push` / scripts de migração).
2. **Core/PostgREST**: Garantir que está a servir `/rest/v1/` e `/rpc` com JWT válido.
3. **Integration Gateway**: Deploy do `server/integration-gateway.ts` com env configurado; health: `GET /health`.
4. **Frontend**: Deploy do merchant-portal (Vercel ou estático) com `VITE_API_BASE` apontando ao gateway/Core conforme arquitetura.

---

## 3. Verificação pós-deploy

```bash
# Health Core
curl -s -o /dev/null -w "%{http_code}" "$CORE_URL/rest/v1/"

# Health Gateway
curl -s "$GATEWAY_URL/health"

# Teste de integração (com Core + Gateway no ar)
API_URL="$CORE_URL" GATEWAY_URL="$GATEWAY_URL" bash scripts/test-integration.sh
```

---

## 4. Rollback

- **Frontend**: Reverter deploy na Vercel (previous deployment).
- **Gateway**: Reverter para a versão anterior no Render/host e redesenhar.
- **Base de dados**: Migrations são aplicadas de forma incremental; rollback de schema exige migrações de reversão (não automático). Em caso de erro, corrigir com nova migração em vez de reverter.

---

## 5. Incidentes comuns

| Sintoma | Ação |
|--------|------|
| PostgREST 401/403 | Verificar JWT (iss, aud), RLS e `CORE_SERVICE_KEY` no gateway. |
| Webhook SumUp 401 | Verificar `SUMUP_WEBHOOK_SECRET` e formato de `X-SumUp-Signature`. |
| Webhooks OUT não entregues | Consultar `webhook_out_delivery_log`; verificar URL e secret na config. |
| Gateway 500 ao chamar Core | Verificar conectividade e `CORE_URL`; logs do gateway. |

---

## 6. Handoff checklist (ops/support)

Ao entregar o sistema à equipa de operações, garantir:

| Item | Descrição |
|------|-----------|
| **Runbook** | Este documento (DEPLOYMENT_RUNBOOK.md) + incidentes comuns (§5). |
| **Monitoring dashboard** | Acesso a Sentry/Vercel/Render (ou equivalente); ver `docs/ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md`. |
| **Database backup** | Calendário de backups (Supabase ou self-hosted); ponto de restauro conhecido. |
| **On-call** | Definir rotação e contactos; documentar em ferramenta de equipa. |
| **Incident response** | Plano de resposta a incidentes (quem decide rollback, quem comunica); ver `docs/ops/ROLLOUT_QUICK_REFERENCE.md`. |
| **Deployment procedure** | Ordem de deploy (§2); rollback (§4); comando de smoke: `bash scripts/smoke-test.sh --prod`. |

Checklist editável para a equipa preencher: **docs/ops/HANDOFF_CHECKLIST.md** (variáveis de produção, monitorização, backup, on-call, resposta a incidentes, deploy). Guia de variáveis de produção (Vercel, anon key, migrações): **docs/ops/PRODUCTION_ENV_SETUP.md**.

Scripts úteis: `scripts/verify-local-stack.sh` (Day 1), `scripts/monitoring-health.sh` (health + latency), `scripts/test-integration.sh`, `scripts/smoke-test.sh`.

---

## 7. Referências

- Arquitetura: `ARCHITECTURE_SAAS.md`
- Checklist de implementação: `IMPLEMENTATION_CHECKLIST.md`
- Webhooks: `docs/WEBHOOK_SPEC.md`
- Monitorização: `docs/ops/PRODUCTION_ROLLOUT_MONITORING_PLAN.md`, `docs/ops/ROLLOUT_QUICK_REFERENCE.md`
- Segurança: `docs/SECURITY_AUDIT_CHECKLIST.md`
