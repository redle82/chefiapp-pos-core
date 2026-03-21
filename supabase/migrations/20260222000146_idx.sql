CREATE INDEX IF NOT EXISTS idx_gm_restaurant_members_user ON public.gm_restaurant_members USING btree (user_id);
