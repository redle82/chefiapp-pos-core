/**
 * TYPES - Teste Massivo Nível 4 (End-to-End + Scale)
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
    run_id?: string;
    test_level?: string;
    scenario?: 'S' | 'M' | 'L' | 'XL';
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
  users: UserData[];
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
  created_at: Date;
}

export interface OrderItemData {
  id: string;
  product_id: string;
  quantity: number;
  created_by_role?: string;
  created_by_user_id?: string;
  device_id?: string;
  origin?: string;
  status?: string;
}

export interface TaskData {
  id: string;
  restaurant_id: string;
  task_type: string;
  station: string;
  priority: string;
  status: string;
  message: string;
  context?: any;
}

export interface UserData {
  id: string;
  restaurant_id: string;
  role: 'waiter' | 'kitchen' | 'manager' | 'owner' | 'bar' | 'cleaning';
  name: string;
  device_id?: string;
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
  metrics?: {
    [key: string]: number | string;
  };
}

export interface PhaseFunction {
  (pool: pg.Pool, logger: TestLogger, context: TestContext): Promise<PhaseResult>;
}

// =============================================================================
// SCENARIO CONFIGURATIONS
// =============================================================================

export interface ScenarioConfig {
  name: string;
  restaurants: number;
  tablesPerRestaurant: number;
  locationsPerRestaurant: number;
  productsPerRestaurant: number;
  ingredientsPerRestaurant: number;
  waitersPerRestaurant: number;
  managersPerRestaurant: number;
  ownersPerRestaurant: number;
  ordersPerRestaurant: number;
  concurrentActions: number;
}

export const SCENARIOS: Record<'S' | 'M' | 'L' | 'XL', ScenarioConfig> = {
  S: {
    name: 'Ambulante (1 restaurante, 1 mesa, 1 estação)',
    restaurants: 1,
    tablesPerRestaurant: 1,
    locationsPerRestaurant: 1,
    productsPerRestaurant: 10,
    ingredientsPerRestaurant: 15,
    waitersPerRestaurant: 0,
    managersPerRestaurant: 0,
    ownersPerRestaurant: 1,
    ordersPerRestaurant: 5,
    concurrentActions: 10,
  },
  M: {
    name: 'Restaurante Médio (1 restaurante, 15 mesas, 2 estações, 3 garçons)',
    restaurants: 1,
    tablesPerRestaurant: 15,
    locationsPerRestaurant: 2,
    productsPerRestaurant: 30,
    ingredientsPerRestaurant: 40,
    waitersPerRestaurant: 3,
    managersPerRestaurant: 1,
    ownersPerRestaurant: 1,
    ordersPerRestaurant: 50,
    concurrentActions: 50,
  },
  L: {
    name: 'Grupo Multi-restaurantes (4 restaurantes, 60 mesas, 8 garçons, 2 gerentes, 1 dono)',
    restaurants: 4,
    tablesPerRestaurant: 15,
    locationsPerRestaurant: 3,
    productsPerRestaurant: 50,
    ingredientsPerRestaurant: 60,
    waitersPerRestaurant: 2,
    managersPerRestaurant: 1,
    ownersPerRestaurant: 1,
    ordersPerRestaurant: 100,
    concurrentActions: 100,
  },
  XL: {
    name: 'McDonald\'s Mode (10 restaurantes, 200 mesas, ondas temporais, alta concorrência)',
    restaurants: 10,
    tablesPerRestaurant: 20,
    locationsPerRestaurant: 4,
    productsPerRestaurant: 80,
    ingredientsPerRestaurant: 100,
    waitersPerRestaurant: 5,
    managersPerRestaurant: 2,
    ownersPerRestaurant: 1,
    ordersPerRestaurant: 500,
    concurrentActions: 200,
  },
};
