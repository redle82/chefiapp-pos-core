# FASE 5 — Data Mode (demo vs live)

Documento do Passo 2 da [FASE_5_CONSOLIDACAO_CHECKLIST.md](FASE_5_CONSOLIDACAO_CHECKLIST.md). Referência: `docs/ROADMAP_POS_FUNDACAO.md`.

**Objetivo:** O sistema nunca minta. O Dono sabe quando "Isto é simulação" e quando "Isto é dinheiro real".

---

## Definição

- **data_mode** (no código: `dataMode`) é `"demo"` ou `"live"`.
- Determina se os dados mostrados ao Dono/Gerente são de **demonstração** ou **reais** (negócio).
- Fonte única de verdade para "os dados mostrados refletem operação real ou não".

---

## Derivação

- **Sem novo storage.** Derivado do existente:  
  `dataMode = (runtime.productMode === "live" ? "live" : "demo")`.
- Pilot e demo tratados como dados não-reais para este fim.
- Opcional futuro: atributo em tenant ou env para override explícito de `data_mode`.

---

## Onde flui

- **RestaurantRuntime** — Interface tem `dataMode: "demo" | "live"`; provider calcula a partir de `productMode`.
- **Páginas que mostram dados operacionais/financeiros:** relatórios (Fecho diário, Vendas por período), Finanças, Alertas. Opcionalmente Ecrã Zero.
- **Contrato UI:** Qualquer ecrã que mostre vendas, caixa, turnos ou alertas deve, quando `dataMode === "demo"`, exibir um indicador visível (barra ou badge). Não esconder dados; apenas não deixar dúvida sobre a natureza deles.

---

## Onde tocar (lista cirúrgica)

| Local | Alteração |
|-------|-----------|
| [RestaurantRuntimeContext.tsx](merchant-portal/src/context/RestaurantRuntimeContext.tsx) | Interface `RestaurantRuntime`: campo `dataMode`. Provider e `INITIAL_RUNTIME`: definir `dataMode` derivado de `productMode`. |
| [DataModeBanner.tsx](merchant-portal/src/components/DataModeBanner.tsx) | Componente reutilizável: recebe `dataMode`; se `"demo"` mostra barra com texto fixo; se `"live"` retorna `null`. |
| [FinancialDashboardPage.tsx](merchant-portal/src/pages/Financial/FinancialDashboardPage.tsx) | `useRestaurantRuntime()`; renderizar `<DataModeBanner dataMode={runtime.dataMode} />` acima do conteúdo. |
| [SalesByPeriodReportPage.tsx](merchant-portal/src/pages/Reports/SalesByPeriodReportPage.tsx) | Idem. |
| [DailyClosingReportPage.tsx](merchant-portal/src/pages/Reports/DailyClosingReportPage.tsx) | Idem. |
| [AlertsDashboardPage.tsx](merchant-portal/src/pages/Alerts/AlertsDashboardPage.tsx) | Idem. |

---

## Não tocar (evitar quebrar)

- Lógica de `getBackendType`, `backendAdapter`.
- `FinancialEngine` (listTransactions, calculateCashBalance).
- `useShiftHistory`, `invokeRpc` / `get_shift_history`.
- `AlertEngine`.
- Rotas, `rolePermissions`, sidebar.

---

## Critério de aceite

- O tipo `RestaurantRuntime` tem `dataMode: "demo" | "live"` derivado de `productMode`; não há nova persistência.
- As páginas Finanças, Vendas por período, Fecho diário e Alertas mostram um indicador explícito quando `dataMode === "demo"`.
- Nenhuma alteração à lógica de getBackendType, RPC ou engines.
