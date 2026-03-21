ALTER TABLE public.gm_payment_audit_logs ADD CONSTRAINT gm_payment_audit_logs_restaurant_id_fkey FOREIGN KEY (restaurant_id) REFERENCES gm_restaurants(id) ON DELETE CASCADE;
