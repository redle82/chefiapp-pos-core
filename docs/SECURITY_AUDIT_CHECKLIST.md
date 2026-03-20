> **DEPRECATED** -- This document is from an earlier audit cycle (Day 7). See [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) for the current canonical security checklist (audited 2026-03-20).

# ChefIApp -- Security Audit Checklist (DAY 7)

**Objetivo**: Verificacao pre-release de seguranca.
**Ref**: IMPLEMENTATION_CHECKLIST.md Day 7 Afternoon.

---

## 1. RLS (Row-Level Security)

- [ ] **Políticas RLS ativas** em todas as tabelas sensíveis: `gm_restaurants`, `gm_orders`, `gm_order_items`, `gm_payments`, `gm_restaurant_members`, `gm_organizations`, `webhook_out_config`, `gm_audit_logs`.
- [ ] **Utilizador autenticado** não vê dados de outro tenant (testar com `scripts/test-rls-isolation.sh`).
- [ ] **Role `anon`** sem permissões em tabelas de negócio (REVOKE documentado em migrações).
- [ ] **`service_role`** usado apenas em backend/gateway; nunca exposto no frontend.

---

## 2. CORS

- [ ] **CORS** configurado no integration-gateway (`CORS_ORIGIN`) e no frontend (Vercel/rewrites) apenas para origens permitidas.
- [ ] Sem `Access-Control-Allow-Origin: *` em produção.

---

## 3. HTTPS e headers

- [ ] **HTTPS** em produção (redirect HTTP → HTTPS).
- [ ] **Headers de segurança** presentes onde aplicável: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security` (ver deploy smoke).

---

## 4. JWT e segredos

- [ ] **JWT** não exposto em logs (não fazer log de `Authorization` ou `apikey`).
- [ ] **Segredos** (`CORE_SERVICE_KEY`, `SUMUP_WEBHOOK_SECRET`, `INTERNAL_API_TOKEN`) apenas em variáveis de ambiente, nunca em código.
- [ ] **Claims JWT** validados (iss, aud) pelo PostgREST/Supabase.

---

## 5. Webhooks

- [ ] **SumUp**: verificação HMAC quando `SUMUP_WEBHOOK_SECRET` está definido.
- [ ] **Webhooks OUT**: assinatura HMAC no header `X-ChefIApp-Signature`; clientes devem validar.

---

## 6. Auditoria

- [ ] **Trilha de auditoria** (`gm_audit_logs` ou equivalente) em uso para ações sensíveis (pagamentos, alterações de config).
- [ ] Logs de acesso a dados sensíveis não expõem PII em claro em ficheiros de log públicos.

---

## Como executar

1. Aplicar checklist manualmente antes de cada release.
2. RLS: `JWT_USER_A=... JWT_USER_B=... bash scripts/test-rls-isolation.sh`
3. Smoke deploy (headers, reachability): `bash scripts/smoke-test.sh --prod`
4. Ver também: `docs/ops/ROLLOUT_QUICK_REFERENCE.md`, `DEPLOYMENT_RUNBOOK.md`
