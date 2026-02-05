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
