# Sofia Gastrobar — Fase 2 Passo 6: Relatórios (auditoria e alinhamento)

**Objetivo:** Verificar que os relatórios do ambiente vivo do Sofia usam `restaurant_id` do runtime (100) e fontes Core; documentar exceções e estado final.

**Referências:** [SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md](./SOFIA_GASTROBAR_FASE2_AMBIENTE_VIVO.md), [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md) §10.

---

## 1. Resumo executivo

| Relatório / página | Usa restaurant_id do runtime? | Fonte Core? | Reflete 100? | Notas |
|--------------------|------------------------------|-------------|---------------|--------|
| **AdminReportsOverview** | Sim (`useRestaurantId`) | Sim (dashboardService) | Sim | KPIs e links; getOverview(restaurantId) → gm_tables, gm_orders, gm_tasks, shift_logs, etc. |
| **SalesByPeriodReportPage** | Sim (`useRestaurantId`) | Sim (get_shift_history RPC) | Sim | useShiftHistory(restaurantId) → p_restaurant_id. |
| **OperationalActivityReportPage** | Sim (hook interno `useRestaurantId`) | Sim (readOrdersForAnalytics) | Sim | getOperationalActivityReport(restaurantId, period) → gm_orders. |
| **DailyClosingReportPage** | Sim (`useRestaurantId`) | Sim (get_shift_history + gm_reconciliations) | Sim | useShiftHistory(restaurantId), useFiscalReconciliation(restaurantId). |
| **MultiUnitOverviewReportPage** | Implícito (RPC) | Sim (get_multiunit_overview) | Depende de sessão | RPC usa current_user_restaurants(); em mock/sem JWT pode devolver vazio. |
| **SalesSummaryReportPage** | Sim (hook `useRestaurantId`) | Sim (readOrdersForAnalytics) | Sim | getSalesSummaryReport(restaurantId, period). |
| **GamificationImpactReportPage** | Sim (hook `useRestaurantId`) | Sim (readOrdersForAnalytics) | Sim | getGamificationImpactReport(restaurantId, input). |
| **SaftExportPage** | Sim (`useRestaurantId`) | Sim (exportSaftXml) | Sim | exportSaftXml({ restaurantId, from, to }). |

**Conclusão:** A maioria dos relatórios já usa `restaurant_id` do runtime (via `useRestaurantId()` → `useRestaurantIdentity()` → tenant/runtime) e fontes Core. Nenhuma alteração de código foi necessária para alinhar ao tenant 100. A única exceção documentada é o **Multi-unit**, que depende de `current_user_restaurants()` no Core (sessão/JWT).

---

## 2. Detalhe por relatório

### 2.1 AdminReportsOverview

- **Ficheiro:** `merchant-portal/src/features/admin/reports/AdminReportsOverview.tsx`
- **restaurant_id:** `useRestaurantId()` → passado a `useDashboardOverview(restaurantId)`.
- **Fonte:** `dashboardService.getOverview(locationId)` usa `restaurantId` em todas as queries:
  - `gm_tables`, `gm_orders`, `alertEngine.getActive(restaurantId)`, `gm_tasks`, `shift_logs`, `gm_order_items`, `gm_payments` — todos com `.eq("restaurant_id", restaurantId)`.
- **Mock/fallback:** Nenhum; se Core falhar, getOverview devolve overview vazio (buildEmptyOverview).
- **Estado:** ✅ Alinhado ao restaurante 100 quando o tenant for 100.

### 2.2 SalesByPeriodReportPage

- **Ficheiro:** `merchant-portal/src/pages/Reports/SalesByPeriodReportPage.tsx`
- **restaurant_id:** `useRestaurantId()` → `useShiftHistory(restaurantId, { dateFrom, dateTo })`.
- **Fonte:** `invokeRpc("get_shift_history", { p_restaurant_id: restaurantId, p_from, p_to })` — Core RPC.
- **Estado:** ✅ Alinhado.

### 2.3 OperationalActivityReportPage

- **Ficheiro:** `merchant-portal/src/pages/Reports/OperationalActivityReportPage.tsx`
- **restaurant_id:** O hook `useOperationalActivityReport(period)` usa internamente `useRestaurantId()` e chama `getOperationalActivityReport(restaurantId, period)`.
- **Fonte:** `ReportsService.getOperationalActivityReport` → `loadEventsForPeriod({ restaurantId, period })` → `readOrdersForAnalytics(restaurantId, limit)` → `dockerCoreClient.from("gm_orders").eq("restaurant_id", restaurantId)`.
- **Estado:** ✅ Alinhado.

### 2.4 DailyClosingReportPage

- **Ficheiro:** `merchant-portal/src/pages/Reports/DailyClosingReportPage.tsx`
- **restaurant_id:** `useRestaurantId()`; passado a `useShiftHistory(restaurantId, { daysBack: 7 })` e `useFiscalReconciliation(restaurantId, { daysBack: 7 })`.
- **Fontes:**  
  - Turnos: `get_shift_history` RPC (p_restaurant_id).  
  - Reconciliação fiscal: `db.from("gm_reconciliations").eq("restaurant_id", restaurantId)` (Core; `db` = getDockerCoreFetchClient).
