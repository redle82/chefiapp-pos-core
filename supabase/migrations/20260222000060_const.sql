ALTER TABLE public.gm_payments ADD CONSTRAINT gm_payments_cash_register_id_fkey FOREIGN KEY (cash_register_id) REFERENCES gm_cash_registers(id);
