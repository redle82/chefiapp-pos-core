/**
 * Modules Registry - Registry de Módulos Instalados
 * 
 * Sistema de instalação e gerenciamento de módulos
 */

-- Tabela de módulos instalados
CREATE TABLE IF NOT EXISTS installed_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES gm_restaurants(id) ON DELETE CASCADE,
  module_id VARCHAR NOT NULL,
  module_name VARCHAR NOT NULL,
  version VARCHAR DEFAULT '1.0.0',
  installed_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  config JSONB DEFAULT '{}'::JSONB,
  dependencies TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::JSONB,
  UNIQUE(restaurant_id, module_id)
);

CREATE INDEX idx_installed_modules_restaurant ON installed_modules(restaurant_id);
CREATE INDEX idx_installed_modules_status ON installed_modules(status);
CREATE INDEX idx_installed_modules_module_id ON installed_modules(module_id);

-- Tabela de permissões de módulos
CREATE TABLE IF NOT EXISTS module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES gm_restaurants(id) ON DELETE CASCADE,
  module_id VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  permissions TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(restaurant_id, module_id, role)
);

CREATE INDEX idx_module_permissions_restaurant ON module_permissions(restaurant_id);
CREATE INDEX idx_module_permissions_module ON module_permissions(module_id);

-- Trigger: Atualizar updated_at
CREATE TRIGGER update_installed_modules_updated_at
  BEFORE UPDATE ON installed_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
