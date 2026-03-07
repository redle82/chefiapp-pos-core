CREATE INDEX IF NOT EXISTS idx_shift_logs_employee ON public.shift_logs USING btree (employee_id);
