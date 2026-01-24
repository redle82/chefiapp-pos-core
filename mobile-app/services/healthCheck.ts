/**
 * Health Check Service
 * 
 * Verifica saúde do sistema (conexão Supabase, autenticação)
 */

import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface HealthCheckResult {
  status: 'online' | 'offline';
  database: 'ok' | 'error';
  authentication: 'ok' | 'error';
  timestamp: string;
  responseTime?: number;
}

// ============================================================================
// HEALTH CHECK FUNCTIONS
// ============================================================================

/**
 * Verificar saúde do sistema
 * @returns Status de saúde do sistema
 */
export async function checkHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  const result: HealthCheckResult = {
    status: 'offline',
    database: 'error',
    authentication: 'error',
    timestamp: new Date().toISOString(),
  };

  try {
    // Check database connection
    try {
      const { error } = await supabase
        .from('gm_restaurants')
        .select('id')
        .limit(1);
      
      if (!error) {
        result.database = 'ok';
      }
    } catch (e) {
      console.error('[Health Check] Database error:', e);
    }

    // Check authentication service
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      // We don't need a valid session, just that the service responds
      if (error === null) {
        result.authentication = 'ok';
      }
    } catch (e) {
      console.error('[Health Check] Auth error:', e);
    }

    // Determine overall status
    if (result.database === 'ok' && result.authentication === 'ok') {
      result.status = 'online';
    }

    result.responseTime = Date.now() - startTime;
  } catch (error) {
    console.error('[Health Check] Error:', error);
    result.responseTime = Date.now() - startTime;
  }

  return result;
}

/**
 * Verificar saúde do backend (Edge Function)
 * @param supabaseUrl - URL do Supabase
 * @returns Status de saúde do backend
 */
export async function checkBackendHealth(supabaseUrl: string): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  const result: HealthCheckResult = {
    status: 'offline',
    database: 'error',
    authentication: 'error',
    timestamp: new Date().toISOString(),
  };

  try {
    const healthCheckUrl = `${supabaseUrl}/functions/v1/health`;
    
    const response = await fetch(healthCheckUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      result.status = data.status === 'healthy' ? 'online' : 'offline';
      result.database = data.checks?.database || 'error';
      result.authentication = data.checks?.authentication || 'error';
      result.responseTime = data.responseTime || (Date.now() - startTime);
    } else {
      result.responseTime = Date.now() - startTime;
    }
  } catch (error) {
    console.error('[Health Check] Backend error:', error);
    result.responseTime = Date.now() - startTime;
  }

  return result;
}

/**
 * Verificar se sistema está online
 * @returns true se sistema está online
 */
export async function isOnline(): Promise<boolean> {
  const health = await checkHealth();
  return health.status === 'online';
}
