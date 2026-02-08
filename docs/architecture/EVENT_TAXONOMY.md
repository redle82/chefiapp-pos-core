# Taxonomia de Eventos — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T30-1 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Taxonomia central de eventos do ChefIApp: domínio operacional, segurança e auditoria. Base para [METRICS_DICTIONARY.md](./METRICS_DICTIONARY.md), [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) e instrumentação (Onda 3).

---

## 1. Âmbito

Este documento define:

- **Categorias** de eventos (identidade, operação, financeiro, auditoria).
- **Nome do evento**, **descrição** e **campos mínimos** (tenant, actor, timestamp).
- **Uso:** Observabilidade, dashboards, alertas e trilha de auditoria; ver [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) para eventos de auditoria formais.

**Implementação:** Eventos implícitos nos contratos e em app_logs; instrumentação centralizada = Onda 3.

---

## 2. Princípios

- **Escopo por tenant:** Todo o evento inclui `restaurant_id` (ou equivalente) quando aplicável.
- **Actor:** Quem ou o quê originou o evento (user_id, system, terminal_id).
- **Timestamp:** UTC; granularidade definida na implementação.
- **Imutabilidade:** Eventos de auditoria não são alterados nem apagados; ver [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md).

---

## 3. Categorias e eventos

### 3.1 Identidade e sessão

| Evento | Descrição | Campos mínimos |
|--------|-----------|-----------------|
| login_success | Login bem-sucedido | user_id, restaurant_id(s), timestamp |
| login_failure | Tentativa de login falhada | identifier, reason, timestamp |
| logout | Logout ou fim de sessão | user_id, timestamp |
| session_revoked | Sessão revogada (admin/sistema) | target_user_id, performed_by, reason, timestamp |
| user_disabled | Membro desativado (kill switch) | target_user_id, restaurant_id, performed_by, reason, timestamp |
| user_reenabled | Membro reativado | target_user_id, restaurant_id, performed_by, reason, timestamp |

### 3.2 Operação — Pedidos e KDS

| Evento | Descrição | Campos mínimos |
|--------|-----------|-----------------|
| order_created | Pedido criado | restaurant_id, order_id, created_by, timestamp |
| order_updated | Pedido atualizado (estado, itens) | restaurant_id, order_id, updated_by, timestamp |
| order_cancelled | Pedido cancelado | restaurant_id, order_id, cancelled_by, reason, timestamp |
| order_item_status_changed | Estado de item alterado (KDS) | restaurant_id, order_id, item_id, status, performed_by, timestamp |
| task_assigned | Tarefa atribuída a utilizador | restaurant_id, task_id, assignee_id, assigned_by, timestamp |
| task_completed | Tarefa concluída | restaurant_id, task_id, completed_by, timestamp |

### 3.3 Operação — Turnos e presença

| Evento | Descrição | Campos mínimos |
|--------|-----------|-----------------|
| shift_started | Check-in / início de turno | restaurant_id, user_id, shift_id, timestamp |
| shift_ended | Check-out / fim de turno | restaurant_id, user_id, shift_id, timestamp |
| shift_planned | Turno planeado criado ou alterado | restaurant_id, user_id, shift_id, performed_by, timestamp |

### 3.4 Financeiro e caixa (Core)

| Evento | Descrição | Campos mínimos |
|--------|-----------|-----------------|
| cash_register_opened | Abertura de caixa | restaurant_id, register_id, performed_by, timestamp |
| cash_register_closed | Fecho de caixa | restaurant_id, register_id, performed_by, amount_summary, timestamp |
| payment_recorded | Pagamento registado (referência; não dados de cartão) | restaurant_id, order_id, amount, method, performed_by, timestamp |

### 3.5 Configuração e export

| Evento | Descrição | Campos mínimos |
|--------|-----------|-----------------|
| config_changed | Alteração de configuração do restaurante | restaurant_id, performed_by, key/scope, timestamp |
| export_requested | Pedido de export (work log, DSR, dados) | restaurant_id, performed_by, export_type, scope, timestamp |
| bulk_action | Ação em massa (ex.: cancelar pedidos) | restaurant_id, performed_by, action_type, scope_count, timestamp |

### 3.6 Segurança e admin

| Evento | Descrição | Campos mínimos |
|--------|-----------|-----------------|
| admin_access | Acesso excecional de suporte | admin_id, restaurant_id ou scope, action, reason, timestamp |
| security_incident_opened | Abertura de incidente de segurança | restaurant_id ou global, performed_by, reason, timestamp |
| security_incident_closed | Encerramento de incidente | incident_id, performed_by, summary, timestamp |

### 3.7 Infra e conectividade

| Evento | Descrição | Campos mínimos |
|--------|-----------|-----------------|
| heartbeat_ok | Heartbeat recebido (terminal online) | terminal_id, restaurant_id, timestamp |
| heartbeat_missed | Heartbeat em falta (terminal offline) | terminal_id, restaurant_id, last_seen, timestamp |
| sync_completed | Sincronização concluída (Core ↔ terminal) | restaurant_id, terminal_id ou scope, timestamp |

---

## 4. Relação com outros documentos

- **Auditoria formal:** Subconjunto destes eventos (segurança, membresia, config, export, caixa, admin) deve ser persistido como trilha imutável conforme [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md).
- **Métricas:** Agregações (ex.: pedidos por hora, turnos por dia) derivam destes eventos; ver [METRICS_DICTIONARY.md](./METRICS_DICTIONARY.md).
- **Alertas:** Eventos anómalos (ex.: login_failure em massa, heartbeat_missed) alimentam definições em [ANOMALY_DEFINITION.md](./ANOMALY_DEFINITION.md).

---

## 5. Implementação (Onda 2/3)

- **Estado atual:** Subconjunto da taxonomia persistido em `gm_audit_logs` (Onda 2): order_created, payment_recorded, user_disabled, user_reenabled, export_requested, shift_started, shift_ended. Ver [DASHBOARD_METRICS.md](../ops/DASHBOARD_METRICS.md) §2.
- **Onda 3:** Emissão consistente dos restantes eventos (login_success, order_cancelled, cash_register_opened/closed, etc.); pipeline ou store para dashboards e alertas.

---

**Referências:** [AUDIT_LOG_SPEC.md](./AUDIT_LOG_SPEC.md) · [METRICS_DICTIONARY.md](./METRICS_DICTIONARY.md) · [ANOMALY_DEFINITION.md](./ANOMALY_DEFINITION.md) · [CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md](./CORE_DATA_RETENTION_AND_IMMUTABILITY_CONTRACT.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md).
