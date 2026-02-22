# ChefIApp — RLS Policies (Design)

**Fonte**: `docker-core/schema/migrations/20260321_day2_rls_policies.sql`  
**Objetivo**: Isolamento multi-tenant por restaurante; utilizadores só acedem a dados dos restaurantes onde têm acesso.

---

## 1. Função auxiliar

As políticas baseiam-se na função **`has_restaurant_access(restaurant_id UUID)`**, que deve retornar `true` se o utilizador autenticado (`auth.uid()`) tiver acesso ao restaurante (ex.: membro em `gm_restaurant_members` ou via `restaurant_users`). A definição concreta está nas migrações anteriores (ex.: RLS phase2 ou schema base).

---

## 2. Tabelas com RLS

| Tabela | SELECT | INSERT | UPDATE | DELETE | service_role |
|--------|--------|--------|--------|--------|--------------|
| **gm_restaurants** | `has_restaurant_access(id)` | authenticated | same | same | ALL |
| **gm_orders** | `has_restaurant_access(restaurant_id)` | same | same | same | ALL |
| **gm_order_items** | via `gm_orders` (restaurant) | same | same | same | ALL |
| **gm_payments** | via `gm_orders` (restaurant) | same | same | same | ALL |
| **gm_restaurant_members** | `has_restaurant_access(restaurant_id)` | same | same | same | ALL |

---

## 3. Políticas por tabela

### gm_restaurants

- **restaurants_select**: SELECT onde `has_restaurant_access(id)`.
- **restaurants_insert**: INSERT para `authenticated` (criação sujeita a regras de negócio noutras camadas).
- **restaurants_update** / **restaurants_delete**: USING e WITH CHECK com `has_restaurant_access(id)`.
- **restaurants_service_all**: `service_role` tem ALL (bypass RLS).

### gm_orders

- **orders_select** / **orders_insert** / **orders_update** / **orders_delete**: todos usam `has_restaurant_access(restaurant_id)`.
- **orders_service_all**: `service_role` ALL.

### gm_order_items

- Políticas baseadas em `order_id IN (SELECT id FROM gm_orders WHERE has_restaurant_access(restaurant_id))`.
- Garante que itens só são visíveis/editáveis no contexto de pedidos do mesmo restaurante.

### gm_payments

- Mesmo padrão: acesso via `order_id` → `gm_orders` → `has_restaurant_access(restaurant_id)`.

### gm_restaurant_members

- Acesso por `has_restaurant_access(restaurant_id)`; só se vê/edita equipa dos restaurantes a que se pertence.

---

## 4. Índices (performance)

- `restaurant_users(user_id)`, `restaurant_users(restaurant_id)` (para `has_restaurant_access`).
- `gm_orders(restaurant_id, created_at DESC)`.
- `gm_order_items(order_id)`, `gm_payments(order_id)`.
- `gm_restaurant_members(restaurant_id)`.

---

## 5. Permissões

- **authenticated**: SELECT, INSERT, UPDATE, DELETE nas tabelas acima (com RLS a filtrar linhas).
- **service_role**: SELECT, INSERT, UPDATE, DELETE (bypass RLS).
- **anon**: REVOKE em todas estas tabelas (sem acesso).

---

## 6. Verificação

- Testar com dois utilizadores (A e B) e dois restaurantes: A não deve ver pedidos/dados do restaurante de B.
- Script de teste: `scripts/test-integration.sh` (RLS indiretamente coberto ao criar onboarding e listar organizações com JWT).
