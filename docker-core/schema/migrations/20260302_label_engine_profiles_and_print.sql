-- =============================================================================
-- Label Engine MVP — print contract + label profile persistence
-- Date: 2026-03-02
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Expand print type contract to include 'label'
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'print_jobs_type_check'
          AND conrelid = 'public.gm_print_jobs'::regclass
    ) THEN
        ALTER TABLE public.gm_print_jobs
        DROP CONSTRAINT print_jobs_type_check;
    END IF;

    ALTER TABLE public.gm_print_jobs
    ADD CONSTRAINT print_jobs_type_check CHECK (type IN ('kitchen_ticket', 'receipt', 'z_report', 'label'));
END;
$$;

CREATE OR REPLACE FUNCTION public.request_print(
    p_restaurant_id UUID,
    p_type TEXT,
    p_order_id UUID DEFAULT NULL,
    p_payload JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_job_id UUID;
    v_status TEXT := 'pending';
BEGIN
    IF p_type NOT IN ('kitchen_ticket', 'receipt', 'z_report', 'label') THEN
        RAISE EXCEPTION 'INVALID_TYPE: Tipo de impressão inválido: %', p_type;
    END IF;

    INSERT INTO public.gm_print_jobs (restaurant_id, type, order_id, payload, status, updated_at)
    VALUES (p_restaurant_id, p_type, p_order_id, p_payload, v_status, NOW())
    RETURNING id, status INTO v_job_id, v_status;

    IF p_type = 'kitchen_ticket' THEN
        UPDATE public.gm_print_jobs
        SET status = 'sent', updated_at = NOW()
        WHERE id = v_job_id;
        v_status := 'sent';
    END IF;

    RETURN jsonb_build_object(
        'job_id', v_job_id,
        'status', v_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_print TO postgres;

-- -----------------------------------------------------------------------------
-- 2) Label profiles table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gm_label_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.gm_restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    printer_target TEXT NOT NULL,
    size_w_mm INTEGER NOT NULL CHECK (size_w_mm > 0),
    size_h_mm INTEGER NOT NULL CHECK (size_h_mm > 0),
    template_id TEXT NOT NULL,
    language_primary TEXT NOT NULL,
    language_secondary TEXT,
    barcode_type TEXT NOT NULL CHECK (barcode_type IN ('none', 'ean13', 'code128')),
    qr_type TEXT NOT NULL CHECK (qr_type IN ('none', 'batch', 'url')),
    default_scope TEXT NOT NULL CHECK (default_scope IN ('product', 'operator', 'tenant')),
    product_id TEXT,
    operator_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_label_profiles_restaurant_updated
ON public.gm_label_profiles(restaurant_id, updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_label_profiles_unique_scope
ON public.gm_label_profiles(
    restaurant_id,
    default_scope,
    COALESCE(product_id, ''),
    COALESCE(operator_id, ''),
    name
);

-- -----------------------------------------------------------------------------
-- 3) RPCs: list_label_profiles, upsert_label_profile
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_label_profiles(p_restaurant_id UUID)
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
                'name', name,
                'printer_target', printer_target,
                'size_w_mm', size_w_mm,
                'size_h_mm', size_h_mm,
                'template_id', template_id,
                'language_primary', language_primary,
                'language_secondary', language_secondary,
                'barcode_type', barcode_type,
                'qr_type', qr_type,
                'default_scope', default_scope,
                'product_id', product_id,
                'operator_id', operator_id,
                'updated_at', updated_at
            )
            ORDER BY updated_at DESC
        ),
        '[]'::jsonb
    )
    INTO v_result
    FROM public.gm_label_profiles
    WHERE restaurant_id = p_restaurant_id;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_label_profiles TO postgres;

