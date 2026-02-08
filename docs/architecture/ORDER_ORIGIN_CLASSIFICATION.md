# ORDER_ORIGIN_CLASSIFICATION

**Status:** PARCIAL (semântica oficial; enforcement futuro)
**Tipo:** Classificação de origem de pedidos (pilot | real)
**Local:** docs/architecture/ORDER_ORIGIN_CLASSIFICATION.md
**Hierarquia:** Subordinado a [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md)

---

## Princípio

Semântica oficial do campo **order_origin** (ou equivalente) para pedidos: valores canónicos **pilot** e **real**. O Core pode ignorar, filtrar ou reportar pedidos por origem; este documento define a classificação; ainda **não** é gate nem enforcement obrigatório no código.

---

## Regras (curtas)

| Regra | O que significa |
|-------|-----------------|
| Pedidos **devem** carregar order_origin | Quando o modelo de dados suportar, os pedidos expõem origem (pilot vs real). |
| Core **trata** conforme política | O Core pode ignorar pedidos pilot, filtrar em relatórios ou reportar separadamente; a política é documentada aqui, a implementação é futura. |
| **Estado:** Parcial | Semântica oficial definida; enforcement (gates, filtros, relatórios) é futuro. |

---

## Referências

- [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) — soberania do Core.
- Pedidos, relatórios, filtros por origem (quando implementados).

**Violação = regressão arquitetural** (quando enforcement estiver ativo).
