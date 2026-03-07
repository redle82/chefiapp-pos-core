ALTER TABLE public.shift_logs ADD CONSTRAINT shift_logs_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES gm_staff(id) ON DELETE CASCADE;
