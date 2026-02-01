/**
 * FASE 0: PREFLIGHT - Teste Massivo Nível 5
 * 
 * Validação pré-teste: Docker Core, schema, RPCs, Realtime.
 */

import type { PhaseFunction, PhaseResult, TestContext } from './types';
import { getDbPool } from './db';
import { Logger } from './logger';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { emitProgress, initProgressBus } from './progress';

export const fase0Preflight: PhaseFunction = async (pool, logger, context) => {
  logger.log('=== FASE 0: PREFLIGHT ===');
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  try {
    // 1. Validar Docker Core
    logger.log('Validando Docker Core...');
    emitProgress(context, { phase: 'FASE 0', step: 'Docker Core', op: 'INFO', message: 'Validando acesso ao Core...' });
    const coreCheck = await pool.query('SELECT 1');
    if (coreCheck.rows.length === 0) {
      errors.push({
        phase: 'preflight',
        severity: 'CRITICAL',
        message: 'Docker Core não está acessível',
        reproducible: true,
      });
      throw new Error('Docker Core não está acessível');
    }
    logger.log('✅ Docker Core acessível');
    emitProgress(context, { phase: 'FASE 0', step: 'Docker Core', op: 'SELECT', resource: 'public', message: 'Core acessível' });

    // 2. Validar schema mínimo
    logger.log('Validando schema mínimo...');
    emitProgress(context, { phase: 'FASE 0', step: 'Schema', op: 'SELECT', resource: 'information_schema.tables', message: 'Validando tabelas mínimas...' });
    const schemaCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('gm_restaurants', 'gm_tables', 'gm_orders', 'gm_tasks', 'gm_stock_levels')
    `);
    if (schemaCheck.rows.length < 5) {
      errors.push({
        phase: 'preflight',
        severity: 'CRITICAL',
        message: 'Schema incompleto',
        reproducible: true,
      });
      throw new Error('Schema incompleto');
    }
    logger.log('✅ Schema completo');
    emitProgress(context, { phase: 'FASE 0', step: 'Schema', op: 'INFO', message: 'Schema OK' });

    // 3. Validar RPCs críticos
    logger.log('Validando RPCs críticos...');
    emitProgress(context, { phase: 'FASE 0', step: 'RPCs', op: 'SELECT', resource: 'information_schema.routines', message: 'Validando RPCs críticos...' });
    const rpcCheck = await pool.query(`
      SELECT routine_name FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN ('create_order_atomic', 'generate_tasks_from_orders', 'generate_shopping_list', 'confirm_purchase')
    `);
    if (rpcCheck.rows.length < 4) {
      errors.push({
        phase: 'preflight',
        severity: 'CRITICAL',
        message: 'RPCs críticos faltando',
        reproducible: true,
      });
      throw new Error('RPCs críticos faltando');
    }
    logger.log('✅ RPCs críticos disponíveis');
    emitProgress(context, { phase: 'FASE 0', step: 'RPCs', op: 'INFO', message: 'RPCs OK' });

    // 4. Validar Realtime (se configurado)
    logger.log('Validando Realtime...');
    emitProgress(context, { phase: 'FASE 0', step: 'Realtime', op: 'SELECT', resource: 'pg_publication', message: 'Checando publication...' });
    try {
      const realtimeCheck = await pool.query(`
        SELECT COUNT(*) FROM pg_publication WHERE pubname = 'supabase_realtime'
      `);
      if (realtimeCheck.rows[0].count === '0') {
        warnings.push('Realtime não configurado (não crítico para teste)');
        emitProgress(context, { phase: 'FASE 0', step: 'Realtime', op: 'WARN', message: 'Realtime não configurado (não crítico)' });
      } else {
        logger.log('✅ Realtime configurado');
        emitProgress(context, { phase: 'FASE 0', step: 'Realtime', op: 'INFO', message: 'Realtime configurado' });
      }
    } catch (e) {
      warnings.push('Realtime não configurado (não crítico para teste)');
      emitProgress(context, { phase: 'FASE 0', step: 'Realtime', op: 'WARN', message: 'Realtime não configurado (não crítico)' });
    }

    // 5. Gerar run_id único
    const runId = uuidv4();
    context.metadata.run_id = runId;
    context.metadata.test_level = 'NIVEL_5';
    context.metadata.scenario = 'EXTREME';
    logger.log(`✅ Run ID gerado: ${runId}`);
    initProgressBus(context);
    emitProgress(context, { phase: 'FASE 0', step: 'run_id', op: 'INFO', message: `run_id=${runId}` });

    // 6. Criar diretório de resultados
    const resultsDir = path.join(process.cwd(), 'test-results', 'NIVEL_5', runId);
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    logger.log(`✅ Diretório de resultados criado: ${resultsDir}`);
    emitProgress(context, { phase: 'FASE 0', step: 'results_dir', op: 'INFO', message: resultsDir, resource: resultsDir });

    const duration = Date.now() - startTime;
    logger.log(`=== FASE 0 COMPLETA (${duration}ms) ===`);
    emitProgress(context, { phase: 'FASE 0', step: 'complete', op: 'INFO', message: `COMPLETA (${duration}ms)` });

    return {
      success: errors.length === 0,
      duration,
      errors,
      warnings,
      metrics: {
        run_id: runId,
        results_dir: resultsDir,
      },
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    errors.push({
      phase: 'preflight',
      severity: 'CRITICAL',
      message: error.message || 'Erro desconhecido',
      details: error,
      reproducible: true,
    });
    logger.log(`❌ FASE 0 FALHOU: ${error.message}`, 'ERROR');
    emitProgress(context, { phase: 'FASE 0', step: 'failed', op: 'ERROR', message: error.message || 'Erro desconhecido' });
    return {
      success: false,
      duration,
      errors,
      warnings,
    };
  }
};
