# Matriz de Mitigações — Threat Model ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [THREAT_MODEL.md](./THREAT_MODEL.md) · [ONDA_3_TAREFAS_90_DIAS.md](../ONDA_3_TAREFAS_90_DIAS.md)  
**Propósito:** Mapear cada ameaça do Threat Model a mitigações existentes ou planeadas, controles (código/config/doc) e dono/estado. Entregável E1 Onda 3.

---

## Legenda

| Estado | Significado |
|--------|-------------|
| ✅ | Implementado e verificado |
| 🟡 | Parcial ou planeado; em backlog |
| ❌ | Em falta; backlog prioritário |

**Dono:** Engenharia (Core/API), Produto (Auth/UX), Ops (alertas/runbooks), ou Processo (PR/revisão).

---

## 1. Cross-tenant (vazamento entre tenants)

| Ameaça | Mitigação | Controle existente / em falta | Dono | Estado |
|--------|-----------|------------------------------|------|--------|
| Leitura de dados de outro restaurante | RLS em 100% das tabelas multi-tenant; `restaurant_id` em todas as queries; fail-closed | RLS em migrações (143 ficheiros com políticas); [TENANT_ISOLATION_SECURITY_MODEL.md](../security/TENANT_ISOLATION_SECURITY_MODEL.md) | Engenharia | ✅ |
| Leitura cross-tenant — validação contínua | Testes E2E de isolamento em todo PR | Testes de isolamento em pipeline | Engenharia | 🟡 |
| Escrita em outro tenant (injeção de `restaurant_id`) | Backend deriva `restaurant_id` do Auth Context; nunca confiar no cliente em escrita | RPCs usam `auth.uid()` e helpers; Edge Functions requireUser(); [ACCESS_CONTROL_MATRIX.md](./ACCESS_CONTROL_MATRIX.md) | Engenharia | ✅ |
| Escrita cross-tenant — auditoria de pontos de escrita | Revisão de todos os pontos de escrita | Processo de PR; checklist de novas tabelas/APIs | Processo | 🟡 |
| IDs previsíveis (enumeração entre tenants) | UUIDv4 para entidades externas | Schema com UUID; sem sequential IDs expostos ao cliente | Engenharia | ✅ |

---

## 2. Compromisso de sessão / identidade

| Ameaça | Mitigação | Controle existente / em falta | Dono | Estado |
|--------|-----------|------------------------------|------|--------|
| Dispositivo roubado (sessão ativa) | RLS limita dano ao tenant; playbook revogar sessão / desativar membro | [INCIDENT_PLAYBOOK_STOLEN_DEVICE.md](../ops/INCIDENT_PLAYBOOK_STOLEN_DEVICE.md); `admin_disable_staff_member`; gm_audit_logs (user_disabled) | Ops / Engenharia | ✅ |
| Revogação em massa / automatizada | Automatizar revogação quando membro desativado | disabled_at em gm_restaurant_members; cliente deve respeitar; revogação de tokens pode ser manual | Produto / Engenharia | 🟡 |
| Alertas de login anómalo | Detetar logins suspeitos (localização, dispositivo) | — | Ops | ❌ |
| Roubo de credenciais (phishing, reutilização) | Supabase Auth; MFA quando disponível | Supabase Auth; política de senha | Produto | ✅ / 🟡 |
| MFA para Owner/Manager | Promover MFA para contas sensíveis | — | Produto / Auth | ❌ |
| Token longo ou não revogável | Sessões curtas; refresh tokens; desativar membro (disabled_at) | JWT + refresh; disabled_at; política de revogação ao desligar colaborador (doc) | Engenharia / Produto | ✅ |

---

## 3. Integridade de dados

| Ameaça | Mitigação | Controle existente / em falta | Dono | Estado |
|--------|-----------|------------------------------|------|--------|
| Alteração de dados financeiros/auditoria | Imutabilidade; correções por evento compensatório; trilha de auditoria | [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md); gm_audit_logs append-only (Onda 2); trigger sem UPDATE/DELETE | Engenharia | ✅ |
| Escalação de privilégios (ver/editar além do papel) | Matriz de acesso; RLS por papel | [ACCESS_CONTROL_MATRIX.md](./ACCESS_CONTROL_MATRIX.md); RLS por role em tabelas; helpers is_user_member_of_restaurant(), disabled_at | Engenharia | ✅ |
| Revisão de novas funcionalidades para RLS e papel | Checklist em PR para novas tabelas/APIs | — | Processo | 🟡 |
| Validação de entrada (RPCs críticos) | Rejeitar entradas inválidas antes de auth e lógica | create_order_atomic, process_order_payment: validação em migração 20260201130000 / 20260228120000; [RATE_LIMITING_AND_INPUT_VALIDATION.md](./RATE_LIMITING_AND_INPUT_VALIDATION.md) | Engenharia | ✅ |

