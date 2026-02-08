/**
 * Reservations System - Sistema Completo de Reservas
 * 
 * Inclui:
 * - Reservas online e internas
 * - Overbooking controlado
 * - No-show tracking
 * - Impacto no TPV e cozinha
 * - Correlação reserva ↔ staff ↔ estoque
 */

-- Reservas
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Cliente
  customer_name VARCHAR NOT NULL,
  customer_phone VARCHAR,
  customer_email VARCHAR,
  customer_notes TEXT,
  
  -- Reserva
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL, -- Mesa atribuída (opcional)
  
  -- Status
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
  confirmed_at TIMESTAMP,
  seated_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancelled_reason TEXT,
  
  -- Origem
  source VARCHAR DEFAULT 'internal' CHECK (source IN ('online', 'internal', 'phone', 'walk_in')),
  
  -- Overbooking
  is_overbooking BOOLEAN DEFAULT false,
  overbooking_reason TEXT,
  
  -- Relacionamentos
  related_order_id UUID, -- Pedido gerado a partir da reserva
  assigned_staff_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reservations_restaurant ON reservations(restaurant_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_date_status ON reservations(restaurant_id, reservation_date, status);
CREATE INDEX idx_reservations_table ON reservations(table_id) WHERE table_id IS NOT NULL;

-- Histórico de no-shows
CREATE TABLE IF NOT EXISTS no_show_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Dados do no-show
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL,
  customer_name VARCHAR NOT NULL,
  customer_phone VARCHAR,
  
  -- Impacto
  estimated_revenue_loss DECIMAL(10,2) DEFAULT 0,
  table_wasted_time_minutes INTEGER DEFAULT 0,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_no_show_history_restaurant ON no_show_history(restaurant_id);
CREATE INDEX idx_no_show_history_date ON no_show_history(reservation_date);

-- Configuração de overbooking
CREATE TABLE IF NOT EXISTS overbooking_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL UNIQUE REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Configurações
  enabled BOOLEAN DEFAULT false,
  max_overbooking_percentage DECIMAL(5,2) DEFAULT 10.0, -- % máximo de overbooking
  overbooking_window_hours INTEGER DEFAULT 2, -- Janela de tempo para considerar overbooking
  
  -- Regras
  allow_overbooking_on_weekends BOOLEAN DEFAULT true,
  allow_overbooking_on_holidays BOOLEAN DEFAULT false,
  min_party_size_for_overbooking INTEGER DEFAULT 4, -- Tamanho mínimo de grupo para permitir overbooking
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_overbooking_config_restaurant ON overbooking_config(restaurant_id);

-- Correlação reserva ↔ estoque
CREATE TABLE IF NOT EXISTS reservation_inventory_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Impacto estimado
  estimated_consumption JSONB DEFAULT '{}'::JSONB, -- {ingredient_id: quantity}
  forecasted_dishes JSONB DEFAULT '[]'::JSONB, -- [{dish_id, quantity}]
  
  -- Status
  impact_calculated BOOLEAN DEFAULT false,
  calculated_at TIMESTAMP,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reservation_inventory_impact_reservation ON reservation_inventory_impact(reservation_id);
CREATE INDEX idx_reservation_inventory_impact_restaurant ON reservation_inventory_impact(restaurant_id);

-- RPC: Criar reserva
CREATE OR REPLACE FUNCTION create_reservation(
  p_restaurant_id UUID,
  p_customer_name VARCHAR,
  p_reservation_date DATE,
  p_reservation_time TIME,
  p_party_size INTEGER,
  p_customer_phone VARCHAR DEFAULT NULL,
  p_customer_email VARCHAR DEFAULT NULL,
  p_customer_notes TEXT DEFAULT NULL,
  p_source VARCHAR DEFAULT 'internal',
  p_table_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_reservation_id UUID;
  v_is_overbooking BOOLEAN := false;
  v_overbooking_reason TEXT;
  v_existing_count INTEGER;
  v_capacity INTEGER;
  v_overbooking_config RECORD;
BEGIN
  -- Verificar configuração de overbooking
  SELECT * INTO v_overbooking_config
  FROM overbooking_config
  WHERE restaurant_id = p_restaurant_id;
  
  -- Contar reservas existentes no mesmo horário
  SELECT COUNT(*) INTO v_existing_count
  FROM reservations
  WHERE restaurant_id = p_restaurant_id
    AND reservation_date = p_reservation_date
    AND reservation_time = p_reservation_time
    AND status IN ('pending', 'confirmed', 'seated');
  
  -- Calcular capacidade (simplificado - pode ser melhorado)
  SELECT COALESCE(SUM(capacity), 0) INTO v_capacity
  FROM tables
  WHERE restaurant_id = p_restaurant_id;
  
  -- Verificar se é overbooking
  IF v_overbooking_config.enabled AND v_existing_count > 0 THEN
    IF (v_existing_count * 100.0 / GREATEST(v_capacity, 1)) > v_overbooking_config.max_overbooking_percentage THEN
      v_is_overbooking := true;
      v_overbooking_reason := format('Overbooking: %s%% acima da capacidade', 
        ((v_existing_count * 100.0 / GREATEST(v_capacity, 1)) - v_overbooking_config.max_overbooking_percentage)::INTEGER);
    END IF;
  END IF;
  
  -- Criar reserva
  INSERT INTO reservations (
    restaurant_id, customer_name, customer_phone, customer_email, customer_notes,
    reservation_date, reservation_time, party_size, source, table_id,
    is_overbooking, overbooking_reason
  ) VALUES (
    p_restaurant_id, p_customer_name, p_customer_phone, p_customer_email, p_customer_notes,
    p_reservation_date, p_reservation_time, p_party_size, p_source, p_table_id,
    v_is_overbooking, v_overbooking_reason
  ) RETURNING id INTO v_reservation_id;
  
  RETURN v_reservation_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Atualizar status da reserva
CREATE OR REPLACE FUNCTION update_reservation_status(
  p_reservation_id UUID,
  p_new_status VARCHAR,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE reservations
  SET 
    status = p_new_status,
    confirmed_at = CASE WHEN p_new_status = 'confirmed' AND confirmed_at IS NULL THEN NOW() ELSE confirmed_at END,
    seated_at = CASE WHEN p_new_status = 'seated' AND seated_at IS NULL THEN NOW() ELSE seated_at END,
    completed_at = CASE WHEN p_new_status = 'completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END,
    cancelled_at = CASE WHEN p_new_status = 'cancelled' AND cancelled_at IS NULL THEN NOW() ELSE cancelled_at END,
    cancelled_reason = CASE WHEN p_new_status = 'cancelled' THEN p_notes ELSE cancelled_reason END,
    updated_at = NOW()
  WHERE id = p_reservation_id;
  
  -- Se marcado como no-show, registrar no histórico
  IF p_new_status = 'no_show' THEN
    INSERT INTO no_show_history (
      reservation_id, restaurant_id, reservation_date, reservation_time,
      party_size, customer_name, customer_phone, estimated_revenue_loss
    )
    SELECT 
      id, restaurant_id, reservation_date, reservation_time,
      party_size, customer_name, customer_phone,
      party_size * 50.0 -- Estimativa de perda de receita (pode ser melhorado)
    FROM reservations
    WHERE id = p_reservation_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RPC: Calcular impacto de estoque da reserva
CREATE OR REPLACE FUNCTION calculate_reservation_inventory_impact(
  p_reservation_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_reservation RECORD;
  v_impact JSONB;
  v_estimated_consumption JSONB := '{}'::JSONB;
  v_forecasted_dishes JSONB := '[]'::JSONB;
BEGIN
  -- Buscar dados da reserva
  SELECT * INTO v_reservation
  FROM reservations
  WHERE id = p_reservation_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found: %', p_reservation_id;
  END IF;
  
  -- Calcular impacto estimado (simplificado - pode ser melhorado com dados históricos)
  -- Assumindo consumo médio por pessoa
  -- TODO: Melhorar com dados históricos reais
  
  -- Salvar impacto
  INSERT INTO reservation_inventory_impact (
    reservation_id, restaurant_id, estimated_consumption, forecasted_dishes,
    impact_calculated, calculated_at
  ) VALUES (
    p_reservation_id, v_reservation.restaurant_id, v_estimated_consumption, v_forecasted_dishes,
    true, NOW()
  )
  ON CONFLICT DO NOTHING;
  
  v_impact := jsonb_build_object(
    'reservation_id', p_reservation_id,
    'party_size', v_reservation.party_size,
    'estimated_consumption', v_estimated_consumption,
    'forecasted_dishes', v_forecasted_dishes
  );
  
  RETURN v_impact;
END;
$$ LANGUAGE plpgsql;

-- RPC: Listar reservas do dia
CREATE OR REPLACE FUNCTION list_reservations_for_date(
  p_restaurant_id UUID,
  p_date DATE
) RETURNS TABLE (
  id UUID,
  customer_name VARCHAR,
  reservation_time TIME,
  party_size INTEGER,
  status VARCHAR,
  table_id UUID,
  is_overbooking BOOLEAN,
  source VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.customer_name,
    r.reservation_time,
    r.party_size,
    r.status,
    r.table_id,
    r.is_overbooking,
    r.source
  FROM reservations r
  WHERE r.restaurant_id = p_restaurant_id
    AND r.reservation_date = p_date
    AND r.status IN ('pending', 'confirmed', 'seated')
  ORDER BY r.reservation_time;
END;
$$ LANGUAGE plpgsql;

-- RPC: Calcular estatísticas de no-show
CREATE OR REPLACE FUNCTION calculate_no_show_stats(
  p_restaurant_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_total_no_shows INTEGER;
  v_total_reservations INTEGER;
  v_no_show_rate DECIMAL;
  v_total_revenue_loss DECIMAL;
BEGIN
  -- Contar no-shows
  SELECT COUNT(*), COALESCE(SUM(estimated_revenue_loss), 0)
  INTO v_total_no_shows, v_total_revenue_loss
  FROM no_show_history
  WHERE restaurant_id = p_restaurant_id
    AND (p_start_date IS NULL OR reservation_date >= p_start_date)
    AND (p_end_date IS NULL OR reservation_date <= p_end_date);
  
  -- Contar total de reservas no período
  SELECT COUNT(*)
  INTO v_total_reservations
  FROM reservations
  WHERE restaurant_id = p_restaurant_id
    AND (p_start_date IS NULL OR reservation_date >= p_start_date)
    AND (p_end_date IS NULL OR reservation_date <= p_end_date)
    AND status IN ('completed', 'no_show', 'cancelled');
  
  -- Calcular taxa de no-show
  v_no_show_rate := CASE 
    WHEN v_total_reservations > 0 THEN (v_total_no_shows::DECIMAL / v_total_reservations) * 100
    ELSE 0
  END;
  
  v_result := jsonb_build_object(
    'total_no_shows', v_total_no_shows,
    'total_reservations', v_total_reservations,
    'no_show_rate', v_no_show_rate,
    'total_revenue_loss', v_total_revenue_loss
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Atualizar updated_at
CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_overbooking_config_updated_at
  BEFORE UPDATE ON overbooking_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
