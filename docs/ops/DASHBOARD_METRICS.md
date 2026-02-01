# Dashboard e métricas operacionais (D3)

**Data:** 1 de Fevereiro de 2026  
**Referência:** [METRICS_DICTIONARY.md](../architecture/METRICS_DICTIONARY.md) · [EVENT_TAXONOMY.md](../architecture/EVENT_TAXONOMY.md) · Onda 2 D1–D3  
**Público:** Owner/manager do restaurante, operações.

---

## 1. RPC get_operational_metrics (D2)

Métricas por tenant e período, alinhadas ao [METRICS_DICTIONARY](../architecture/METRICS_DICTIONARY.md).

**Chamada:** `get_operational_metrics(p_restaurant_id, p_from, p_to)`

**Retorno (JSON):**

| Campo | Descrição | Unidade |
|-------|-----------|---------|
| schema_version | `operational_metrics_v1` | — |
| tenant_id | UUID do restaurante | — |
| period | { start, end } (ISO 8601 UTC) | — |
| orders_created_total | Pedidos criados no período | count |
| orders_cancelled_total | Pedidos cancelados no período | count |
| payments_recorded_total | Pagamentos registados no período | count |
| payments_amount_cents | Montante total de pagamentos (cêntimos) | cents |
| active_shifts_count | Turnos ativos (check-in sem check-out) | count |
| export_requested_count | Pedidos de export (work log, DSR) no período | count |
| daily_revenue_cents | Alias de payments_amount_cents no período | cents |
| daily_orders_count | Alias de orders_created_total | count |
| avg_order_value_cents | payments_amount_cents / orders_created_total (quando > 0) | cents |

**Exemplo (Supabase client):**

```ts
const { data } = await supabase.rpc('get_operational_metrics', {
  p_restaurant_id: restaurantId,
  p_from: '2026-02-01T00:00:00Z',
  p_to: '2026-02-01T23:59:59Z',
});
// data.orders_created_total, data.payments_amount_cents, data.active_shifts_count, etc.
```

**Acesso:** Apenas owner ou membro ativo do restaurante.

---

## 2. Eventos na trilha de auditoria (D1)

Os seguintes eventos da [EVENT_TAXONOMY](../architecture/EVENT_TAXONOMY.md) são persistidos em `gm_audit_logs` (event_type):

| event_type | Descrição | Origem |
|------------|-----------|--------|
| order_created | Pedido criado | create_order_atomic |
| payment_recorded | Pagamento registado | process_order_payment |
| user_disabled | Membro desativado | admin_disable_staff_member |
| user_reenabled | Membro reativado | admin_reenable_staff_member |
| export_requested | Pedido de export (work log, DSR) | get_work_log_export, get_dsr_access_export |
| shift_started | Check-in / início de turno | start_turn |
| shift_ended | Check-out / fim de turno | trigger em turn_sessions (status → closed) |

Consulta: RPC `get_audit_logs(p_restaurant_id, p_from, p_to, p_event_type, ...)` — ver [AUDIT_LOG_QUERY.md](./AUDIT_LOG_QUERY.md). **Pipeline (G1):** Eventos consumíveis via Supabase Realtime; ver [EVENT_PIPELINE.md](./EVENT_PIPELINE.md).

---

## 3. Primeiro dashboard (D3)

Para visibilidade mínima por tenant:

1. **Supabase Dashboard / SQL:** Consultar `gm_orders`, `gm_payments`, `turn_sessions` e `gm_audit_logs` com filtro por `restaurant_id` e período. Usar `get_operational_metrics` para totais.
2. **UI interna (merchant-portal):** Chamar `get_operational_metrics(restaurantId, startOfDay, endOfDay)` e exibir cards (pedidos do dia, receita, turnos ativos). **Implementado em G4:** bloco «Operacional (hoje)» na vista principal do Dashboard (`OperationalMetricsCards` + `useOperationalMetrics`).
3. **Grafana / Sentry:** Se existir pipeline de eventos, alimentar painéis com eventos de `gm_audit_logs` (por event_type) e métricas agregadas; definir alertas conforme [ANOMALY_DEFINITION.md](../architecture/ANOMALY_DEFINITION.md) e [SLO_SLI.md](../architecture/SLO_SLI.md).

**Painéis sugeridos (por tenant):**

- Pedidos criados (hoje / período)
- Receita (payments_amount_cents no período)
- Turnos ativos (active_shifts_count)
- Pedidos de export (export_requested_count) — auditoria
- Eventos de auditoria (últimas 24 h) — tabela ou lista por event_type

---

## 4. Pipeline de eventos (G1)

Eventos de `gm_audit_logs` estão disponíveis via **Supabase Realtime** (subscrição a INSERT) e via RPC **get_audit_logs** (batch). Ver [EVENT_PIPELINE.md](./EVENT_PIPELINE.md) para consumo por dashboards externos (Grafana/Sentry) ou interno.

---

## 5. Dashboard operacional por tenant (G4 Onda 3)

**Entregável:** Visibilidade mínima por tenant validada — UI no merchant-portal + doc.

- **UI (merchant-portal):** Na vista principal do Dashboard (quando nenhum módulo está selecionado), o bloco **Operacional (hoje)** chama `get_operational_metrics(restaurantId, startOfDay, endOfDay)` e exibe quatro cards: **Pedidos (hoje)**, **Receita (hoje)**, **Turnos ativos**, **Export pedidos**. Componente: `OperationalMetricsCards`; hook: `useOperationalMetrics`.
- **Supabase / Grafana:** Para visibilidade via SQL ou painéis externos, usar as queries e o RPC descritos em §1 e §3; eventos em [EVENT_PIPELINE.md](./EVENT_PIPELINE.md).

---

## 6. Referências

- [METRICS_DICTIONARY.md](../architecture/METRICS_DICTIONARY.md) — definição das métricas
- [EVENT_TAXONOMY.md](../architecture/EVENT_TAXONOMY.md) — eventos emitidos
- [EVENT_PIPELINE.md](./EVENT_PIPELINE.md) — pipeline de eventos (G1 Onda 3)
- [AUDIT_LOG_QUERY.md](./AUDIT_LOG_QUERY.md) — consulta à trilha de auditoria
- [SLO_SLI.md](../architecture/SLO_SLI.md) — SLO quando definidos
- [ANOMALY_DEFINITION.md](../architecture/ANOMALY_DEFINITION.md) — alertas
