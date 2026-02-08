/**
 * FASE 0 - PRÉ-FLIGHT
 * 
 * Valida containers, endpoints, schema mínimo e gera run_id.
 */

import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { PhaseFunction, PhaseResult, TestContext } from './types';
import type { TestLogger } from './types';

const RESULTS_DIR = path.join(process.cwd(), 'test-results', 'NIVEL_4');

export const fase0Preflight: PhaseFunction = async (
  pool: pg.Pool,
  logger: TestLogger,
  context: TestContext
): Promise<PhaseResult> => {
  const startTime = Date.now();
  const errors: PhaseResult['errors'] = [];
  const warnings: PhaseResult['warnings'] = [];

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('FASE 0 — PRÉ-FLIGHT');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // 1. Criar diretório de resultados
    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }
    logger.log('✅ Diretório de resultados criado');

    // 2. Gerar run_id
    const runId = uuidv4();
    context.metadata.run_id = runId;
    context.metadata.test_level = 'NIVEL_4';
    logger.log(`✅ Run ID gerado: ${runId}`);

    // 3. Testar conexão com banco
    logger.log('Testando conexão com banco...');
    const dbTest = await pool.query('SELECT NOW() as now, version() as version');
    logger.log(`✅ Banco conectado: PostgreSQL ${dbTest.rows[0].version.split(' ')[0]}`);

    // 4. Validar schema mínimo
    logger.log('Validando schema mínimo...');
    const requiredTables = [
      'gm_restaurants',
      'gm_tables',
      'gm_orders',
      'gm_order_items',
      'gm_products',
      'gm_ingredients',
      'gm_stock_levels',
      'gm_locations',
      'gm_tasks',
    ];

    for (const table of requiredTables) {
      const check = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      if (!check.rows[0].exists) {
        errors.push({
          phase: 'FASE 0',
          severity: 'CRITICAL',
          message: `Tabela obrigatória não encontrada: ${table}`,
          reproducible: true,
        });
      } else {
        logger.log(`  ✅ ${table}`);
      }
    }

    // 5. Validar RPCs críticos
    logger.log('Validando RPCs críticos...');
    const requiredRPCs = [
      'create_order_atomic',
      'generate_tasks_from_orders',
      'generate_scheduled_tasks',
      'generate_shopping_list',
      'confirm_purchase',
    ];

    for (const rpc of requiredRPCs) {
      const check = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public'
          AND p.proname = $1
        )
      `, [rpc]);
      
      if (!check.rows[0].exists) {
        warnings.push(`RPC ${rpc} não encontrado (pode ser criado durante o teste)`);
      } else {
        logger.log(`  ✅ ${rpc}`);
      }
    }

    // 6. Validar Realtime (wal_level e publicação)
    logger.log('Validando configuração Realtime...');
    const walLevel = await pool.query(`SHOW wal_level`);
    if (walLevel.rows[0].wal_level !== 'logical') {
      warnings.push('wal_level não está em "logical" - Realtime pode não funcionar');
    } else {
      logger.log('  ✅ wal_level = logical');
    }

    const realtimePub = await pool.query(`
      SELECT COUNT(*) as count
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND tablename IN ('gm_orders', 'gm_order_items', 'gm_tasks')
    `);
    logger.log(`  ✅ ${realtimePub.rows[0].count} tabelas publicadas no Realtime`);

    // 7. Salvar run_id em arquivo
    const runInfo = {
      run_id: runId,
      start_time: new Date().toISOString(),
      test_level: 'NIVEL_4',
      scenario: context.metadata.scenario || 'M',
    };
    fs.writeFileSync(
      path.join(RESULTS_DIR, 'run_info.json'),
      JSON.stringify(runInfo, null, 2)
    );

    const duration = Date.now() - startTime;

    if (errors.length > 0) {
      return {
        success: false,
        duration,
        errors,
        warnings,
      };
    }

    logger.log('✅ Pré-flight concluído com sucesso');
    return {
      success: true,
      duration,
      data: { runId, requiredTables: requiredTables.length },
      errors,
      warnings,
    };
  } catch (error: any) {
    errors.push({
      phase: 'FASE 0',
      severity: 'CRITICAL',
      message: `Erro no pré-flight: ${error.message}`,
      details: error,
      reproducible: true,
    });

    return {
      success: false,
      duration: Date.now() - startTime,
      errors,
      warnings,
    };
  }
};
