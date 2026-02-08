/**
 * Coletor de Métricas de Banco de Dados (Postgres)
 * 
 * Coleta TPS, locks, slow queries, event store metrics
 */

import pg from 'pg';
import type { Pool } from 'pg';

export interface DatabaseMetrics {
  performance: PerformanceMetrics;
  locks: LockMetrics;
  eventStore: EventStoreMetrics;
  integrity: IntegrityMetrics;
  alerts: Alert[];
}

export interface PerformanceMetrics {
  tps: {
    total: number;
    select: number;
    insert: number;
    update: number;
    delete: number;
  };
  queryLatency: {
    p50: number; // ms
    p95: number; // ms
    p99: number; // ms
    p999: number; // ms
  };
  slowQueries: SlowQuery[];
  connectionPool: {
    active: number;
    idle: number;
    waiting: number;
    total: number;
  };
}

export interface SlowQuery {
  query: string;
  duration: number; // ms
  calls: number;
  meanTime: number; // ms
}

export interface LockMetrics {
  active: number;
  byType: { [key: string]: number };
  deadlocks: number;
  waitTime: number; // ms
  blockingQueries: BlockingQuery[];
}

export interface BlockingQuery {
  blockedQuery: string;
  blockingQuery: string;
  waitTime: number; // ms
}

export interface EventStoreMetrics {
  eventsPerSecond: number;
  size: number; // bytes
  growthRate: number; // bytes per hour
  integrity: {
    chainIntact: boolean;
    gaps: number;
  };
  replayTime: number; // ms (tempo para replay completo)
}

export interface IntegrityMetrics {
  foreignKeyViolations: number;
  constraintViolations: number;
  dataCorruption: boolean;
  lastVacuum: Date | null;
  lastAnalyze: Date | null;
}

