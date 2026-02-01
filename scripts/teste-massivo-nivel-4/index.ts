#!/usr/bin/env npx ts-node
/**
 * ORQUESTRADOR - Teste Massivo Nível 4 (End-to-End + Scale)
 * 
 * Executa todas as fases sequencialmente e gera relatório final.
 */

import { getDbPool } from './db';
import { Logger } from './logger';
import { fase0Preflight } from './fase-0-preflight';
import { fase1SetupEvolutivo } from './fase-1-setup-evolutivo';
import { fase2PedidosMultiOrigem } from './fase-2-pedidos-multi-origem';
import { fase3ProducaoEstacao } from './fase-3-producao-estacao';
import { fase4EstoqueConsumo } from './fase-4-estoque-consumo';
import { fase5TaskEngine } from './fase-5-task-engine';
import { fase6MultiDispositivo } from './fase-6-multi-dispositivo';
import { fase7Realtime } from './fase-7-realtime';
import { fase8RelatorioFinal } from './fase-8-relatorio-final';
import type { TestContext, PhaseResult } from './types';

async function main() {
  const pool = getDbPool();
  const scenario = (process.env.SCENARIO || 'M') as 'S' | 'M' | 'L' | 'XL';
  
  const context: TestContext = {
    restaurants: [],
    orders: [],
    tasks: [],
    stockLevels: [],
    errors: [],
    warnings: [],
    startTime: new Date(),
    metadata: {
      scenario,
    },
  };

  const results: { phase: string; result: PhaseResult }[] = [];

  try {
    console.log('\n🧪 TESTE MASSIVO NÍVEL 4 - INICIANDO\n');
    console.log(`📊 Cenário: ${scenario}\n`);

    // FASE 0
    const logger0 = new Logger('fase-0');
    const result0 = await fase0Preflight(pool, logger0, context);
    logger0.flush();
    results.push({ phase: 'FASE 0 - Pré-flight', result: result0 });
    if (!result0.success) {
      throw new Error('Fase 0 falhou');
    }

    // FASE 1
    const logger1 = new Logger('fase-1');
    const result1 = await fase1SetupEvolutivo(pool, logger1, context);
    logger1.flush();
    results.push({ phase: 'FASE 1 - Setup Evolutivo', result: result1 });
    if (!result1.success) {
      throw new Error('Fase 1 falhou');
    }

    // FASE 2
    const logger2 = new Logger('fase-2');
    const result2 = await fase2PedidosMultiOrigem(pool, logger2, context);
    logger2.flush();
    results.push({ phase: 'FASE 2 - Pedidos Multi-origem', result: result2 });
    if (!result2.success) {
      throw new Error('Fase 2 falhou');
    }

    // FASE 3
    const logger3 = new Logger('fase-3');
    const result3 = await fase3ProducaoEstacao(pool, logger3, context);
    logger3.flush();
    results.push({ phase: 'FASE 3 - Produção por Estação', result: result3 });
    if (!result3.success) {
      throw new Error('Fase 3 falhou');
    }

    // FASE 4
    const logger4 = new Logger('fase-4');
    const result4 = await fase4EstoqueConsumo(pool, logger4, context);
    logger4.flush();
    results.push({ phase: 'FASE 4 - Estoque + Consumo', result: result4 });
    if (!result4.success) {
      throw new Error('Fase 4 falhou');
    }

    // FASE 5
    const logger5 = new Logger('fase-5');
    const result5 = await fase5TaskEngine(pool, logger5, context);
    logger5.flush();
    results.push({ phase: 'FASE 5 - Task Engine', result: result5 });
    if (!result5.success) {
      throw new Error('Fase 5 falhou');
    }

    // FASE 6
    const logger6 = new Logger('fase-6');
    const result6 = await fase6MultiDispositivo(pool, logger6, context);
    logger6.flush();
    results.push({ phase: 'FASE 6 - Multi-dispositivo', result: result6 });
    if (!result6.success) {
      throw new Error('Fase 6 falhou');
    }

    // FASE 7
    const logger7 = new Logger('fase-7');
    const result7 = await fase7Realtime(pool, logger7, context);
    logger7.flush();
    results.push({ phase: 'FASE 7 - Realtime vs Polling', result: result7 });
    if (!result7.success) {
      throw new Error('Fase 7 falhou');
    }

    // FASE 8
    context.endTime = new Date();
    context.totalDuration = context.endTime.getTime() - context.startTime.getTime();
    context.phaseResults = results;

    const logger8 = new Logger('fase-8');
    const result8 = await fase8RelatorioFinal(pool, logger8, context);
    logger8.flush();
    results.push({ phase: 'FASE 8 - Relatório Final', result: result8 });

    console.log('\n✅ TESTE MASSIVO NÍVEL 4 - CONCLUÍDO\n');
    console.log(`⏱️  Duração total: ${Math.round(context.totalDuration / 1000)}s\n`);

    // Resumo
    const totalErrors = context.errors.filter(e => e.severity === 'CRITICAL').length;
    if (totalErrors > 0) {
      console.log(`⚠️  ${totalErrors} erros críticos encontrados\n`);
      process.exit(1);
    } else {
      console.log('✅ Nenhum erro crítico encontrado\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ ERRO FATAL NO TESTE\n');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
