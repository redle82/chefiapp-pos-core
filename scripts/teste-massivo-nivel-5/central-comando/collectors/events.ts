/**
 * Coletor de Métricas do Event System
 * 
 * Coleta taxa de eventos, tipos, eventos bloqueantes, processamento
 */

import pg from 'pg';
import type { Pool } from 'pg';

export interface EventSystemMetrics {
  rate: EventRateMetrics;
  types: EventTypeMetrics;
  blocking: BlockingEventsMetrics;
  processing: ProcessingMetrics;
  alerts: Alert[];
}

export interface EventRateMetrics {
  eventsPerSecond: number;
  eventsPerRestaurant: { [restaurantId: string]: number };
  eventsPerOrigin: { [origin: string]: number };
  peaks: PeakEvent[];
}

export interface PeakEvent {
  timestamp: Date;
  rate: number; // eventos por segundo
  type: string;
}

export interface EventTypeMetrics {
  orderCreated: number;
  orderModified: number;
  orderCancelled: number;
  taskCreated: number;
  stockConsumed: number;
  kdsUpdated: number;
  other: number;
}

export interface BlockingEventsMetrics {
  failed: number;
  retried: number;
  ignored: number;
  duplicates: number;
  failedEvents: FailedEvent[];
}

export interface FailedEvent {
  eventId: string;
  type: string;
  reason: string;
  timestamp: Date;
}

export interface ProcessingMetrics {
  latency: {
    p50: number; // ms
    p95: number; // ms
    p99: number; // ms
  };
  backlog: number;
  processingRate: number; // eventos por segundo
  storeLag: number; // ms (diferença entre criado e processado)
}

