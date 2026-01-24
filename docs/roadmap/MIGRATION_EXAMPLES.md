# 📦 Exemplos de Migrations SQL - Multi-Tenant

**Versão:** 1.0  
**Data:** 2026-01-24

---

## 🎯 OBJETIVO

Fornecer exemplos prontos de migrations SQL para facilitar implementação do multi-tenancy.

---

## 📋 MIGRATION 1: Adicionar restaurant_id onde falta

**Arquivo:** `supabase/migrations/YYYYMMDD_add_restaurant_id_audit.sql`

```sql
-- Migration: Adicionar restaurant_id onde falta
-- Data: YYYY-MM-DD
-- Objetivo: Garantir que todas as tabelas de dados têm restaurant_id

-- 1. Adicionar restaurant_id em gm_menu_categories (se não existir)
ALTER TABLE public.gm_menu_categories
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;

-- 2. Adicionar restaurant_id em gm_customers (se não existir)
ALTER TABLE public.gm_customers
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.gm_restaurants(id) ON DELETE CASCADE;

-- 3. Adicionar restaurant_id em gm_audit_logs (se não existir, opcional)
ALTER TABLE public.gm_audit_logs
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.gm_restaurants(id) ON DELETE SET NULL;

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant 
ON public.gm_menu_categories(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_customers_restaurant 
ON public.gm_customers(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant 
ON public.gm_audit_logs(restaurant_id, created_at DESC);

-- 5. Backfill: Preencher restaurant_id existente (assumir primeiro restaurante)
-- ATENÇÃO: Ajustar lógica de backfill conforme necessário
UPDATE public.gm_menu_categories
SET restaurant_id = (SELECT id FROM public.gm_restaurants LIMIT 1)
WHERE restaurant_id IS NULL;

UPDATE public.gm_customers
SET restaurant_id = (SELECT id FROM public.gm_restaurants LIMIT 1)
WHERE restaurant_id IS NULL;

-- 6. Tornar NOT NULL após backfill (se aplicável)
-- ALTER TABLE public.gm_menu_categories ALTER COLUMN restaurant_id SET NOT NULL;
-- ALTER TABLE public.gm_customers ALTER COLUMN restaurant_id SET NOT NULL;
```

---

## 📋 MIGRATION 2: Criar tabela gm_restaurant_members

**Arquivo:** `supabase/migrations/YYYYMMDD_restaurant_members.sql`

```sql
-- Migration: Criar tabela de associação User-Restaurant
-- Data: YYYY-MM-DD
-- Objetivo: Associar usuários a restaurantes com roles

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS public.gm_restaurant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'waiter' CHECK (role IN ('owner', 'manager', 'waiter', 'kitchen', 'cashier')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(restaurant_id, user_id) -- Um usuário só pode ter uma role por restaurante
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_restaurant_members_restaurant 
ON public.gm_restaurant_members(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_members_user 
ON public.gm_restaurant_members(user_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_members_role 
ON public.gm_restaurant_members(restaurant_id, role);

-- 3. Habilitar RLS
ALTER TABLE public.gm_restaurant_members ENABLE ROW LEVEL SECURITY;

-- 4. Criar RLS Policy: Usuários só veem suas próprias associações
CREATE POLICY "Users can only see their own memberships"
ON public.gm_restaurant_members
FOR SELECT
USING (user_id = auth.uid());

-- 5. Criar RLS Policy: Owners podem gerenciar membros do seu restaurante
CREATE POLICY "Owners can manage members of their restaurant"
ON public.gm_restaurant_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.gm_restaurant_members
    WHERE restaurant_id = gm_restaurant_members.restaurant_id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

-- 6. Migrar dados existentes (assumir owner_id = primeiro owner)
INSERT INTO public.gm_restaurant_members (restaurant_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM public.gm_restaurants
WHERE owner_id IS NOT NULL
ON CONFLICT (restaurant_id, user_id) DO NOTHING;

-- 7. Comentários
COMMENT ON TABLE public.gm_restaurant_members IS 'Associação de usuários a restaurantes com roles';
COMMENT ON COLUMN public.gm_restaurant_members.role IS 'Role do usuário no restaurante: owner, manager, waiter, kitchen, cashier';
```

---

## 📋 MIGRATION 3: Função helper get_user_restaurant_id()

**Arquivo:** `supabase/migrations/YYYYMMDD_get_user_restaurant_id_function.sql`

```sql
-- Migration: Criar função helper para RLS
-- Data: YYYY-MM-DD
-- Objetivo: Função helper para policies RLS

-- 1. Criar função que retorna restaurant_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_restaurant_id()
RETURNS UUID AS $$
  SELECT restaurant_id 
  FROM public.gm_restaurant_members 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Criar função que retorna lista de restaurantes do usuário
CREATE OR REPLACE FUNCTION public.get_user_restaurants()
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(restaurant_id)
  FROM public.gm_restaurant_members 
  WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Comentários
COMMENT ON FUNCTION public.get_user_restaurant_id() IS 'Retorna restaurant_id do usuário logado (para RLS)';
COMMENT ON FUNCTION public.get_user_restaurants() IS 'Retorna lista de restaurantes do usuário logado';
```

