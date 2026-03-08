# UI — Moeda e datas (contrato)

**Objetivo:** Garantir que na UI (billing, TPV, relatórios) a moeda vem do tenant/restaurante e as datas usam o locale do utilizador de forma consistente.

## Moeda

- **Billing:** A moeda de exibição de preços e totais deve vir do **restaurante/tenant**, nunca apenas do locale do browser. Fontes:
  - `getRestaurantBillingCurrency(restaurantId)` (Core: `gm_restaurants.currency` / `billing_currency` ou derivado de país).
  - `billing_plan_prices` e listagens de planos: filtrar por essa moeda.
- **TPV / Pedidos:** Valores monetários (totais, troco, pagamentos) devem usar a moeda do restaurante (configuração do outlet/restaurante).
- **Relatórios e listagens:** Quando os dados têm `currency` por linha (ex.: `billing_invoices` com `amount_cents` + `currency`), formatar cada linha com a `currency` da linha. Quando não há moeda por linha, usar a moeda do tenant.
- **Referência:** `merchant-portal/src/core/billing/coreBillingApi.ts` (`getRestaurantBillingCurrency`), `BillingPage.tsx` (billingCurrency do tenant), `InvoicesTable.tsx` (formatCurrency com currency da invoice).

## Datas

- **Formatação:** Usar `useFormatLocale()` (React) ou `getFormatLocale()` (fora de componente) para obter o locale Intl (pt-BR, en, etc.) e passar a `Intl.DateTimeFormat` / `toLocaleDateString(locale, options)`.
- **Onde:** Listagens (faturas, pedidos, turnos), recibos, relatórios, cabeçalhos de período.
- **Referência:** `merchant-portal/src/core/i18n/useFormatLocale.ts`, `merchant-portal/src/core/i18n/regionLocaleConfig.ts` (`toIntlLocale`, `getFormatLocale`), `InvoicesTable.tsx` (formatDate com getFormatLocale()).

## Resumo

| Contexto     | Moeda                         | Datas                |
|-------------|-------------------------------|----------------------|
| Billing     | Tenant (getRestaurantBillingCurrency) | useFormatLocale / getFormatLocale |
| Invoices    | Por linha (invoice.currency)  | getFormatLocale      |
| TPV/Reports | Restaurante / tenant          | useFormatLocale      |
