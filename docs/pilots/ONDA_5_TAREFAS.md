# Onda 5 — Primeiras tarefas (kick-off)

**Data:** 2026-02-01  
**Referências:** [ONDA_5_ESCOPO_CONGELADO.md](./ONDA_5_ESCOPO_CONGELADO.md) · [ONDA_4_VALOR_E_ONDA_5.md](./ONDA_4_VALOR_E_ONDA_5.md) §24 · [PRD_OWNER_DASHBOARD.md](../product/PRD_OWNER_DASHBOARD.md) · [PRD_ALERTS.md](../product/PRD_ALERTS.md)

---

## Objetivo

Executar Onda 5 conforme escopo congelado: Owner Dashboard (visão de dono), métricas reais (vendas, pedidos, turnos), alertas acionáveis.

---

## Ordem sugerida e tarefas

### 1. Owner Dashboard (visão de dono)

**Ref.:** [PRD_OWNER_DASHBOARD.md](../product/PRD_OWNER_DASHBOARD.md)

| # | Tarefa | Descrição | Prioridade |
|---|--------|-----------|------------|
| O5.1 | Hub dashboard | Página /app/dashboard como hub: resumo do dia, atalhos TPV/KDS/Menu/Billing. | P0 |
| O5.2 | Destino pós-login | Após login/signup, redirecionar para /app/dashboard (ou /dashboard); se 0 tenants → bootstrap. | P0 |
| O5.3 | Ready-to-publish checklist | Mostrar checklist recomendada (identidade, ≥1 produto, billing); advisor, não gate. | P0 |
| O5.4 | Seleção de tenant | Se >1 restaurante, página /app/select-tenant; após escolha → dashboard. | P0 |

**Estado:** O5.1 implementado (DashboardPortal: atalhos rápidos + OperationalMetricsCards no hub). O5.2–O5.4 já existem (AuthPage/BootstrapPage → /app/dashboard; SelectTenantPage → /dashboard).

- [x] O5.1 implementado. O5.2–O5.4 em backlog ou já feitos.

---

### 2. Métricas reais (vendas, pedidos, turnos)

**Ref.:** [METRICS_DICTIONARY.md](../architecture/METRICS_DICTIONARY.md) · [EVENT_TAXONOMY.md](../architecture/EVENT_TAXONOMY.md)

| # | Tarefa | Descrição | Prioridade |
|---|--------|-----------|------------|
| O5.5 | Métricas do dia no dashboard | Exibir no hub: vendas do dia (€), nº pedidos, turno aberto/fechado. Fonte: dados reais (Core/eventos). | P0 |
| O5.6 | Histórico por turno | Lista ou resumo por turno (abertura, fecho, total vendas, nº pedidos). | P1 |
| O5.7 | Persistência e fonte | Garantir que métricas vêm de fonte única (ex.: Core, tabelas de pedidos/vendas); não mock em produção. | P0 |

**Estado:** O5.5 implementado (OperationalMetricsCards no hub). O5.6: RPC `get_shift_history` + UI «Histórico por turno» no hub. O5.7 implementado: métricas via `invokeRpc` (coreOrSupabaseRpc) — useOperationalMetrics e useShiftHistory usam Core quando Docker, Supabase quando live; nunca mock em produção. Ref.: [DASHBOARD_METRICS.md](../ops/DASHBOARD_METRICS.md) §8.

- [x] O5.5 implementado. [x] O5.6 RPC + UI implementados. [x] O5.7 implementado (fonte única via coreOrSupabaseRpc).

---

### 3. Alertas acionáveis

**Ref.:** [PRD_ALERTS.md](../product/PRD_ALERTS.md) · [ops/alerts.md](../ops/alerts.md)

| # | Tarefa | Descrição | Prioridade |
|---|--------|-----------|------------|
| O5.8 | Alertas operacionais no dashboard | Mostrar no hub (ou painel dedicado): tarefas atrasadas, pedidos em espera excessiva, caixa em risco. | P1 |
| O5.9 | Condição e limiar | Limiares definidos por configuração ou contrato (ex.: atraso > X min); não hardcoded arbitrário. | P0 |
| O5.10 | Ação imediata | Alerta crítico → notificação (ex.: in-app, email) conforme contrato; ligação a runbooks se P1. | P1 |

**Estado:** O5.8 implementado (hub: resumo "X ativos · Y críticos" + botão "Ver alertas"). O5.9 implementado: contrato [ALERT_THRESHOLDS_CONTRACT.md](../ops/ALERT_THRESHOLDS_CONTRACT.md) + `alertThresholds.ts`. O5.10 implementado: contrato [ALERT_ACTION_CONTRACT.md](../ops/ALERT_ACTION_CONTRACT.md); notificação in-app (toast no hub quando há críticos, ação "Ver alertas"); link "Ver runbook" em AlertCard para críticos (`alertRunbooks.ts`).

- [x] O5.8 implementado. [x] O5.9 implementado. [x] O5.10 implementado (contrato + toast + runbook).

---

## Checklist kick-off (§24)

- [ ] Plano Onda 5 aprovado e kick-off marcado.
- [x] Primeiras tarefas (O5.1–O5.10) implementadas (hub, métricas, histórico, alertas, limiares, ação, fonte única).
- [ ] Dependências Onda 4 satisfeitas (ex.: ≥1 cliente pagante ou piloto ativo) para validar dashboard com uso real.

**Próximo passo Onda 5:** Validar dashboard com uso real (teste humano E2E + Stripe + primeiro cliente) ou marcar kick-off comunicado; depois Onda 6 (motor cognitivo / IA) conforme [ONDAS_4_A_7_ESTRATEGIA.md](../ONDAS_4_A_7_ESTRATEGIA.md).