---

## 📋 MIGRATION 4: RLS Policies para tabelas core

**Arquivo:** `supabase/migrations/YYYYMMDD_rls_policies_core.sql`

```sql
-- Migration: RLS Policies para tabelas core
-- Data: YYYY-MM-DD
-- Objetivo: Isolar dados por restaurant_id usando RLS

-- 1. gm_restaurants: Usuários só veem restaurantes onde têm acesso
DROP POLICY IF EXISTS "Users can only see their restaurants" ON public.gm_restaurants;
CREATE POLICY "Users can only see their restaurants"
ON public.gm_restaurants
FOR SELECT
USING (
  id IN (
    SELECT restaurant_id 
    FROM public.gm_restaurant_members 
    WHERE user_id = auth.uid()
  )
);

-- 2. gm_orders: Usuários só veem pedidos do seu restaurante
DROP POLICY IF EXISTS "Users can only see their restaurant's orders" ON public.gm_orders;
CREATE POLICY "Users can only see their restaurant's orders"
ON public.gm_orders
FOR ALL
USING (restaurant_id = public.get_user_restaurant_id())
WITH CHECK (restaurant_id = public.get_user_restaurant_id());

-- 3. gm_products: Usuários só veem produtos do seu restaurante
DROP POLICY IF EXISTS "Users can only see their restaurant's products" ON public.gm_products;
CREATE POLICY "Users can only see their restaurant's products"
ON public.gm_products
FOR ALL
USING (restaurant_id = public.get_user_restaurant_id())
WITH CHECK (restaurant_id = public.get_user_restaurant_id());

-- 4. gm_tables: Usuários só veem mesas do seu restaurante
DROP POLICY IF EXISTS "Users can only see their restaurant's tables" ON public.gm_tables;
CREATE POLICY "Users can only see their restaurant's tables"
ON public.gm_tables
FOR ALL
USING (restaurant_id = public.get_user_restaurant_id())
WITH CHECK (restaurant_id = public.get_user_restaurant_id());

-- 5. gm_order_items: Usuários só veem itens de pedidos do seu restaurante
DROP POLICY IF EXISTS "Users can only see their restaurant's order items" ON public.gm_order_items;
CREATE POLICY "Users can only see their restaurant's order items"
ON public.gm_order_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.gm_orders 
    WHERE gm_orders.id = gm_order_items.order_id 
    AND gm_orders.restaurant_id = public.get_user_restaurant_id()
  )
);

-- 6. gm_shifts: Usuários só veem turnos do seu restaurante
DROP POLICY IF EXISTS "Users can only see their restaurant's shifts" ON public.gm_shifts;
CREATE POLICY "Users can only see their restaurant's shifts"
ON public.gm_shifts
FOR ALL
USING (restaurant_id = public.get_user_restaurant_id())
WITH CHECK (restaurant_id = public.get_user_restaurant_id());

-- 7. gm_tasks: Usuários só veem tarefas do seu restaurante
DROP POLICY IF EXISTS "Users can only see their restaurant's tasks" ON public.gm_tasks;
CREATE POLICY "Users can only see their restaurant's tasks"
ON public.gm_tasks
FOR ALL
USING (restaurant_id = public.get_user_restaurant_id())
WITH CHECK (restaurant_id = public.get_user_restaurant_id());

-- 8. gm_menu_categories: Usuários só veem categorias do seu restaurante
DROP POLICY IF EXISTS "Users can only see their restaurant's categories" ON public.gm_menu_categories;
CREATE POLICY "Users can only see their restaurant's categories"
ON public.gm_menu_categories
FOR ALL
USING (restaurant_id = public.get_user_restaurant_id())
WITH CHECK (restaurant_id = public.get_user_restaurant_id());

-- 9. gm_customers: Usuários só veem clientes do seu restaurante
DROP POLICY IF EXISTS "Users can only see their restaurant's customers" ON public.gm_customers;
CREATE POLICY "Users can only see their restaurant's customers"
ON public.gm_customers
FOR ALL
USING (restaurant_id = public.get_user_restaurant_id())
WITH CHECK (restaurant_id = public.get_user_restaurant_id());
```

---

## 📋 MIGRATION 5: Tabelas de Billing

**Arquivo:** `supabase/migrations/YYYYMMDD_billing_tables.sql`

