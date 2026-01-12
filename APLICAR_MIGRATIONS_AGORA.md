# 🚀 Guia de Migração: APLIQUE AGORA (v0.9.2)

> [!CAUTION]
> **ATENÇÃO:** O sistema **NÃO FUNCIONARÁ** corretamente na versão v0.9.2 sem estas alterações no banco de dados.
> Aplique os scripts na ordem apresentada abaixo.

---

## 📋 Como Aplicar

1.  Acesse o **Supabase Dashboard** do seu projeto.
2.  Vá para **SQL Editor**.
3.  Cole o conteúdo de cada bloco abaixo (um por vez) e clique em **RUN**.
4.  Verifique se retornou "Success" (ou vazio, sem erros).

---

## 🟢 1. Configuração Fiscal & Base (20260117)

Este script prepara a estrutura para configurações fiscais.

```sql
-- Migration: Add fiscal config to restaurants
-- Date: 2026-01-17

ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS fiscal_config JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.gm_restaurants.fiscal_config IS 'Configuration for fiscal integration (e.g. invoiceXpress API key, account name)';

-- Add setup_status column if missing (for legacy databases)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gm_restaurants' AND column_name = 'setup_status') THEN
        ALTER TABLE public.gm_restaurants ADD COLUMN setup_status TEXT DEFAULT 'not_started';
    END IF;
END $$;
```

---

## 🟢 2. Integração Delivery (Glovo/Uber) (20260117)

Cria a tabela de buffer para pedidos externos e configura segurança RLS.

```sql
-- 1. Modify gm_restaurants to support external mappings
ALTER TABLE public.gm_restaurants
ADD COLUMN IF NOT EXISTS external_ids JSONB DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.gm_restaurants.external_ids IS 'Map of external provider IDs, e.g. {"glovo_store_id": "12345", "uber_uuid": "..."}';

-- Development: Reset table
DROP TABLE IF EXISTS public.integration_orders CASCADE;

-- 2. Create integration_orders table (Buffer)
CREATE TABLE public.integration_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT NOT NULL,
    source TEXT NOT NULL,
    reference TEXT,
    source_restaurant_id TEXT,
    restaurant_id UUID REFERENCES public.gm_restaurants(id),
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    delivery_address TEXT,
    delivery_type TEXT DEFAULT 'delivery',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'EUR',
    payment_method TEXT,
    payment_status TEXT,
    instructions TEXT,
    raw_payload JSONB,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    UNIQUE(external_id, source)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integration_orders_source ON public.integration_orders(source);
CREATE INDEX IF NOT EXISTS idx_integration_orders_status ON public.integration_orders(status);
CREATE INDEX IF NOT EXISTS idx_integration_orders_restaurant ON public.integration_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_integration_orders_received ON public.integration_orders(received_at DESC);

-- RLS
ALTER TABLE public.integration_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Owners view their own orders
-- Ajuste: Usa 'restaurant_members' ou 'gm_restaurant_members' dependendo da sua versão. 
-- O script abaixo tenta ser compatível, mas ajuste se necessário.
-- Assumindo 'restaurant_members' como padrão legado ou 'gm_restaurant_members' se for novo schema.
-- AQUI USAMOS O PADRÃO ATUAL: gm_restaurant_members

CREATE POLICY "Owners view integration orders" ON public.integration_orders FOR
SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM public.gm_restaurant_members
            WHERE user_id = auth.uid()
                AND role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Service role full access integration orders" ON public.integration_orders FOR ALL USING (auth.role() = 'service_role');
```

---

## 🟢 3. Offline Core & Idempotência (20260118)

**CRÍTICO:** Necessário para sincronização offline robusta.

```sql
-- 3.1 Metadata de Sincronização
ALTER TABLE gm_orders
ADD COLUMN IF NOT EXISTS sync_metadata JSONB DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_gm_orders_sync_local_id 
ON gm_orders USING GIN ((sync_metadata->>'localId'));

COMMENT ON COLUMN gm_orders.sync_metadata IS 'Metadata for offline sync: {localId, syncAttempts, lastSyncAt}';

-- 3.2 Optimistic Lock (Versionamento)
ALTER TABLE gm_orders
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gm_orders_version 
ON gm_orders(id, version);

COMMENT ON COLUMN gm_orders.version IS 'Optimistic locking version - increments on each update';

CREATE OR REPLACE FUNCTION increment_order_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version := OLD.version + 1;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_order_version ON gm_orders;
CREATE TRIGGER trigger_increment_order_version
    BEFORE UPDATE ON gm_orders
    FOR EACH ROW
    EXECUTE FUNCTION increment_order_version();
```

---

## 🟢 4. Atomic Order Creation com Idempotência (20260118)

Atualiza a função RPC para suportar metadata offline e **idempotência** (evita duplicação de pedidos offline).

