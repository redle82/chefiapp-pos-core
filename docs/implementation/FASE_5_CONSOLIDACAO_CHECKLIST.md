# FASE 5 — Consolidação (checklist técnica)

Checklist executável por dev. Referência: `docs/ROADMAP_POS_FUNDACAO.md`.

**Condição de entrada:** FASE 5 é "SÓ DEPOIS DO €79" — executar quando o cliente atinge o patamar de faturação definido (decisão de negócio).

**Objetivo:** Supabase ON, dados reais, alertas avançados, relatórios.

---

## Passo 1 — Supabase ON

**Objetivo:** Backend em produção usa Supabase (auth + PostgREST + Realtime) em vez de apenas Docker Core local.

**Estado atual:** `backendAdapter` distingue Docker vs Supabase; merchant-portal usa `getBackendType()`, `isSupabaseBackend()`. Em piloto/demo o Core pode ser Docker; em produção o mesmo schema pode ser servido por Supabase (Project URL + anon key). Migrations em `supabase/migrations/` são a fonte de verdade do schema.

**Tarefas:** Garantir que em produção (ou quando `VITE_SUPABASE_URL` aponta para projeto Supabase real) o fluxo Auth + API usa Supabase; sem alterar comportamento quando backend é Docker. Documentado: variáveis de ambiente e checklist de deploy em [FASE_5_SUPABASE_DEPLOY.md](FASE_5_SUPABASE_DEPLOY.md). Código: `backendAdapter`, `supabaseClient`, `useSupabaseAuth` e módulos que usam `getBackendType()`/`isSupabaseBackend()` já utilizam Supabase quando a URL aponta para projeto real; em Docker (localhost/rest), comportamento mantido.

**Critério de aceite:** Em ambiente configurado para Supabase, login e dados fluem via Supabase; em ambiente Docker, comportamento mantido.

---

## Passo 1.5 — Histórico externo (baseline)

**Objetivo:** Nomear oficialmente que o sistema aceita dados de fora (outros TPVs, POS antigos, CSV, relatórios fiscais) e definir **dados herdados** vs **dados nativos**. Sem ETL complexo nem UI completa — só contrato, modelo e ponto de entrada definido.

**Estado atual:** Documento [FASE_5_HISTORICO_EXTERNO.md](FASE_5_HISTORICO_EXTERNO.md) define: tipos de dados aceitos (vendas, caixa, produtos, clientes, fiscal); formato mínimo (CSV); modelo (source_system, período, data_type, fidelity); como dados herdados entram nos relatórios; ritual "Antes de ligar ao vivo, queres trazer a tua história?"; ponto de entrada (upload CSV ou API de importação) documentado para implementação futura. Implementação futura (tabela gm_imported_history ou equivalente) respeita este contrato.

**Critério de aceite:** Contrato e modelo existem; ponto de entrada (CSV ou API) documentado para quando a funcionalidade for construída. ✅ Cumprido.

---

## Passo 2 — Dados reais

**Objetivo:** Operação com dados reais (pedidos, caixa, inventário, pessoas) persistidos e auditáveis; sem dados de demonstração como fonte principal.

**Estado atual:** gm*orders, gm_cash_registers, gm_restaurant_people, gm_tasks, gm_shift_checklist*\*, etc. já persistem em PostgREST (Docker ou Supabase). "Dados reais" significa uso em produção com dados do restaurante real; demo/piloto pode usar dados de teste. Billing (Stripe) e `gm_restaurants.billing_status` já existem.

**Tarefas:** Garantir que em modo "live" ou pós-€79 não se usa seed de demo como dados principais; opcional: flag ou tenant attribute "data_mode": "demo" | "live". Backup e retenção de dados conforme política. Implementado: flag explícita `dataMode` em RestaurantRuntime (derivado de productMode); indicadores "Dados de demonstração" em relatórios (Fecho diário, Vendas por período), Finanças e Alertas quando demo. Contrato e guia: [FASE_5_DATA_MODE.md](FASE_5_DATA_MODE.md).

