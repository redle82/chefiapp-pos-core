/**
 * Progress Bus (v1) — Teste Massivo Nível 5
 *
 * Em vez de inferir progresso a partir de logs (que podem ficar buffered),
 * emitimos eventos explícitos (NDJSON) para um arquivo por run_id.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { TestContext } from './types';

export type ProgressEvent = {
  phase: string;
  step?: string;
  current?: number;
  total?: number;
  message?: string;
  /** Recurso/“arquivo” observado (ex: public.gm_restaurants, RPC: create_order_atomic) */
  resource?: string;
  /** Tipo de operação (ex: INSERT/UPDATE/SELECT/RPC/EXEC) */
  op?: 'INSERT' | 'UPDATE' | 'SELECT' | 'RPC' | 'EXEC' | 'INFO' | 'WARN' | 'ERROR';
  timestamp: number;
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function progressFilePathFromContext(context: TestContext): string | null {
  const runId = context.metadata?.run_id;
  if (!runId) return null;
  const resultsDir = path.join(process.cwd(), 'test-results', 'NIVEL_5', runId);
  return path.join(resultsDir, 'progress.ndjson');
}

export function initProgressBus(context: TestContext): string | null {
  const runId = context.metadata?.run_id;
  if (!runId) {
    console.error('[PROGRESS] initProgressBus: run_id não encontrado no context.metadata');
    return null;
  }

  const resultsDir = path.join(process.cwd(), 'test-results', 'NIVEL_5', runId);
  try {
    ensureDir(resultsDir);
    console.log(`[PROGRESS] Diretório criado/verificado: ${resultsDir}`);
  } catch (e) {
    console.error(`[PROGRESS] Erro ao criar diretório: ${e}`);
    return null;
  }

  const filePath = path.join(resultsDir, 'progress.ndjson');
  context.metadata.progress_file = filePath;

  try {
    // “Cabeçalho” (1 linha)
    fs.appendFileSync(
      filePath,
      JSON.stringify({
        __PROGRESS__: true,
        phase: 'BOOT',
        step: 'init',
        op: 'INFO',
        message: `Progress Bus iniciado (run_id=${runId})`,
        timestamp: Date.now(),
      }) + '\n'
    );
    console.log(`[PROGRESS] Arquivo progress.ndjson criado: ${filePath}`);
  } catch (e) {
    console.error(`[PROGRESS] Erro ao criar arquivo progress.ndjson: ${e}`);
    return null;
  }

  return filePath;
}

export function emitProgress(context: TestContext, partial: Omit<ProgressEvent, 'timestamp'>) {
  const evt: ProgressEvent = {
    ...partial,
    timestamp: Date.now(),
  };

  const progressLine = JSON.stringify({ __PROGRESS__: true, ...evt }) + '\n';

  // ✅ CRÍTICO: Escrever em stdout com flush forçado
  try {
    fs.writeSync(1, progressLine);
  } catch (e) {
    process.stdout.write(progressLine);
  }

  // ✅ CORREÇÃO DEFINITIVA: Sempre tentar escrever no arquivo
  // Se progress_file não estiver no metadata, usar run_id para encontrar
  let filePath = context.metadata?.progress_file as string | undefined;
  
  if (!filePath) {
    filePath = progressFilePathFromContext(context) ?? undefined;
  }
  
  // Se ainda não tiver, tentar criar baseado no run_id
  if (!filePath && context.metadata?.run_id) {
    const runId = context.metadata.run_id;
    const resultsDir = path.join(process.cwd(), 'test-results', 'NIVEL_5', runId);
    filePath = path.join(resultsDir, 'progress.ndjson');
    
    // Garantir que o diretório existe
    ensureDir(resultsDir);
    
    // Salvar no metadata para próximas chamadas
    context.metadata.progress_file = filePath;
  }

  // Escrever no arquivo se tiver caminho válido
  if (filePath) {
    try {
      fs.appendFileSync(filePath, progressLine);
    } catch (e) {
      // Se falhar, tentar criar o arquivo do zero
      try {
        ensureDir(path.dirname(filePath));
        fs.writeFileSync(filePath, progressLine, { flag: 'a' });
      } catch (e2) {
        console.error(`[PROGRESS] Erro crítico ao escrever progress: ${e2}`);
      }
    }
  }
}