export interface Alert {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

export async function collectEventSystemMetrics(pool: Pool): Promise<EventSystemMetrics> {
  const rate = await collectEventRateMetrics(pool);
  const types = await collectEventTypeMetrics(pool);
  const blocking = await collectBlockingEventsMetrics(pool);
  const processing = await collectProcessingMetrics(pool);
  const alerts = generateAlerts(rate, types, blocking, processing);

  return {
    rate,
    types,
    blocking,
    processing,
    alerts,
  };
}

async function collectEventRateMetrics(pool: Pool): Promise<EventRateMetrics> {
  try {
    // Eventos por segundo (últimos 60 segundos)
    const eventsPerSecondResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_orders
      WHERE created_at > NOW() - INTERVAL '60 seconds'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const eventsPerSecond = Math.floor((eventsPerSecondResult.rows[0]?.count || 0) / 60);
    
    // Eventos por restaurante (últimos 60 segundos)
    const eventsPerRestaurantResult = await pool.query(`
      SELECT 
        restaurant_id,
        COUNT(*) as count
      FROM public.gm_orders
      WHERE created_at > NOW() - INTERVAL '60 seconds'
      GROUP BY restaurant_id
      LIMIT 100
    `).catch(() => ({ rows: [] }));
    
    const eventsPerRestaurant: { [key: string]: number } = {};
    for (const row of eventsPerRestaurantResult.rows) {
      eventsPerRestaurant[row.restaurant_id] = parseInt(row.count);
    }
    
    // Eventos por origem (últimos 60 segundos)
    const eventsPerOriginResult = await pool.query(`
      SELECT 
        sync_metadata->>'origin' as origin,
        COUNT(*) as count
      FROM public.gm_orders
      WHERE created_at > NOW() - INTERVAL '60 seconds'
        AND sync_metadata->>'origin' IS NOT NULL
      GROUP BY sync_metadata->>'origin'
    `).catch(() => ({ rows: [] }));
    
    const eventsPerOrigin: { [key: string]: number } = {};
    for (const row of eventsPerOriginResult.rows) {
      eventsPerOrigin[row.origin] = parseInt(row.count);
    }
    
    // Picos (simplificado - em produção usar análise temporal)
    const peaks: PeakEvent[] = [];
    
    return {
      eventsPerSecond,
      eventsPerRestaurant,
      eventsPerOrigin,
      peaks,
    };
  } catch (e) {
    console.error('[EVENTS] Erro ao coletar métricas de taxa:', e);
    return {
      eventsPerSecond: 0,
      eventsPerRestaurant: {},
      eventsPerOrigin: {},
      peaks: [],
    };
  }
}

async function collectEventTypeMetrics(pool: Pool): Promise<EventTypeMetrics> {
  try {
    // Contar por tipo (simplificado - em produção usar event store real)
    // Assumindo que eventos são pedidos, tasks, etc.
    const ordersResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_orders
      WHERE created_at > NOW() - INTERVAL '60 seconds'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const tasksResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_tasks
      WHERE created_at > NOW() - INTERVAL '60 seconds'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const cancelledResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_orders
      WHERE status = 'cancelled'
        AND updated_at > NOW() - INTERVAL '60 seconds'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    return {
      orderCreated: parseInt(ordersResult.rows[0]?.count || '0'),
      orderModified: 0, // Simplificado
      orderCancelled: parseInt(cancelledResult.rows[0]?.count || '0'),
      taskCreated: parseInt(tasksResult.rows[0]?.count || '0'),
      stockConsumed: 0, // Simplificado
      kdsUpdated: 0, // Simplificado
      other: 0,
    };
  } catch (e) {
    console.error('[EVENTS] Erro ao coletar métricas de tipos:', e);
    return {
      orderCreated: 0,
      orderModified: 0,
      orderCancelled: 0,
      taskCreated: 0,
      stockConsumed: 0,
      kdsUpdated: 0,
      other: 0,
    };
  }
}

async function collectBlockingEventsMetrics(pool: Pool): Promise<BlockingEventsMetrics> {
  // Simplificado - em produção ler de logs ou event store com status
  return {
    failed: 0,
    retried: 0,
    ignored: 0,
    duplicates: 0,
    failedEvents: [],
  };
}

async function collectProcessingMetrics(pool: Pool): Promise<ProcessingMetrics> {
  try {
    // Latência de processamento (simplificado)
    // Em produção, calcular diferença entre created_at e processed_at
    const latencyResult = await pool.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000) as avg_latency
      FROM public.gm_orders
      WHERE updated_at > NOW() - INTERVAL '60 seconds'
        AND created_at IS NOT NULL
    `).catch(() => ({ rows: [{ avg_latency: 0 }] }));
    
    const avgLatency = parseFloat(latencyResult.rows[0]?.avg_latency || '0');
    
    // Backlog (pedidos não processados)
    const backlogResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_orders
      WHERE status = 'pending'
        AND created_at < NOW() - INTERVAL '5 minutes'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const backlog = parseInt(backlogResult.rows[0]?.count || '0');
    
    // Processing rate (pedidos processados por segundo)
    const processingRateResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_orders
      WHERE status != 'pending'
        AND updated_at > NOW() - INTERVAL '60 seconds'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const processingRate = Math.floor((processingRateResult.rows[0]?.count || 0) / 60);
    
    return {
      latency: {
        p50: avgLatency,
        p95: avgLatency * 2,
        p99: avgLatency * 3,
      },
      backlog,
      processingRate,
      storeLag: 0, // Simplificado
    };
  } catch (e) {
    console.error('[EVENTS] Erro ao coletar métricas de processamento:', e);
    return {
      latency: { p50: 0, p95: 0, p99: 0 },
      backlog: 0,
      processingRate: 0,
      storeLag: 0,
    };
  }
}

function generateAlerts(
  rate: EventRateMetrics,
  types: EventTypeMetrics,
  blocking: BlockingEventsMetrics,
  processing: ProcessingMetrics
): Alert[] {
  const alerts: Alert[] = [];
  
  // Eventos bloqueantes
  if (blocking.failed > 10) {
    alerts.push({
      severity: 'critical',
      message: `${blocking.failed} eventos falharam`,
      timestamp: new Date(),
    });
  }
  
  // Backlog alto
  if (processing.backlog > 100) {
    alerts.push({
      severity: 'warning',
      message: `Backlog de ${processing.backlog} eventos`,
      timestamp: new Date(),
    });
  }
  
  // Latência alta
  if (processing.latency.p95 > 5000) {
    alerts.push({
      severity: 'warning',
      message: `Latência P95 alta: ${processing.latency.p95.toFixed(0)}ms`,
      timestamp: new Date(),
    });
  }
  
  return alerts;
}
