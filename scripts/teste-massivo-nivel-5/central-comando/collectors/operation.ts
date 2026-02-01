/**
 * Coletor de Métricas de Operação (Restaurantes)
 * 
 * Coleta status de restaurantes, pedidos, KDS, estoque
 */

import pg from 'pg';
import type { Pool } from 'pg';

export interface OperationMetrics {
  restaurants: RestaurantMetrics;
  orders: OrderMetrics;
  kds: KDSMetrics;
  stock: StockMetrics;
  alerts: Alert[];
}

export interface RestaurantMetrics {
  active: number;
  offline: number; // sem atividade > 5 minutos
  online: number;
  atRisk: string[]; // IDs de restaurantes com múltiplos problemas
  byRegion: { [region: string]: number };
}

export interface OrderMetrics {
  inProgress: number;
  perHour: number;
  pending: number;
  delayed: number; // passaram do tempo estimado
  byRestaurant: { [restaurantId: string]: number };
}

export interface KDSMetrics {
  congested: CongestedStation[];
  byStation: { [station: string]: number };
  avgPrepTime: { [station: string]: number }; // segundos
  queueLength: { [station: string]: number };
}

export interface CongestedStation {
  restaurantId: string;
  station: string;
  queueLength: number;
  avgWaitTime: number; // segundos
}

export interface StockMetrics {
  critical: CriticalStock[];
  byRestaurant: { [restaurantId: string]: number };
  byLocation: { [location: string]: number };
  alerts: StockAlert[];
}

export interface CriticalStock {
  restaurantId: string;
  ingredientId: string;
  ingredientName: string;
  location: string;
  current: number;
  minimum: number;
  percentage: number;
}

export interface StockAlert {
  restaurantId: string;
  message: string;
  severity: 'critical' | 'warning';
}

export interface Alert {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  restaurantId?: string;
  timestamp: Date;
}

export async function collectOperationMetrics(pool: Pool): Promise<OperationMetrics> {
  const restaurants = await collectRestaurantMetrics(pool);
  const orders = await collectOrderMetrics(pool);
  const kds = await collectKDSMetrics(pool);
  const stock = await collectStockMetrics(pool);
  const alerts = generateAlerts(restaurants, orders, kds, stock);

  return {
    restaurants,
    orders,
    kds,
    stock,
    alerts,
  };
}

