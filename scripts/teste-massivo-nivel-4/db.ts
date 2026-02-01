/**
 * DATABASE - Teste Massivo Nível 4
 * 
 * Pool de conexão compartilhado.
 */

import pg from 'pg';

const { Pool } = pg;

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54320/chefiapp_core';

export function getDbPool(): pg.Pool {
  return new Pool({
    connectionString: DB_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}
