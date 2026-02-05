-- Hardening P0: Core Consistency & Security
-- Date: 2026-01-22
-- Purpose: Enforce strict schema for Event Store and Legal Seals (UUIDs, FKs, Concurrency)

-- 1. Event Store (The Immutable Truth)
-- Optimized for "Append Only" with strict concurrency control.
CREATE TABLE IF NOT EXISTS public.event_store (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Global Unique ID
    stream_type TEXT NOT NULL, -- e.g., 'order', 'payment'
    stream_id TEXT NOT NULL,   -- e.g., the UUID of the entity
    stream_version INTEGER NOT NULL, -- 1, 2, 3... (Strict Ordering)
    event_type TEXT NOT NULL, -- e.g., 'OrderCreated'
    payload JSONB NOT NULL, -- The fact data
    meta JSONB DEFAULT '{}'::jsonb, -- Metadata (actor, correlation, causation)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Concurrency Guard: Cannot have two events with same version in same stream
    CONSTRAINT uq_event_stream_version UNIQUE(stream_type, stream_id, stream_version)
);

-- Performance Indexes for Event Store
CREATE INDEX IF NOT EXISTS idx_event_store_lookup ON public.event_store(stream_type, stream_id);
CREATE INDEX IF NOT EXISTS idx_event_store_global_order ON public.event_store(created_at, event_id); -- For global replay
CREATE INDEX IF NOT EXISTS idx_event_store_type ON public.event_store(event_type); -- For projection rebuilding

-- 2. Legal Seals (The Audit Chain)
-- Stores the "Sealed" state of an entity at a point in time.
CREATE TABLE IF NOT EXISTS public.legal_seals (
    seal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Fixed: UUID v4
    entity_type TEXT NOT NULL, -- 'ORDER', 'PAYMENT', 'SESSION'
    entity_id TEXT NOT NULL, -- The ID of the sealed entity
    
    -- Link to the Event that triggered the seal (The "Why")
    -- Enforces that a seal must point to a real financial fact.
    seal_event_id UUID NOT NULL REFERENCES public.event_store(event_id),
    
    stream_hash TEXT NOT NULL, -- Crypto hash of the stream up to this point
    financial_state_snapshot JSONB NOT NULL, -- The state being sealed
    legal_state TEXT NOT NULL, -- logic state e.g., 'FISCAL_READY'
    
    sealed_at TIMESTAMPTZ DEFAULT NOW(),
    legal_sequence_id BIGSERIAL NOT NULL, -- Monotonic sequence for auditors
    
    -- Constraints
    CONSTRAINT uq_legal_seal_event UNIQUE(seal_event_id) -- One seal per event
);

