#!/usr/bin/env npx ts-node
/**
 * TESTE MASSIVO NÍVEL 3 - ChefIApp POS Core
 * 
 * Objetivo: Validar TODO o sistema integrado antes de congelar arquitetura.
 * 
 * Usage:
 *   npx ts-node scripts/teste-massivo-nivel-3.ts
 */

import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const { Pool } = pg;

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54320/chefiapp_core';
const RESULTS_DIR = path.join(process.cwd(), 'test-results');
const LOGS_DIR = path.join(RESULTS_DIR, 'logs');

if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

function getDbPool(): pg.Pool {
  return new Pool({
    connectionString: DB_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

class TestLogger {
  private logFile: string;
  private logBuffer: string[] = [];

  constructor(phase: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(LOGS_DIR, `test-${phase}-${timestamp}.log`);
  }

  log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}`;
    this.logBuffer.push(logLine);
    console.log(logLine);
  }

  flush() {
    fs.writeFileSync(this.logFile, this.logBuffer.join('\n'));
  }
}

async function fase0Limpeza(pool: pg.Pool, logger: TestLogger): Promise<void> {
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 0 — LIMPEZA');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  const closeResult = await pool.query(`
    UPDATE public.gm_orders
    SET status = 'CLOSED', updated_at = NOW()
    WHERE status IN ('OPEN', 'PREPARING', 'IN_PREP', 'READY')
  `);
  logger.log(`✅ ${closeResult.rowCount} pedidos fechados`);

  const taskResult = await pool.query(`
    UPDATE public.gm_tasks
    SET status = 'DISMISSED', updated_at = NOW()
    WHERE status = 'OPEN' AND auto_generated = true
  `);
  logger.log(`✅ ${taskResult.rowCount} tarefas dispensadas`);

  fs.writeFileSync(
    path.join(RESULTS_DIR, 'RESET_LOG.md'),
    `# Reset Log - ${new Date().toISOString()}\n\n` +
    `- Pedidos fechados: ${closeResult.rowCount}\n` +
    `- Tarefas dispensadas: ${taskResult.rowCount}\n`
  );
}

async function main() {
  const pool = getDbPool();
  const logger = new TestLogger('massivo-nivel-3');

  try {
    logger.log('🧪 TESTE MASSIVO NÍVEL 3 - INICIANDO');
    await fase0Limpeza(pool, logger);
    logger.log('✅ Fase 0 concluída');
    logger.flush();
  } catch (error) {
    logger.log(`❌ Erro: ${error}`, 'ERROR');
    logger.flush();
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
