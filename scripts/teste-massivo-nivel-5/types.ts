/**
 * TYPES - Teste Massivo Nível 5 (Stress de Realidade Extrema)
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
  // Restaurantes criados (1.000)
  restaurants: RestaurantData[];
  
  // Pedidos criados (~500.000 em 7 dias)
  orders: OrderData[];
  
  // Tarefas geradas
  tasks: TaskData[];
  
  // Estoque criado
  stockLevels: StockLevelData[];
  
  // Pessoas/Identidades (~12.000)
  people: PersonData[];
  
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
    scenario?: 'EXTREME';
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
  profile: RestaurantProfile;
  tables: TableData[];
  locations: LocationData[];
  equipment: EquipmentData[];
  ingredients: IngredientData[];
  products: ProductData[];
  stockLevels: StockLevelData[];
  people: PersonData[];
}

export type RestaurantProfile = 'AMBULANTE' | 'PEQUENO' | 'GRANDE' | 'ENTERPRISE';

export interface RestaurantProfileConfig {
  name: string;
  count: number;
  tablesRange: [number, number];
  locationsRange: [number, number];
  productsRange: [number, number];
  ingredientsRange: [number, number];
  peopleRange: [number, number];
  behavior: RestaurantBehavior;
}

export interface RestaurantBehavior {
  orderFrequency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  peakHours: { start: number; end: number }[];
  orderComplexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX';
  stockManagement: 'BASIC' | 'ADVANCED' | 'ENTERPRISE';
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
  ready_at?: Date;
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
  ready_at?: Date;
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
  created_at: Date;
  resolved_at?: Date;
}

export interface PersonData {
  id: string;
  restaurant_id: string;
  role: 'waiter' | 'kitchen' | 'manager' | 'owner' | 'bar' | 'cleaning';
  name: string;
  device_id?: string;
  shift?: ShiftData;
}

export interface ShiftData {
  start: number; // hour (0-23)
  end: number; // hour (0-23)
  days: number[]; // [0-6] (Sunday-Saturday)
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
  restaurants: RestaurantProfileConfig[];
  totalRestaurants: number;
  totalTables: number;
  totalPeople: number;
  totalOrders: number;
  simulationDays: number;
  concurrentDevices: number;
}

export const SCENARIO_EXTREME: ScenarioConfig = {
  name: 'Stress de Realidade Extrema (1.000 restaurantes, 7 dias)',
  restaurants: [
    {
      name: 'Ambulante/Micro',
      count: 400,
      tablesRange: [0, 3],
      locationsRange: [1, 2],
      productsRange: [10, 20],
      ingredientsRange: [15, 30],
      peopleRange: [1, 3],
      behavior: {
        orderFrequency: 'LOW',
        peakHours: [{ start: 12, end: 14 }, { start: 19, end: 21 }],
        orderComplexity: 'SIMPLE',
        stockManagement: 'BASIC',
      },
    },
    {
      name: 'Pequeno/Médio',
      count: 350,
      tablesRange: [10, 20],
      locationsRange: [2, 3],
      productsRange: [30, 50],
      ingredientsRange: [40, 60],
      peopleRange: [5, 10],
      behavior: {
        orderFrequency: 'MEDIUM',
        peakHours: [{ start: 12, end: 14 }, { start: 19, end: 22 }],
        orderComplexity: 'MEDIUM',
        stockManagement: 'ADVANCED',
      },
    },
    {
      name: 'Grande',
      count: 200,
      tablesRange: [40, 80],
      locationsRange: [3, 4],
      productsRange: [50, 80],
      ingredientsRange: [60, 100],
      peopleRange: [15, 30],
      behavior: {
        orderFrequency: 'HIGH',
        peakHours: [{ start: 12, end: 14 }, { start: 19, end: 22 }],
        orderComplexity: 'COMPLEX',
        stockManagement: 'ADVANCED',
      },
    },
    {
      name: 'Enterprise',
      count: 50,
      tablesRange: [120, 300],
      locationsRange: [4, 6],
      productsRange: [80, 150],
      ingredientsRange: [100, 200],
      peopleRange: [50, 150],
      behavior: {
        orderFrequency: 'EXTREME',
        peakHours: [{ start: 11, end: 15 }, { start: 18, end: 23 }],
        orderComplexity: 'COMPLEX',
        stockManagement: 'ENTERPRISE',
      },
    },
  ],
  totalRestaurants: 1000,
  totalTables: 27850, // Estimado
  totalPeople: 12000, // Estimado
  totalOrders: 500000, // Estimado em 7 dias
  simulationDays: 7,
  concurrentDevices: 5000, // Estimado
};

// =============================================================================
// METRICS
// =============================================================================

export interface TechnicalMetrics {
  latency: {
    mean: number;
    p95: number;
    p99: number;
    p999: number;
  };
  errors: {
    total: number;
    perMillionEvents: number;
    byType: Record<string, number>;
    fatal: number;
    recoverable: number;
  };
  state: {
    drift: number; // 0 tolerado
    inconsistencies: number;
    ghostOrders: number;
    ghostTasks: number;
  };
}

export interface OperationalMetrics {
  tasks: {
    useful: number;
    irrelevant: number;
    usefulPercent: number;
    correctTiming: number;
    earlyTiming: number;
    lateTiming: number;
    duplicated: number; // 0 tolerado
    noContext: number; // 0 tolerado
    absurd: number; // 0 tolerado
  };
  alerts: {
    early: number;
    late: number;
    falsePositives: number;
    falseNegatives: number;
  };
}

export interface ProductMetrics {
  intelligent: string[]; // Onde fica inteligente
  annoying: string[]; // Onde fica chato
  surprising: string[]; // Onde surpreende
  requiresUI: string[]; // Onde exige UI clara
}
