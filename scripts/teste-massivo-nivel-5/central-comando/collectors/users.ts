/**
 * Coletor de Métricas de Usuários & Dispositivos
 * 
 * Coleta usuários ativos, dispositivos, concorrência
 */

import pg from 'pg';
import type { Pool } from 'pg';

export interface UsersMetrics {
  active: ActiveUsersMetrics;
  devices: DeviceMetrics;
  concurrency: ConcurrencyMetrics;
  alerts: Alert[];
}

export interface ActiveUsersMetrics {
  waiters: number;
  kitchen: number;
  bar: number;
  managers: number;
  owners: number;
  byRestaurant: { [restaurantId: string]: number };
  online: number;
  offline: number;
}

export interface DeviceMetrics {
  connected: number;
  offline: number; // sem heartbeat > 5 minutos
  byType: { [type: string]: number };
  byRestaurant: { [restaurantId: string]: number };
  lowBattery: string[]; // IDs de dispositivos com bateria < 20%
}

export interface ConcurrencyMetrics {
  conflicts: number;
  userLocks: number;
  simultaneousSessions: number;
  recentConflicts: ConcurrencyConflict[];
}

export interface ConcurrencyConflict {
  resource: string;
  users: string[];
  timestamp: Date;
  resolved: boolean;
}

export interface Alert {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

export async function collectUsersMetrics(pool: Pool): Promise<UsersMetrics> {
  const active = await collectActiveUsersMetrics(pool);
  const devices = await collectDeviceMetrics(pool);
  const concurrency = await collectConcurrencyMetrics(pool);
  const alerts = generateAlerts(active, devices, concurrency);

  return {
    active,
    devices,
    concurrency,
    alerts,
  };
}

async function collectActiveUsersMetrics(pool: Pool): Promise<ActiveUsersMetrics> {
  try {
    // Usuários ativos por role (com atividade recente)
    const waitersResult = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM public.gm_people p
      JOIN public.gm_orders o ON o.restaurant_id = p.restaurant_id
      WHERE p.role = 'waiter'
        AND o.created_at > NOW() - INTERVAL '15 minutes'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const waiters = parseInt(waitersResult.rows[0]?.count || '0');
    
    const kitchenResult = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM public.gm_people p
      JOIN public.gm_tasks t ON t.restaurant_id = p.restaurant_id
      WHERE p.role = 'kitchen'
        AND t.created_at > NOW() - INTERVAL '15 minutes'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const kitchen = parseInt(kitchenResult.rows[0]?.count || '0');
    
    const barResult = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM public.gm_people p
      JOIN public.gm_tasks t ON t.restaurant_id = p.restaurant_id
      WHERE p.role = 'bar'
        AND t.created_at > NOW() - INTERVAL '15 minutes'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const bar = parseInt(barResult.rows[0]?.count || '0');
    
    const managersResult = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM public.gm_people p
      JOIN public.gm_tasks t ON t.restaurant_id = p.restaurant_id
      WHERE p.role = 'manager'
        AND t.created_at > NOW() - INTERVAL '15 minutes'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const managers = parseInt(managersResult.rows[0]?.count || '0');
    
    const ownersResult = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM public.gm_people p
      WHERE p.role = 'owner'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    
    const owners = parseInt(ownersResult.rows[0]?.count || '0');
    
    // Por restaurante
    const byRestaurantResult = await pool.query(`
      SELECT 
        p.restaurant_id,
        COUNT(DISTINCT p.id) as count
      FROM public.gm_people p
      JOIN public.gm_orders o ON o.restaurant_id = p.restaurant_id
      WHERE o.created_at > NOW() - INTERVAL '15 minutes'
      GROUP BY p.restaurant_id
      LIMIT 100
    `).catch(() => ({ rows: [] }));
    
    const byRestaurant: { [key: string]: number } = {};
    for (const row of byRestaurantResult.rows) {
      byRestaurant[row.restaurant_id] = parseInt(row.count);
    }
    
    const online = waiters + kitchen + bar + managers + owners;
    const offline = 0; // Simplificado
    
    return {
      waiters,
      kitchen,
      bar,
      managers,
      owners,
      byRestaurant,
      online,
      offline,
    };
  } catch (e) {
    console.error('[USERS] Erro ao coletar métricas de usuários ativos:', e);
    return {
      waiters: 0,
      kitchen: 0,
      bar: 0,
      managers: 0,
      owners: 0,
      byRestaurant: {},
      online: 0,
      offline: 0,
    };
  }
}

async function collectDeviceMetrics(pool: Pool): Promise<DeviceMetrics> {
  // Simplificado - em produção ter tabela de dispositivos com heartbeat
  return {
    connected: 0,
    offline: 0,
    byType: {},
    byRestaurant: {},
    lowBattery: [],
  };
}

async function collectConcurrencyMetrics(pool: Pool): Promise<ConcurrencyMetrics> {
  // Simplificado - em produção detectar conflitos de concorrência
  return {
    conflicts: 0,
    userLocks: 0,
    simultaneousSessions: 0,
    recentConflicts: [],
  };
}

function generateAlerts(
  active: ActiveUsersMetrics,
  devices: DeviceMetrics,
  concurrency: ConcurrencyMetrics
): Alert[] {
  const alerts: Alert[] = [];
  
  // Dispositivos offline
  if (devices.offline > 0) {
    alerts.push({
      severity: devices.offline > 10 ? 'warning' : 'info',
      message: `${devices.offline} dispositivos offline`,
      timestamp: new Date(),
    });
  }
  
  // Conflitos de concorrência
  if (concurrency.conflicts > 0) {
    alerts.push({
      severity: 'warning',
      message: `${concurrency.conflicts} conflitos de concorrência detectados`,
      timestamp: new Date(),
    });
  }
  
  return alerts;
}
