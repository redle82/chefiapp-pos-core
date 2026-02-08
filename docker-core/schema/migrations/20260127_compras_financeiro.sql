/**
 * Compras + Financeiro - Sistema Completo de Compras e Gestão Financeira
 * 
 * Inclui:
 * - Ciclo completo de compras (consumo → alerta → sugestão → pedido → recebimento)
 * - Fornecedores e lead time
 * - Compras automáticas
 * - Fluxo de caixa
 * - Margem por produto
 * - Custo real por prato
 * - Desperdício e perdas
 * - Previsão financeira
 */

-- Fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Dados básicos
  name VARCHAR NOT NULL,
  contact_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  address TEXT,
  
  -- Operacional
  lead_time_days INTEGER DEFAULT 1, -- Tempo de entrega em dias
  payment_terms VARCHAR DEFAULT 'net_30', -- Termos de pagamento
  minimum_order DECIMAL(10,2), -- Pedido mínimo
  active BOOLEAN DEFAULT true,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_suppliers_restaurant ON suppliers(restaurant_id);
CREATE INDEX idx_suppliers_active ON suppliers(restaurant_id, active) WHERE active = true;

-- Pedidos de compra
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  
  -- Identificação
  order_number VARCHAR UNIQUE NOT NULL,
  status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'received', 'cancelled')),
  
  -- Datas
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  
  -- Valores
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  
  -- Metadados
  notes TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_restaurant ON purchase_orders(restaurant_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON purchase_orders(order_date);

-- Itens do pedido de compra
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  
  -- Produto
  product_name VARCHAR NOT NULL,
  unit VARCHAR NOT NULL, -- kg, litro, unidade, etc
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Recebimento
  received_quantity DECIMAL(10,3) DEFAULT 0,
  received_at TIMESTAMP,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_purchase_order_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_ingredient ON purchase_order_items(ingredient_id) WHERE ingredient_id IS NOT NULL;

-- Sugestões de compra automáticas
CREATE TABLE IF NOT EXISTS purchase_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  
  -- Sugestão
  suggested_quantity DECIMAL(10,3) NOT NULL,
  reason VARCHAR NOT NULL, -- low_stock, forecasted_demand, etc
  priority VARCHAR DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Estado
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted', 'expired')),
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  converted_to_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  
  -- Contexto
  current_stock DECIMAL(10,3),
  min_stock DECIMAL(10,3),
  forecasted_consumption DECIMAL(10,3),
  context JSONB DEFAULT '{}'::JSONB,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_purchase_suggestions_restaurant ON purchase_suggestions(restaurant_id);
CREATE INDEX idx_purchase_suggestions_ingredient ON purchase_suggestions(ingredient_id) WHERE ingredient_id IS NOT NULL;
CREATE INDEX idx_purchase_suggestions_status ON purchase_suggestions(status) WHERE status = 'pending';

-- Recebimentos
CREATE TABLE IF NOT EXISTS purchase_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  
  -- Recebimento
  received_date DATE DEFAULT CURRENT_DATE,
  received_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  -- Valores recebidos
  total_received DECIMAL(10,2) DEFAULT 0,
  
  -- Qualidade
  quality_check BOOLEAN DEFAULT false,
  quality_notes TEXT,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_purchase_receipts_order ON purchase_receipts(purchase_order_id);

-- Fluxo de caixa
CREATE TABLE IF NOT EXISTS cash_flow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Transação
  transaction_date DATE NOT NULL,
  transaction_type VARCHAR NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  category VARCHAR NOT NULL, -- sales, purchase, payroll, rent, etc
  
  -- Valores
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  
  -- Relacionamentos
  related_order_id UUID, -- Pedido relacionado
  related_purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cash_flow_restaurant ON cash_flow(restaurant_id);
CREATE INDEX idx_cash_flow_date ON cash_flow(transaction_date);
CREATE INDEX idx_cash_flow_type ON cash_flow(transaction_type);

-- Margem por produto
CREATE TABLE IF NOT EXISTS product_margins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- Período
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Métricas
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  margin_amount DECIMAL(10,2) DEFAULT 0,
  margin_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Quantidades
  units_sold INTEGER DEFAULT 0,
  units_wasted INTEGER DEFAULT 0,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(restaurant_id, product_id, period_start, period_end)
);

CREATE INDEX idx_product_margins_restaurant ON product_margins(restaurant_id);
CREATE INDEX idx_product_margins_product ON product_margins(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_product_margins_period ON product_margins(period_start, period_end);

-- Custos por prato
CREATE TABLE IF NOT EXISTS dish_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE,
  
  -- Custo
  ingredient_cost DECIMAL(10,2) DEFAULT 0,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  overhead_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) DEFAULT 0,
  
  -- Preço
  selling_price DECIMAL(10,2),
  margin_amount DECIMAL(10,2) DEFAULT 0,
  margin_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Timestamp
  calculated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dish_costs_restaurant ON dish_costs(restaurant_id);
CREATE INDEX idx_dish_costs_dish ON dish_costs(dish_id) WHERE dish_id IS NOT NULL;

