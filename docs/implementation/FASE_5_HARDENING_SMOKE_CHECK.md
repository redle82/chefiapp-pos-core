# FASE 5 — Hardening final: smoke check manual

Checklist de validação rápida após implementação do Data Mode e indicadores de demonstração. Referência: [FASE_5_DATA_MODE.md](FASE_5_DATA_MODE.md).

---

## Pré-requisito

- Merchant-portal a correr (`npm run dev` ou equivalente).
- Login como **owner** com `productMode !== "live"` (ex.: demo ou pilot) para ver os indicadores.

---

## 1. Ecrã Zero (Dashboard dono)

- [ ] Navegar para `/app/dashboard` (ou `/dashboard`) como owner.
- [ ] Com "Ver resumo do dia" fechado (vista Ecrã Zero): ver barra amarela **"Isto é simulação. Os valores mostrados não refletem operação real."** no topo.
- [ ] No próprio card do Ecrã Zero: ver texto **"Modo demonstração. Os valores não refletem operação real."** abaixo da frase (verde/amarelo/vermelho).
- [ ] Clicar em "Ver resumo do dia": o dashboard completo carrega; a barra amarela continua visível no topo.

---

## 2. Páginas com DataModeBanner

Em modo demo, em cada uma das páginas abaixo deve aparecer a **barra amarela** com o texto de simulação no topo do conteúdo (logo abaixo do header/título quando aplicável):

- [ ] **Finanças** — `/financial` ou `/app/reports/finance` (FinancialDashboardPage).
- [ ] **Alertas** — `/app/alerts` (AlertsDashboardPage).
- [ ] **Fecho diário** — `/app/reports/daily-closing` (DailyClosingReportPage).
- [ ] **Vendas por período** — `/app/reports/sales-by-period` (SalesByPeriodReportPage).
- [ ] **Compras (dashboard)** — `/app/purchases` (PurchasesDashboardPage).
- [ ] **Visão (Owner)** — rota owner visão (OwnerVisionPage).
- [ ] **Estoque real (Owner)** — rota owner estoque (OwnerStockRealPage).
- [ ] **Simulação (Owner)** — rota owner simulação (OwnerSimulationPage).
- [ ] **Compras (Owner)** — rota owner compras (OwnerPurchasesPage).

---

## 3. Modo live

- [ ] Com `productMode === "live"` (ou equivalente que defina `dataMode === "live"`): **nenhuma** barra amarela nem texto "Modo demonstração" em nenhuma das páginas acima.
- [ ] Ecrã Zero: sem linha extra "Modo demonstração" no card.

---

## 4. Revisão visual (opcional)

- [ ] Contraste: texto da barra legível (ex.: âmbar escuro em fundo âmbar claro).
- [ ] Hierarquia: o banner não domina o conteúdo; está acima do conteúdo principal sem cobrir ações críticas.
- [ ] Não intrusivo: margens e padding adequados; bordas arredondadas consistentes.

---

## Resultado

- **Pass:** Todos os itens assinalados sem erros.
- **Fail:** Anotar a página e o passo que falhou para correção.

Documento criado no âmbito do Hardening final FASE 5 (Data Mode em todas as páginas + indicador no Ecrã Zero).
