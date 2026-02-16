# Contrato — Web pública do restaurante: catálogo, pedidos e KDS

**Status:** OBRIGATÓRIO (anti-regressão)  
**Tipo:** Fluxo da web pública (/public/:slug): catálogo, criação de pedidos, origem WEB_PUBLIC e exibição no KDS/AppStaff.  
**Subordinado a:** [APPSTAFF_CONFIG_SEPARATION_CONTRACT.md](./APPSTAFF_CONFIG_SEPARATION_CONTRACT.md) — a web pública é separada da web de configuração.

---

## 1. Declaração

A **web pública do restaurante** (`/public/:slug`, `PublicWebPage`) é a interface para o cliente: ver cardápio, adicionar ao carrinho e criar pedidos. Está **ligada ao mesmo Core** que o TPV, o KDS e o AppStaff: **catálogo** (gm_products, gm_menu_categories), **pedidos** (gm_orders) e **origem** (sync_metadata.origin). Os pedidos feitos na web aparecem no **KDS** e no **AppStaff (KDS Mini)** com indicação clara de que vieram da **página web** (badge "WEB").

---

## 2. Conexões obrigatórias (sem regressão)

| Conexão | Descrição | Implementação |
|--------|-----------|----------------|
| **Catálogo** | A web pública usa o **mesmo menu** que o TPV e o KDS: tabelas `gm_restaurants`, `gm_menu_categories`, `gm_products`. Nenhuma cópia local; leitura via `readMenu(restaurantId)` (RestaurantReader). | `PublicWebPage` → `readMenu`, `readRestaurantBySlug` (infra/readers/RestaurantReader). |
| **Pedidos** | Criação de pedidos na web escreve no **mesmo backend** que o TPV: RPC `create_order_atomic` no Core (gm_orders, gm_order_items). | `PublicWebPage` → `createOrder(restaurantId, items, "WEB_PUBLIC", paymentMethod)` (infra/writers/OrderWriter). |
| **Origem WEB_PUBLIC** | Todo pedido criado na web deve ter `origin = "WEB_PUBLIC"` em `sync_metadata`, persistido pelo Core na coluna `origin` de `gm_orders`. | OrderWriter passa `{ ...syncMetadata, origin }` em `p_sync_metadata`; Core usa `COALESCE((p_sync_metadata->>'origin')::TEXT, 'CAIXA')`. |
| **KDS / AppStaff KDS Mini** | Os pedidos com `sync_metadata.origin === "WEB_PUBLIC"` são listados no KDS e no KDS Mini do AppStaff; o **OriginBadge** exibe **"WEB"** (ícone 🌐, cor laranja) para que a cozinha e a equipa saibam que o pedido veio da página web. | KDSMinimal, KitchenDisplay, MiniKDSMinimal usam `order.sync_metadata?.origin` e renderizam `OriginBadge`; mapeamento `WEB_PUBLIC` → label "WEB". |

---

## 3. Estoque (catálogo e disponibilidade)

- O **catálogo** na web é o mesmo que no TPV/KDS (gm_products). Não existe "catálogo separado" para a web.
- O campo **available** em gm_products (quando existir) pode ser usado na web para esconder ou marcar itens indisponíveis; a web não deve manter uma cópia de stock — usa os mesmos produtos do Core.
- Qualquer lógica futura de **stock/estoque** que afete a web deve continuar a usar o Core como fonte única (ex.: disponibilidade por produto ou por restaurante).

---

## 4. Regras anti-regressão

| Regra | Descrição |
|-------|-----------|
| **Nunca criar pedido na web sem origin** | A chamada `createOrder` a partir da web pública **deve** passar `origin: "WEB_PUBLIC"`. O OrderWriter **deve** incluir `origin` em `p_sync_metadata` para que o Core persista. |
| **Nunca remover OriginBadge do KDS** | O KDS e o KDS Mini do AppStaff **devem** exibir a origem do pedido (OriginBadge). Remover ou ignorar `sync_metadata.origin` no KDS é regressão. |
| **Nunca duplicar catálogo** | A web **não** deve ter um catálogo ou menu próprio; deve sempre usar `readMenu` / RestaurantReader contra o Core. |
| **Web pública ≠ web de configuração** | A rota `/public/:slug` é para clientes (cardápio e pedidos). A separação entre app operacional e web de configuração está em APPSTAFF_CONFIG_SEPARATION_CONTRACT.md. |

---

## 5. Ficheiros críticos (referência)

| Ficheiro | Responsabilidade |
|----------|------------------|
| `merchant-portal/src/pages/PublicWeb/PublicWebPage.tsx` | UI da web pública; chama `readMenu`, `createOrder(..., "WEB_PUBLIC", ...)`. |
| `merchant-portal/src/infra/writers/OrderWriter.ts` | `createOrder` deve passar `{ ...syncMetadata, origin }` em `p_sync_metadata`. |
| `merchant-portal/src/infra/readers/RestaurantReader.ts` | `readMenu`, `readRestaurantBySlug` — fonte única do catálogo para a web. |
| `merchant-portal/src/pages/AppStaff/components/OriginBadge.tsx` | Mapeamento `WEB_PUBLIC` → "WEB" (🌐). |
| `merchant-portal/src/pages/AppStaff/components/MiniKDSMinimal.tsx` | Lista pedidos e exibe `OriginBadge` com `order.sync_metadata?.origin`. |
| `merchant-portal/src/pages/KDSMinimal/KDSMinimal.tsx` | Idem; `OriginBadge` para cada pedido. |
| `docker-core/schema`: `create_order_atomic`, `gm_orders.origin` | Persistência de `origin` a partir de `p_sync_metadata->>'origin'`. |

---

## 6. Violação

Alterar a web pública para usar um catálogo diferente do Core, criar pedidos sem `origin` "WEB_PUBLIC", ou remover/ocultar a indicação "WEB" no KDS/KDS Mini é **violação de contrato** e regressão. Reverter ou ajustar para cumprir este documento.

---

## 7. Referências

- Separação app vs config: [APPSTAFF_CONFIG_SEPARATION_CONTRACT.md](./APPSTAFF_CONFIG_SEPARATION_CONTRACT.md)
- Implementação web pública: [APPSTAFF_DASHBOARD_AND_CONFIG_SEPARATION.md](../implementation/APPSTAFF_DASHBOARD_AND_CONFIG_SEPARATION.md) (secção web pública)
- Core: `docker-core/schema` — `create_order_atomic`, `gm_orders`, `gm_products`, `gm_menu_categories`