---

## 4. Disponibilidade e negação de serviço

| Ameaça | Mitigação | Controle existente / em falta | Dono | Estado |
|--------|-----------|------------------------------|------|--------|
| DDoS ou abuso de API | Rate limiting; rede isolada; Core em Docker | Rate limit em Docker Core (middleware) + cliente (OrderProtection); [RATE_LIMITING_AND_INPUT_VALIDATION.md](./RATE_LIMITING_AND_INPUT_VALIDATION.md) | Ops / Engenharia | ✅ |
| SLO e alertas para disponibilidade | Definir SLO; alertas para indisponibilidade | [SLO_SLI.md](./SLO_SLI.md); alertas (Sentry/Grafana) = Onda 3 G2/G3 | Ops | 🟡 |
| Runbooks para incidentes de disponibilidade | Documentar resposta a incidentes | [INCIDENT_RESPONSE.md](../ops/INCIDENT_RESPONSE.md); disaster-recovery | Ops | ✅ |
| Ransomware / destruição de dados | Backups; disaster recovery | Backups; [ops/disaster-recovery.md](../ops/disaster-recovery.md) | Ops | ✅ |
| Testes de restore; backup imutável | Validar restauro; backup não apagável por atacante | — | Ops | 🟡 |

---

## 5. Cadeia de fornecedores e dependências

| Ameaça | Mitigação | Controle existente / em falta | Dono | Estado |
|--------|-----------|------------------------------|------|--------|
| Compromisso de Supabase / BaaS | RLS; JWT com claims mínimos; contrato DPA | RLS; Supabase Auth; DPA (contrato) | Engenharia / Legal | ✅ / 🟡 |
| Revisão periódica de permissões e dependências | Processo de revisão de permissões (Supabase, IAM) | — | Ops / Processo | 🟡 |
| Dependência maliciosa ou vulnerável (npm, etc.) | Auditoria de dependências; lockfile | lockfile (package-lock, etc.); npm audit | Engenharia | ✅ |
| Automatizar (Dependabot, auditoria em CI) | CI falha se vulnerabilidades críticas | — | Engenharia | 🟡 |

---

## 6. Auditoria e eventos de segurança (complemento OWASP 7.x)

| Requisito | Mitigação | Controle existente / em falta | Dono | Estado |
|-----------|-----------|------------------------------|------|--------|
| Eventos login_success, login_failure, logout em gm_audit_logs | Emitir em auth callback ou boundary | — (Onda 3 F1) | Engenharia | ❌ |
| Logs imutáveis (utilizador não altera) | gm_audit_logs append-only; sem UPDATE/DELETE | Migração Onda 2; trigger imutabilidade | Engenharia | ✅ |
| Retenção de logs definida e documentada | Política de retenção; purge conforme (Onda 3 F3) | [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) | Ops | 🟡 |

---

## 7. Resumo por prioridade (backlog Onda 3)

| Prioridade | Controle | Dono | Estado | Onda 3 tarefa |
|------------|----------|------|--------|----------------|
| 1 | Trilha de auditoria imutável | Engenharia | ✅ | Onda 2 concluída |
| 2 | Testes E2E de isolamento em todo PR | Engenharia | 🟡 | E2 |
| 3 | MFA para Owner/Manager | Produto / Auth | ❌ | E2/E3 |
| 4 | Revisão de novas tabelas/APIs para RLS e tenant | Processo | 🟡 | E3 |
| 5 | Rate limiting e SLO/alertas | Ops / Engenharia | 🟡 | E2, G2, G3 |
| 6 | Eventos login/logout em gm_audit_logs | Engenharia | ❌ | F1 |
| 7 | Purge/retenção gm_audit_logs | Ops | 🟡 | F3 |

---

**Referências:** [THREAT_MODEL.md](./THREAT_MODEL.md) · [OWASP_ASVS_CHECKLIST.md](./OWASP_ASVS_CHECKLIST.md) · [ONDA_3_TAREFAS_90_DIAS.md](../ONDA_3_TAREFAS_90_DIAS.md) · [CHECKLIST_FECHO_GAPS.md](../CHECKLIST_FECHO_GAPS.md).
