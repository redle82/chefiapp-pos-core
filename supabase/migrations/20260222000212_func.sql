CREATE TRIGGER update_gm_catalog_menus_updated_at BEFORE UPDATE ON gm_catalog_menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
