-- Add 'locked' and 'closed' to order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'locked';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'closed';