CREATE OR REPLACE FUNCTION public.upsert_label_profile(
    p_restaurant_id UUID,
    p_profile JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile_id UUID;
    v_name TEXT := COALESCE(NULLIF(BTRIM(p_profile->>'name'), ''), 'Default');
    v_printer_target TEXT := COALESCE(
        NULLIF(BTRIM(p_profile->>'printerTarget'), ''),
        NULLIF(BTRIM(p_profile->>'printer_target'), ''),
        'MUNBYN_LABEL_1'
    );
    v_size_w INTEGER := COALESCE(
        NULLIF(p_profile#>>'{size,widthMm}', '')::INTEGER,
        NULLIF(p_profile->>'size_w_mm', '')::INTEGER,
        60
    );
    v_size_h INTEGER := COALESCE(
        NULLIF(p_profile#>>'{size,heightMm}', '')::INTEGER,
        NULLIF(p_profile->>'size_h_mm', '')::INTEGER,
        40
    );
    v_template_id TEXT := COALESCE(
        NULLIF(BTRIM(p_profile->>'templateId'), ''),
        NULLIF(BTRIM(p_profile->>'template_id'), ''),
        'short-60x40'
    );
    v_lang_primary TEXT := COALESCE(
        NULLIF(BTRIM(p_profile->>'languagePrimary'), ''),
        NULLIF(BTRIM(p_profile->>'language_primary'), ''),
        'es'
    );
    v_lang_secondary TEXT := COALESCE(
        NULLIF(BTRIM(p_profile->>'languageSecondary'), ''),
        NULLIF(BTRIM(p_profile->>'language_secondary'), '')
    );
    v_barcode_type TEXT := COALESCE(
        NULLIF(BTRIM(p_profile->>'barcode'), ''),
        NULLIF(BTRIM(p_profile->>'barcode_type'), ''),
        'none'
    );
    v_qr_type TEXT := COALESCE(
        NULLIF(BTRIM(p_profile->>'qr'), ''),
        NULLIF(BTRIM(p_profile->>'qr_type'), ''),
        'none'
    );
    v_default_scope TEXT := COALESCE(
        NULLIF(BTRIM(p_profile->>'defaultScope'), ''),
        NULLIF(BTRIM(p_profile->>'default_scope'), ''),
        'tenant'
    );
    v_product_id TEXT := COALESCE(
        NULLIF(BTRIM(p_profile->>'productId'), ''),
        NULLIF(BTRIM(p_profile->>'product_id'), '')
    );
    v_operator_id TEXT := COALESCE(
        NULLIF(BTRIM(p_profile->>'operatorId'), ''),
        NULLIF(BTRIM(p_profile->>'operator_id'), '')
    );
BEGIN
    IF v_barcode_type NOT IN ('none', 'ean13', 'code128') THEN
        RAISE EXCEPTION 'INVALID_BARCODE_TYPE: %', v_barcode_type;
    END IF;

    IF v_qr_type NOT IN ('none', 'batch', 'url') THEN
        RAISE EXCEPTION 'INVALID_QR_TYPE: %', v_qr_type;
    END IF;

    IF v_default_scope NOT IN ('product', 'operator', 'tenant') THEN
        RAISE EXCEPTION 'INVALID_DEFAULT_SCOPE: %', v_default_scope;
    END IF;

    IF v_size_w <= 0 OR v_size_h <= 0 THEN
        RAISE EXCEPTION 'INVALID_LABEL_SIZE: %x%', v_size_w, v_size_h;
    END IF;

    INSERT INTO public.gm_label_profiles (
        restaurant_id,
        name,
        printer_target,
        size_w_mm,
        size_h_mm,
        template_id,
        language_primary,
        language_secondary,
        barcode_type,
        qr_type,
        default_scope,
        product_id,
        operator_id,
        updated_at
    )
    VALUES (
        p_restaurant_id,
        v_name,
        v_printer_target,
        v_size_w,
        v_size_h,
        v_template_id,
        v_lang_primary,
        v_lang_secondary,
        v_barcode_type,
        v_qr_type,
        v_default_scope,
        v_product_id,
        v_operator_id,
        NOW()
    )
    ON CONFLICT (
        restaurant_id,
        default_scope,
        COALESCE(product_id, ''),
        COALESCE(operator_id, ''),
        name
    )
    DO UPDATE SET
        printer_target = EXCLUDED.printer_target,
        size_w_mm = EXCLUDED.size_w_mm,
        size_h_mm = EXCLUDED.size_h_mm,
        template_id = EXCLUDED.template_id,
        language_primary = EXCLUDED.language_primary,
        language_secondary = EXCLUDED.language_secondary,
        barcode_type = EXCLUDED.barcode_type,
        qr_type = EXCLUDED.qr_type,
        updated_at = NOW()
    RETURNING id INTO v_profile_id;

    RETURN jsonb_build_object('id', v_profile_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_label_profile TO postgres;

-- -----------------------------------------------------------------------------
-- 4) RPC: set_print_job_status (agent ack)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_print_job_status(
    p_job_id UUID,
    p_status TEXT,
    p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    IF p_status NOT IN ('sent', 'failed') THEN
        RAISE EXCEPTION 'INVALID_STATUS: %', p_status;
    END IF;

    UPDATE public.gm_print_jobs
    SET status = p_status,
        error_message = CASE WHEN p_status = 'failed' THEN p_error_message ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_job_id;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 0 THEN
        RAISE EXCEPTION 'PRINT_JOB_NOT_FOUND: %', p_job_id;
    END IF;

    RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_print_job_status TO postgres;

COMMIT;