async function collectRestaurantMetrics(pool: Pool): Promise<RestaurantMetrics> {
  try {
    // Restaurantes ativos (com atividade recente)
    const activeResult = await pool.query(`
      SELECT COUNT(DISTINCT restaurant_id) as count
      FROM public.gm_orders
      WHERE created_at > NOW() - INTERVAL '5 minutes'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const active = parseInt(activeResult.rows[0]?.count || '0');
    
    // Total de restaurantes
    const totalResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_restaurants
      WHERE name LIKE '%n5%' OR slug LIKE '%-n5'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const total = parseInt(totalResult.rows[0]?.count || '0');
    const offline = total - active;
    const online = active;
    
    // Restaurantes em risco (com múltiplos problemas)
    const atRiskResult = await pool.query(`
      SELECT DISTINCT r.id
      FROM public.gm_restaurants r
      WHERE (
        -- Sem atividade recente
        NOT EXISTS (
          SELECT 1 FROM public.gm_orders o 
          WHERE o.restaurant_id = r.id 
          AND o.created_at > NOW() - INTERVAL '15 minutes'
        )
        OR
        -- Muitas tasks pendentes
        (
          SELECT COUNT(*) FROM public.gm_tasks t
          WHERE t.restaurant_id = r.id
          AND t.status != 'completed'
          AND t.created_at < NOW() - INTERVAL '30 minutes'
        ) > 5
        OR
        -- Estoque crítico
        (
          SELECT COUNT(*) FROM public.gm_stock_levels s
          WHERE s.restaurant_id = r.id
          AND s.qty < s.min_qty
        ) > 3
      )
      AND (r.name LIKE '%n5%' OR r.slug LIKE '%-n5')
      LIMIT 50
    `).catch(() => ({ rows: [] }));
    
    const atRisk = atRiskResult.rows.map(row => row.id);
    
    // Por região (simplificado - assumindo todos na mesma região)
    const byRegion: { [key: string]: number } = {
      'default': total,
    };
    
    return {
      active,
      offline,
      online,
      atRisk,
      byRegion,
    };
  } catch (e) {
    console.error('[OPERATION] Erro ao coletar métricas de restaurantes:', e);
    return {
      active: 0,
      offline: 0,
      online: 0,
      atRisk: [],
      byRegion: {},
    };
  }
}

async function collectOrderMetrics(pool: Pool): Promise<OrderMetrics> {
  try {
    // Pedidos em progresso
    const inProgressResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_orders
      WHERE status IN ('pending', 'confirmed', 'preparing')
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const inProgress = parseInt(inProgressResult.rows[0]?.count || '0');
    
    // Pedidos por hora (última hora)
    const perHourResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_orders
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const perHour = parseInt(perHourResult.rows[0]?.count || '0');
    
    // Pedidos pendentes
    const pendingResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_orders
      WHERE status = 'pending'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const pending = parseInt(pendingResult.rows[0]?.count || '0');
    
    // Pedidos atrasados (simplificado - assumindo 30 min de preparo)
    const delayedResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_orders
      WHERE status IN ('confirmed', 'preparing')
        AND created_at < NOW() - INTERVAL '30 minutes'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const delayed = parseInt(delayedResult.rows[0]?.count || '0');
    
    // Por restaurante
    const byRestaurantResult = await pool.query(`
      SELECT 
        restaurant_id,
        COUNT(*) as count
      FROM public.gm_orders
      WHERE status IN ('pending', 'confirmed', 'preparing')
      GROUP BY restaurant_id
      LIMIT 100
    `).catch(() => ({ rows: [] }));
    
    const byRestaurant: { [key: string]: number } = {};
    for (const row of byRestaurantResult.rows) {
      byRestaurant[row.restaurant_id] = parseInt(row.count);
    }
    
    return {
      inProgress,
      perHour,
      pending,
      delayed,
      byRestaurant,
    };
  } catch (e) {
    console.error('[OPERATION] Erro ao coletar métricas de pedidos:', e);
    return {
      inProgress: 0,
      perHour: 0,
      pending: 0,
      delayed: 0,
      byRestaurant: {},
    };
  }
}

async function collectKDSMetrics(pool: Pool): Promise<KDSMetrics> {
  try {
    // KDS congestionado (estações com muitos pedidos pendentes)
    // Assumindo que pedidos têm station no metadata ou products
    const congestedResult = await pool.query(`
      SELECT 
        o.restaurant_id,
        p.station,
        COUNT(*) as queue_length
      FROM public.gm_orders o
      JOIN public.gm_order_items oi ON oi.order_id = o.id
      JOIN public.gm_products p ON p.id = oi.product_id
      WHERE o.status IN ('confirmed', 'preparing')
        AND p.station IS NOT NULL
      GROUP BY o.restaurant_id, p.station
      HAVING COUNT(*) > 10
      LIMIT 50
    `).catch(() => ({ rows: [] }));
    
    const congested: CongestedStation[] = congestedResult.rows.map(row => ({
      restaurantId: row.restaurant_id,
      station: row.station,
      queueLength: parseInt(row.queue_length),
      avgWaitTime: 0, // Simplificado
    }));
    
    // Por estação
    const byStationResult = await pool.query(`
      SELECT 
        p.station,
        COUNT(*) as count
      FROM public.gm_orders o
      JOIN public.gm_order_items oi ON oi.order_id = o.id
      JOIN public.gm_products p ON p.id = oi.product_id
      WHERE o.status IN ('confirmed', 'preparing')
        AND p.station IS NOT NULL
      GROUP BY p.station
    `).catch(() => ({ rows: [] }));
    
    const byStation: { [key: string]: number } = {};
    for (const row of byStationResult.rows) {
      byStation[row.station] = parseInt(row.count);
    }
    
    // Tempo médio de preparo (simplificado)
    const avgPrepTime: { [key: string]: number } = {};
    for (const station of Object.keys(byStation)) {
      avgPrepTime[station] = 600; // 10 minutos assumido
    }
    
    // Tamanho da fila
    const queueLength: { [key: string]: number } = {};
    for (const station of Object.keys(byStation)) {
      queueLength[station] = byStation[station];
    }
    
    return {
      congested,
      byStation,
      avgPrepTime,
      queueLength,
    };
  } catch (e) {
    console.error('[OPERATION] Erro ao coletar métricas de KDS:', e);
    return {
      congested: [],
      byStation: {},
      avgPrepTime: {},
      queueLength: {},
    };
  }
}

async function collectStockMetrics(pool: Pool): Promise<StockMetrics> {
  try {
    // Estoque crítico (abaixo do mínimo)
    const criticalResult = await pool.query(`
      SELECT 
        s.restaurant_id,
        s.ingredient_id,
        i.name as ingredient_name,
        l.name as location_name,
        s.qty,
        s.min_qty,
        (s.qty / NULLIF(s.min_qty, 0) * 100) as percentage
      FROM public.gm_stock_levels s
      JOIN public.gm_ingredients i ON i.id = s.ingredient_id
      LEFT JOIN public.gm_locations l ON l.id = s.location_id
      WHERE s.qty < s.min_qty
      ORDER BY s.qty / NULLIF(s.min_qty, 0)
      LIMIT 100
    `).catch(() => ({ rows: [] }));
    
    const critical: CriticalStock[] = criticalResult.rows.map(row => ({
      restaurantId: row.restaurant_id,
      ingredientId: row.ingredient_id,
      ingredientName: row.ingredient_name,
      location: row.location_name || 'unknown',
      current: parseFloat(row.qty),
      minimum: parseFloat(row.min_qty),
      percentage: parseFloat(row.percentage || '0'),
    }));
    
    // Por restaurante
    const byRestaurantResult = await pool.query(`
      SELECT 
        restaurant_id,
        COUNT(*) as count
      FROM public.gm_stock_levels
      WHERE qty < min_qty
      GROUP BY restaurant_id
      LIMIT 100
    `).catch(() => ({ rows: [] }));
    
    const byRestaurant: { [key: string]: number } = {};
    for (const row of byRestaurantResult.rows) {
      byRestaurant[row.restaurant_id] = parseInt(row.count);
    }
    
    // Por localização
    const byLocationResult = await pool.query(`
      SELECT 
        l.name as location,
        COUNT(*) as count
      FROM public.gm_stock_levels s
      LEFT JOIN public.gm_locations l ON l.id = s.location_id
      WHERE s.qty < s.min_qty
      GROUP BY l.name
    `).catch(() => ({ rows: [] }));
    
    const byLocation: { [key: string]: number } = {};
    for (const row of byLocationResult.rows) {
      byLocation[row.location || 'unknown'] = parseInt(row.count);
    }
    
    // Alertas
    const alerts: StockAlert[] = [];
    for (const item of critical.slice(0, 20)) {
      alerts.push({
        restaurantId: item.restaurantId,
        message: `${item.ingredientName} crítico em ${item.location} (${item.current}/${item.minimum})`,
        severity: item.percentage < 50 ? 'critical' : 'warning',
      });
    }
    
    return {
      critical,
      byRestaurant,
      byLocation,
      alerts,
    };
  } catch (e) {
    console.error('[OPERATION] Erro ao coletar métricas de estoque:', e);
    return {
      critical: [],
      byRestaurant: {},
      byLocation: {},
      alerts: [],
    };
  }
}

function generateAlerts(
  restaurants: RestaurantMetrics,
  orders: OrderMetrics,
  kds: KDSMetrics,
  stock: StockMetrics
): Alert[] {
  const alerts: Alert[] = [];
  
  // Restaurantes offline
  if (restaurants.offline > 0) {
    alerts.push({
      severity: restaurants.offline > 10 ? 'warning' : 'info',
      message: `${restaurants.offline} restaurantes offline`,
      timestamp: new Date(),
    });
  }
  
  // Restaurantes em risco
  if (restaurants.atRisk.length > 0) {
    alerts.push({
      severity: 'warning',
      message: `${restaurants.atRisk.length} restaurantes em risco`,
      timestamp: new Date(),
    });
  }
  
  // Pedidos atrasados
  if (orders.delayed > 0) {
    alerts.push({
      severity: orders.delayed > 50 ? 'critical' : 'warning',
      message: `${orders.delayed} pedidos atrasados`,
      timestamp: new Date(),
    });
  }
  
  // KDS congestionado
  if (kds.congested.length > 0) {
    alerts.push({
      severity: 'warning',
      message: `${kds.congested.length} estações KDS congestionadas`,
      timestamp: new Date(),
    });
  }
  
  // Estoque crítico
  if (stock.critical.length > 0) {
    alerts.push({
      severity: stock.critical.length > 20 ? 'critical' : 'warning',
      message: `${stock.critical.length} itens de estoque crítico`,
      timestamp: new Date(),
    });
  }
  
  return alerts;
}