**Critério de aceite:** Em produção, dados do restaurante são reais e persistidos; demo continua disponível sem misturar com produção.

---

## Passo 3 — Alertas avançados

**Objetivo:** Alertas mais ricos (regras, prioridade, histórico, ações) visíveis ao Dono e Gerente.

**Estado atual:** Ecrã Zero (useEcraZeroState) com estados verde/amarelo/vermelho; AlertsDashboardPage; AlertCard; alertas de estoque baixo (FASE 2), tarefas, caixa, fiscal. Origens: operacionais (turno, stock), tarefas, billing.

**Tarefas:** Definir catálogo de "alertas avançados" (ex.: SLA de pedidos, ruptura prevista, desvios de margem, fiscal em atraso); persistir histórico de alertas (ou usar app_logs/gm_audit_logs); UI de listagem e filtro por tipo/prioridade; opcional: notificações (email/push) para críticos. Catálogo e pontos de extensão: [FASE_5_ALERTAS_AVANCADOS.md](FASE_5_ALERTAS_AVANCADOS.md). Tipos avançados em `AlertEngine.createFromEvent` (categorias explícitas em sync com o doc); filtro por categoria e por severidade em AlertsDashboardPage.

**Critério de aceite:** Dono/Gerente vê alertas avançados (lista + Ecrã Zero) e pode actuar a partir deles.

---

## Passo 4 — Relatórios

**Objetivo:** Relatórios de operação e financeiros (vendas, fecho diário, margens, etc.) disponíveis ao Dono.

**Estado atual:** FinancialDashboardPage (fluxo de caixa, transações); FinancialEngine; AdminSidebar com "Fecho Diário", "Finanças", "Clientes (CRM)", "Fidelidade"; ReportBuilder; shift history (get_shift_history). Existem migrations para daily_closings e métricas.

**Tarefas:** Consolidar fontes de dados para relatórios (gm_orders, gm_cash_registers, turn_sessions, gm_audit_logs); relatório "Fecho diário" (vendas por dia, por método de pagamento); relatório "Vendas por período" com export (CSV/PDF) opcional; garantir que rotas de relatórios respeitam permissões (owner/manager). Estado atual e tarefas: [FASE_5_RELATORIOS.md](FASE_5_RELATORIOS.md). Implementado: rota `/app/reports/daily-closing` → DailyClosingReportPage (ShiftHistorySection); `/app/reports/finance` → redirect `/financial`; rolePermissions `/app/reports` owner/manager; SalesByPeriodReportPage com export CSV (turnos, resumo dia, resumo mês). PDF opcional em iteração futura.

**Critério de aceite:** Dono acede a relatórios de vendas e fecho (e opcionalmente export); dados coerentes com operação real.

---

## Hardening final (Data Mode em todas as páginas)

**Objetivo:** Indicador "simulação" consistente em todas as vistas que mostram dados operacionais/financeiros; indicador também no Ecrã Zero.

**Estado atual:** DataModeBanner em DashboardPortal, FinancialDashboardPage, AlertsDashboardPage, DailyClosingReportPage, SalesByPeriodReportPage, PurchasesDashboardPage, Owner (Vision, StockReal, Simulation, Purchases). EcraZeroView recebe `dataMode` e mostra "Modo demonstração. Os valores não refletem operação real." quando `dataMode === "demo"`. Smoke check manual: [FASE_5_HARDENING_SMOKE_CHECK.md](FASE_5_HARDENING_SMOKE_CHECK.md).

**Critério de aceite:** Em modo demo, todas as páginas listadas no smoke check mostram o indicador; em modo live nenhum indicador. Revisão visual: contraste e hierarquia adequados, não intrusivo.

---

## Ordem recomendada

1 → 2 → 3 → 4. Hardening final após Passo 2 (Data Mode). Validar com smoke check. A entrada na FASE 5 é condicionada pela decisão de negócio (pós-€79).
