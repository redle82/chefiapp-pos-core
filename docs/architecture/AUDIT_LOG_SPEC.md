# Especificação de Audit Log — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T40-4 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Especificação formal da trilha de auditoria (quem fez o quê, quando): eventos a registar, imutabilidade, retenção e formato. Implementação = Onda 2/3.

---

## 1. Âmbito

Este documento define:

- **Eventos** que devem ser registados (segurança, operação sensível, alterações de dados críticos).
- **Formato** e metadados de cada entrada (timestamp, actor, tenant, ação, recurso, resultado).
- **Imutabilidade:** Registos de auditoria não podem ser alterados nem apagados pelo utilizador ou por rotinas normais; apenas o Core pode escrever; purge conforme política.
- **Retenção:** Período de conservação; alinhado a [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md).

**Estado:** Especificação aprovada; persistência imutável e eventos operacionais = Onda 2; **login_success, login_failure, logout** = Onda 3 F1 (RPCs + cliente).

---

## 2. Princípios

| Princípio | Regra |
|-----------|--------|
| **Imutabilidade** | Uma vez escrito, o registo de auditoria não é alterado nem apagado por aplicação ou utilizador. Correções ou anotações (ex.: "evento anulado por decisão X") são novos eventos, não overwrite. |
| **Escopo por tenant** | Todo o evento inclui `restaurant_id` (ou equivalente) para isolamento e filtro. |
| **Actor** | Todo o evento identifica quem realizou a ação (user_id, system, ou "support_admin" com id de sessão). |
| **Timestamp** | Data/hora em UTC; granularidade mínima (ex.: segundo ou milissegundo) definida na implementação. |
| **Integridade** | Implementação deve garantir que a ordem e o conteúdo não são adulterados (ex.: append-only, checksum, ou WORM storage). |

---

## 3. Categorias de eventos a registar

### 3.1 Autenticação e sessão

| Evento | Descrição | Campos mínimos |
|--------|-----------|-----------------|
| login_success | Login bem-sucedido | user_id, restaurant_id(s), timestamp, client_info (opcional) |
| login_failure | Tentativa de login falhada | identifier (email/uid), reason, timestamp, client_info |
| logout | Logout ou sessão terminada | user_id, timestamp |
| session_revoked | Sessão revogada (admin ou sistema) | target_user_id, performed_by, reason, timestamp |
| password_reset_requested | Pedido de reset de senha | user_id ou identifier, timestamp |

**Implementação (F1 Onda 3):** RPCs `log_login_failure(identifier, reason)` (anon) e `record_auth_event('login_success'|'logout', metadata)` (authenticated); cliente chama em AuthPage (login success/failure) e antes de signOut (AdminSidebar, SetupLayout, DraftDashboard). Migração `20260228130000_f1_auth_audit_events.sql`.

### 3.2 Membresia e papéis

| Evento | Descrição | Campos mínimos |
|--------|-----------|-----------------|
| user_disabled | Membro desativado (kill switch) | target_user_id, restaurant_id, performed_by, reason, timestamp |
| user_reenabled | Membro reativado | target_user_id, restaurant_id, performed_by, reason, timestamp |
| role_changed | Alteração de papel (se aplicável) | target_user_id, restaurant_id, old_role, new_role, performed_by, timestamp |
| member_invited | Convite a novo membro | restaurant_id, invited_by, role, timestamp |

### 3.3 Operação sensível (dados e configuração)

| Evento | Descrição | Campos mínimos |
|--------|-----------|-----------------|
| config_changed | Alteração de configuração do restaurante (ex.: integrações, TPV) | restaurant_id, performed_by, key/scope, timestamp |
| export_requested | Pedido de export (work log, dados, DSR) | restaurant_id, performed_by, export_type, scope (período), timestamp |
| bulk_action | Ação em massa (ex.: cancelar pedidos) | restaurant_id, performed_by, action_type, scope_count, timestamp |

### 3.4 Dados financeiros e de caixa (conforme Core)

