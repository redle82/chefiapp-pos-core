/**
 * DATABASE - Teste Massivo Nível 5
 * 
 * Pool de conexão compartilhado (otimizado para alta concorrência).
 */

import pg from 'pg';

const { Pool } = pg;

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54320/chefiapp_core';

export function getDbPool(): pg.Pool {
  return new Pool({
    connectionString: DB_URL,
    max: 50, // Aumentado para suportar alta concorrência
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}
