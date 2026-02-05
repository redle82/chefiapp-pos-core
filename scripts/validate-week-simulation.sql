-- =============================================================================
-- Validação pós-simulação de 7 dias (só Core).
-- Uso: psql -U postgres -d chefiapp_core -v restaurant_id='00000000-0000-0000-0000-000000000100' -f scripts/validate-week-simulation.sql
-- Override: -v restaurant_id='<uuid>' -v expected_total_orders=350 -v expected_closed_shifts=7
-- =============================================================================

-- Defaults (override with -v restaurant_id='...' -v expected_total_orders=N -v expected_closed_shifts=N)
\if :{?restaurant_id}
\else
\set restaurant_id '00000000-0000-0000-0000-000000000100'
\endif
\if :{?expected_total_orders}
\else
\set expected_total_orders 350
\endif
\if :{?expected_closed_shifts}
\else
\set expected_closed_shifts 7
\endif

-- 1) Total de pedidos (restaurant_id; esperado = expected_days * expected_orders_per_day)
SELECT COUNT(*) AS total_orders
FROM public.gm_orders
WHERE restaurant_id = :'restaurant_id'::uuid;
-- Esperado: expected_total_orders (ex.: 350 para 7×50)

-- 2) Nenhum pedido fora de CLOSED/CANCELLED (restaurant_id)
SELECT COUNT(*) AS orders_not_closed_or_cancelled
FROM public.gm_orders
WHERE restaurant_id = :'restaurant_id'::uuid
  AND status NOT IN ('CLOSED', 'CANCELLED');
-- Esperado: 0

-- 3) Nenhum pedido CLOSED sem PAID/PARTIALLY_PAID (schema: PENDING, PAID, PARTIALLY_PAID, FAILED, REFUNDED)
SELECT COUNT(*) AS orders_unpaid
FROM public.gm_orders
WHERE restaurant_id = :'restaurant_id'::uuid
  AND status = 'CLOSED'
  AND payment_status NOT IN ('PAID', 'PARTIALLY_PAID');
-- Esperado: 0

-- 4) Número de turnos fechados no restaurante >= expected_days
SELECT COUNT(*) AS closed_shifts
FROM public.gm_cash_registers
WHERE restaurant_id = :'restaurant_id'::uuid
  AND status = 'closed';
-- Esperado: >= expected_closed_shifts (ex.: 7)

-- 5) Cada turno fechado tem closed_at, closing_balance_cents e closed_by not null
SELECT id, closed_at, closing_balance_cents, closed_by
FROM public.gm_cash_registers
WHERE restaurant_id = :'restaurant_id'::uuid
  AND status = 'closed'
  AND (closed_at IS NULL OR closing_balance_cents IS NULL OR closed_by IS NULL OR TRIM(closed_by) = '');
-- Esperado: 0 linhas

-- 6) Pagamentos: por cash_register_id, soma amount_cents = closing_balance_cents - opening_balance_cents (tolerância 0)
SELECT cr.id AS shift_id,
       cr.opening_balance_cents,
       cr.closing_balance_cents,
       COALESCE(SUM(p.amount_cents), 0) AS sum_payments,
       (cr.closing_balance_cents - cr.opening_balance_cents) AS expected_from_payments
FROM public.gm_cash_registers cr
LEFT JOIN public.gm_payments p ON p.cash_register_id = cr.id
WHERE cr.restaurant_id = :'restaurant_id'::uuid
  AND cr.status = 'closed'
GROUP BY cr.id, cr.opening_balance_cents, cr.closing_balance_cents
HAVING COALESCE(SUM(p.amount_cents), 0) != (cr.closing_balance_cents - cr.opening_balance_cents);
-- Esperado: 0 linhas

-- 7) Tarefas: contagem por estado (informação)
SELECT status, COUNT(*) AS cnt
FROM public.gm_tasks
WHERE restaurant_id = :'restaurant_id'::uuid
GROUP BY status
ORDER BY status;

-- 8) Totais por método de pagamento (por turno) — auditoria
SELECT cr.id AS shift_id, cr.closed_at,
       p.payment_method,
       SUM(p.amount_cents) AS total_cents
FROM public.gm_cash_registers cr
JOIN public.gm_payments p ON p.cash_register_id = cr.id
WHERE cr.restaurant_id = :'restaurant_id'::uuid
  AND cr.status = 'closed'
GROUP BY cr.id, cr.closed_at, p.payment_method
ORDER BY cr.closed_at, p.payment_method;
