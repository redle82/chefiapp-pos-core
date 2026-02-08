/**
 * MONITOR WEB - Teste Massivo Nível 5
 * 
 * Servidor HTTP que mostra monitor em tempo real no navegador.
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { getDbPool } from './db';
import { SCENARIO_EXTREME } from './types';

const PORT = 4321;
const LOGS_DIR = path.join(process.cwd(), 'test-results', 'NIVEL_5', 'logs');
const RESULTS_DIR = path.join(process.cwd(), 'test-results', 'NIVEL_5');

interface PhaseStatus {
  name: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  duration?: number;
  current?: number;
  total?: number;
  message?: string;
  lastUpdate?: Date;
}

interface ActiveFile {
  path: string;
  phase: string;
  operation: string;
  timestamp: Date;
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

function getLatestRunId(): string | null {
  if (fs.existsSync(RESULTS_DIR)) {
    const dirs = fs.readdirSync(RESULTS_DIR)
      .filter(d => d !== 'logs' && fs.statSync(path.join(RESULTS_DIR, d)).isDirectory())
      .map(d => ({
        name: d,
        mtime: fs.statSync(path.join(RESULTS_DIR, d)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime); // Ordenar por data de modificação (mais recente primeiro)
    
    if (dirs.length > 0) {
      return dirs[0].name;
    }
  }
  
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
    // Debug: arquivo não existe
    console.error(`[DEBUG] Arquivo progress.ndjson não encontrado: ${progressFile}`);
    return statuses;
  }

  try {
    const content = fs.readFileSync(progressFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      console.error(`[DEBUG] Arquivo progress.ndjson está vazio: ${progressFile}`);
      return statuses;
    }
    
    let eventsProcessed = 0;
    
    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        
        // Verificar se é um evento de progresso válido
        if (!event.__PROGRESS__ || !event.phase) {
          continue;
        }

        eventsProcessed++;

        // Encontrar a fase correspondente - melhorar matching
        let phaseIndex = -1;
        for (let i = 0; i < PHASES.length; i++) {
          const phaseName = PHASES[i];
          const phaseNumber = phaseName.split(':')[0].trim(); // Ex: "FASE 0"
          const eventPhaseNumber = event.phase.split(':')[0].trim(); // Ex: "FASE 0"
          
          // Matching mais flexível:
          // 1. Match exato
          // 2. Match por número da fase (FASE 0, FASE 1, etc)
          // 3. Match por substring
          if (event.phase === phaseName || 
              eventPhaseNumber === phaseNumber ||
              event.phase.includes(phaseName) || 
              phaseName.includes(event.phase)) {
            phaseIndex = i;
            break;
          }
        }
        
        if (phaseIndex === -1) {
          // Debug: fase não encontrada
          console.warn(`[DEBUG] Fase não encontrada para evento: ${event.phase}`);
          continue;
        }

        const phase = statuses[phaseIndex];
        
        // Atualizar status baseado no step
        if (event.step === 'start') {
          phase.status = 'running';
        } else if (event.step === 'complete') {
          phase.status = 'complete';
          // Tentar extrair duração da mensagem
          if (event.message) {
            const match = event.message.match(/\((\d+)ms\)/);
            if (match) {
              phase.duration = parseInt(match[1]);
            }
          }
        } else if (event.step === 'failed' || event.step === 'abort' || event.op === 'ERROR') {
          if (phase.status !== 'complete') {
            phase.status = 'failed';
          }
        } else if (event.step && phase.status === 'pending') {
          // Qualquer outro step indica que a fase começou
          phase.status = 'running';
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
        console.warn(`[DEBUG] Erro ao processar linha: ${line.substring(0, 50)}...`);
        continue;
      }
    }
    
    console.log(`[DEBUG] Processados ${eventsProcessed} eventos de progresso de ${lines.length} linhas`);
  } catch (e) {
    // Se não conseguir ler o arquivo, retornar status padrão
    console.error(`[DEBUG] Erro ao ler progress.ndjson: ${e}`);
    return statuses;
  }

  return statuses;
}

async function getDatabaseStats(pool: any): Promise<any> {
  try {
    const [restaurants, tables, orders, tasks, stockLevels, people] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM public.gm_restaurants WHERE name LIKE '%n5%' OR slug LIKE '%-n5'`),
      pool.query(`SELECT COUNT(*) as count FROM public.gm_tables t JOIN public.gm_restaurants r ON t.restaurant_id = r.id WHERE r.name LIKE '%n5%' OR r.slug LIKE '%-n5'`),
      pool.query(`SELECT COUNT(*) as count FROM public.gm_orders WHERE sync_metadata->>'test' = 'nivel5' OR sync_metadata->>'run_id' IS NOT NULL`),
      pool.query(`SELECT COUNT(*) as count FROM public.gm_tasks WHERE context->>'run_id' IS NOT NULL`),
      pool.query(`SELECT COUNT(*) as count FROM public.gm_stock_levels s JOIN public.gm_restaurants r ON s.restaurant_id = r.id WHERE r.name LIKE '%n5%' OR r.slug LIKE '%-n5'`),
      pool.query(`SELECT COUNT(*) as count FROM public.gm_people p JOIN public.gm_restaurants r ON p.restaurant_id = r.id WHERE r.name LIKE '%n5%' OR r.slug LIKE '%-n5'`),
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
    console.error(`[MONITOR] Erro ao buscar estatísticas do banco: ${e}`);
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

function getActiveFiles(runId: string | null): ActiveFile[] {
  const activeFiles: ActiveFile[] = [];
  
  if (!runId) {
    return activeFiles;
  }

  // ✅ CORREÇÃO: Ler eventos de progresso explícitos do arquivo progress.ndjson
  const progressFile = path.join(RESULTS_DIR, runId, 'progress.ndjson');
  
  if (!fs.existsSync(progressFile)) {
    return activeFiles;
  }

  try {
    const content = fs.readFileSync(progressFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // Pegar apenas os últimos 20 eventos mais recentes
    const recentEvents = lines.slice(-20).reverse();
    
    for (const line of recentEvents) {
      try {
        const event = JSON.parse(line);
        
        if (!event.__PROGRESS__ || !event.phase) {
          continue;
        }

        // Ignorar eventos de boot/init
        if (event.phase === 'BOOT' && event.step === 'init') {
          continue;
        }

        const phase = event.phase;
        let operation = event.op || 'INFO';
        let path = '';
        
        // Construir path baseado no tipo de evento
        if (event.resource) {
          path = event.resource;
        } else if (event.step) {
          path = event.step;
        } else {
          path = event.phase;
        }
        
        // Adicionar mensagem se houver progresso granular
        if (event.current !== undefined && event.total !== undefined) {
          path = `${path} (${event.current}/${event.total})`;
          if (event.message) {
            path = `${event.message}`;
          }
        } else if (event.message) {
          path = `${path}: ${event.message}`;
        }
        
        activeFiles.push({
          path,
          phase,
          operation,
          timestamp: new Date(event.timestamp),
        });
      } catch (e) {
        // Ignorar linhas inválidas
        continue;
      }
    }
  } catch (e) {
    // Se não conseguir ler o arquivo, retornar vazio
    return activeFiles;
  }
  
  // Retornar apenas os últimos 15 eventos únicos, ordenados por timestamp
  const unique = new Map<string, ActiveFile>();
  for (const file of activeFiles) {
    const key = `${file.path}-${file.operation}-${file.phase}`;
    if (!unique.has(key) || unique.get(key)!.timestamp < file.timestamp) {
      unique.set(key, file);
    }
  }
  
  return Array.from(unique.values())
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 15);
}

function createHTML(phases: PhaseStatus[], stats: any, startTime: Date, runId: string | null, activeFiles: ActiveFile[]): string {
  const elapsed = Date.now() - startTime.getTime();
  const completedPhases = phases.filter(p => p.status === 'complete').length;
  const totalPhases = phases.length;
  const progress = (completedPhases / totalPhases) * 100;
  
  // Debug: verificar se arquivo progress existe
  let debugInfo = '';
  if (runId) {
    const progressFile = path.join(RESULTS_DIR, runId, 'progress.ndjson');
    const fileExists = fs.existsSync(progressFile);
    let fileSize = 0;
    let fileLines = 0;
    if (fileExists) {
      try {
        const content = fs.readFileSync(progressFile, 'utf-8');
        fileSize = content.length;
        fileLines = content.split('\n').filter(l => l.trim()).length;
      } catch (e) {
        // Ignore
      }
    }
    debugInfo = `
      <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; font-size: 0.85em; color: #666;">
        <strong>🔍 Debug:</strong> 
        Arquivo progress.ndjson: ${fileExists ? '✅ Existe' : '❌ Não existe'} 
        ${fileExists ? `(${fileSize} bytes, ${fileLines} linhas)` : ''}
        <br>
        Caminho: ${progressFile}
      </div>
    `;
  }
  
  const expected = {
    restaurants: SCENARIO_EXTREME.totalRestaurants,
    tables: SCENARIO_EXTREME.totalTables,
    orders: SCENARIO_EXTREME.totalOrders,
    people: SCENARIO_EXTREME.totalPeople,
  };

  const currentPhase = phases.find(p => p.status === 'running');
  const isComplete = phases.every(p => p.status === 'complete');
  const hasFailed = phases.some(p => p.status === 'failed');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monitor - Teste Massivo Nível 5</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      text-align: center;
      color: #667eea;
      margin-bottom: 30px;
      font-size: 2.5em;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .header-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .info-item {
      background: rgba(255,255,255,0.2);
      padding: 10px;
      border-radius: 8px;
    }
    .info-label {
      font-size: 0.9em;
      opacity: 0.9;
    }
    .info-value {
      font-size: 1.3em;
      font-weight: bold;
      margin-top: 5px;
    }
    .progress-bar-container {
      background: #f0f0f0;
      border-radius: 10px;
      height: 30px;
      margin: 20px 0;
      overflow: hidden;
      position: relative;
    }
    .progress-bar {
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      height: 100%;
      transition: width 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
    }
    .phases {
      margin: 30px 0;
    }
    .phase {
      display: flex;
      align-items: center;
      padding: 15px;
      margin: 10px 0;
      border-radius: 10px;
      background: #f8f9fa;
      transition: all 0.3s ease;
    }
    .phase.pending { border-left: 4px solid #ccc; }
    .phase.running { border-left: 4px solid #17a2b8; background: #e7f3ff; }
    .phase.complete { border-left: 4px solid #28a745; background: #d4edda; }
    .phase.failed { border-left: 4px solid #dc3545; background: #f8d7da; }
    .phase-icon {
      font-size: 1.5em;
      margin-right: 15px;
      width: 30px;
      text-align: center;
    }
    .phase-name {
      flex: 1;
      font-weight: 500;
    }
    .phase-duration {
      color: #666;
      font-size: 0.9em;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .stat-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .stat-label {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 10px;
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #333;
    }
    .stat-progress {
      margin-top: 10px;
      background: #e0e0e0;
      border-radius: 5px;
      height: 8px;
      overflow: hidden;
    }
    .stat-progress-bar {
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      height: 100%;
      transition: width 0.3s ease;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 0.9em;
      font-weight: bold;
      margin-top: 10px;
    }
    .status-running { background: #17a2b8; color: white; }
    .status-complete { background: #28a745; color: white; }
    .status-failed { background: #dc3545; color: white; }
    .auto-refresh {
      text-align: center;
      color: #666;
      margin-top: 20px;
      font-size: 0.9em;
    }
    .active-files {
      margin: 30px 0;
      background: #f8f9fa;
      border-radius: 10px;
      padding: 20px;
    }
    .active-files h2 {
      color: #667eea;
      margin-bottom: 15px;
    }
    .file-item {
      display: flex;
      align-items: center;
      padding: 10px;
      margin: 5px 0;
      background: white;
      border-radius: 5px;
      border-left: 4px solid #667eea;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    .file-operation {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 0.8em;
      font-weight: bold;
      margin-right: 10px;
      min-width: 60px;
      text-align: center;
    }
    .op-INSERT { background: #d4edda; color: #155724; }
    .op-UPDATE { background: #fff3cd; color: #856404; }
    .op-SELECT { background: #d1ecf1; color: #0c5460; }
    .op-RPC { background: #e2e3e5; color: #383d41; }
    .op-EXECUTANDO { background: #cce5ff; color: #004085; }
    .op-ACESSO { background: #f8d7da; color: #721c24; }
    .op-COMPLETE { background: #d1ecf1; color: #0c5460; }
    .file-path {
      flex: 1;
      color: #333;
    }
    .file-phase {
      color: #666;
      font-size: 0.85em;
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Monitor - Teste Massivo Nível 5</h1>
    
    <div class="header">
      <div style="text-align: center; font-size: 1.2em; margin-bottom: 10px;">
        ${runId ? `🔍 Run ID: ${runId}` : '⏳ Aguardando início do teste...'}
      </div>
      ${debugInfo}
      <div class="header-info">
        <div class="info-item">
          <div class="info-label">⏱️ Tempo decorrido</div>
          <div class="info-value">${formatDuration(elapsed)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">📈 Progresso geral</div>
          <div class="info-value">${Math.round(progress)}%</div>
        </div>
        <div class="info-item">
          <div class="info-label">✅ Fases completas</div>
          <div class="info-value">${completedPhases} / ${totalPhases}</div>
        </div>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: ${progress}%">${Math.round(progress)}%</div>
      </div>
    </div>

    <div class="phases">
      <h2 style="margin-bottom: 20px; color: #667eea;">📋 FASES DO TESTE</h2>
      ${phases.map((phase, i) => {
        const icon = phase.status === 'complete' ? '✅' : 
                    phase.status === 'running' ? '🔄' : 
                    phase.status === 'failed' ? '❌' : '⏳';
        const duration = phase.duration ? ` (${formatDuration(phase.duration)})` : '';
        
        // Mostrar progresso granular se disponível
        let progressInfo = '';
        if (phase.current !== undefined && phase.total !== undefined) {
          const progressPercent = Math.min(100, Math.floor((phase.current / phase.total) * 100));
          progressInfo = `<div style="margin-top: 5px; font-size: 0.85em; color: #666;">
            <div style="background: #e0e0e0; border-radius: 5px; height: 6px; margin: 5px 0;">
              <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${progressPercent}%; transition: width 0.3s ease;"></div>
            </div>
            ${phase.current.toLocaleString()} / ${phase.total.toLocaleString()} (${progressPercent}%)
            ${phase.message ? `<div style="font-size: 0.8em; color: #999; margin-top: 3px;">${phase.message}</div>` : ''}
          </div>`;
        }
        
        return `
          <div class="phase ${phase.status}">
            <div class="phase-icon">${icon}</div>
            <div class="phase-name" style="flex: 1;">
              <div>${phase.name}</div>
              ${progressInfo}
            </div>
            <div class="phase-duration">${duration}</div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">🏪 Restaurantes</div>
        <div class="stat-value">${stats.restaurants.toLocaleString()} / ${expected.restaurants.toLocaleString()}</div>
        <div class="stat-progress">
          <div class="stat-progress-bar" style="width: ${Math.min(100, (stats.restaurants / expected.restaurants) * 100)}%"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">🪑 Mesas</div>
        <div class="stat-value">${stats.tables.toLocaleString()} / ${expected.tables.toLocaleString()}</div>
        <div class="stat-progress">
          <div class="stat-progress-bar" style="width: ${Math.min(100, (stats.tables / expected.tables) * 100)}%"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">📦 Pedidos</div>
        <div class="stat-value">${stats.orders.toLocaleString()} / ${expected.orders.toLocaleString()}</div>
        <div class="stat-progress">
          <div class="stat-progress-bar" style="width: ${Math.min(100, (stats.orders / expected.orders) * 100)}%"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">👥 Pessoas</div>
        <div class="stat-value">${stats.people.toLocaleString()} / ${expected.people.toLocaleString()}</div>
        <div class="stat-progress">
          <div class="stat-progress-bar" style="width: ${Math.min(100, (stats.people / expected.people) * 100)}%"></div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">✅ Tarefas</div>
        <div class="stat-value">${stats.tasks.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">📦 Estoque</div>
        <div class="stat-value">${stats.stockLevels.toLocaleString()}</div>
      </div>
    </div>

    <div class="active-files">
      <h2>📂 ARQUIVOS E OPERAÇÕES EM TEMPO REAL</h2>
      ${activeFiles.length > 0 ? activeFiles.slice().reverse().map(file => {
        const opClass = `op-${file.operation}`;
        return `
          <div class="file-item">
            <span class="file-operation ${opClass}">${file.operation}</span>
            <span class="file-path">${file.path}</span>
            <span class="file-phase">${file.phase}</span>
          </div>
        `;
      }).join('') : '<div style="text-align: center; color: #666; padding: 20px;">⏳ Aguardando atividade...</div>'}
    </div>

    ${currentPhase ? `
      <div style="text-align: center; margin: 30px 0;">
        <span class="status-badge status-running">🔄 Fase atual: ${currentPhase.name}</span>
      </div>
    ` : isComplete ? `
      <div style="text-align: center; margin: 30px 0;">
        <span class="status-badge status-complete">✅ TESTE COMPLETO!</span>
      </div>
    ` : hasFailed ? `
      <div style="text-align: center; margin: 30px 0;">
        <span class="status-badge status-failed">❌ TESTE FALHOU!</span>
      </div>
    ` : ''}

    <div class="auto-refresh">
      🔄 Atualização automática a cada 2 segundos
    </div>
  </div>

    <script>
    // Auto-refresh a cada 2 segundos
    let refreshInterval = setInterval(() => {
      location.reload();
    }, 2000);
    
    // Parar refresh se teste completo ou falhou
    ${isComplete || hasFailed ? 'clearInterval(refreshInterval);' : ''}
  </script>
</body>
</html>`;
}

async function main() {
  const pool = getDbPool();
  const startTime = new Date();
  
  const server = http.createServer(async (req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      try {
        const runId = getLatestRunId();
        const phases = getPhaseStatus(runId);
        const stats = await getDatabaseStats(pool);
        const activeFiles = getActiveFiles(runId);
        const html = createHTML(phases, stats, startTime, runId, activeFiles);
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Erro: ${error.message}`);
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  server.listen(PORT, () => {
    console.log(`🚀 Monitor web iniciado!`);
    console.log(`📊 Acesse: http://localhost:${PORT}`);
    console.log(`\n💡 Pressione Ctrl+C para parar\n`);
  });

  process.on('SIGINT', () => {
    console.log('\n👋 Encerrando monitor...');
    pool.end();
    server.close();
    process.exit(0);
  });
}

main().catch(console.error);
