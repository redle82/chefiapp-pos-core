# Onda 2 (31–60 dias) — Tarefas de Engenharia

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md) · [LIVRO_ARQUITETURA_INDEX.md](./LIVRO_ARQUITETURA_INDEX.md)  
**Objetivo:** Primeira execução de engenharia — Compliance mínimo: trilhas de auditoria, export real, DSR, instrumentação inicial de eventos/métricas.

**Pré-requisito:** Onda 1 concluída (Livro v1 congelado em 1 Fev 2026).

---

## Foco da Onda 2

| Área | O que passa de "especificado" para "implementado" | Doc de referência |
|------|----------------------------------------------------|-------------------|
| **Trilhas de auditoria** | Audit log imutável em produção (quem fez o quê, quando) | [AUDIT_LOG_SPEC.md](./architecture/AUDIT_LOG_SPEC.md) |
| **Export real** | Fluxo de export de trabalho/dados (csv/json) testado e utilizável | [WORK_LOG_EXPORT.md](./architecture/WORK_LOG_EXPORT.md), [EXPORT_FORMATS.md](./architecture/EXPORT_FORMATS.md) |
| **DSR** | Fluxo operacional para acesso, retificação, apagamento, portabilidade | [DATA_SUBJECT_REQUESTS.md](./architecture/DATA_SUBJECT_REQUESTS.md) |
| **Data taxonomy + métricas** | Eventos e métricas do dicionário começam a ser emitidos/agregados | [EVENT_TAXONOMY.md](./architecture/EVENT_TAXONOMY.md), [METRICS_DICTIONARY.md](./architecture/METRICS_DICTIONARY.md) |

**Critério de sucesso Onda 2:** Export e DSR utilizáveis por equipa legal/DPO; trilha de auditoria consultável; primeiros dashboards alinhados ao Livro.

---

## Tarefas sugeridas (backlog)

### Bloco A — Audit log (dias 31–40)

| ID | Tarefa | Entregável | Tipo | Resultado esperado |
|----|--------|------------|------|--------------------|
| A1 | Implementar tabela/schema de audit log imutável conforme AUDIT_LOG_SPEC | Migrations + tabela(s) | Engenharia | Eventos de auditoria (quem, o quê, quando) persistidos; sem alteração/apagamento |
| A2 | Instrumentar escritas críticas (Core, boundary) para escrever no audit log | Código (Core/boundary) | Engenharia | Criar/atualizar pedido, restaurante, billing, etc. geram evento de auditoria |
| A3 | Endpoint ou relatório consultável (admin/DPO) para audit log | API ou relatório | Engenharia | Equipa legal/DPO pode consultar trilha (filtros por tenant, período, ação) |

### Bloco B — Export real (dias 35–45)

| ID | Tarefa | Entregável | Tipo | Resultado esperado |
|----|--------|------------|------|--------------------|
| B1 | Implementar export de work log (formato conforme WORK_LOG_EXPORT e EXPORT_FORMATS) | Endpoint ou job + ficheiro csv/json | Engenharia | Export de dados de trabalho (scope definido no spec) utilizável e testado |
| B2 | Testes de export (formato, conteúdo, permissões por tenant) | Testes (unit ou E2E) | Engenharia | Export validado; isolamento por tenant garantido |
| B3 | Documentar uso do export para equipa legal/DPO | Doc ou runbook | Doc | Como solicitar e interpretar export |

### Bloco C — DSR (dias 40–52)

| ID | Tarefa | Entregável | Tipo | Resultado esperado |
|----|--------|------------|------|--------------------|
| C1 | Fluxo de acesso (pedido de cópia de dados pessoais) | Processo + endpoint ou UI admin | Engenharia | Pedido de acesso tratado; export de dados do titular entregue |
| C2 | Fluxo de retificação/apagamento/portabilidade conforme DATA_SUBJECT_REQUESTS | Processo + implementação | Engenharia | Retificação, apagamento e portabilidade operacionais (manual ou semi-automatizado) |
| C3 | Registo de pedidos DSR e prazos (rastreabilidade) | Tabela + UI ou sheet | Engenharia | Pedidos DSR registados; prazos visíveis para DPO |
| C4 | Runbook DSR para equipa | docs/ops ou equivalente | Doc | Passos para receber, executar e responder a pedidos DSR |

### Bloco D — Instrumentação eventos/métricas (dias 45–60)

| ID | Tarefa | Entregável | Tipo | Resultado esperado |
|----|--------|------------|------|--------------------|
| D1 | Emitir eventos da taxonomia (EVENT_TAXONOMY) nos pontos críticos | Código (Core, boundary, UI onde aplicável) | Engenharia | Eventos order_created, payment_recorded, etc. emitidos e persistidos ou enviados para pipeline |
| D2 | Agregação ou leitura de métricas do dicionário (METRICS_DICTIONARY) | Queries, job ou dashboard | Engenharia | Métricas operacionais (ex.: orders_created_total, api_request_latency_p95) disponíveis |
| D3 | Primeiro dashboard alinhado ao Livro (ex.: operacional por tenant) | Dashboard (Sentry, Supabase, Grafana ou interno) | Engenharia | Visibilidade mínima para validar instrumentação |

---

## Ordem sugerida

1. **A1 → A2 → A3** (audit log completo e consultável).  
2. **B1 → B2 → B3** (export real e documentado).  
3. **C1 → C2 → C3 → C4** (DSR operacional e runbook).  
4. **D1 → D2 → D3** (eventos e métricas; dashboard).

