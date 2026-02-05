# Primeira venda auditável (C)

Garantir que o fluxo **menu válido → publicação consciente → venda → core financeiro** fecha sem exceções. Este documento traça o fluxo e lista pontos de validação e possíveis falhas.

---

## 1. Fluxo traçado (resumo)

| Etapa             | Onde                                      | O que acontece                                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Menu           | Menu Builder                              | Itens em `gm_menu_items` (ou `gm_products` conforme schema). Preço obrigatório, `price_cents`.                                                                                                                                                                                                                                                                          |
| 2. Setup          | Bootstrap / Onboarding                    | `setup_status` (identity, location, schedule, **menu**, people). `canPublish` exige menu completo.                                                                                                                                                                                                                                                                      |
| 3. Publicação     | PublishSection → RestaurantRuntimeContext | `publishRestaurant()`: Docker Core → `gm_restaurants.status = 'active'` + `installed_modules`. Runtime passa a `mode: 'active'`, `canUseTPV` verdadeiro.                                                                                                                                                                                                                |
| 4. TPV — catálogo | TPV / TPVMinimal                          | Menu via `useDynamicMenu` (DynamicMenuService) ou fallback B1; produtos com `id`, `name`, `price_cents`. Carrinho usa `product_id` do item do menu.                                                                                                                                                                                                                     |
| 5. Criar pedido   | OrderContextReal / TPVMinimal             | Payload: `p_restaurant_id`, `p_items`: `[{ product_id, name, quantity, unit_price }]`, `p_payment_method`, `p_sync_metadata`. Chamada: `create_order_atomic` (Core Docker ou Supabase transicional).                                                                                                                                                                    |
| 6. Core — RPC     | create_order_atomic (Postgres)            | Validação E2: `p_items` array 1–500 elementos; cada item: `product_id` não vazio, `name` 1–500 chars, `quantity` 1–9999, `unit_price` ≥ 0; `p_payment_method` em cash/card/other/split. Autorização: membro do restaurante. Insere `gm_orders` + `gm_order_items`. `gm_order_items.product_id` tem FK para `gm_products(id)` — produto tem de existir no menu/catálogo. |
| 7. Financeiro     | Mesmo RPC + lógica posterior              | Pedido fica em `gm_orders` (totais, status); linhas em `gm_order_items` (preço snapshot, subtotal). Migrations posteriores (ex.: financial_logic) podem calcular custo/receita. Core financeiro consome estes dados; não há segundo sistema de autoridade para a primeira venda.                                                                                        |

---

## 2. Pontos de falha conhecidos e mitigações

| Ponto                                 | Risco                              | Mitigação atual                                                                                                                                              |
| ------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `product_id` ausente ou mal formatado | 409 / 400 no RPC                   | RPC: exceção "item N missing or empty product_id". UI: TPV só adiciona ao carrinho itens do menu com `id` válido.                                            |
| Preço em euros em vez de centavos     | Total errado                       | Menu Builder: `price_cents`; TPV/OrderContext: `unit_price` em centavos. Verificar chamadas que passam `price` em euros.                                     |
| Restaurante não publicado             | TPV inacessível ou bloqueado       | ORE: `useOperationalReadiness` bloqueia TPV quando `menuState !== "LIVE"` ([MENU_OPERATIONAL_STATE](../architecture/MENU_OPERATIONAL_STATE.md)). Publicação via `publishRestaurant()`.                                            |
| Core offline                          | TPV usa fallback B1                | Produtos pilot podem não existir em `gm_products` → criar pedido falha por FK. Mitigação: em produção, Core online antes da primeira venda.                  |
| Caixa fechado                         | Alguns fluxos esperam caixa aberto | Primeira venda pode ser apenas "criar pedido" (PENDING); pagamento pode ser passo seguinte. Confirmar se o checklist exige caixa aberto ou só pedido criado. |

---

## 3. Checklist — primeira venda auditável (humano)

Executar uma vez após o congelamento (A) para validar o fluxo de ponta a ponta.

1. **Menu**

   - [ ] Pelo menos um item no Menu Builder com preço válido (ex.: 2,50 €).
   - [ ] Item visível na lista; guardar mentalmente o nome e o preço.

2. **Publicação**

   - [ ] Bootstrap/onboarding completo (identidade, localização, horários, menu, pessoas).
   - [ ] Clicar em "Publicar" e ver redireção para Dashboard sem erro.
   - [ ] Dashboard mostra acesso ao TPV (ou link para TPV).

3. **TPV**

   - [ ] Abrir TPV (ou TPV Minimal); lista de produtos carrega (do menu).
   - [ ] Adicionar ao carrinho o item criado; quantidade e preço corretos.
   - [ ] Criar pedido (botão "Cobrar" ou equivalente); sem erro 400/409.
   - [ ] Pedido aparece na lista de pedidos ou em ecrã de sucesso.

4. **Core / Financeiro**

   - [ ] Em `gm_orders`: existe um registo com o restaurante e total coerente com o preço do item.
   - [ ] Em `gm_order_items`: existe linha com `product_id` igual ao item do menu e `price_snapshot` / subtotal corretos.

5. **Exceções**
   - [ ] Nenhuma exceção não tratada no console (merchant-portal).
   - [ ] Nenhum alerta de "Core indisponível" durante o fluxo de criação do pedido (ou documentar se em ambiente conhecido offline).

---

## 4. Referências

- [MENU_CORE_CONTRACT.md](../architecture/MENU_CORE_CONTRACT.md) — Menu como fonte de verdade; relação com Financial Core.
- [CoreOrdersApi.ts](../../merchant-portal/src/core/infra/CoreOrdersApi.ts) — Chamada a `create_order_atomic`.
- [RestaurantRuntimeContext](../../merchant-portal/src/context/RestaurantRuntimeContext.tsx) — `publishRestaurant`.
- Migrations: `20260228120000_e2_input_validation_after_hardening.sql`, `000_genesis_recovery.sql` (FK `gm_order_items.product_id` → `gm_products.id`).