-- Desperdício e perdas
CREATE TABLE IF NOT EXISTS waste_and_losses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- Tipo
  loss_type VARCHAR NOT NULL CHECK (loss_type IN ('waste', 'spoilage', 'theft', 'error', 'other')),
  category VARCHAR DEFAULT 'operational' CHECK (category IN ('operational', 'storage', 'preparation', 'service')),
  
  -- Quantidade e valor
  quantity DECIMAL(10,3) NOT NULL,
  unit VARCHAR NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_loss DECIMAL(10,2) NOT NULL,
  
  -- Detalhes
  reason TEXT,
  reported_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  reported_at TIMESTAMP DEFAULT NOW(),
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_waste_and_losses_restaurant ON waste_and_losses(restaurant_id);
CREATE INDEX idx_waste_and_losses_type ON waste_and_losses(loss_type);
CREATE INDEX idx_waste_and_losses_date ON waste_and_losses(reported_at);

-- Previsão financeira
CREATE TABLE IF NOT EXISTS financial_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurant(id) ON DELETE CASCADE,
  
  -- Período
  forecast_date DATE NOT NULL,
  forecast_type VARCHAR NOT NULL CHECK (forecast_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  
  -- Previsões
  forecasted_income DECIMAL(10,2) DEFAULT 0,
  forecasted_expenses DECIMAL(10,2) DEFAULT 0,
  forecasted_profit DECIMAL(10,2) DEFAULT 0,
  
  -- Confiança
  confidence_level DECIMAL(3,2) DEFAULT 0.5, -- 0-1
  methodology VARCHAR, -- historical, trend, seasonal, etc
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(restaurant_id, forecast_date, forecast_type)
);

CREATE INDEX idx_financial_forecasts_restaurant ON financial_forecasts(restaurant_id);
CREATE INDEX idx_financial_forecasts_date ON financial_forecasts(forecast_date);

-- RPC: Criar pedido de compra
CREATE OR REPLACE FUNCTION create_purchase_order(
  p_restaurant_id UUID,
  p_supplier_id UUID,
  p_order_date DATE DEFAULT CURRENT_DATE,
  p_expected_delivery_date DATE DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_order_number VARCHAR;
  v_supplier_lead_time INTEGER;
BEGIN
  -- Buscar lead time do fornecedor
  SELECT lead_time_days INTO v_supplier_lead_time
  FROM suppliers WHERE id = p_supplier_id;
  
  -- Gerar número do pedido
  v_order_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('purchase_order_seq')::TEXT, 4, '0');
  
  -- Criar pedido
  INSERT INTO purchase_orders (
    restaurant_id, supplier_id, order_number, order_date,
    expected_delivery_date, notes
  ) VALUES (
    p_restaurant_id, p_supplier_id, v_order_number, p_order_date,
    COALESCE(p_expected_delivery_date, p_order_date + (v_supplier_lead_time || ' days')::INTERVAL),
    p_notes
  ) RETURNING id INTO v_order_id;
  
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Adicionar item ao pedido
CREATE OR REPLACE FUNCTION add_purchase_order_item(
  p_order_id UUID,
  p_ingredient_id UUID,
  p_product_name VARCHAR,
  p_unit VARCHAR,
  p_quantity DECIMAL,
  p_unit_price DECIMAL
) RETURNS UUID AS $$
DECLARE
  v_item_id UUID;
  v_total_price DECIMAL;
BEGIN
  v_total_price := p_quantity * p_unit_price;
  
  INSERT INTO purchase_order_items (
    purchase_order_id, ingredient_id, product_name, unit, quantity, unit_price, total_price
  ) VALUES (
    p_order_id, p_ingredient_id, p_product_name, p_unit, p_quantity, p_unit_price, v_total_price
  ) RETURNING id INTO v_item_id;
  
  -- Atualizar total do pedido
  UPDATE purchase_orders
  SET 
    subtotal = (SELECT COALESCE(SUM(total_price), 0) FROM purchase_order_items WHERE purchase_order_id = p_order_id),
    total = subtotal + tax,
    updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN v_item_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Gerar sugestões de compra automáticas