- **Estado:** ✅ Alinhado. Tabela `gm_reconciliations` existe no Core (migração 20260218).

### 2.5 MultiUnitOverviewReportPage

- **Ficheiro:** `merchant-portal/src/features/admin/reports/MultiUnitOverviewReportPage.tsx`
- **restaurant_id:** Não recebe explicitamente; o RPC `get_multiunit_overview(p_period_date)` filtra no Core por `current_user_restaurants()`.
- **Fonte:** Core RPC que faz `FROM current_user_restaurants() cur JOIN gm_restaurants r ON r.id = cur.restaurant_id` e agrega por restaurante.
- **Limitação:** Em ambiente Docker com mock auth (anon key, sem JWT com `restaurant_id` ou sem linhas em `restaurant_users` para auth.uid()), `current_user_restaurants()` pode devolver vazio e o relatório mostrar zero unidades. Para Sofia como único restaurante com sessão “pilot”, depende de o Core estar configurado para devolver o restaurante 100 para esse utilizador (ex.: JWT claim ou `restaurant_users`).
- **Estado:** ⚠️ Correto por design (filtro por utilizador no Core); pode requerer configuração de sessão/JWT ou `restaurant_users` para refletir o 100 em mock.

### 2.6 SalesSummaryReportPage e GamificationImpactReportPage

- **restaurant_id:** Ambos usam hooks que internamente chamam `useRestaurantId()` e passam `restaurantId` a `getSalesSummaryReport` / `getGamificationImpactReport`.
- **Fonte:** `ReportsService` → `loadEventsForPeriod({ restaurantId, period })` → `readOrdersForAnalytics(restaurantId)` → `gm_orders` com `restaurant_id`.
- **Estado:** ✅ Alinhados.

### 2.7 SaftExportPage

- **restaurant_id:** `useRestaurantId()`; passado a `exportSaftXml({ restaurantId, from, to })`.
- **Fonte:** Serviço fiscal que deve usar Core/gm_orders por restaurante.
- **Estado:** ✅ Alinhado (uso explícito de restaurantId).

---

## 3. Origem do restaurant_id no runtime

- **useRestaurantId()** (usado pela maioria dos relatórios) vem de `useRestaurantIdentity()`.
- **useRestaurantIdentity()** resolve o id a partir de: runtime (RestaurantRuntimeContext), tenant (FlowGate/TenantContext), ou fallback (ex.: `getTabIsolated("chefiapp_restaurant_id")` / seed).
- Com ambiente Sofia ativo (runbook Fase 1), o tenant está selado em 100 e o runtime fornece o mesmo restaurante; portanto `useRestaurantId()` devolve `00000000-0000-0000-0000-000000000100` e todos os relatórios que o usam refletem dados do restaurante 100.

---

## 4. O que foi corrigido

Nenhuma alteração de código foi necessária. Todos os relatórios auditados já utilizam `restaurant_id` do runtime (diretamente ou via RPC com filtro no Core). A auditoria confirmou o alinhamento e documentou a exceção do Multi-unit.

---

## 5. O que continua incompleto ou dependente

| Item | Motivo |
|------|--------|
| **Multi-unit com mock auth** | RPC `get_multiunit_overview` depende de `current_user_restaurants()`. Sem JWT com `restaurant_id` ou sem `restaurant_users` para o utilizador, a lista pode ser vazia. Solução: configurar sessão/JWT ou dados em `restaurant_users` para o pilot/100, ou aceitar que em mock single-tenant o relatório “Vendas” e “Overview” já cobrem o 100. |
| **Relatórios “Staff” / “Performance humana”** | As rotas `/admin/reports/staff` e `/admin/reports/human-performance` redirecionam para `/admin/reports/overview` (não há página específica implementada). Não há relatório dedicado a listar por restaurant_id; quando existirem, devem seguir o mesmo padrão (useRestaurantId + fontes Core). |

---

## 6. Estado final do Passo 6

- **Auditoria:** Concluída para AdminReportsOverview, SalesByPeriodReportPage, OperationalActivityReportPage, DailyClosingReportPage, MultiUnitOverviewReportPage, SalesSummaryReportPage, GamificationImpactReportPage, SaftExportPage.
- **Uso de restaurant_id:** Confirmado para todos (explícito no front ou no RPC).
- **Fontes Core:** Confirmadas (gm_orders, gm_tasks, shift_logs, get_shift_history, gm_reconciliations, gm_tables, etc.).
- **Correções:** Nenhuma necessária.
- **Documentação:** Este ficheiro; §10 de SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md atualizado; FASE2_AMBIENTE_VIVO.md atualizado com resultado do passo 6.

---

## 7. Próximo passo único

**Passo 7 (se aplicável) — Android/simulador:** Validar AppStaff no simulador Android com o mesmo Core e tenant 100. Ou considerar a Fase 2 concluída para o bloco de relatórios e seguir com operação/validação contínua do Sofia.
