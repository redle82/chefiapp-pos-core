/**
 * Install TPV Module - RPCs para Instalação do Módulo TPV
 */

-- RPC: Instalar módulo TPV
CREATE OR REPLACE FUNCTION install_tpv_module(
  p_restaurant_id UUID,
  p_config JSONB DEFAULT '{}'::JSONB
) RETURNS UUID AS $$
DECLARE
  v_module_id UUID;
  v_operator_id UUID;
  v_cash_register_id UUID;
  v_owner_id UUID;
BEGIN
  -- 1. Verificar se restaurante existe
  IF NOT EXISTS (SELECT 1 FROM restaurant WHERE id = p_restaurant_id) THEN
    RAISE EXCEPTION 'Restaurant not found: %', p_restaurant_id;
  END IF;
  
  -- 2. Verificar se já está instalado
  IF EXISTS (SELECT 1 FROM installed_modules WHERE restaurant_id = p_restaurant_id AND module_id = 'tpv') THEN
    RAISE EXCEPTION 'TPV module already installed for restaurant: %', p_restaurant_id;
  END IF;
  
  -- 3. Registrar módulo
  INSERT INTO installed_modules (
    restaurant_id, module_id, module_name, version, status, config
  ) VALUES (
    p_restaurant_id, 'tpv', 'TPV (Point of Sale)', '1.0.0', 'active', p_config
  ) RETURNING id INTO v_module_id;
  
  -- 4. Criar operador padrão (se não existir)
  SELECT id INTO v_operator_id FROM employees 
  WHERE restaurant_id = p_restaurant_id AND role = 'cashier' 
  LIMIT 1;
  
  IF v_operator_id IS NULL THEN
    INSERT INTO employees (restaurant_id, name, role, status)
    VALUES (p_restaurant_id, 'Operador Padrão', 'cashier', 'active')
    RETURNING id INTO v_operator_id;
  END IF;
  
  -- 5. Criar caixa padrão (se tabela existir)
  -- Verificar se tabela cash_registers existe antes de inserir
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_registers') THEN
    INSERT INTO cash_registers (restaurant_id, name, status)
    VALUES (p_restaurant_id, 'Caixa 1', 'active')
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_cash_register_id;
  END IF;
  
  -- 6. Criar permissões padrão
  INSERT INTO module_permissions (restaurant_id, module_id, role, permissions)
  VALUES 
    (p_restaurant_id, 'tpv', 'owner', ARRAY['all']),
    (p_restaurant_id, 'tpv', 'manager', ARRAY['read', 'write', 'close']),
    (p_restaurant_id, 'tpv', 'cashier', ARRAY['read', 'write'])
  ON CONFLICT (restaurant_id, module_id, role) DO NOTHING;
  
  RETURN v_module_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Desinstalar módulo TPV
CREATE OR REPLACE FUNCTION uninstall_tpv_module(
  p_restaurant_id UUID
) RETURNS VOID AS $$
BEGIN
  -- 1. Verificar se está instalado
  IF NOT EXISTS (SELECT 1 FROM installed_modules WHERE restaurant_id = p_restaurant_id AND module_id = 'tpv') THEN
    RAISE EXCEPTION 'TPV module not installed for restaurant: %', p_restaurant_id;
  END IF;
  
  -- 2. Remover permissões
  DELETE FROM module_permissions WHERE restaurant_id = p_restaurant_id AND module_id = 'tpv';
  
  -- 3. Marcar módulo como inativo (não deletar, manter histórico)
  UPDATE installed_modules
  SET status = 'inactive', updated_at = NOW()
  WHERE restaurant_id = p_restaurant_id AND module_id = 'tpv';
END;
$$ LANGUAGE plpgsql;

-- RPC: Verificar saúde do módulo TPV
CREATE OR REPLACE FUNCTION check_tpv_module_health(
  p_restaurant_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_module_status VARCHAR;
  v_has_operators BOOLEAN;
  v_has_cash_registers BOOLEAN;
BEGIN
  -- Verificar status do módulo
  SELECT status INTO v_module_status
  FROM installed_modules
  WHERE restaurant_id = p_restaurant_id AND module_id = 'tpv';
  
  IF v_module_status IS NULL THEN
    RETURN jsonb_build_object(
      'installed', false,
      'status', 'not_installed'
    );
  END IF;
  
  -- Verificar dependências
  SELECT 
    EXISTS(SELECT 1 FROM employees WHERE restaurant_id = p_restaurant_id AND role = 'cashier'),
    EXISTS(SELECT 1 FROM cash_registers WHERE restaurant_id = p_restaurant_id)
  INTO v_has_operators, v_has_cash_registers;
  
  -- Construir resultado
  v_result := jsonb_build_object(
    'installed', true,
    'status', v_module_status,
    'health', CASE 
      WHEN v_module_status = 'active' AND v_has_operators AND v_has_cash_registers THEN 'healthy'
      WHEN v_module_status = 'active' THEN 'degraded'
      ELSE 'unhealthy'
    END,
    'checks', jsonb_build_object(
      'operators', v_has_operators,
      'cash_registers', v_has_cash_registers
    )
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
