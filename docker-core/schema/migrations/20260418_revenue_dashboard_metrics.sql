-- =============================================================================
-- Migration: Revenue Dashboard Metrics RPC
-- Date: 2026-04-18
-- Purpose:
--   1) Add enterprise revenue dashboard metrics RPC
--   2) Compute MRR/ARR/churn/growth/ARPU/LTV/NRR from org invoices + org status
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_enterprise_revenue_metrics(
  p_reference_month TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reference_month DATE;
  v_current_month_start DATE;
  v_current_month_end DATE;
  v_previous_month_start DATE;
  v_previous_month_end DATE;
  v_yoy_month_start DATE;
  v_yoy_month_end DATE;

  v_active_orgs INTEGER := 0;
  v_grace_orgs INTEGER := 0;
  v_suspended_orgs INTEGER := 0;

  v_mrr_cents BIGINT := 0;
  v_previous_mrr_cents BIGINT := 0;
  v_yoy_arr_cents BIGINT := 0;

  v_arr_cents BIGINT := 0;
  v_arpu_cents BIGINT := 0;
  v_ltv_cents BIGINT := 0;

  v_churn_rate_pct NUMERIC(12,2) := 0;
  v_mrr_growth_mom_pct NUMERIC(12,2) := 0;
  v_arr_growth_yoy_pct NUMERIC(12,2) := 0;
  v_net_revenue_retention_pct NUMERIC(12,2) := 100;

  v_revenue_by_country JSONB := '[]'::JSONB;
BEGIN
  BEGIN
    v_reference_month := to_date(p_reference_month || '-01', 'YYYY-MM-DD');
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'INVALID_REFERENCE_MONTH'
      USING DETAIL = json_build_object(
        'code', 'INVALID_REFERENCE_MONTH',
        'message', 'Expected format YYYY-MM',
        'reference_month', p_reference_month
      )::TEXT;
  END;

  v_current_month_start := date_trunc('month', v_reference_month)::DATE;
  v_current_month_end := (v_current_month_start + INTERVAL '1 month - 1 day')::DATE;

  v_previous_month_start := (v_current_month_start - INTERVAL '1 month')::DATE;
  v_previous_month_end := (v_current_month_start - INTERVAL '1 day')::DATE;

  v_yoy_month_start := (v_current_month_start - INTERVAL '12 month')::DATE;
  v_yoy_month_end := (v_current_month_end - INTERVAL '12 month')::DATE;

  SELECT
    COUNT(*) FILTER (WHERE enterprise_status = 'active')::INT,
    COUNT(*) FILTER (WHERE enterprise_status = 'grace')::INT,
    COUNT(*) FILTER (WHERE enterprise_status = 'suspended')::INT
  INTO
    v_active_orgs,
    v_grace_orgs,
    v_suspended_orgs
  FROM public.gm_organizations;

  WITH org_scope AS (
    SELECT
      o.id,
      o.country,
      o.enterprise_status,
      COALESCE(o.metadata, '{}'::jsonb) AS metadata
    FROM public.gm_organizations o
  ),
  latest_invoice_current AS (
    SELECT DISTINCT ON (i.organization_id)
      i.organization_id,
      i.total_revenue_cents,
      i.payment_status,
      i.created_at
    FROM public.gm_org_invoices i
    WHERE i.created_at >= v_current_month_start::timestamp
      AND i.created_at < (v_current_month_end + 1)::timestamp
    ORDER BY i.organization_id, i.created_at DESC
  ),
  normalized_current AS (
    SELECT
      s.id AS organization_id,
      COALESCE(NULLIF(TRIM(s.country), ''), 'unknown') AS country,
      s.enterprise_status,
      CASE
        WHEN (s.metadata ->> 'billing_cycle') IN ('annual', 'yearly')
          OR (s.metadata ->> 'billing_interval') IN ('annual', 'yearly')
          OR (s.metadata ->> 'plan_interval') IN ('annual', 'yearly')
          OR (s.metadata ->> 'interval') IN ('annual', 'yearly')
          THEN ROUND(COALESCE(li.total_revenue_cents, 0)::numeric / 12)::BIGINT
        ELSE COALESCE(li.total_revenue_cents, 0)
      END AS mrr_equivalent_cents,
      COALESCE(li.payment_status, 'pending') AS payment_status
    FROM org_scope s
    LEFT JOIN latest_invoice_current li
      ON li.organization_id = s.id
  )
  SELECT
    COALESCE(
      SUM(
        CASE
          WHEN enterprise_status = 'suspended' THEN 0
          ELSE mrr_equivalent_cents
        END
      ),
      0
    )::BIGINT,
    COALESCE(
      jsonb_agg(
        jsonb_build_object('country', country, 'mrr', country_mrr)
        ORDER BY country
      ) FILTER (WHERE country IS NOT NULL),
      '[]'::jsonb
    )
  INTO v_mrr_cents, v_revenue_by_country
  FROM (
    SELECT
      country,
      SUM(
        CASE
          WHEN enterprise_status = 'suspended' THEN 0
          ELSE mrr_equivalent_cents
        END
      )::BIGINT AS country_mrr
    FROM normalized_current
    GROUP BY country
  ) country_rollup;

  WITH org_scope AS (
    SELECT
      o.id,
      o.enterprise_status,
      COALESCE(o.metadata, '{}'::jsonb) AS metadata
    FROM public.gm_organizations o
  ),
  latest_invoice_previous AS (
    SELECT DISTINCT ON (i.organization_id)
      i.organization_id,
      i.total_revenue_cents,
      i.created_at
    FROM public.gm_org_invoices i
    WHERE i.created_at >= v_previous_month_start::timestamp
      AND i.created_at < (v_previous_month_end + 1)::timestamp
    ORDER BY i.organization_id, i.created_at DESC
  )
  SELECT
    COALESCE(
      SUM(
        CASE
          WHEN s.enterprise_status = 'suspended' THEN 0
          WHEN (s.metadata ->> 'billing_cycle') IN ('annual', 'yearly')
            OR (s.metadata ->> 'billing_interval') IN ('annual', 'yearly')
            OR (s.metadata ->> 'plan_interval') IN ('annual', 'yearly')
            OR (s.metadata ->> 'interval') IN ('annual', 'yearly')
            THEN ROUND(COALESCE(li.total_revenue_cents, 0)::numeric / 12)::BIGINT
          ELSE COALESCE(li.total_revenue_cents, 0)
        END
      ),
      0
    )::BIGINT
  INTO v_previous_mrr_cents
  FROM org_scope s
  LEFT JOIN latest_invoice_previous li
    ON li.organization_id = s.id;

  WITH org_scope AS (
    SELECT
      o.id,
      o.enterprise_status,
      COALESCE(o.metadata, '{}'::jsonb) AS metadata
    FROM public.gm_organizations o
  ),
  latest_invoice_yoy AS (
    SELECT DISTINCT ON (i.organization_id)
      i.organization_id,
      i.total_revenue_cents,
      i.created_at
    FROM public.gm_org_invoices i
    WHERE i.created_at >= v_yoy_month_start::timestamp
      AND i.created_at < (v_yoy_month_end + 1)::timestamp
    ORDER BY i.organization_id, i.created_at DESC
  )
  SELECT
    COALESCE(
      SUM(
        CASE
          WHEN s.enterprise_status = 'suspended' THEN 0
          WHEN (s.metadata ->> 'billing_cycle') IN ('annual', 'yearly')
            OR (s.metadata ->> 'billing_interval') IN ('annual', 'yearly')
            OR (s.metadata ->> 'plan_interval') IN ('annual', 'yearly')
            OR (s.metadata ->> 'interval') IN ('annual', 'yearly')
            THEN ROUND(COALESCE(li.total_revenue_cents, 0)::numeric / 12)::BIGINT
          ELSE COALESCE(li.total_revenue_cents, 0)
        END
      ),
      0
    )::BIGINT * 12
  INTO v_yoy_arr_cents
  FROM org_scope s
  LEFT JOIN latest_invoice_yoy li
    ON li.organization_id = s.id;

  v_arr_cents := v_mrr_cents * 12;

  IF v_previous_mrr_cents > 0 THEN
    v_mrr_growth_mom_pct := ROUND(((v_mrr_cents - v_previous_mrr_cents)::numeric / v_previous_mrr_cents::numeric) * 100, 2);
  ELSIF v_mrr_cents > 0 THEN
    v_mrr_growth_mom_pct := 100;
  ELSE
    v_mrr_growth_mom_pct := 0;
  END IF;

  IF v_yoy_arr_cents > 0 THEN
    v_arr_growth_yoy_pct := ROUND(((v_arr_cents - v_yoy_arr_cents)::numeric / v_yoy_arr_cents::numeric) * 100, 2);
  ELSIF v_arr_cents > 0 THEN
    v_arr_growth_yoy_pct := 100;
  ELSE
    v_arr_growth_yoy_pct := 0;
  END IF;

  IF (v_active_orgs + v_grace_orgs) > 0 THEN
    v_arpu_cents := ROUND(v_mrr_cents::numeric / (v_active_orgs + v_grace_orgs))::BIGINT;
  ELSE
    v_arpu_cents := 0;
  END IF;

  v_churn_rate_pct := CASE
    WHEN (v_active_orgs + v_grace_orgs + v_suspended_orgs) = 0 THEN 0
    ELSE ROUND((v_suspended_orgs::numeric / (v_active_orgs + v_grace_orgs + v_suspended_orgs)::numeric) * 100, 2)
  END;

  IF v_churn_rate_pct >= 100 THEN
    v_ltv_cents := 0;
  ELSIF v_arpu_cents <= 0 THEN
    v_ltv_cents := 0;
  ELSE
    v_ltv_cents := ROUND(v_arpu_cents::numeric / (NULLIF(v_churn_rate_pct, 0) / 100.0))::BIGINT;
  END IF;

  IF v_previous_mrr_cents <= 0 THEN
    v_net_revenue_retention_pct := CASE WHEN v_mrr_cents > 0 THEN 100 ELSE 0 END;
  ELSE
    v_net_revenue_retention_pct := ROUND((v_mrr_cents::numeric / v_previous_mrr_cents::numeric) * 100, 2);
  END IF;

  RETURN jsonb_build_object(
    'mrr_cents', v_mrr_cents,
    'arr_cents', v_arr_cents,
    'churn_rate_pct', v_churn_rate_pct,
    'active_orgs', v_active_orgs,
    'grace_orgs', v_grace_orgs,
    'suspended_orgs', v_suspended_orgs,
    'revenue_by_country', v_revenue_by_country,
    'mrr_growth_mom_pct', v_mrr_growth_mom_pct,
    'arr_growth_yoy_pct', v_arr_growth_yoy_pct,
    'arpu_cents', v_arpu_cents,
    'ltv_cents', v_ltv_cents,
    'net_revenue_retention_pct', v_net_revenue_retention_pct
  );
END;
$$;

COMMENT ON FUNCTION public.get_enterprise_revenue_metrics(TEXT) IS
'Revenue dashboard RPC (enterprise): MRR, ARR, churn, org status counts, country breakdown, MoM/YoY growth, ARPU, LTV, NRR.';

GRANT EXECUTE ON FUNCTION public.get_enterprise_revenue_metrics(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_enterprise_revenue_metrics(TEXT) TO authenticated;