```sql
-- Migration: Tabelas de Billing
-- Data: YYYY-MM-DD
-- Objetivo: Criar estrutura de billing básica

-- 1. Tabela de assinaturas
CREATE TABLE IF NOT EXISTS public.gm_billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'professional')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(restaurant_id) -- Um restaurante só pode ter uma assinatura ativa
);

-- 2. Tabela de invoices
CREATE TABLE IF NOT EXISTS public.gm_billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.gm_billing_subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('paid', 'open', 'void', 'uncollectible')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_restaurant 
ON public.gm_billing_subscriptions(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_stripe 
ON public.gm_billing_subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_restaurant 
ON public.gm_billing_invoices(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_stripe 
ON public.gm_billing_invoices(stripe_invoice_id);

-- 4. RLS Policies
ALTER TABLE public.gm_billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gm_billing_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their restaurant's subscriptions"
ON public.gm_billing_subscriptions
FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

CREATE POLICY "Users can only see their restaurant's invoices"
ON public.gm_billing_invoices
FOR SELECT
USING (restaurant_id = public.get_user_restaurant_id());

-- 5. Comentários
COMMENT ON TABLE public.gm_billing_subscriptions IS 'Assinaturas de billing por restaurante';
COMMENT ON TABLE public.gm_billing_invoices IS 'Invoices de billing por restaurante';
```

---

## 📋 MIGRATION 6: Audit Logs Expandido

**Arquivo:** `supabase/migrations/YYYYMMDD_audit_logs_enhanced.sql`

```sql
-- Migration: Expandir tabela de audit logs
-- Data: YYYY-MM-DD
-- Objetivo: Adicionar contexto de tenant e melhorar rastreabilidade

-- 1. Criar/expandir tabela de audit logs
CREATE TABLE IF NOT EXISTS public.gm_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.gm_restaurants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'order.created', 'payment.processed', 'product.updated', etc.
  entity_type TEXT, -- 'order', 'product', 'table', 'customer', etc.
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant 
ON public.gm_audit_logs(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user 
ON public.gm_audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
ON public.gm_audit_logs(action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
ON public.gm_audit_logs(entity_type, entity_id);

-- 3. RLS Policy
ALTER TABLE public.gm_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their restaurant's audit logs"
ON public.gm_audit_logs
FOR SELECT
USING (
  restaurant_id = public.get_user_restaurant_id() 
  OR restaurant_id IS NULL -- Logs sem restaurant_id são globais (admin)
);

-- 4. Comentários
COMMENT ON TABLE public.gm_audit_logs IS 'Logs de auditoria com contexto de tenant';
COMMENT ON COLUMN public.gm_audit_logs.action_type IS 'Tipo de ação: order.created, payment.processed, etc.';
COMMENT ON COLUMN public.gm_audit_logs.metadata IS 'Metadados adicionais da ação (JSON)';
```

---

## 📋 MIGRATION 7: Performance Indexes

**Arquivo:** `supabase/migrations/YYYYMMDD_performance_indexes.sql`

```sql
-- Migration: Índices de Performance
-- Data: YYYY-MM-DD
-- Objetivo: Otimizar queries críticas para escala

-- 1. Índices compostos para queries frequentes
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status 
ON public.gm_orders(restaurant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_table 
ON public.gm_orders(restaurant_id, table_number, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_status 
ON public.gm_order_items(order_id, status);

CREATE INDEX IF NOT EXISTS idx_products_restaurant_available 
ON public.gm_products(restaurant_id, available) 
WHERE available = true;

CREATE INDEX IF NOT EXISTS idx_tables_restaurant_status 
ON public.gm_tables(restaurant_id, status);

CREATE INDEX IF NOT EXISTS idx_shifts_restaurant_active 
ON public.gm_shifts(restaurant_id, status, created_at DESC)
WHERE status IN ('open', 'active');

-- 2. Índices parciais para queries específicas
CREATE INDEX IF NOT EXISTS idx_orders_pending 
ON public.gm_orders(restaurant_id, created_at DESC)
WHERE status IN ('pending', 'OPEN', 'IN_PREP');

CREATE INDEX IF NOT EXISTS idx_orders_wants_pay 
ON public.gm_orders(restaurant_id, updated_at DESC)
WHERE status = 'wants_pay';

-- 3. Comentários
COMMENT ON INDEX idx_orders_restaurant_status IS 'Otimiza queries de pedidos por restaurante e status';
COMMENT ON INDEX idx_orders_pending IS 'Otimiza queries de pedidos pendentes';
```

---

## 🎯 COMO USAR

1. **Copiar migration apropriada**
2. **Ajustar data no nome do arquivo** (YYYYMMDD)
3. **Revisar e adaptar conforme necessário**
4. **Testar em staging primeiro**
5. **Aplicar em produção**

---

## ⚠️ AVISOS IMPORTANTES

1. **Sempre testar em staging primeiro**
2. **Fazer backup antes de migrations em produção**
3. **Revisar lógica de backfill** (pode variar por ambiente)
4. **Validar performance** após criar índices
5. **Documentar mudanças** em `docs/architecture/`

---

**Versão:** 1.0  
**Data:** 2026-01-24
