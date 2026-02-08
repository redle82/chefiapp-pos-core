# Dicionário de Métricas — ChefIApp™

**Data:** 1 de Fevereiro de 2026  
**Referência:** [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md) — GAP T30-2 · [LIVRO_ARQUITETURA_INDEX.md](../LIVRO_ARQUITETURA_INDEX.md)  
**Propósito:** Métricas formais: nome, definição, unidade e (quando aplicável) SLI/SLO. Base para dashboards e alertas. Instrumentação = Onda 3.

---

## 1. Âmbito

Este documento define:

- **Nome** da métrica (identificador estável).
- **Descrição** e **definição** (como é calculada ou obtida).
- **Unidade** (contagem, percentagem, tempo, etc.).
- **SLI/SLO** (quando aplicável): limiar ou objetivo para disponibilidade, latência ou erro.
- **Fonte de dados:** Eventos ou tabelas (ver [EVENT_TAXONOMY.md](./EVENT_TAXONOMY.md)).

**Implementação:** Métricas podem ser calculadas a partir da taxonomia de eventos ou de queries; instrumentação em dashboards/alertas = Onda 3.

---

## 2. Métricas operacionais (por tenant)

| Nome | Descrição | Definição | Unidade | SLI/SLO (exemplo) |
|------|-----------|-----------|---------|-------------------|
| orders_created_total | Total de pedidos criados | Contagem de eventos order_created no período | count | — |
| orders_created_per_hour | Pedidos criados por hora | orders_created_total / horas no período | count/h | — |
| orders_cancelled_total | Total de pedidos cancelados | Contagem de order_cancelled no período | count | — |
| active_shifts_count | Turnos ativos (check-in sem check-out) | Contagem de turnos com shift_started e sem shift_ended no momento | count | — |
| tasks_completed_total | Tarefas concluídas no período | Contagem de task_completed no período | count | — |
| payments_recorded_total | Pagamentos registados no período | Contagem de payment_recorded no período | count | — |
| payments_amount_cents | Montante total de pagamentos (cêntimos) | Soma de amount em payment_recorded no período | cents | — |

---

## 3. Métricas de disponibilidade e conectividade

| Nome | Descrição | Definição | Unidade | SLI/SLO (exemplo) |
|------|-----------|-----------|---------|-------------------|
| heartbeat_ok_count | Heartbeats recebidos (terminais online) | Contagem de heartbeat_ok por terminal no período | count | — |
| heartbeat_missed_count | Heartbeats em falta (terminal offline) | Contagem de heartbeat_missed por terminal | count | Alerta se > 0 em janela configurável |
| terminals_online_ratio | Proporção de terminais online | Terminais com heartbeat_ok recente / terminais esperados | ratio (0–1) | SLO: ≥ 0.99 (exemplo) |
| api_request_latency_p95 | Latência P95 das requisições à API | Percentil 95 da latência de resposta (ms) | ms | SLO: ≤ 500 ms (exemplo) |
| api_error_rate | Taxa de erro (5xx ou equivalente) | Erros 5xx / total de requisições no período | ratio | SLO: ≤ 0.01 (exemplo) |

---

## 4. Métricas de segurança e auditoria

| Nome | Descrição | Definição | Unidade | SLI/SLO (exemplo) |
|------|-----------|-----------|---------|-------------------|
| login_failure_count | Tentativas de login falhadas | Contagem de login_failure no período (por tenant ou global) | count | Alerta se > N em janela curta (ex.: 10 em 5 min) |
| session_revoked_count | Sessões revogadas (admin/sistema) | Contagem de session_revoked no período | count | — |
| user_disabled_count | Membros desativados (kill switch) | Contagem de user_disabled no período | count | — |
| export_requested_count | Pedidos de export (work log, DSR) | Contagem de export_requested no período | count | — |

---

## 5. Métricas de negócio (agregadas)

| Nome | Descrição | Definição | Unidade | SLI/SLO (exemplo) |
|------|-----------|-----------|---------|-------------------|
| daily_revenue_cents | Receita do dia (referência de pagamentos) | Soma de amount em payment_recorded no dia (tenant) | cents | — |
| daily_orders_count | Pedidos do dia | orders_created_total no dia (tenant) | count | — |
| avg_order_value_cents | Valor médio do pedido (referência) | daily_revenue_cents / daily_orders_count (quando > 0) | cents | — |

---

## 6. Uso e instrumentação

- **Dashboards:** Agregações por tenant, período e métrica; filtro por restaurant_id.
- **Alertas:** Limiares (ex.: heartbeat_missed > 0, login_failure_count > N, api_error_rate > 0.01) conforme [ANOMALY_DEFINITION.md](./ANOMALY_DEFINITION.md) e [SLO_SLI.md](./SLO_SLI.md).
- **Retenção:** Dados de métricas agregadas sujeitos a política de retenção; ver [RETENTION_POLICY.md](./RETENTION_POLICY.md).

---

## 7. Implementação (Onda 2/3)

- **Estado atual:** RPC `get_operational_metrics(p_restaurant_id, p_from, p_to)` (Onda 2) devolve métricas por tenant e período: orders_created_total, orders_cancelled_total, payments_recorded_total, payments_amount_cents, active_shifts_count, export_requested_count, daily_revenue_cents, daily_orders_count, avg_order_value_cents. Ver [DASHBOARD_METRICS.md](../ops/DASHBOARD_METRICS.md) §1.
- **Onda 3:** SLO monitorados (não só definidos); alertas baseados em ANOMALY_DEFINITION e SLO_SLI.

---

**Referências:** [EVENT_TAXONOMY.md](./EVENT_TAXONOMY.md) · [ANOMALY_DEFINITION.md](./ANOMALY_DEFINITION.md) · [SLO_SLI.md](./SLO_SLI.md) · [RETENTION_POLICY.md](./RETENTION_POLICY.md) · [ROADMAP_FECHO_GAPS_CHEFIAPP.md](../ROADMAP_FECHO_GAPS_CHEFIAPP.md).
