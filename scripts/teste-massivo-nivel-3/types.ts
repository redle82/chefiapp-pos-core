/**
 * TYPES - Teste Massivo Nível 3
 * 
 * Contratos compartilhados entre todas as fases.
 */

import pg from 'pg';

// =============================================================================
// DATABASE
// =============================================================================

export interface DatabasePool {
  pool: pg.Pool;
}

// =============================================================================
// LOGGING
// =============================================================================

export interface TestLogger {
  log(message: string, level?: 'INFO' | 'WARN' | 'ERROR'): void;
  flush(): void;
  getLogPath(): string;
}

// =============================================================================
// CONTEXT (estado acumulado entre fases)
// =============================================================================

export interface TestContext {
  // Restaurantes criados
  restaurants: RestaurantData[];
  
  // Pedidos criados
  orders: OrderData[];
  
  // Tarefas geradas
  tasks: TaskData[];
  
  // Estoque criado
  stockLevels: StockLevelData[];
  
  // Erros encontrados
  errors: TestError[];
  
  // Avisos
  warnings: string[];
  
  // Timestamps
  startTime: Date;
  endTime?: Date;
  totalDuration?: number; // milliseconds
  
  // Resultados das fases (para auditoria)
  phaseResults?: { phase: string; result: PhaseResult }[];
  
  // Metadados
  metadata: {
    [key: string]: any;
  };
}

// =============================================================================
// DATA STRUCTURES
// =============================================================================

export interface RestaurantData {
  id: string;
  name: string;
  slug: string;
  tenant_id: string;
  tables: TableData[];
  locations: LocationData[];
  equipment: EquipmentData[];
  ingredients: IngredientData[];
  products: ProductData[];
  stockLevels: StockLevelData[];
}

export interface TableData {
  id: string;
  number: number;
  restaurant_id: string;
}

export interface LocationData {
  id: string;
  name: string;
  kind: 'KITCHEN' | 'BAR' | 'STORAGE' | 'SERVICE' | 'OTHER';
  restaurant_id: string;
}

export interface EquipmentData {
  id: string;
  name: string;
  kind: string;
  location_id?: string;
  capacity_note?: string;
  restaurant_id: string;
}

export interface IngredientData {
  id: string;
  name: string;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'unit';
  restaurant_id: string;
}

export interface ProductData {
  id: string;
  name: string;
  station: 'KITCHEN' | 'BAR';
  prep_time_seconds: number;
  prep_category: string;
  price_cents: number;
  restaurant_id: string;
  bom: BOMData[];
}

export interface BOMData {
  ingredient_id: string;
  qty_per_unit: number;
  station: 'KITCHEN' | 'BAR';
}

export interface StockLevelData {
  id: string;
  location_id: string;
  ingredient_id: string;
  qty: number;
  min_qty: number;
  restaurant_id: string;
}

export interface OrderData {
  id: string;
  restaurant_id: string;
  table_id: string;
  table_number: number;
  status: string;
  items: OrderItemData[];
  authors: string[];
  origin: string;
}

export interface OrderItemData {
  id: string;
  product_id: string;
  quantity: number;
  created_by_role?: string;
  created_by_user_id?: string;
  device_id?: string;
}

export interface TaskData {
  id: string;
  restaurant_id: string;
  task_type: string;
  station: string;
  priority: string;
  status: string;
  message: string;
}

export interface TestError {
  phase: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  details?: any;
  reproducible: boolean;
}

// =============================================================================
// PHASE CONTRACT
// =============================================================================

export interface PhaseResult {
  success: boolean;
  duration: number; // milliseconds
  data?: any;
  errors: TestError[];
  warnings: string[];
}

export interface PhaseFunction {
  (pool: pg.Pool, logger: TestLogger, context: TestContext): Promise<PhaseResult>;
}