Blocos A e B podem sobrepor-se (dias 35–40); C e D podem sobrepor-se (dias 45–52). Ajustar conforme capacidade da equipa.

---

## Referências

- [ROADMAP_FECHO_GAPS_CHEFIAPP.md](./ROADMAP_FECHO_GAPS_CHEFIAPP.md) — Onda 2 §3
- [GAP_CLOSURE_ROADMAP.md](./GAP_CLOSURE_ROADMAP.md) — Fase 2 (engenharia)
- [CHECKLIST_FECHO_GAPS.md](./CHECKLIST_FECHO_GAPS.md) — Atualizar estado ao fechar cada capacidade (🟡 → 🟢 onde aplicável)
- Specs: AUDIT_LOG_SPEC, WORK_LOG_EXPORT, EXPORT_FORMATS, DATA_SUBJECT_REQUESTS, EVENT_TAXONOMY, METRICS_DICTIONARY

---

## Progresso Onda 2

| ID | Estado | Notas |
|----|--------|-------|
| A1 | ✅ Schema | Migração `20260201120000_audit_log_spec_alignment.sql`: colunas `event_type`, `actor_type`, `result`; trigger de imutabilidade (sem UPDATE/DELETE). |
| A2 | ✅ Instrumentação | Migração `20260201120001_audit_log_instrument_rpcs.sql`: `create_order_atomic` → order_created; `process_order_payment` → payment_recorded; `admin_disable_staff_member` / `admin_reenable_staff_member` → user_disabled / user_reenabled em `gm_audit_logs`. |
| A3 | ✅ Consulta | Migração `20260201120002_audit_log_query_rpc.sql`: RPC `get_audit_logs(p_restaurant_id, p_from, p_to, p_event_type, p_action, p_limit)`; doc [AUDIT_LOG_QUERY.md](./ops/AUDIT_LOG_QUERY.md) para DPO/admin. |
| B1 | ✅ Export work log | Migração `20260201120003_work_log_export_rpc.sql`: RPC `get_work_log_export(p_restaurant_id, p_from, p_to)` retorna JSON work_log_v1 (users, shifts, check_ins, tasks); regista `export_requested` em gm_audit_logs. Ver [WORK_LOG_EXPORT.md](./architecture/WORK_LOG_EXPORT.md) §6.1. |
| B2 | ✅ Testes export | `tests/unit/export/work-log-export-schema.test.ts` (schema work_log_v1); `tests/integration/work-log-export.integration.test.ts` (formato, conteúdo, isolamento tenant e período inválido). |
| C1 | ✅ Acesso | RPC `get_dsr_access_export(p_restaurant_id, p_subject_user_id)` — export JSON dsr_access_v1 (membership, shifts, check_ins). Ver [DATA_SUBJECT_REQUESTS.md](./architecture/DATA_SUBJECT_REQUESTS.md) §4.1. |
| C3 | ✅ Registo DSR | Tabela `gm_dsr_requests`; RPC `create_dsr_request`. Migração `20260201120004_dsr_requests_and_access_export.sql`. |
| C4 | ✅ Runbook DSR | [DSR_RUNBOOK.md](./ops/DSR_RUNBOOK.md) — receção, registo, execução (acesso via RPC; restante manual) e resposta ao titular. |
| D1 | ✅ Eventos taxonomia | Migração `20260201120005_events_metrics_d1_d2.sql`: shift_started em start_turn; trigger shift_ended em turn_sessions (status → closed). Ver [DASHBOARD_METRICS.md](./ops/DASHBOARD_METRICS.md) §2. |
| D2 | ✅ Métricas dicionário | RPC `get_operational_metrics(p_restaurant_id, p_from, p_to)` — orders_created_total, payments_recorded_total, payments_amount_cents, active_shifts_count, export_requested_count, avg_order_value_cents. Ver [DASHBOARD_METRICS.md](./ops/DASHBOARD_METRICS.md) §1. |
| D3 | ✅ Doc dashboard | [DASHBOARD_METRICS.md](./ops/DASHBOARD_METRICS.md) — RPC métricas, eventos em gm_audit_logs, painéis sugeridos por tenant. |

---

## Onda 2 concluída (1 Fev 2026)

**Critério de sucesso atingido:** Trilha de auditoria consultável (A1–A3); export work log e DSR utilizáveis por legal/DPO (B1–B2, C1/C3/C4); eventos e métricas alinhados ao Livro (D1–D3).

**Pendente (opcional):** B3 (doc uso export — parcialmente coberto por runbooks); C2 (retificação/apagamento — processo manual no runbook).

**Migrations Onda 2:** `20260201120000` (audit schema) · `20260201120001` (audit RPCs) · `20260201120002` (get_audit_logs) · `20260201120003` (work log export) · `20260201120004` (DSR requests + access export) · `20260201120005` (events + get_operational_metrics).

**Próximo passo:** Onda 3 (eventos restantes, SLO/alertas, pipeline lineage) ou refinamentos C2; atualizar [CHECKLIST_FECHO_GAPS.md](./CHECKLIST_FECHO_GAPS.md) e [LIVRO_ARQUITETURA_INDEX.md](./LIVRO_ARQUITETURA_INDEX.md).

---

*Documento vivo. Ao concluir tarefas, atualizar CHECKLIST_FECHO_GAPS e, se necessário, LIVRO_ARQUITETURA_INDEX (Estado por secção).*
