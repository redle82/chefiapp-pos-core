# FASE 2 — Menu, Inventário e Estoque (checklist técnica)

Checklist executável por dev. Referência: `docs/ROADMAP_POS_FUNDACAO.md`.

**Princípio:** Menu ≠ inventário ≠ estoque, mas têm que conversar.

**Critério de conclusão da FASE 2:** "Vendo algo e sei se estou a ficar sem isso."

---

## Passo 1 — Criar produtos (menu): nome, categoria, preço

**Objetivo:** Dono cria produtos do menu com nome, categoria e preço.

**Estado atual:** `gm_products` existe; FirstProductPage (nome, preço); MenuBuilderMinimal; uso de `station` (KITCHEN/BAR). Categoria pode ser implícita ou campo.

**Tarefas:** Garantir que produtos têm nome, categoria (ou station como proxy) e preço; UI de criação/edição acessível (FirstProductPage ou Menu Builder).

**Critério de aceite:** Dono consegue criar/editar produto com nome, categoria e preço; produtos aparecem no TPV.

---

## Passo 2 — Criar ingredientes: unidade (kg, l, unidade), custo

**Objetivo:** Dono cria ingredientes com unidade e custo.

**Estado atual:** `gm_ingredients` (InventoryStockReader: name, unit); InventoryStockMinimal com tab ingredientes. Custo pode estar em outro lugar (ex. compras) ou por ingrediente.

**Tarefas:** Garantir que ingredientes têm unidade (g, kg, ml, l, unit) e custo; UI para criar/editar ingrediente.

**Critério de aceite:** Dono consegue criar ingrediente com nome, unidade e custo; lista visível em Inventário/Estoque.

---

## Passo 3 — Ligar produto → ingredientes (receita simples / BOM)

**Objetivo:** Cada produto pode ter uma receita: quantidades de ingredientes por unidade vendida.

**Estado atual:** `gm_product_bom` (product_id, ingredient_id, qty_per_unit, station); readProductBOM; InventoryStockMinimal tab "recipes".

**Tarefas:** UI para associar produto a ingredientes (qty_per_unit); persistir em gm_product_bom; listar receitas por produto.

**Critério de aceite:** Dono consegue definir "produto X usa N unidades do ingrediente Y"; receitas listadas e editáveis.

---

## Passo 4 — Estoque: quantidade atual, alerta baixo

**Objetivo:** Estoque por ingrediente/local com quantidade atual e mínimo (alerta).

**Estado atual:** `gm_stock_levels` (location_id, ingredient_id, qty, min_qty); readStockLevels; InventoryStockMinimal tab stock; confirmPurchase (StockWriter).

**Tarefas:** UI para ver e editar qty e min_qty; exibir claramente "alerta baixo" quando qty < min_qty.

**Critério de aceite:** Dono vê quantidade atual e mínimo por ingrediente/local; alertas visíveis quando abaixo do mínimo.

---

## Passo 5 — Efeito no TPV: vender produto ↓ estoque; alertar se crítico

**Objetivo:** Ao vender no TPV, consumir estoque conforme BOM; alertar quando estoque fica crítico.

**Estado atual:** create_order_atomic (OrderWriter); Core pode ou não ter trigger/RPC para consumir estoque. Frontend TPV não mostra alerta de estoque hoje.

**Tarefas:** Definir no Core (ou no frontend) o fluxo "venda → consumir estoque conforme BOM"; no TPV ou no Ecrã Zero / Dashboard, mostrar alerta quando algum ingrediente está abaixo do mínimo (ou pós-venda).

**Critério de aceite:** Venda no TPV reflete no estoque (via Core ou RPC); Dono é alertado quando estoque fica crítico (Dashboard, Ecrã Zero ou toast pós-venda).

---

## Ordem recomendada

1 → 2 → 3 → 4 → 5. Validar após cada passo.

---

## Estado de implementação (FASE 2)

- **Passo 2:** InventoryStockMinimal — tab Ingredientes: botão "Novo ingrediente", form (nome, unidade: g/kg/ml/l/unit), insert em gm_ingredients. Custo: pendente (coluna no Core se existir).
- **Passo 3:** InventoryStockMinimal — tab Receitas: carregamento de produtos (gm_products); botão "Nova receita", form (produto, ingrediente, qtd. por unidade), insert em gm_product_bom; listagem BOM com nome do produto e do ingrediente.
- **Passo 4:** Já existente — tab Estoque com qty, min_qty e alerta "BAIXO" / "CRÍTICO".
- **Passos 1 e 5:** Pendentes (produtos com categoria; efeito venda → estoque no Core/TPV).
