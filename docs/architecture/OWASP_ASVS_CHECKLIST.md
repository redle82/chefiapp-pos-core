# Checklist OWASP ASVS (adaptado ao ChefIApp™)

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T40-2 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md) · [ONDA_3_TAREFAS_90_DIAS.md](../ONDA_3_TAREFAS_90_DIAS.md)  
**Propósito:** Checklist de requisitos de segurança adaptado ao ChefIApp, inspirado no OWASP Application Security Verification Standard (ASVS). Usado para auto-avaliação e auditoria. Não substitui o ASVS completo; cobre os pontos mais relevantes para a arquitetura multi-tenant e operacional.

**E3 Onda 3:** Checklist alinhado a testes ou revisões; coluna **Evidência** com referência a teste, migração ou doc por item.

---

## 1. Âmbito

- **Base:** OWASP ASVS (níveis 1–2 como referência).
- **Adaptação:** Foco em autenticação, autorização, isolamento de dados (multi-tenant), proteção de dados sensíveis, auditoria e configuração segura.
- **Uso:** Marcar conforme implementado (✅), parcial (🟡) ou em falta (❌); **Evidência** = teste, migração ou doc que comprova o estado.

---

## 2. Autenticação (V2)

| ID | Requisito | Estado | Evidência |
|----|-----------|--------|-----------|
| 2.1.1 | Requisitos de senha (complexidade, política) definidos e aplicados (Supabase Auth) | 🟡 | Revisão: Supabase Dashboard Auth settings; doc projeto |
| 2.1.2 | Bloqueio após N falhas ou rate limiting no login | 🟡 | [RATE_LIMITING_AND_INPUT_VALIDATION.md](./RATE_LIMITING_AND_INPUT_VALIDATION.md); Core middleware auth: 10 req/min |
| 2.2.1 | Sessões com timeout e renovação (refresh token) | ✅ | Supabase Auth (JWT + refresh); testes `tests/security/auth-security.test.ts` |
| 2.2.2 | Logout invalida sessão no servidor (revogação de token/sessão) | ✅ | disabled_at em gm_restaurant_members; RPC admin_disable_staff_member; [ACCESS_CONTROL_MATRIX.md](./ACCESS_CONTROL_MATRIX.md) |
| 2.2.3 | Identificador de sessão não previsível (não sequential) | ✅ | Supabase Auth JWT; sem ID sequencial exposto |
| 2.5.x | MFA disponível para contas sensíveis (Owner/Admin) | ❌ | Backlog [THREAT_MODEL.md](./THREAT_MODEL.md) |

---

## 3. Autorização e controlo de acesso (V4)

| ID | Requisito | Estado | Evidência |
|----|-----------|--------|-----------|
| 4.1.1 | Controlo de acesso por papel/função (Owner, Manager, Waiter, KDS) | ✅ | RLS em migrações (gm_restaurant_members.role); [ACCESS_CONTROL_MATRIX.md](./ACCESS_CONTROL_MATRIX.md) |
| 4.1.2 | Falha fechada (403) quando não autorizado; nunca assumir tenant padrão | ✅ | [TENANT_ISOLATION_SECURITY_MODEL.md](../security/TENANT_ISOLATION_SECURITY_MODEL.md); RPCs RAISE / 403 |
| 4.2.1 | Recursos e ações autorizadas definidas por papel | ✅ | [ACCESS_CONTROL_MATRIX.md](./ACCESS_CONTROL_MATRIX.md) (Recurso × Papel) |
| 4.4.1 | APIs e rotas protegidas; sem bypass de autorização no cliente | ✅ | supabase/functions/_shared/auth.ts requireUser(); RPCs usam auth.uid() |

---

## 4. Validação de dados e injeção (V5)

