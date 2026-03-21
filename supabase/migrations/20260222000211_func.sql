CREATE TRIGGER update_gm_catalog_items_updated_at BEFORE UPDATE ON gm_catalog_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