CREATE OR REPLACE FUNCTION generate_purchase_suggestions(
  p_restaurant_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_suggestions_count INTEGER := 0;
  v_ingredient RECORD;
  v_current_stock DECIMAL;
  v_min_stock DECIMAL;
  v_suggested_quantity DECIMAL;
  v_supplier_id UUID;
BEGIN
  -- Iterar sobre ingredientes com estoque baixo
  FOR v_ingredient IN
    SELECT i.id, i.name, i.min_stock, i.unit, s.id as supplier_id
    FROM ingredients i
    LEFT JOIN suppliers s ON s.restaurant_id = i.restaurant_id AND s.active = true
    WHERE i.restaurant_id = p_restaurant_id
      AND i.min_stock IS NOT NULL
      AND i.min_stock > 0
  LOOP
    -- Buscar estoque atual
    SELECT COALESCE(SUM(quantity), 0) INTO v_current_stock
    FROM inventory_stock
    WHERE restaurant_id = p_restaurant_id AND ingredient_id = v_ingredient.id;
    
    -- Se estoque abaixo do mínimo
    IF v_current_stock < v_ingredient.min_stock THEN
      v_suggested_quantity := v_ingredient.min_stock * 2 - v_current_stock; -- Sugerir quantidade para chegar a 2x o mínimo
      
      -- Criar sugestão
      PERFORM create_mentor_suggestion(
        p_restaurant_id,
        'optimization',
        'Estoque baixo: ' || v_ingredient.name,
        format('O ingrediente %s está com estoque baixo (%.2f %s). Considere fazer um pedido.', 
               v_ingredient.name, v_current_stock, v_ingredient.unit),
        'operational',
        CASE 
          WHEN v_current_stock < v_ingredient.min_stock * 0.5 THEN 'urgent'
          WHEN v_current_stock < v_ingredient.min_stock * 0.7 THEN 'high'
          ELSE 'medium'
        END,
        jsonb_build_object('ingredient_id', v_ingredient.id, 'current_stock', v_current_stock, 'min_stock', v_ingredient.min_stock),
        'Estoque abaixo do mínimo configurado',
        jsonb_build_object('ingredient_id', v_ingredient.id),
        'ingredient',
        v_ingredient.id
      );
      
      v_suggestions_count := v_suggestions_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_suggestions_count;
END;
$$ LANGUAGE plpgsql;

-- RPC: Registrar recebimento
CREATE OR REPLACE FUNCTION receive_purchase_order(
  p_order_id UUID,
  p_received_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_receipt_id UUID;
BEGIN
  -- Criar recebimento
  INSERT INTO purchase_receipts (
    purchase_order_id, received_date, received_by, total_received
  )
  SELECT 
    p_order_id, CURRENT_DATE, p_received_by,
    COALESCE(SUM(total_price), 0)
  FROM purchase_order_items
  WHERE purchase_order_id = p_order_id
  RETURNING id INTO v_receipt_id;
  
  -- Atualizar status do pedido
  UPDATE purchase_orders
  SET 
    status = 'received',
    actual_delivery_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Atualizar estoque (se houver itens com ingredient_id)
  UPDATE inventory_stock
  SET quantity = quantity + poi.received_quantity
  FROM purchase_order_items poi
  WHERE poi.purchase_order_id = p_order_id
    AND poi.ingredient_id = inventory_stock.ingredient_id
    AND poi.received_quantity > 0;
  
  RETURN v_receipt_id;
END;
$$ LANGUAGE plpgsql;

-- RPC: Calcular margem por produto
CREATE OR REPLACE FUNCTION calculate_product_margin(
  p_restaurant_id UUID,
  p_product_id UUID,
  p_period_start DATE,
  p_period_end DATE
) RETURNS JSONB AS $$
DECLARE
  v_total_sales DECIMAL := 0;
  v_total_cost DECIMAL := 0;
  v_units_sold INTEGER := 0;
  v_margin_amount DECIMAL;
  v_margin_percentage DECIMAL;
BEGIN
  -- Calcular vendas
  SELECT 
    COALESCE(SUM(oi.quantity * oi.unit_price), 0),
    COALESCE(SUM(oi.quantity), 0)::INTEGER
  INTO v_total_sales, v_units_sold
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.restaurant_id = p_restaurant_id
    AND oi.product_id = p_product_id
    AND o.created_at::DATE BETWEEN p_period_start AND p_period_end
    AND o.status IN ('completed', 'delivered');
  
  -- Calcular custo (simplificado - pode ser melhorado)
  -- TODO: Calcular custo real baseado em receitas e ingredientes
  v_total_cost := v_total_sales * 0.3; -- Assumindo 30% de custo (placeholder)
  
  -- Calcular margem
  v_margin_amount := v_total_sales - v_total_cost;
  v_margin_percentage := CASE 
    WHEN v_total_sales > 0 THEN (v_margin_amount / v_total_sales) * 100
    ELSE 0
  END;
  
  -- Salvar
  INSERT INTO product_margins (
    restaurant_id, product_id, period_start, period_end,
    total_sales, total_cost, margin_amount, margin_percentage, units_sold
  ) VALUES (
    p_restaurant_id, p_product_id, p_period_start, p_period_end,
    v_total_sales, v_total_cost, v_margin_amount, v_margin_percentage, v_units_sold
  )
  ON CONFLICT (restaurant_id, product_id, period_start, period_end) DO UPDATE SET
    total_sales = v_total_sales,
    total_cost = v_total_cost,
    margin_amount = v_margin_amount,
    margin_percentage = v_margin_percentage,
    units_sold = v_units_sold;
  
  RETURN jsonb_build_object(
    'total_sales', v_total_sales,
    'total_cost', v_total_cost,
    'margin_amount', v_margin_amount,
    'margin_percentage', v_margin_percentage,
    'units_sold', v_units_sold
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger: Atualizar updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sequence para números de pedido
CREATE SEQUENCE IF NOT EXISTS purchase_order_seq START 1;
