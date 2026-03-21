CREATE UNIQUE INDEX IF NOT EXISTS gm_tables_restaurant_id_number_key ON public.gm_tables USING btree (restaurant_id, number);
