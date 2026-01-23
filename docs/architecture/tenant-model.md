# 🏗️ Modelo de Tenancy - ChefIApp

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Documentado

---

## 🎯 VISÃO GERAL

O ChefIApp usa **Single Database com Row-Level Security (RLS)** para isolamento multi-tenant. O `restaurant_id` é o identificador de tenant em todas as tabelas de dados.

---

## 📊 HIERARQUIA DE TENANCY

```
gm_restaurants (tenant root)
  ├── gm_restaurant_members (user ↔ restaurant)
  ├── gm_products
  ├── gm_orders
  ├── gm_order_items
  ├── gm_tables
  ├── gm_menu_categories
  ├── gm_shifts
  ├── gm_cash_registers
  ├── gm_payments
  ├── gm_customer_profiles
  ├── gm_loyalty_cards
  ├── gm_inventory_items
  ├── gm_integration_secrets
  ├── gm_fiscal_queue
  └── ... (todas as tabelas de dados)
```

---

## 📋 LISTA DE TABELAS COM restaurant_id

### Tabelas Principais (Já têm restaurant_id)

| Tabela | restaurant_id | Índice | RLS |
|--------|---------------|--------|-----|
| `gm_restaurants` | N/A (raiz) | - | ✅ |
| `gm_products` | ✅ | ✅ | ✅ |
| `gm_orders` | ✅ | ✅ | ✅ |
| `gm_order_items` | Via `order_id` | ✅ | ✅ |
| `gm_tables` | ✅ | ✅ | ✅ |
| `gm_menu_categories` | ✅ | ✅ | ✅ |
| `gm_shifts` | ✅ | ✅ | ✅ |
| `gm_cash_registers` | ✅ | ✅ | ✅ |
| `gm_payments` | ✅ | ✅ | ✅ |
| `gm_restaurant_members` | ✅ | ✅ | ✅ |
| `gm_customer_profiles` | ✅ | ✅ | ✅ |
| `gm_loyalty_cards` | ✅ | ✅ | ✅ |
| `gm_inventory_items` | ✅ | ✅ | ✅ |
| `gm_integration_secrets` | ✅ | ✅ | ✅ |
| `gm_fiscal_queue` | ✅ | ✅ | ✅ |
| `gm_restaurant_settings` | ✅ | ✅ | ✅ |

### Tabelas de Sistema (Sem restaurant_id)

| Tabela | Motivo |
|--------|--------|
| `auth.users` | Tabela do Supabase Auth |
| `gm_audit_logs` | Usa `tenant_id` (equivalente) |

---

## 🔧 FUNÇÕES HELPER

### `get_user_restaurant_id() → UUID`

Retorna o primeiro `restaurant_id` do usuário logado.

**Uso:**
```sql
SELECT * FROM gm_orders 
WHERE restaurant_id = get_user_restaurant_id();
```

### `get_user_restaurants() → SETOF UUID`

Retorna todos os `restaurant_id` do usuário logado.

**Uso:**
```sql
SELECT * FROM gm_orders 
WHERE restaurant_id = ANY(get_user_restaurants());
```

### `user_restaurant_ids() → SETOF UUID`

Função existente (compatibilidade). Retorna todos os `restaurant_id` do usuário.

### `is_user_member_of_restaurant(restaurant_id UUID) → BOOLEAN`

Verifica se usuário é membro de um restaurante específico.

**Uso:**
```sql
SELECT * FROM gm_orders 
WHERE is_user_member_of_restaurant(restaurant_id);
```

---

## 🔒 RLS POLICIES

### Estrutura Padrão

```sql
-- SELECT: Usuário só vê dados do seu restaurante
CREATE POLICY "users_select_own_restaurant_data"
ON public.gm_products
FOR SELECT
USING (restaurant_id = ANY(get_user_restaurants()));

-- INSERT: Usuário só insere dados no seu restaurante
CREATE POLICY "users_insert_own_restaurant_data"
ON public.gm_products
FOR INSERT
WITH CHECK (restaurant_id = ANY(get_user_restaurants()));

-- UPDATE: Usuário só atualiza dados do seu restaurante
CREATE POLICY "users_update_own_restaurant_data"
ON public.gm_products
FOR UPDATE
USING (restaurant_id = ANY(get_user_restaurants()))
WITH CHECK (restaurant_id = ANY(get_user_restaurants()));

-- DELETE: Usuário só deleta dados do seu restaurante
CREATE POLICY "users_delete_own_restaurant_data"
ON public.gm_products
FOR DELETE
USING (restaurant_id = ANY(get_user_restaurants()));
```

---

## 📊 ÍNDICES DE PERFORMANCE

Todos os índices em `restaurant_id` foram criados para otimizar queries:

```sql
-- Índices principais
CREATE INDEX idx_gm_orders_restaurant_id ON gm_orders(restaurant_id);
CREATE INDEX idx_gm_products_restaurant_id ON gm_products(restaurant_id);
CREATE INDEX idx_gm_tables_restaurant_id ON gm_tables(restaurant_id);
-- ... (ver migration 20260122170644_add_restaurant_id_indexes.sql)
```

---

## 🔄 CONTEXT SWITCHING

Para permitir que usuários trabalhem com múltiplos restaurantes:

1. **Tabela de associação:** `gm_restaurant_members`
2. **Função helper:** `get_user_restaurants()` retorna todos
3. **App:** Context switching permite selecionar restaurante ativo
4. **RLS:** Policies usam `ANY(get_user_restaurants())` para permitir acesso a múltiplos

---

## 📚 REFERÊNCIAS

- **Migrations:** `supabase/migrations/20260122170643_audit_restaurant_id.sql`
- **Índices:** `supabase/migrations/20260122170644_add_restaurant_id_indexes.sql`
- **Helpers:** `supabase/migrations/20260122170645_create_helper_functions.sql`
- **RLS:** `supabase/migrations/20260117000001_rls_orders.sql`

---

**Versão:** 1.0  
**Data:** 2026-01-22  
**Status:** ✅ Documentado
