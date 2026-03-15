# Sofia Gastrobar — Circuito operacional do catálogo

**Objetivo:** Fechar e provar o circuito em que produtos criados no Admin do Sofia Gastrobar refletem nas restantes superfícies do mesmo restaurante (TPV, Web, QR Mesa, Comandeiro).

**Referência:** [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md).

**Smoke executado (Fase 2 passo 2):** Resultado por superfície e estado do passo em [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md) §5.1. Para garantir o produto sem UI: `./scripts/core/apply-sofia-e2e-product.sh`.

---

## 1. Estado atual do fluxo de catálogo no Sofia

### 1.1 Onde entra a criação de produto

| Etapa | Onde | O quê |
|-------|------|--------|
| **Entrada** | Admin → Catálogo → Produtos (`/admin/catalog/products` ou equivalente) | Botão "Criar produto"; modal com nome, categoria, preço, ativo. |
| **API** | `catalogApi.saveProduct(input, restaurantId)` | Quando `restaurantId` está definido e backend é Docker, chama `MenuWriter.createMenuItem(restaurantId, payload)`. |
| **Escrita** | `MenuWriter.createMenuItem` → PostgREST | `INSERT` em **`gm_products`** (tabela do Core). |
| **Payload** | `restaurant_id`, `category_id`, `name`, `description`, `price_cents`, `available`, `station`, `prep_time_seconds`, `prep_category` | Categoria obrigatória no Admin; station default KITCHEN; prep 5 min. |

Não existe passo de "publicar" nem sync para outra tabela: o produto fica em **`gm_products`** e é essa a fonte de verdade para o menu operacional.

### 1.2 Quem lê `gm_products` (e reflete o produto)

| Superfície | Como lê | Fonte |
|------------|---------|--------|
| **Admin (lista)** | `catalogApi.listProducts(restaurantId)` → `readProducts(restaurantId)` | `RestaurantReader.readProducts` → `gm_products` |
| **TPV** | `TPVPOSView`: fetch direto ao Core `gm_products?restaurant_id=eq.{id}` + `readMenuCategories` | `gm_products` + `gm_menu_categories` |
| **Comandeiro / Waiter** | `useMenuItems(tenantId)` → `readMenuCategories` + `readProducts` | `RestaurantReader` → `gm_products` |
| **Web** | `readMenu(restaurantId)` → `readProducts` + `readMenuCategories` | `RestaurantReader` → `gm_products` |
| **QR Mesa** | `TablePage`: `readMenu(restaurantData.id)` | Idem |
| **Menu Builder** | `readProductsByRestaurant(restaurantId)` → `readProducts` + `readMenuCategories` | Idem |

Conclusão: **uma única tabela (`gm_products`) e uma única leitura (RestaurantReader / fetch Core).** Não há publish nem sync; o que o Admin grava em `gm_products` é o que as outras superfícies leem na próxima carga.

### 1.3 Pré-requisito para aparecer em todas

- O produto deve ter **`category_id`** igual a um id existente em **`gm_menu_categories`** para o restaurante 100 (Sofia). O Admin exige escolha de categoria ao criar; portanto, desde que se use uma categoria existente, o produto aparece em todas as superfícies que listam por categoria.

---

## 2. Produto de teste

### Nome canónico

- **SOFIA E2E PRODUCT** — nome único e fácil de procurar em qualquer superfície.

### Opção A — Criar no Admin (smoke manual)

1. Login (mock pilot ou Keycloak) com tenant = Sofia (restaurant_id 100).
2. Ir a **Admin → Catálogo → Produtos**.
3. Clicar **Criar produto**.
4. Nome: **SOFIA E2E PRODUCT**.
5. Categoria: qualquer uma existente (ex.: Tapas & Entradas).
6. Preço: ex. 1,00 € (100 cêntimos).
7. Guardar.
8. Confirmar que o produto aparece na lista do Admin.

### Opção B — Inserir via migração (validação repetível)

Ficheiro **`docker-core/schema/migrations/20260415_sofia_e2e_product.sql`** insere o produto **SOFIA E2E PRODUCT** no restaurante 100. Aplicar a migração (ou executar o SQL) antes de validar nas superfícies.