```sql
-- Drop existing function to update signature
DROP FUNCTION IF EXISTS public.create_order_atomic(UUID, JSONB, TEXT);
DROP FUNCTION IF EXISTS public.create_order_atomic(UUID, JSONB, TEXT, JSONB); -- Safety drop

CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_restaurant_id UUID,
    p_items JSONB,
    p_payment_method TEXT DEFAULT 'cash',
    p_sync_metadata JSONB DEFAULT NULL
) RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE 
    v_order_id UUID;
    v_total_amount INTEGER := 0;
    v_item JSONB;
    v_item_total INTEGER;
    v_short_id TEXT;
    v_count INTEGER;
BEGIN
    -- 1. Calculate Total
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) 
    LOOP
        v_item_total := (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER;
        v_total_amount := v_total_amount + v_item_total;
    END LOOP;

    -- 2. Generate Short ID
    SELECT count(*) + 1 INTO v_count
    FROM public.gm_orders
    WHERE restaurant_id = p_restaurant_id;
    v_short_id := '#' || v_count::TEXT;

    -- 3. IDEMPOTÊNCIA: Verificar se pedido já existe (por localId)
    IF p_sync_metadata IS NOT NULL AND p_sync_metadata ? 'localId' THEN
        SELECT id INTO v_order_id
        FROM public.gm_orders
        WHERE restaurant_id = p_restaurant_id
            AND (sync_metadata->>'localId')::TEXT = (p_sync_metadata->>'localId')::TEXT
        LIMIT 1;

        IF v_order_id IS NOT NULL THEN
            -- Pedido já existe, retornar dados existentes
            RETURN jsonb_build_object(
                'id', v_order_id,
                'short_id', (SELECT short_id FROM gm_orders WHERE id = v_order_id),
                'total_amount', (SELECT total_amount FROM gm_orders WHERE id = v_order_id),
                'status', (SELECT status FROM gm_orders WHERE id = v_order_id)
            );
        END IF;
    END IF;

    -- 4. Insert Order
    INSERT INTO public.gm_orders (
        restaurant_id,
        short_id,
        status,
        total_amount,
        payment_status,
        payment_method,
        sync_metadata
    )
    VALUES (
        p_restaurant_id,
        v_short_id,
        'pending',
        v_total_amount,
        'pending',
        p_payment_method,
        p_sync_metadata
    )
    RETURNING id INTO v_order_id;

    -- 5. Insert Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) 
    LOOP
        INSERT INTO public.gm_order_items (
            order_id,
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price
        )
        VALUES (
            v_order_id,
            (v_item->>'product_id')::UUID,
            v_item->>'name',
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::INTEGER,
            (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::INTEGER
        );
    END LOOP;

    RETURN jsonb_build_object(
        'id', v_order_id,
        'short_id', v_short_id,
        'total_amount', v_total_amount,
        'status', 'pending'
    );
END;
$$;
```

---

## 🟢 5. Cash Register Lock (20260118)

**CRÍTICO:** Previne fechamento de caixa durante processamento de pagamento (P0-4).

```sql
-- Migration: Add RPC function to check open orders with FOR UPDATE lock
-- Purpose: Prevent cash register closure during payment processing
-- Date: 2026-01-18

CREATE OR REPLACE FUNCTION public.check_open_orders_with_lock(
    p_restaurant_id UUID
) RETURNS TABLE (
    id UUID,
    table_number INTEGER
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
    -- Lock rows to prevent concurrent modifications
    RETURN QUERY
    SELECT o.id, o.table_number
    FROM gm_orders o
    WHERE o.restaurant_id = p_restaurant_id
        AND o.status IN ('pending', 'preparing', 'ready')
        AND o.payment_status != 'PAID'
    FOR UPDATE OF o;
END;
$$;

COMMENT ON FUNCTION public.check_open_orders_with_lock IS 'Checks for open orders with row-level lock to prevent race conditions during cash register closure';
```

---

## ✅ Validação Final

Após rodar todos os scripts, execute esta query para confirmar que as colunas críticas existem:

```sql
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('gm_restaurants', 'integration_orders', 'gm_orders')
AND column_name IN ('fiscal_config', 'external_ids', 'sync_metadata', 'version');
```

Você deve ver:
*   `gm_restaurants`: `fiscal_config`, `external_ids`
*   `gm_orders`: `sync_metadata`, `version`
*   `integration_orders`: (varias colunas)

---

## 🔍 Validação Adicional: Funções RPC

Verifique se as funções críticas foram criadas:

```sql
SELECT proname, pronargs 
FROM pg_proc 
WHERE proname IN ('create_order_atomic', 'check_open_orders_with_lock')
ORDER BY proname;
```

Você deve ver:
*   `create_order_atomic` com 4 parâmetros (incluindo `p_sync_metadata`)
*   `check_open_orders_with_lock` com 1 parâmetro

---

## ✅ Próximo Passo

Após aplicar todas as migrations e validar:

👉 **[Seguir para Checklist Pós-Migração](./POS_MIGRATION_CHECKLIST.md)**

O checklist inclui:
* Validação técnica (15 min)
* Testes de sanidade (30 min)
* Testes offline (1h)
* Testes de race condition (30 min)
* Teste fiscal (30 min)
* Validação final (15 min)
