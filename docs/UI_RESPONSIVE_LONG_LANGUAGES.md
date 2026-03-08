# UI — Responsividade e idiomas longos

**Objetivo:** Evitar overflow e quebras incorrectas quando o texto é mais longo (ex.: alemão), especialmente em billing e TPV.

## Regras

- **Modais e tabelas (billing, TPV):** Evitar larguras fixas em labels; usar `minWidth` onde necessário e permitir quebra ou truncation (ex.: `textOverflow: "ellipsis"`, `overflow: "hidden"`) com tooltip para texto completo quando fizer sentido.
- **Botões:** Preferir padding adequado para que o texto não fique colado; em idiomas longos o botão pode crescer ou quebrar em duas linhas conforme o layout.
- **Alemão (de):** Será testado numa fase posterior; documentar que novos textos devem ser revistos para layout em alemão (strings tipicamente mais longas que en/pt).

## Onde aplicar

- Componentes em `merchant-portal/src/pages/Billing`, `merchant-portal/src/features/admin/subscription`, `merchant-portal/src/pages/TPV` e modais de pagamento.
- Tabelas de listagem (invoices, orders): cabeçalhos e células com texto longo.

## Referência

- Evitar `width: "100%"` em elementos que contêm texto sem limite; usar `maxWidth` ou flex com `minWidth: 0` para permitir shrink.
