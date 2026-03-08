# Recibos e relatórios — i18n

**Objetivo:** Recibos e relatórios usam namespaces i18n e locale consistente para datas e moeda.

## Recibos (ShiftReceiptGenerator)

- **Ficheiro:** `merchant-portal/src/core/reporting/ShiftReceiptGenerator.ts`
- **Textos:** Todos os textos visíveis vêm de `i18n.t()` com namespaces `receipt` e `shift` (ex.: `receipt:cashClosure`, `shift:receipt.terminal`, `shift:receipt.openingBalance`).
- **Datas:** `date.toLocaleString(getFormatLocale(), options)`.
- **Moeda:** `Intl.NumberFormat(getFormatLocale(), { style: "currency", currency: currencyService.getDefaultCurrency() })`. Em contexto com restaurante, o default currency deve ser o do tenant (ex.: definido antes de gerar o recibo).
- **Locales:** Ficheiros em `merchant-portal/src/locales/{locale}/receipt.json` e `shift.json` (pt-BR, pt-PT, en, es).

## Relatórios

- **Páginas:** `merchant-portal/src/pages/Reports`, `merchant-portal/src/features/admin/reports`
- **Regra:** Valores monetários com moeda do tenant; datas com `useFormatLocale()` ou `getFormatLocale()`; labels e títulos via `t()` (namespaces comuns: common, dashboard, operational, ou específicos do relatório).
- **Referência:** `docs/UI_CURRENCY_AND_DATES_CONTRACT.md` para moeda e datas.

## Verificação

- Procurar em recibos e relatórios por strings literais em português/inglês fora de `t()`; mover para o namespace apropriado.
- Garantir que novos textos de recibo/relatório são adicionados aos ficheiros de locale (pt-BR, en, pt-PT, es) quando necessário.
