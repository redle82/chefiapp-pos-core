# Contrato — Rotas e endpoints do TPV

**Status:** Referência  
**Tipo:** Mapa técnico das rotas e pontos de integração (APIs/Core) do TPV.  
**Subordinado a:** [APPSTAFF_VISUAL_CANON.md](APPSTAFF_VISUAL_CANON.md), layout operacional (sidebar, header, painel do pedido).

---

## 1. Rotas do TPV

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/op/tpv` | `TPVPOSView` | Vista principal do POS: modo (Take away / Dine in / Delivery), categorias, grelha de produtos, painel do pedido (itens, subtotal, imposto, total, Limpar, Imprimir recibo, Finalizar). |
| `/op/tpv/orders` | `TPVOrdersPage` | Lista de pedidos (em aberto e históricos). Placeholder; integração com `gm_orders` em breve. |
| `/op/tpv/settings` | `TPVSettingsPage` | Definições do TPV (idioma, moeda, impressora). Placeholder. |

Todas as rotas do TPV estão sob o layout `TPVLayout` (sidebar esquerda + header topo + área principal). A rota `/op/tpv` (index) mostra a vista POS com painel do pedido à direita; `/op/tpv/orders` e `/op/tpv/settings` usam a mesma sidebar e header, com conteúdo específico no `Outlet`.

Redirecionamentos canónicos: `/tpv`, `/tpv-minimal`, `/op/cash`, `/op/pos`, `/op/pos/*` → `/op/tpv`.

---

## 2. Componentes do layout (por parte da UI)

| Parte da UI | Componente | Ficheiro |
|-------------|------------|----------|
| Barra lateral esquerda | `TPVSidebar` | `merchant-portal/src/pages/TPVMinimal/components/TPVSidebar.tsx` |
| Cabeçalho (logo, nome, pesquisa, filtro) | `TPVHeader` | `merchant-portal/src/pages/TPVMinimal/components/TPVHeader.tsx` |
| Modo do pedido (Take away / Dine in / Delivery) | `OrderModeSelector` | `merchant-portal/src/pages/TPVMinimal/components/OrderModeSelector.tsx` |
| Filtro por categorias | `ProductCategoryFilter` | `merchant-portal/src/pages/TPVMinimal/components/ProductCategoryFilter.tsx` |
| Card de produto na grelha | `TPVProductCard` | `merchant-portal/src/pages/TPVMinimal/components/TPVProductCard.tsx` |
| Painel do pedido (itens, totais, Limpar, Imprimir, Finalizar) | `OrderSummaryPanel` | `merchant-portal/src/pages/TPVMinimal/components/OrderSummaryPanel.tsx` |

---

## 3. Endpoints / APIs (Core)

| Operação | Endpoint / Fonte | Uso no TPV |
|----------|-------------------|------------|
| Listar produtos | `GET /rest/v1/gm_products?restaurant_id=eq.{id}&available=eq.true` | Grelha de produtos; filtro por categoria e pesquisa por nome. |
| Listar categorias | `readMenuCategories(restaurantId)` → `gm_menu_categories` | Filtro horizontal de categorias (ProductCategoryFilter). |
| Criar pedido | `createOrder(restaurantId, items, origin, paymentMethod)` → RPC `create_order_atomic` | Botão "Finalizar" no OrderSummaryPanel. |
| (Em breve) Listar pedidos | `GET /rest/v1/gm_orders?restaurant_id=eq.{id}` ou RPC | Página `/op/tpv/orders`. |
| (Em breve) Imprimir recibo | RPC ou serviço de impressão | Botão "Imprimir recibo" no OrderSummaryPanel. |

Identidade do restaurante: `useRestaurantIdentity()`; `restaurantId` para chamadas: `getTpvRestaurantId()` ou runtime ou `DEFAULT_RESTAURANT_ID` (Sofia Gastrobar em dev).

---

## 4. Fluxo de dados (vista POS)

1. **Carregar menu:** ao montar `TPVPOSView`, fetch `gm_products` (disponíveis) e `readMenuCategories(restaurantId)`.
2. **Filtrar produtos:** por `selectedCategoryId` (ProductCategoryFilter) e por `searchQuery` (TPVHeader).
3. **Carrinho:** estado local em `TPVPOSView` (array de itens com product_id, name, quantity, unit_price); adicionar/alterar quantidade/limpar via callbacks para `TPVProductCard` e `OrderSummaryPanel`.
4. **Finalizar:** `createOrder(restaurantId, items, "WEB", "cash")`; em sucesso limpar carrinho e toast; em erro toast de erro.

---

## 5. Referências

- Layout e Shell: [APPSTAFF_VISUAL_CANON.md](APPSTAFF_VISUAL_CANON.md)
- Rotas operacionais: `merchant-portal/src/routes/OperationalRoutes.tsx`
- Criação de pedidos: `merchant-portal/src/infra/writers/OrderWriter.ts`
- Menu/Categorias: `merchant-portal/src/infra/readers/RestaurantReader.ts` (`readMenuCategories`, `readProducts`)
