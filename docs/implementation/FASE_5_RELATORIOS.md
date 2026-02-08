# FASE 5 — Relatórios: estado atual e tarefas

Documento do Passo 4 da [FASE_5_CONSOLIDACAO_CHECKLIST.md](FASE_5_CONSOLIDACAO_CHECKLIST.md). Referência: `docs/ROADMAP_POS_FUNDACAO.md`.

**Objetivo:** Dono acede a relatórios de vendas e fecho (e opcionalmente export); dados coerentes com operação real.

---

## Estado atual

| Componente | Descrição |
|------------|-----------|
| **FinancialDashboardPage** | Fluxo de caixa, transações, saldo. Rota `/financial`. Usa `FinancialEngine`: `listTransactions`, `calculateCashBalance`. Em Docker retorna lista vazia / saldo zero. |
| **ShiftHistorySection** | Histórico por turno (abertura, fecho, vendas, pedidos). Usa `useShiftHistory` → RPC `get_shift_history` (p_restaurant_id, p_from, p_to). Dados: shift_id, opened_at, closed_at, total_sales_cents, orders_count. |
| **SalesByPeriodReportPage** | Relatório "Vendas por período". Rota `/app/reports/sales-by-period`. Filtro por datas; **resumo por mês** + resumo por dia + detalhe por turno; "Exportar CSV (turnos)", "Exportar CSV (resumo por dia)" e "Exportar CSV (resumo por mês)". |
| **ReportBuilder** | Configurações de relatórios customizados (campos, filtros, groupBy). Persistência em localStorage (`chefiapp_custom_reports`). Não faz fetch a gm_orders/gm_cash_registers. |
| **AdminSidebar** | "Fecho Diário" → `/app/reports/daily-closing`; "Vendas por período" → `/app/reports/sales-by-period`; "Finanças" → `/app/reports/finance`. |
| **ShiftReceiptGenerator** | Geração de HTML para recibo de fecho de caixa. |
| **AdvancedReportingService** | Serviço de export e agendamento; usa ReportBuilder. |

**Fontes de dados (backend):** gm_orders, gm_cash_registers, turn_sessions (RPC get_shift_history); cash_flow (Supabase, quando não Docker). Migrations existem para daily_closings e métricas.

**Permissões:** `/financial` já está em `rolePermissions` como owner/manager. Rotas `/app/reports/*` devem ser restritas a owner/manager.

---

## Tarefas (checklist Passo 4)

1. **Consolidar fontes** — Documentar e usar gm_orders, gm_cash_registers, turn_sessions (e gm_audit_logs se necessário) como fonte única para relatórios de operação quando Supabase ON.
2. **Relatório "Fecho diário"** — Vendas por dia; por método de pagamento quando disponível. Hoje: ShiftHistorySection já mostra turnos (total_sales_cents, orders_count). Página dedicada ou secção em Financeiro que agregue por dia e, se o RPC/schema expuser, por método de pagamento.
3. **Relatório "Vendas por período"** — Implementado. Página `/app/reports/sales-by-period` com filtro de datas, **resumo por mês** (Mês | Vendas | Pedidos), resumo por dia, detalhe por turno, totais, "Exportar CSV (turnos)", "Exportar CSV (resumo por dia)" e "Exportar CSV (resumo por mês)". Opcional futuro: PDF; agregação por método de pagamento quando o RPC expuser.
4. **Rotas** — `/app/reports/daily-closing` e `/app/reports/finance` devem abrir o conteúdo correto (Fecho diário = histórico de turnos; Finanças = FinancialDashboardPage). Redirecionar ou criar páginas mínimas.
5. **Permissões** — Garantir que rotas de relatórios respeitam owner/manager (rolePermissions e RoleGate nas rotas).

---

## Pontos de extensão no código

- **Fecho diário:** `useShiftHistory` (get_shift_history) já fornece dados por turno. DailyClosingReportPage reutiliza ShiftHistorySection (últimos 7 dias).
- **Vendas por período:** SalesByPeriodReportPage usa `useShiftHistory(restaurantId, { dateFrom, dateTo })` para intervalo customizado; export CSV inline (UTF-8 com BOM).
- **Finanças:** FinancialDashboardPage em `/financial`. Redirecionar `/app/reports/finance` → `/financial`.
- **Export:** `merchant-portal/src/core/reporting/AdvancedReportingService.ts` e `core/finance/FinancialExport.ts`; ReportBuilder para formatos; browser print/PDF conforme ShiftReceiptGenerator.
- **Permissões:** Adicionar `/app/reports` (e filhos) em `rolePermissions.ts` com `["owner", "manager"]`.

---

## Critério de aceite

- Dono/Gerente acede a relatórios de vendas e fecho (lista de turnos = fecho por turno; finanças = fluxo de caixa).
- Rotas "Fecho Diário" e "Finanças" do sidebar levam ao conteúdo correto.
- Dados coerentes com operação real quando backend tem dados (Supabase ou Core com get_shift_history).
- Rotas de relatórios restritas a owner/manager.

Export CSV implementado em SalesByPeriodReportPage (turnos, resumo dia, resumo mês). PDF permanece opcional em iteração posterior.

**Status Passo 4:** Critérios de aceite cumpridos (rotas, permissões owner/manager, fecho diário, vendas por período, export CSV). Fontes documentadas; agregação por método de pagamento quando o RPC/schema expuser.