export interface Alert {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

export async function collectDatabaseMetrics(pool: Pool): Promise<DatabaseMetrics> {
  const performance = await collectPerformanceMetrics(pool);
  const locks = await collectLockMetrics(pool);
  const eventStore = await collectEventStoreMetrics(pool);
  const integrity = await collectIntegrityMetrics(pool);
  const alerts = generateAlerts(performance, locks, eventStore, integrity);

  return {
    performance,
    locks,
    eventStore,
    integrity,
    alerts,
  };
}

async function collectPerformanceMetrics(pool: Pool): Promise<PerformanceMetrics> {
  try {
    // Verificar se pg_stat_statements está habilitado
    const extensionsCheck = await pool.query(`
      SELECT * FROM pg_extension WHERE extname = 'pg_stat_statements'
    `);
    
    let slowQueries: SlowQuery[] = [];
    let queryLatency = { p50: 0, p95: 0, p99: 0, p999: 0 };
    
    if (extensionsCheck.rows.length > 0) {
      // Buscar queries lentas
      const slowQueriesResult = await pool.query(`
        SELECT 
          LEFT(query, 200) as query,
          calls,
          mean_exec_time,
          total_exec_time
        FROM pg_stat_statements
        WHERE mean_exec_time > 1000
        ORDER BY mean_exec_time DESC
        LIMIT 10
      `);
      
      slowQueries = slowQueriesResult.rows.map(row => ({
        query: row.query,
        duration: row.total_exec_time,
        calls: row.calls,
        meanTime: row.mean_exec_time,
      }));
      
      // Calcular percentis (simplificado)
      const latencyResult = await pool.query(`
        SELECT 
          percentile_cont(0.5) WITHIN GROUP (ORDER BY mean_exec_time) as p50,
          percentile_cont(0.95) WITHIN GROUP (ORDER BY mean_exec_time) as p95,
          percentile_cont(0.99) WITHIN GROUP (ORDER BY mean_exec_time) as p99,
          percentile_cont(0.999) WITHIN GROUP (ORDER BY mean_exec_time) as p999
        FROM pg_stat_statements
      `);
      
      if (latencyResult.rows.length > 0) {
        queryLatency = {
          p50: latencyResult.rows[0].p50 || 0,
          p95: latencyResult.rows[0].p95 || 0,
          p99: latencyResult.rows[0].p99 || 0,
          p999: latencyResult.rows[0].p999 || 0,
        };
      }
    }
    
    // TPS (simplificado - contar transações recentes)
    const tpsResult = await pool.query(`
      SELECT 
        SUM(CASE WHEN query LIKE 'SELECT%' THEN 1 ELSE 0 END) as selects,
        SUM(CASE WHEN query LIKE 'INSERT%' THEN 1 ELSE 0 END) as inserts,
        SUM(CASE WHEN query LIKE 'UPDATE%' THEN 1 ELSE 0 END) as updates,
        SUM(CASE WHEN query LIKE 'DELETE%' THEN 1 ELSE 0 END) as deletes
      FROM pg_stat_activity
      WHERE state = 'active'
    `).catch(() => ({ rows: [{ selects: 0, inserts: 0, updates: 0, deletes: 0 }] }));
    
    const tps = {
      total: (tpsResult.rows[0]?.selects || 0) + (tpsResult.rows[0]?.inserts || 0) + 
             (tpsResult.rows[0]?.updates || 0) + (tpsResult.rows[0]?.deletes || 0),
      select: tpsResult.rows[0]?.selects || 0,
      insert: tpsResult.rows[0]?.inserts || 0,
      update: tpsResult.rows[0]?.updates || 0,
      delete: tpsResult.rows[0]?.deletes || 0,
    };
    
    // Connection pool
    const poolStats = await pool.query(`
      SELECT 
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle,
        count(*) FILTER (WHERE wait_event_type = 'Lock') as waiting
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);
    
    return {
      tps,
      queryLatency,
      slowQueries,
      connectionPool: {
        active: parseInt(poolStats.rows[0]?.active || '0'),
        idle: parseInt(poolStats.rows[0]?.idle || '0'),
        waiting: parseInt(poolStats.rows[0]?.waiting || '0'),
        total: pool.totalCount || 0,
      },
    };
  } catch (e) {
    console.error('[DB] Erro ao coletar métricas de performance:', e);
    return {
      tps: { total: 0, select: 0, insert: 0, update: 0, delete: 0 },
      queryLatency: { p50: 0, p95: 0, p99: 0, p999: 0 },
      slowQueries: [],
      connectionPool: { active: 0, idle: 0, waiting: 0, total: 0 },
    };
  }
}

async function collectLockMetrics(pool: Pool): Promise<LockMetrics> {
  try {
    // Locks ativos
    const locksResult = await pool.query(`
      SELECT 
        locktype,
        mode,
        count(*) as count
      FROM pg_locks
      WHERE granted = true
      GROUP BY locktype, mode
    `);
    
    const byType: { [key: string]: number } = {};
    let active = 0;
    
    for (const row of locksResult.rows) {
      byType[`${row.locktype}_${row.mode}`] = parseInt(row.count);
      active += parseInt(row.count);
    }
    
    // Deadlocks (do log do Postgres - simplificado)
    const deadlocks = 0; // Em produção, ler do log
    
    // Queries bloqueadas
    const blockingResult = await pool.query(`
      SELECT 
        blocked_locks.pid AS blocked_pid,
        blocking_locks.pid AS blocking_pid,
        blocked_activity.query AS blocked_query,
        blocking_activity.query AS blocking_query
      FROM pg_catalog.pg_locks blocked_locks
      JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
      JOIN pg_catalog.pg_locks blocking_locks 
        ON blocking_locks.locktype = blocked_locks.locktype
        AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
        AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
        AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
        AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
        AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
        AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
        AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
        AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
        AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
        AND blocking_locks.pid != blocked_locks.pid
      JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
      WHERE NOT blocked_locks.granted
    `);
    
    const blockingQueries: BlockingQuery[] = blockingResult.rows.map(row => ({
      blockedQuery: row.blocked_query?.substring(0, 200) || '',
      blockingQuery: row.blocking_query?.substring(0, 200) || '',
      waitTime: 0, // Simplificado
    }));
    
    return {
      active,
      byType,
      deadlocks,
      waitTime: 0, // Simplificado
      blockingQueries,
    };
  } catch (e) {
    console.error('[DB] Erro ao coletar métricas de locks:', e);
    return {
      active: 0,
      byType: {},
      deadlocks: 0,
      waitTime: 0,
      blockingQueries: [],
    };
  }
}

async function collectEventStoreMetrics(pool: Pool): Promise<EventStoreMetrics> {
  try {
    // Verificar se existe tabela de eventos (assumindo estrutura event sourcing)
    const eventsTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%event%'
      )
    `);
    
    if (!eventsTableCheck.rows[0]?.exists) {
      return {
        eventsPerSecond: 0,
        size: 0,
        growthRate: 0,
        integrity: { chainIntact: true, gaps: 0 },
        replayTime: 0,
      };
    }
    
    // Eventos por segundo (últimos 60 segundos)
    const eventsPerSecondResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.gm_orders
      WHERE created_at > NOW() - INTERVAL '60 seconds'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const eventsPerSecond = Math.floor((eventsPerSecondResult.rows[0]?.count || 0) / 60);
    
    // Tamanho do event store (aproximado)
    const sizeResult = await pool.query(`
      SELECT pg_total_relation_size('public.gm_orders') as size
    `).catch(() => ({ rows: [{ size: 0 }] }));
    
    const size = parseInt(sizeResult.rows[0]?.size || '0');
    
    // Integridade (simplificado - verificar se há gaps)
    const gaps = 0; // Em produção, verificar sequência de eventos
    
    return {
      eventsPerSecond,
      size,
      growthRate: 0, // Calculado ao longo do tempo
      integrity: {
        chainIntact: gaps === 0,
        gaps,
      },
      replayTime: 0, // Calculado em replay real
    };
  } catch (e) {
    console.error('[DB] Erro ao coletar métricas do event store:', e);
    return {
      eventsPerSecond: 0,
      size: 0,
      growthRate: 0,
      integrity: { chainIntact: true, gaps: 0 },
      replayTime: 0,
    };
  }
}

async function collectIntegrityMetrics(pool: Pool): Promise<IntegrityMetrics> {
  try {
    // Último vacuum e analyze
    const vacuumResult = await pool.query(`
      SELECT 
        schemaname,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY GREATEST(
        COALESCE(last_vacuum, '1970-01-01'::timestamp),
        COALESCE(last_autovacuum, '1970-01-01'::timestamp)
      ) DESC
      LIMIT 1
    `).catch(() => ({ rows: [] }));
    
    const lastVacuum = vacuumResult.rows[0]?.last_vacuum || 
                      vacuumResult.rows[0]?.last_autovacuum || null;
    const lastAnalyze = vacuumResult.rows[0]?.last_analyze || 
                       vacuumResult.rows[0]?.last_autoanalyze || null;
    
    return {
      foreignKeyViolations: 0, // Em produção, contar tentativas de violação
      constraintViolations: 0, // Em produção, contar violações
      dataCorruption: false, // Em produção, verificar checksums
      lastVacuum: lastVacuum ? new Date(lastVacuum) : null,
      lastAnalyze: lastAnalyze ? new Date(lastAnalyze) : null,
    };
  } catch (e) {
    console.error('[DB] Erro ao coletar métricas de integridade:', e);
    return {
      foreignKeyViolations: 0,
      constraintViolations: 0,
      dataCorruption: false,
      lastVacuum: null,
      lastAnalyze: null,
    };
  }
}

function generateAlerts(
  performance: PerformanceMetrics,
  locks: LockMetrics,
  eventStore: EventStoreMetrics,
  integrity: IntegrityMetrics
): Alert[] {
  const alerts: Alert[] = [];
  
  // Slow queries
  if (performance.slowQueries.length > 0) {
    alerts.push({
      severity: 'warning',
      message: `${performance.slowQueries.length} queries lentas detectadas`,
      timestamp: new Date(),
    });
  }
  
  // Deadlocks
  if (locks.deadlocks > 0) {
    alerts.push({
      severity: 'critical',
      message: `${locks.deadlocks} deadlocks detectados`,
      timestamp: new Date(),
    });
  }
  
  // Locks bloqueando
  if (locks.blockingQueries.length > 0) {
    alerts.push({
      severity: 'warning',
      message: `${locks.blockingQueries.length} queries bloqueadas`,
      timestamp: new Date(),
    });
  }
  
  // Event store gaps
  if (eventStore.integrity.gaps > 0) {
    alerts.push({
      severity: 'critical',
      message: `${eventStore.integrity.gaps} gaps detectados no event store`,
      timestamp: new Date(),
    });
  }
  
  // Vacuum antigo
  if (integrity.lastVacuum) {
    const daysSinceVacuum = (Date.now() - integrity.lastVacuum.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceVacuum > 7) {
      alerts.push({
        severity: 'warning',
        message: `Último vacuum há ${Math.floor(daysSinceVacuum)} dias`,
        timestamp: new Date(),
      });
    }
  }
  
  return alerts;
}