- Depois de aplicada, não é necessário criar o produto no Admin para este smoke; basta verificar que ele aparece em TPV, Web, Comandeiro e QR Mesa.

---

## 3. Resultado por superfície

Após o produto existir em `gm_products` (criado no Admin ou pela migração):

| Superfície | Esperado | Como validar |
|------------|----------|----------------|
| **Admin** | Produto visível na lista de Produtos (e em edição). | Admin → Catálogo → Produtos → procurar "SOFIA E2E". |
| **TPV** | Produto visível na grelha do TPV (categoria correta). | Abrir `/op/tpv` (ou rota TPV); escolher categoria; procurar "SOFIA E2E PRODUCT". |
| **mini TPV / AppStaff** | Idem: mesma fonte `gm_products`. | AppStaff → modo TPV ou fluxo que use menu; procurar o produto. |
| **Web** | Produto visível no menu da página pública. | Abrir `http://localhost:5175/public/sofia-gastrobar` (ou URL do slug); procurar "SOFIA E2E PRODUCT". |
| **QR Mesa** | Produto visível ao pedir por mesa. | Abrir página da mesa (ex. `/public/sofia-gastrobar/mesa/1`); procurar o produto no menu. |
| **Comandeiro** | Produto visível ao fazer pedido na mesa. | AppStaff → Comandeiro (waiter) → mesa → adicionar itens; procurar "SOFIA E2E PRODUCT". |

Se alguma superfície **não** mostrar o produto, verificar: (1) que está a usar `restaurant_id = 100` (Sofia); (2) que o Core está acessível e a leitura de `gm_products` não falha; (3) que não há filtro por `available = false` que exclua o produto.

---

## 4. O que refletiu automaticamente

- **Admin → `gm_products`:** escrita direta na única tabela de produtos do menu operacional.
- **TPV, Web, QR Mesa, Comandeiro, Menu Builder:** leem todos de `gm_products` (e `gm_menu_categories`) para o mesmo `restaurant_id`. Não há cache de catálogo separado nem passo de publicação: **reflexão imediata** na próxima leitura (refresh da página ou recarregar lista).

Nada depende de job assíncrono nem de "publicar" para outra tabela.

---

## 5. O que ainda depende de publish/sync

- **`gm_catalog_*` (menu digital por canal/marca):** O Admin **Produtos** (ProductsPage) escreve apenas em **`gm_products`**. Não existe neste fluxo um passo que copie automaticamente para `gm_catalog_items` / `gm_catalog_menus`. Se no futuro alguma superfície depender exclusivamente de `gm_catalog_*`, aí sim seria necessário um publish/sync; hoje, **Web e QR Mesa usam `readMenu` → `gm_products`**, por isso não há dependência de publish para este circuito.
- **Resumo:** Para o circuito Sofia (Admin → TPV, Web, QR, Comandeiro), **não há publish/sync**; tudo reflete a partir de `gm_products`.

---

## 6. Estado final do circuito de catálogo do Sofia

| Item | Estado |
|------|--------|
| **Fonte única** | `gm_products` (e `gm_menu_categories` para categorias). |
| **Escrita** | Admin → `MenuWriter.createMenuItem` → `gm_products`. |
| **Leitura** | TPV, Web, QR Mesa, Comandeiro, Menu Builder → `readProducts` / `readMenu` / fetch Core → `gm_products`. |
| **Publish/sync** | Nenhum para este circuito. |
| **Produto de teste** | Nome **SOFIA E2E PRODUCT**; criação no Admin ou via migração `20260415_sofia_e2e_product.sql`. |
| **Validação** | Smoke: criar (ou aplicar migração) → confirmar em Admin, TPV, Web, QR Mesa e Comandeiro. |

---

## 7. Próximo passo único

Executar o **smoke ponta a ponta** uma vez com o produto **SOFIA E2E PRODUCT** (criado no Admin ou pela migração) e assinalar o resultado por superfície neste documento ou em [SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md](./SOFIA_GASTROBAR_RESTAURANTE_OFICIAL_VALIDACAO.md) (ex.: tabela "Resultado do smoke — SOFIA E2E PRODUCT"). Assim fica registado que o circuito do catálogo do Sofia está fechado e operacional.
