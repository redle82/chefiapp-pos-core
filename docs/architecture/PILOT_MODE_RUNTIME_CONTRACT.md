# PILOT_MODE_RUNTIME_CONTRACT

**Status:** CANONICAL
**Tipo:** Contrato de modo de exploração não-financeiro (Runtime/UI)
**Local:** docs/architecture/PILOT_MODE_RUNTIME_CONTRACT.md
**Hierarquia:** Subordinado a [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md)

---

## Princípio

Existe um modo de exploração **piloto** (não-financeiro): o estado vive no Runtime/UI e é **invisível ao Core**. O Core permanece a única fonte de verdade financeira e operacional; o modo piloto nunca altera o estado soberano do Core.

---

## Regras

| Regra | O que significa |
|-------|-----------------|
| Pilot mode **não escreve** pedidos no Core | Pedidos criados em modo piloto não são persistidos no Core financeiro. |
| Pilot mode **não cria** faturação | Nenhuma transação financeira é gerada no Core a partir do piloto. |
| Pilot mode **não sincroniza** dados automaticamente para o Core | Dados locais (ex.: localStorage) não são promovidos a Core sem fluxo explícito e autorizado. |
| Pilot mode **pode persistir** em localStorage | Estado de demonstração ou contenção pode viver em localStorage (ex.: `chefiapp_menu_pilot_{restaurantId}`). |
| Pilot mode **nunca altera** estado soberano do Core | Nenhuma escrita em gm_restaurants, orders, payments, ou outras tabelas soberanas é feita em nome do piloto. |

---

## Referências

- [CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md](./CORE_FINANCIAL_SOVEREIGNTY_CONTRACT.md) — soberania do Core.
- [docs/product/B1_MENU_CONTENCAO.md](../product/B1_MENU_CONTENCAO.md) — contenção cardápio; fallback menu.
- [docs/product/B2_TPV_CONTENCAO.md](../product/B2_TPV_CONTENCAO.md) — contenção TPV.
- [docs/product/B4_KDS_CONTENCAO.md](../product/B4_KDS_CONTENCAO.md) — contenção KDS.
- core-boundary: `menuPilotFallback` (localStorage piloto).

**Violação = regressão arquitetural.**