-- Performance Indexes for Legal Seals
CREATE INDEX IF NOT EXISTS idx_legal_seals_entity ON public.legal_seals(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_legal_seals_sequence ON public.legal_seals(legal_sequence_id);

-- 3. RLS Policies (Hardened)
ALTER TABLE public.event_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_seals ENABLE ROW LEVEL SECURITY;

-- Policy: Service Role (Backend) has full access
-- Clients (Anon/Auth) have NO ACCESS by default. 
-- Specific policies for reading own data:

CREATE POLICY "Authenticated users can read events for their restaurants (via meta)"
ON public.event_store FOR SELECT
USING (
    -- This assumes 'meta' contains 'restaurant_id' or we join.
    -- For P0, we might strictly rely on Service Role for writing events.
    -- Reading might be allowed if we extract restaurant_id to column?
    -- For now, kept minimal: Code uses Service Role or specific defined RPCs.
    false
);

-- Comments
COMMENT ON TABLE public.event_store IS 'Core immutable ledger of all system events.';
COMMENT ON COLUMN public.event_store.stream_version IS 'Strict monotonic version for concurrency control.';
COMMENT ON TABLE public.legal_seals IS 'Audit log of "Sealed" states linked to specific events.';
;
-- Hardening P0-D: CDC Triggers for Event Consistency
-- Date: 2026-01-22
-- Purpose: Guarantee that every write to gm_orders/gm_order_items emits a corresponding event to event_store.

-- 1. Function: Emit ORDER_CREATED
CREATE OR REPLACE FUNCTION public.emit_order_created_trigger()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payload JSONB;
    v_stream_id TEXT;
BEGIN
    v_stream_id := 'ORDER:' || NEW.id;
    
    v_payload := jsonb_build_object(
        'id', NEW.id,
        'restaurant_id', NEW.restaurant_id,
        'table_id', NEW.table_id,
        'tableNumber', NEW.table_number,
        'status', NEW.status,
        'totalCents', NEW.total_amount,
        'source', NEW.source,
        'operatorId', NEW.operator_id,
        'origin', 'CDC_TRIGGER' -- Traceability
    );

    INSERT INTO public.event_store(
        stream_type, stream_id, stream_version, event_type, payload, meta, created_at
    ) VALUES (
        'ORDER',
        NEW.id, -- Stream ID (just the UUID part usually, or full string depending on store convention. Store uses type:id)
        1, -- Initial Version
        'ORDER_CREATED',
        v_payload,
        jsonb_build_object(
            'trigger', 'emit_order_created',
            'timestamp', NOW()
        ),
        NEW.created_at
    );

    RETURN NEW;
END;
$$;

-- 2. Function: Emit ORDER_UPDATED (Status Change)
CREATE OR REPLACE FUNCTION public.emit_order_status_trigger()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payload JSONB;
    v_next_version INTEGER;
BEGIN
    -- Only emit if status changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Calculate next version (Optimistic Lock or simple increment)
    SELECT COALESCE(MAX(stream_version), 0) + 1 INTO v_next_version
    FROM public.event_store
    WHERE stream_type = 'ORDER' AND stream_id = NEW.id;

    v_payload := jsonb_build_object(
        'orderId', NEW.id,
        'oldStatus', OLD.status,
        'status', NEW.status, -- Current status
        'action', NEW.status, -- Mapped broadly
        'updatedAt', NEW.updated_at
    );

    INSERT INTO public.event_store(
        stream_type, stream_id, stream_version, event_type, payload, meta, created_at
    ) VALUES (
        'ORDER',
        NEW.id,
        v_next_version,
        'ORDER_UPDATED',
        v_payload,
        jsonb_build_object('trigger', 'emit_order_status'),
        NOW()
    );

    RETURN NEW;
END;
$$;

-- 3. Function: Emit ORDER_ITEM_ADDED
CREATE OR REPLACE FUNCTION public.emit_order_item_trigger()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payload JSONB;
    v_next_version INTEGER;
BEGIN
    -- Calculate next version for the ORDER stream
    SELECT COALESCE(MAX(stream_version), 0) + 1 INTO v_next_version
    FROM public.event_store
    WHERE stream_type = 'ORDER' AND stream_id = NEW.order_id;

    v_payload := jsonb_build_object(
        'order_id', NEW.order_id,
        'item', jsonb_build_object(
            'id', NEW.id,
            'product_id', NEW.product_id,
            'name', NEW.product_name,
            'quantity', NEW.quantity,
            'price_snapshot_cents', NEW.unit_price,
            'subtotal_cents', NEW.total_price
        )
    );

    INSERT INTO public.event_store(
        stream_type, stream_id, stream_version, event_type, payload, meta, created_at
    ) VALUES (
        'ORDER',
        NEW.order_id,
        v_next_version,
        'ORDER_ITEM_ADDED',
        v_payload,
        jsonb_build_object('trigger', 'emit_order_item'),
        NOW()
    );

    RETURN NEW;
END;
$$;

-- 4. Apply Triggers
DROP TRIGGER IF EXISTS trg_emit_order_created ON public.gm_orders;
CREATE TRIGGER trg_emit_order_created
    AFTER INSERT ON public.gm_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.emit_order_created_trigger();

DROP TRIGGER IF EXISTS trg_emit_order_status ON public.gm_orders;
CREATE TRIGGER trg_emit_order_status
    AFTER UPDATE ON public.gm_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.emit_order_status_trigger();

DROP TRIGGER IF EXISTS trg_emit_order_item ON public.gm_order_items;
CREATE TRIGGER trg_emit_order_item
    AFTER INSERT ON public.gm_order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.emit_order_item_trigger();
;
-- Hardening P0-E: Locking & Race Conditions
-- Date: 2026-01-22
-- Purpose: Prevent race conditions where a concurrent 'Cancel' overwrites a 'Paid' status.
-- Mechanism: Explicitly increment 'version' during payment, causing optimistic lock failures in concurrent transactions.

CREATE OR REPLACE FUNCTION public.process_order_payment(
        p_restaurant_id UUID,
        p_order_id UUID,
        p_cash_register_id UUID,
        p_operator_id UUID,
        p_amount_cents INTEGER,
        p_method TEXT,
        p_idempotency_key TEXT
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
    v_order_status TEXT;
    v_order_total INTEGER;
    v_register_status TEXT;
    v_total_paid INTEGER := 0; -- Total já pago até agora
    v_new_total_paid INTEGER; -- Total após este pagamento
    v_payment_status TEXT; -- Status final do pagamento
    v_order_payment_status TEXT; -- Status final do pedido
    v_payment_id UUID;
BEGIN 
    -- 1. Validate Cash Register
    SELECT status INTO v_register_status
    FROM public.gm_cash_registers
    WHERE id = p_cash_register_id
        AND restaurant_id = p_restaurant_id;
    
    IF v_register_status IS NULL THEN 
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cash Register not found'
        );
    END IF;
    
    IF v_register_status != 'open' THEN 
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cash Register must be OPEN to process payments'
        );
    END IF;

    -- 2. Validate Order State (com FOR UPDATE para prevenir race conditions)
    SELECT status, total_cents INTO v_order_status, v_order_total
    FROM public.gm_orders
    WHERE id = p_order_id
        AND restaurant_id = p_restaurant_id
    FOR UPDATE; -- Lock pessimista: previne pagamento duplo simultâneo
    
    IF v_order_status IS NULL THEN 
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;
    
    -- FIX: Allow 'served' to be paid. Only block 'paid' or 'cancelled'.
    IF v_order_status IN ('paid', 'cancelled') THEN 
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Order is already final (' || v_order_status || ')'
        );
    END IF;

    -- 3. Calcular total já pago (soma de todos os pagamentos do pedido)
    SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_paid
    FROM public.gm_payments
    WHERE order_id = p_order_id
        AND status = 'paid';

    -- 4. Validar que o pagamento não excede o total do pedido
    v_new_total_paid := v_total_paid + p_amount_cents;
    
    IF v_new_total_paid > v_order_total THEN 
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Payment amount (' || p_amount_cents || ') exceeds remaining balance (' || (v_order_total - v_total_paid) || ')'
        );
    END IF;

    -- 5. Idempotency Check (via Unique Index)
    -- 6. Execute Payment (Atomic)
    INSERT INTO public.gm_payments (
            tenant_id,
            restaurant_id,
            order_id,
            cash_register_id,
            operator_id,
            amount_cents,
            currency,
            payment_method,
            status,
            idempotency_key,
            created_at
        )
    VALUES (
            p_restaurant_id,
            p_restaurant_id,
            p_order_id,
            p_cash_register_id,
            p_operator_id,
            p_amount_cents,
            'EUR',
            p_method,
            'paid',
            p_idempotency_key,
            NOW()
        )
    RETURNING id INTO v_payment_id;

    -- 7. Determinar status final do pedido baseado no total pago
    IF v_new_total_paid >= v_order_total THEN
        -- Pedido totalmente pago
        v_order_payment_status := 'paid';
        v_order_status := 'paid';
    ELSE
        -- Pedido parcialmente pago
        v_order_payment_status := 'partially_paid';
        v_order_status := 'OPEN'; -- Mantém status OPEN para permitir mais pagamentos
    END IF;

    -- 8. Update Order Status e Payment Status
    -- CRITICAL P0-E FIX: Explicitly increment version to invalidate concurrent Optimistic Locks
    UPDATE public.gm_orders
    SET 
        status = v_order_status,
        payment_status = v_order_payment_status,
        version = version + 1, -- FORCE VERSION BUMP
        updated_at = NOW()
    WHERE id = p_order_id;

    -- 9. Update Cash Register Balance
    UPDATE public.gm_cash_registers
    SET total_sales_cents = COALESCE(total_sales_cents, 0) + p_amount_cents,
        updated_at = NOW()
    WHERE id = p_cash_register_id;

    -- 10. Call Observability (Mig 022) - Best Effort
    PERFORM public.fn_log_payment_attempt(
        p_order_id,
        p_restaurant_id,
        p_operator_id,
        p_amount_cents,
        p_method,
        'success',
        NULL,
        NULL,
        p_idempotency_key,
        NULL,
        NULL,
        NULL
    );

    RETURN jsonb_build_object(
        'success', true, 
        'order_id', p_order_id,
        'payment_id', v_payment_id,
        'payment_status', v_order_payment_status,
        'total_paid', v_new_total_paid,
        'remaining', v_order_total - v_new_total_paid
    );

EXCEPTION
    WHEN unique_violation THEN 
        PERFORM public.fn_log_payment_attempt(
            p_order_id,
            p_restaurant_id,
            p_operator_id,
            p_amount_cents,
            p_method,
            'fail',
            'IDEMPOTENCY',
            'Duplicate Transaction',
            p_idempotency_key
        );
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Duplicate transaction (Idempotency Key used)'
        );
    WHEN OTHERS THEN 
        PERFORM public.fn_log_payment_attempt(
            p_order_id,
            p_restaurant_id,
            p_operator_id,
            p_amount_cents,
            p_method,
            'fail',
            'UNKNOWN',
            SQLERRM,
            p_idempotency_key
        );
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
;
