#!/usr/bin/env npx ts-node
/**
 * ORQUESTRADOR - Teste Massivo Nível 3
 * 
 * Executa todas as fases sequencialmente e gera relatório final.
 */

import { getDbPool } from './db';
import { Logger } from './logger';
import { fase0Limpeza } from './fase-0-limpeza';
import { fase1SetupRestaurantes } from './fase-1-setup-restaurantes';
import { fase2PedidosMultiOrigem } from './fase-2-pedidos-multi-origem';
import { fase3TaskEngine } from './fase-3-task-engine';
import { fase4Visibilidade } from './fase-4-visibilidade';
import { fase5OndaTemporal } from './fase-5-onda-temporal';
import { fase6Realtime } from './fase-6-realtime';
import { fase7AuditoriaFinal } from './fase-7-auditoria-final';
import type { TestContext, PhaseResult } from './types';

async function main() {
  const pool = getDbPool();
  const context: TestContext = {
    restaurants: [],
    orders: [],
    tasks: [],
    stockLevels: [],
    errors: [],
    warnings: [],
    startTime: new Date(),
    metadata: {},
  };

  const results: { phase: string; result: PhaseResult }[] = [];

  try {
    console.log('\n🧪 TESTE MASSIVO NÍVEL 3 - INICIANDO\n');

    // FASE 0
    const logger0 = new Logger('fase-0');
    const result0 = await fase0Limpeza(pool, logger0, context);
    logger0.flush();
    results.push({ phase: 'FASE 0 - Limpeza', result: result0 });
    if (!result0.success) {
      throw new Error('Fase 0 falhou');
    }

    // FASE 1
    const logger1 = new Logger('fase-1');
    const result1 = await fase1SetupRestaurantes(pool, logger1, context);
    logger1.flush();
    results.push({ phase: 'FASE 1 - Setup Restaurantes', result: result1 });
    if (!result1.success) {
      throw new Error('Fase 1 falhou');
    }

    // FASE 2
    const logger2 = new Logger('fase-2');
    const result2 = await fase2PedidosMultiOrigem(pool, logger2, context);
    logger2.flush();
    results.push({ phase: 'FASE 2 - Pedidos Multi-Origem', result: result2 });
    if (!result2.success) {
      throw new Error('Fase 2 falhou');
    }

    // FASE 3
    const logger3 = new Logger('fase-3');
    const result3 = await fase3TaskEngine(pool, logger3, context);
    logger3.flush();
    results.push({ phase: 'FASE 3 - Task Engine', result: result3 });
    if (!result3.success) {
      throw new Error('Fase 3 falhou');
    }

    // FASE 4
    const logger4 = new Logger('fase-4');
    const result4 = await fase4Visibilidade(pool, logger4, context);
    logger4.flush();
    results.push({ phase: 'FASE 4 - Visibilidade', result: result4 });
    if (!result4.success) {
      throw new Error('Fase 4 falhou');
    }

    // FASE 5
    const logger5 = new Logger('fase-5');
    const result5 = await fase5OndaTemporal(pool, logger5, context);
    logger5.flush();
    results.push({ phase: 'FASE 5 - Onda Temporal', result: result5 });
    if (!result5.success) {
      throw new Error('Fase 5 falhou');
    }

    // FASE 6
    const logger6 = new Logger('fase-6');
    const result6 = await fase6Realtime(pool, logger6, context);
    logger6.flush();
    results.push({ phase: 'FASE 6 - Realtime', result: result6 });
    if (!result6.success) {
      throw new Error('Fase 6 falhou');
    }

    // FASE 7
    context.endTime = new Date();
    const totalDuration = context.endTime.getTime() - context.startTime.getTime();
    context.totalDuration = totalDuration;
    context.phaseResults = results;
    
    const logger7 = new Logger('fase-7');
    const result7 = await fase7AuditoriaFinal(pool, logger7, context);
    logger7.flush();
    results.push({ phase: 'FASE 7 - Auditoria Final', result: result7 });
    if (!result7.success) {
      throw new Error('Fase 7 falhou');
    }

    console.log('\n✅ TESTE MASSIVO CONCLUÍDO\n');
    console.log(`Duração total: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`Restaurantes criados: ${context.restaurants.length}`);
    console.log(`Pedidos criados: ${context.orders.length}`);
    console.log(`Total de itens: ${context.orders.reduce((sum, o) => sum + o.items.length, 0)}`);
    console.log(`Tarefas criadas: ${context.tasks.length}`);
    console.log(`Erros encontrados: ${context.errors.length}`);
    console.log(`Avisos: ${context.warnings.length}`);
    
    // Resumo por fase
    console.log('\n📊 Resumo por Fase:');
    results.forEach(({ phase, result }) => {
      console.log(`  ${phase}: ${result.success ? '✅' : '❌'} (${(result.duration / 1000).toFixed(2)}s)`);
      if (result.errors.length > 0) {
        console.log(`    Erros: ${result.errors.length}`);
      }
      if (result.warnings.length > 0) {
        console.log(`    Avisos: ${result.warnings.length}`);
      }
    });

  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
