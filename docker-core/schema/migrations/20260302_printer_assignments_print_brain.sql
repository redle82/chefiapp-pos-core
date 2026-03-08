-- =============================================================================
-- Print Brain MVP — printer assignments by function (restaurant + station)
-- Date: 2026-03-02
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.gm_printer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    station_id UUID REFERENCES public.gm_terminals(id) ON DELETE CASCADE,
    station_scope_id UUID GENERATED ALWAYS AS (COALESCE(station_id, '00000000-0000-0000-0000-000000000000'::uuid)) STORED,
    print_function TEXT NOT NULL,
    transport TEXT NOT NULL,
    target TEXT NOT NULL,
    display_name TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT printer_assignments_function_check CHECK (print_function IN ('kitchen', 'receipt', 'labels')),
    CONSTRAINT printer_assignments_transport_check CHECK (transport IN ('spooler', 'tcp9100')),
    CONSTRAINT printer_assignments_target_check CHECK (BTRIM(target) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_printer_assignments_unique_scope
ON public.gm_printer_assignments (
    restaurant_id,
    station_scope_id,
    print_function
);

ALTER TABLE public.gm_printer_assignments
    ADD COLUMN IF NOT EXISTS station_scope_id UUID GENERATED ALWAYS AS (COALESCE(station_id, '00000000-0000-0000-0000-000000000000'::uuid)) STORED;

CREATE INDEX IF NOT EXISTS idx_printer_assignments_restaurant
ON public.gm_printer_assignments (restaurant_id, station_id, print_function)
WHERE is_enabled = TRUE;

CREATE OR REPLACE FUNCTION public.list_printer_assignments(
    p_restaurant_id UUID,
    p_station_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'restaurant_id', restaurant_id,
                'station_id', station_id,
                'print_function', print_function,
                'transport', transport,
                'target', target,
                'display_name', display_name,
                'is_enabled', is_enabled,
                'metadata', metadata,
                'updated_at', updated_at
            )
            ORDER BY updated_at DESC
        ),
        '[]'::jsonb
    )
    INTO v_result
    FROM public.gm_printer_assignments
    WHERE restaurant_id = p_restaurant_id
      AND (
        p_station_id IS NULL
        OR station_id = p_station_id
        OR station_id IS NULL
      );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_printer_assignments TO postgres;

CREATE OR REPLACE FUNCTION public.upsert_printer_assignment(
    p_restaurant_id UUID,
    p_station_id UUID,
    p_print_function TEXT,
    p_transport TEXT,
    p_target TEXT,
    p_display_name TEXT DEFAULT NULL,
    p_is_enabled BOOLEAN DEFAULT TRUE,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assignment_id UUID;
BEGIN
    IF p_print_function NOT IN ('kitchen', 'receipt', 'labels') THEN
        RAISE EXCEPTION 'INVALID_PRINT_FUNCTION: %', p_print_function;
    END IF;

    IF p_transport NOT IN ('spooler', 'tcp9100') THEN
        RAISE EXCEPTION 'INVALID_PRINTER_TRANSPORT: %', p_transport;
    END IF;

    IF BTRIM(COALESCE(p_target, '')) = '' THEN
        RAISE EXCEPTION 'INVALID_PRINTER_TARGET';
    END IF;

    INSERT INTO public.gm_printer_assignments (
        restaurant_id,
        station_id,
        print_function,
        transport,
        target,
        display_name,
        is_enabled,
        metadata,
        updated_at
    )
    VALUES (
        p_restaurant_id,
        p_station_id,
        p_print_function,
        p_transport,
        p_target,
        p_display_name,
        p_is_enabled,
        COALESCE(p_metadata, '{}'::jsonb),
        NOW()
    )
    ON CONFLICT (
        restaurant_id,
        station_scope_id,
        print_function
    )
    DO UPDATE SET
        transport = EXCLUDED.transport,
        target = EXCLUDED.target,
        display_name = EXCLUDED.display_name,
        is_enabled = EXCLUDED.is_enabled,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING id INTO v_assignment_id;

    RETURN jsonb_build_object('id', v_assignment_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_printer_assignment TO postgres;

CREATE OR REPLACE FUNCTION public.resolve_printer_assignment(
    p_restaurant_id UUID,
    p_print_function TEXT,
    p_station_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_assignment RECORD;
BEGIN
    IF p_print_function NOT IN ('kitchen', 'receipt', 'labels') THEN
        RAISE EXCEPTION 'INVALID_PRINT_FUNCTION: %', p_print_function;
    END IF;

    SELECT id, restaurant_id, station_id, print_function, transport, target, display_name, metadata, updated_at
    INTO v_assignment
    FROM public.gm_printer_assignments
    WHERE restaurant_id = p_restaurant_id
      AND print_function = p_print_function
      AND is_enabled = TRUE
      AND (
        (p_station_id IS NOT NULL AND station_id = p_station_id)
        OR station_id IS NULL
      )
    ORDER BY CASE WHEN station_id = p_station_id THEN 0 ELSE 1 END, updated_at DESC
    LIMIT 1;

    IF v_assignment.id IS NULL THEN
        RETURN jsonb_build_object(
            'found', false,
            'print_function', p_print_function
        );
    END IF;

    RETURN jsonb_build_object(
        'found', true,
        'assignment', jsonb_build_object(
            'id', v_assignment.id,
            'restaurant_id', v_assignment.restaurant_id,
            'station_id', v_assignment.station_id,
            'print_function', v_assignment.print_function,
            'transport', v_assignment.transport,
            'target', v_assignment.target,
            'display_name', v_assignment.display_name,
            'metadata', v_assignment.metadata,
            'updated_at', v_assignment.updated_at
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_printer_assignment TO postgres;

COMMIT;
