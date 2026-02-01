/**
 * MONITOR EM TEMPO REAL - Teste Massivo Nível 5
 * 
 * Mostra barra de progresso, tempo decorrido e estatísticas em tempo real.
 */

import * as fs from 'fs';
import * as path from 'path';
import { getDbPool } from './db';
import { SCENARIO_EXTREME } from './types';

const LOGS_DIR = path.join(process.cwd(), 'test-results', 'NIVEL_5', 'logs');
const RESULTS_DIR = path.join(process.cwd(), 'test-results', 'NIVEL_5');

interface PhaseStatus {
  name: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  current?: number;
  total?: number;
  message?: string;
  lastUpdate?: Date;
}

const PHASES = [
  'FASE 0: Preflight',
  'FASE 1: Setup Massivo',
  'FASE 2: Pedidos Caos',
  'FASE 3: KDS Stress',
  'FASE 4: Task Extreme',
  'FASE 5: Estoque Cascata',
  'FASE 6: Multi-Dispositivo',
  'FASE 7: Time Warp',
  'FASE 8: Relatório Final',
];

function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[H');
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function createProgressBar(current: number, total: number, width: number = 50): string {
  const percentage = Math.min(100, Math.floor((current / total) * 100));
  const filled = Math.floor((percentage / 100) * width);
  const empty = width - filled;
  
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${percentage}%`;
}

function getLatestRunId(): string | null {
  // Primeiro, tentar buscar do diretório de resultados
  if (fs.existsSync(RESULTS_DIR)) {
    const dirs = fs.readdirSync(RESULTS_DIR)
      .filter(d => d !== 'logs' && fs.statSync(path.join(RESULTS_DIR, d)).isDirectory())
      .sort()
      .reverse();
    
    if (dirs.length > 0) {
      return dirs[0];
    }
  }
  
  // Se não encontrar, buscar do log mais recente
  if (fs.existsSync(LOGS_DIR)) {
    const logFiles = fs.readdirSync(LOGS_DIR)
      .filter(f => f.includes('main') || f.includes('fase-0'))
      .map(f => ({
        name: f,
        path: path.join(LOGS_DIR, f),
        mtime: fs.statSync(path.join(LOGS_DIR, f)).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    
    if (logFiles.length > 0) {
      try {
        const content = fs.readFileSync(logFiles[0].path, 'utf-8');
        const runIdMatch = content.match(/Run ID gerado: ([a-f0-9-]+)/i);
        if (runIdMatch) {
          return runIdMatch[1];
        }
      } catch (e) {
        // Ignore
      }
    }
  }
  
  return null;
}

function getPhaseStatus(runId: string | null): PhaseStatus[] {
  const statuses: PhaseStatus[] = PHASES.map(name => ({
    name,
    status: 'pending' as const,
  }));

  if (!runId) {
    return statuses;
  }

  // ✅ CORREÇÃO: Ler eventos explícitos do arquivo progress.ndjson
  // ao invés de tentar inferir de logs
  const progressFile = path.join(RESULTS_DIR, runId, 'progress.ndjson');
  
  if (!fs.existsSync(progressFile)) {
    return statuses;
  }

  try {
    const content = fs.readFileSync(progressFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        
        // Verificar se é um evento de progresso válido
        if (!event.__PROGRESS__ || !event.phase) {
          continue;
        }

        // Encontrar a fase correspondente
        const phaseIndex = PHASES.findIndex(p => event.phase.includes(p) || p.includes(event.phase));
        if (phaseIndex === -1) {
          continue;
        }

        const phase = statuses[phaseIndex];
        
        // Atualizar status baseado no step
        if (event.step === 'start') {
          phase.status = 'running';
          phase.startTime = new Date(event.timestamp);
        } else if (event.step === 'complete') {
          phase.status = 'complete';
          phase.endTime = new Date(event.timestamp);
          if (phase.startTime) {
            phase.duration = phase.endTime.getTime() - phase.startTime.getTime();
          }
        } else if (event.step === 'failed' || event.step === 'abort' || event.op === 'ERROR') {
          if (phase.status !== 'complete') {
            phase.status = 'failed';
            phase.endTime = new Date(event.timestamp);
            if (phase.startTime) {
              phase.duration = phase.endTime.getTime() - phase.startTime.getTime();
            }
          }
        } else if (event.step && phase.status === 'pending') {
          // Qualquer outro step indica que a fase começou
          phase.status = 'running';
          if (!phase.startTime) {
            phase.startTime = new Date(event.timestamp);
          }
        }

        // Atualizar progresso granular (current/total)
        if (event.current !== undefined && event.total !== undefined) {
          phase.current = event.current;
          phase.total = event.total;
          phase.message = event.message;
          phase.lastUpdate = new Date(event.timestamp);
        }
      } catch (e) {
        // Ignorar linhas inválidas
        continue;
      }
    }
  } catch (e) {
    // Se não conseguir ler o arquivo, retornar status padrão
    return statuses;
  }

  return statuses;
}

async function getDatabaseStats(pool: any): Promise<any> {
  try {
    const [restaurants, tables, orders, tasks, stockLevels, people] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM public.gm_restaurants WHERE name LIKE \'%n5%\' OR slug LIKE \'%-n5\''),
      pool.query('SELECT COUNT(*) as count FROM public.gm_tables t JOIN public.gm_restaurants r ON t.restaurant_id = r.id WHERE r.name LIKE \'%n5%\' OR r.slug LIKE \'%-n5\''),
      pool.query('SELECT COUNT(*) as count FROM public.gm_orders WHERE sync_metadata->>\'test\' = \'nivel5\' OR sync_metadata->>\'run_id\' IS NOT NULL'),
      pool.query('SELECT COUNT(*) as count FROM public.gm_tasks WHERE context->>\'run_id\' IS NOT NULL'),
      pool.query('SELECT COUNT(*) as count FROM public.gm_stock_levels s JOIN public.gm_restaurants r ON s.restaurant_id = r.id WHERE r.name LIKE \'%n5%\' OR r.slug LIKE \'%-n5\''),
      pool.query('SELECT COUNT(*) as count FROM public.gm_people p JOIN public.gm_restaurants r ON p.restaurant_id = r.id WHERE r.name LIKE \'%n5%\' OR r.slug LIKE \'%-n5\''),
    ]);

    return {
      restaurants: parseInt(restaurants.rows[0]?.count || '0'),
      tables: parseInt(tables.rows[0]?.count || '0'),
      orders: parseInt(orders.rows[0]?.count || '0'),
      tasks: parseInt(tasks.rows[0]?.count || '0'),
      stockLevels: parseInt(stockLevels.rows[0]?.count || '0'),
      people: parseInt(people.rows[0]?.count || '0'),
    };
  } catch (e) {
    return {
      restaurants: 0,
      tables: 0,
      orders: 0,
      tasks: 0,
      stockLevels: 0,
      people: 0,
    };
  }
}

function renderScreen(phases: PhaseStatus[], stats: any, startTime: Date, runId: string | null) {
  clearScreen();
  
  const elapsed = Date.now() - startTime.getTime();
  const completedPhases = phases.filter(p => p.status === 'complete').length;
  const totalPhases = phases.length;
  const progress = completedPhases / totalPhases;
  
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║          📊 MONITOR EM TEMPO REAL - TESTE MASSIVO NÍVEL 5                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');
  
  if (runId) {
    console.log(`🔍 Run ID: ${runId}`);
  } else {
    console.log('⏳ Aguardando início do teste...');
  }
  
  console.log(`⏱️  Tempo decorrido: ${formatDuration(elapsed)}`);
  console.log(`📈 Progresso geral: ${createProgressBar(completedPhases, totalPhases, 60)}`);
  console.log('');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 FASES DO TESTE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    
    let icon = '⏳';
    let color = '\x1b[90m'; // Gray
    if (phase.status === 'complete') {
      icon = '✅';
      color = '\x1b[32m'; // Green
    } else if (phase.status === 'running') {
      icon = '🔄';
      color = '\x1b[36m'; // Cyan
    } else if (phase.status === 'failed') {
      icon = '❌';
      color = '\x1b[31m'; // Red
    }
    
    // Mostrar progresso granular se disponível
    let progressInfo = '';
    if (phase.current !== undefined && phase.total !== undefined) {
      const progressBar = createProgressBar(phase.current, phase.total, 30);
      progressInfo = ` ${progressBar} (${phase.current}/${phase.total})`;
      if (phase.message) {
        progressInfo += ` - ${phase.message}`;
      }
    }
    
    const durationStr = phase.duration ? ` (${formatDuration(phase.duration)})` : '';
    console.log(`${color}${icon} ${phase.name.padEnd(40)}${progressInfo}${durationStr}\x1b[0m`);
  }
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ESTATÍSTICAS DO BANCO DE DADOS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  const expected = {
    restaurants: SCENARIO_EXTREME.totalRestaurants,
    tables: SCENARIO_EXTREME.totalTables,
    orders: SCENARIO_EXTREME.totalOrders,
    people: SCENARIO_EXTREME.totalPeople,
  };
  
  console.log(`🏪 Restaurantes: ${stats.restaurants.toLocaleString()} / ${expected.restaurants.toLocaleString()} (${createProgressBar(stats.restaurants, expected.restaurants, 30)})`);
  console.log(`🪑 Mesas:        ${stats.tables.toLocaleString()} / ${expected.tables.toLocaleString()} (${createProgressBar(stats.tables, expected.tables, 30)})`);
  console.log(`📦 Pedidos:      ${stats.orders.toLocaleString()} / ${expected.orders.toLocaleString()} (${createProgressBar(stats.orders, expected.orders, 30)})`);
  console.log(`👥 Pessoas:      ${stats.people.toLocaleString()} / ${expected.people.toLocaleString()} (${createProgressBar(stats.people, expected.people, 30)})`);
  console.log(`✅ Tarefas:      ${stats.tasks.toLocaleString()}`);
  console.log(`📦 Estoque:      ${stats.stockLevels.toLocaleString()}`);
  console.log('');
  
  const currentPhase = phases.find(p => p.status === 'running');
  if (currentPhase) {
    console.log(`🔄 Fase atual: ${currentPhase.name}`);
  } else if (phases.every(p => p.status === 'complete')) {
    console.log('✅ TESTE COMPLETO!');
  } else if (phases.some(p => p.status === 'failed')) {
    console.log('❌ TESTE FALHOU!');
  }
  
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 Pressione Ctrl+C para sair');
  console.log('');
}

async function main() {
  const pool = getDbPool();
  const startTime = new Date();
  let lastRunId: string | null = null;
  
  // Handler para saída limpa
  process.on('SIGINT', () => {
    clearScreen();
    console.log('\n👋 Monitor encerrado.\n');
    pool.end();
    process.exit(0);
  });
  
  console.log('🚀 Iniciando monitor em tempo real...\n');
  
  // Loop de atualização
  while (true) {
    try {
      const runId = getLatestRunId();
      if (runId && runId !== lastRunId) {
        lastRunId = runId;
        startTime.setTime(new Date().getTime());
      }
      
      const phases = getPhaseStatus(runId);
      const stats = await getDatabaseStats(pool);
      
      renderScreen(phases, stats, startTime, runId);
      
      // Verificar se teste terminou
      if (phases.every(p => p.status === 'complete' || p.status === 'failed')) {
        if (phases.every(p => p.status === 'complete')) {
          console.log('✅ TESTE COMPLETO! Verifique os relatórios em test-results/NIVEL_5/');
        } else {
          console.log('❌ TESTE FALHOU! Verifique os logs em test-results/NIVEL_5/logs/');
        }
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Atualizar a cada 1 segundo
    } catch (error: any) {
      clearScreen();
      console.error('❌ Erro no monitor:', error.message);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  await pool.end();
}

main().catch(console.error);