| Evento | Descrição | Campos mínimos |
|--------|-----------|-----------------|
| cash_register_opened | Abertura de caixa | restaurant_id, performed_by, register_id, timestamp |
| cash_register_closed | Fecho de caixa | restaurant_id, performed_by, register_id, amount_summary, timestamp |
| payment_recorded | Registo de pagamento (referência; não dados de cartão) | restaurant_id, performed_by, order_id, amount, method, timestamp |

**Implementação (F2 Onda 3):** Triggers em gm_cash_registers: `tr_gm_cash_registers_audit_opened` (AFTER INSERT, status=open) e `tr_gm_cash_registers_audit_closed` (AFTER UPDATE, open→closed). Migração `20260228140000_f2_cash_register_audit_events.sql`.

### 3.5 Acesso Admin / suporte

| Evento | Descrição | Campos mínimos |
|--------|-----------|-----------------|
| admin_access | Acesso excecional de suporte a recurso/tenant | admin_id, restaurant_id (ou scope), action, reason, timestamp |
| security_incident_opened | Abertura de incidente de segurança | restaurant_id ou global, performed_by, reason, timestamp |
| security_incident_closed | Encerramento de incidente | incident_id, performed_by, summary, timestamp |

---

## 4. Formato e armazenamento

- **Estrutura sugerida (exemplo):** `{ event_id, event_type, timestamp_utc, restaurant_id, actor_id, actor_type, action, resource_type, resource_id, details (JSON), result }`.
- **Armazenamento:** Tabela ou stream append-only; sem UPDATE nem DELETE por aplicação; purge apenas por job autorizado conforme política de retenção.
- **Retenção:** Mínimo conforme obrigações legais e contratuais; recomendação (ex.: 2 anos para eventos de segurança, 7 anos para eventos financeiros) a definir com jurídico e [RETENTION_POLICY.md](./RETENTION_POLICY.md). **Purge:** Conforme [AUDIT_LOG_PURGE_RUNBOOK.md](../ops/AUDIT_LOG_PURGE_RUNBOOK.md) (F3 Onda 3); RPC `purge_audit_logs_older_than(p_cutoff)` com service_role.

---

## 5. Acesso e export

- **Leitura:** Apenas roles autorizadas (ex.: Owner, Manager com restrições; Admin suporte com auditoria); filtro obrigatório por tenant (restaurant_id).
- **Consulta:** RPC `get_audit_logs(p_restaurant_id, p_from, p_to, p_event_type, p_action, p_limit)` para DPO/admin; ver [AUDIT_LOG_QUERY.md](../ops/AUDIT_LOG_QUERY.md).
- **Export:** Para DSR ou auditoria, export de eventos conforme [DATA_SUBJECT_REQUESTS.md](./DATA_SUBJECT_REQUESTS.md) e [WORK_LOG_EXPORT.md](./WORK_LOG_EXPORT.md); formato e âmbito definidos na implementação.
- **Sem alteração:** Nenhum utilizador ou API pode alterar ou apagar registos existentes.

---

## 6. Implementação (Onda 2/3)

- **Entregas previstas:** (1) Schema e tabela/stream append-only; (2) Instrumentação nos pontos de login, membresia, config, export, caixa e admin; (3) Políticas de retenção e purge (F3: runbook + RPC purge_audit_logs_older_than); (4) Consultas e export para DPO/auditoria.
- **Critério de sucesso:** Trilha imutável consultável; eventos mínimos cobertos; integração com [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md).

---

**Referências:** [AUDIT_LOG_QUERY.md](../ops/AUDIT_LOG_QUERY.md) (consulta DPO/admin) · [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) · [THREAT_MODEL.md](./THREAT_MODEL.md) · [ACCESS_CONTROL_MATRIX.md](./ACCESS_CONTROL_MATRIX.md) · [DATA_SUBJECT_REQUESTS.md](./DATA_SUBJECT_REQUESTS.md) · [RETENTION_POLICY.md](./RETENTION_POLICY.md) (a criar) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md).