| ID | Requisito | Estado | Evidência |
|----|-----------|--------|-----------|
| 5.1.x | Entrada validada (tipo, formato, limites); rejeição de inválidos | ✅ | Migrações 20260201130000, 20260228120000; [RATE_LIMITING_AND_INPUT_VALIDATION.md](./RATE_LIMITING_AND_INPUT_VALIDATION.md); tests/security/auth-security.test.ts |
| 5.2.x | Saída codificada/escapada para evitar XSS | 🟡 | Revisão: React (escape por defeito); relatórios/export |
| 5.4.x | Queries parametrizadas / sem concatenação de SQL | ✅ | Supabase client; RPCs com parâmetros; sem sql\`...\${input}\` |
| 5.5.x | IDs não sequenciais expostos (UUID) para entidades | ✅ | Schema: id UUID DEFAULT gen_random_uuid(); short_id não substitui id em APIs sensíveis |

---

## 5. Criptografia e proteção de dados (V6)

| ID | Requisito | Estado | Evidência |
|----|-----------|--------|-----------|
| 6.2.1 | Dados sensíveis em trânsito (TLS) | ✅ | Supabase HTTPS; docs deploy |
| 6.2.2 | Dados sensíveis em repouso (criptografia no disco) | 🟡 | Revisão: Supabase/cloud DPA |
| 6.4.1 | Dados de pagamento (PAN, CVV) não armazenados no ChefIApp | ✅ | [WHAT_WE_DO_NOT_PROCESS.md](./WHAT_WE_DO_NOT_PROCESS.md) |
| 6.6.1 | Chaves e segredos não em código nem em repositório | 🟡 | .env; Supabase secrets; revisão CI/CD |

---

## 6. Multi-tenant e isolamento (específico ChefIApp)

| ID | Requisito | Estado | Evidência |
|----|-----------|--------|-----------|
| MT.1 | Toda tabela multi-tenant tem `restaurant_id` (ou equivalente) | ✅ | Revisão migrações; [TENANT_ISOLATION_SECURITY_MODEL.md](../security/TENANT_ISOLATION_SECURITY_MODEL.md) |
| MT.2 | RLS ativado em 100% das tabelas multi-tenant | ✅ | Migrações ensure_rls_complete, RLS em gm_* |
| MT.3 | `restaurant_id` sempre derivado pelo backend (Auth Context); nunca confiar no cliente em escrita | ✅ | RPCs usam auth.uid() + is_user_member_of_restaurant; [ACCESS_CONTROL_MATRIX.md](./ACCESS_CONTROL_MATRIX.md) |
| MT.4 | Subscriptions/filtros de realtime incluem tenant (ex.: `restaurant_id=eq.X`) | ✅ | Doc: sem filtro = banido; revisão código realtime |
| MT.5 | Teste de isolamento (User A não acede a recurso do Tenant B) em pipeline | 🟡 | tests/isolation-test.ts; tests/e2e/multi-tenant.e2e.test.ts; integrar em CI |

---

## 7. Auditoria e logging (V7)

| ID | Requisito | Estado | Evidência |
|----|-----------|--------|-----------|
| 7.1.1 | Eventos de segurança registados (login, logout, falha de auth, alteração de permissões) | ✅ | login_success, login_failure, logout em gm_audit_logs (F1); RPCs log_login_failure, record_auth_event; [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) §3.1 |
| 7.2.1 | Logs incluem utilizador e tenant (restaurant_id) | ✅ | gm_audit_logs.tenant_id, actor_id; RPC get_audit_logs; migração 20260201120002 |
| 7.3.1 | Logs de auditoria não alteráveis pelo utilizador (imutabilidade) | ✅ | Trigger gm_audit_logs_immutable (UPDATE/DELETE proibidos); supabase/migrations/20260201120000_audit_log_spec_alignment.sql |
| 7.4.1 | Retenção de logs definida e documentada | ✅ | [RETENTION_POLICY.md](./RETENTION_POLICY.md); [AUDIT_LOG_PURGE_RUNBOOK.md](../ops/AUDIT_LOG_PURGE_RUNBOOK.md) (F3); RPC purge_audit_logs_older_than |

---

## 8. Configuração e deploy (V8)

| ID | Requisito | Estado | Evidência |
|----|-----------|--------|-----------|
| 8.1.x | Configuração segura por ambiente (dev/staging/prod); sem credenciais em código | 🟡 | .env; Supabase secrets; revisão .gitignore |
| 8.2.x | Dependências atualizadas; sem vulnerabilidades conhecidas críticas | 🟡 | npm audit; Dependabot; [THREAT_MODEL_MITIGATION_MATRIX.md](./THREAT_MODEL_MITIGATION_MATRIX.md) §5 |
| 8.4.x | Documentação de deploy e runbooks (rollback, incidente) | ✅ | docs/ops/; [INCIDENT_RESPONSE.md](../ops/INCIDENT_RESPONSE.md); [INCIDENT_PLAYBOOK_STOLEN_DEVICE.md](../ops/INCIDENT_PLAYBOOK_STOLEN_DEVICE.md) |

---

## 9. Resumo e próximos passos

- **✅** Implementado e verificado (evidência na coluna Evidência).
- **🟡** Parcial ou a confirmar em revisão.
- **❌** Em falta; registar no backlog (ex.: [THREAT_MODEL.md](./THREAT_MODEL.md), [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md)).

**Prioridade:** F1 (login/logout em gm_audit_logs); MT.5 (integrar isolation-test / multi-tenant.e2e em CI); 2.5.x (MFA). Revisar 5.2, 6.2, 6.6 com equipa.

---

**Referências:** [THREAT_MODEL.md](./THREAT_MODEL.md) · [THREAT_MODEL_MITIGATION_MATRIX.md](./THREAT_MODEL_MITIGATION_MATRIX.md) · [ACCESS_CONTROL_MATRIX.md](./ACCESS_CONTROL_MATRIX.md) · [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) · [RATE_LIMITING_AND_INPUT_VALIDATION.md](./RATE_LIMITING_AND_INPUT_VALIDATION.md) · [TENANT_ISOLATION_SECURITY_MODEL.md](../security/TENANT_ISOLATION_SECURITY_MODEL.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) · [ONDA_3_TAREFAS_90_DIAS.md](../ONDA_3_TAREFAS_90_DIAS.md).
