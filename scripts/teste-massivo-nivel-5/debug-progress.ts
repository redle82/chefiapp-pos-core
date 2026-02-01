/**
 * Script de diagnóstico - Verifica se progress.ndjson está sendo criado
 */

import * as fs from 'fs';
import * as path from 'path';

const RESULTS_DIR = path.join(process.cwd(), 'test-results', 'NIVEL_5');

function getLatestRunId(): string | null {
  if (fs.existsSync(RESULTS_DIR)) {
    const dirs = fs.readdirSync(RESULTS_DIR)
      .filter(d => d !== 'logs' && fs.statSync(path.join(RESULTS_DIR, d)).isDirectory())
      .sort()
      .reverse();
    
    if (dirs.length > 0) {
      return dirs[0];
    }
  }
  return null;
}

function main() {
  const runId = getLatestRunId();
  
  if (!runId) {
    console.log('❌ Nenhum run_id encontrado');
    return;
  }
  
  console.log(`🔍 Run ID: ${runId}`);
  console.log('');
  
  const progressFile = path.join(RESULTS_DIR, runId, 'progress.ndjson');
  
  if (!fs.existsSync(progressFile)) {
    console.log(`❌ Arquivo progress.ndjson NÃO existe: ${progressFile}`);
    console.log('');
    console.log('📁 Conteúdo do diretório:');
    const dir = path.join(RESULTS_DIR, runId);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach(f => {
        const filePath = path.join(dir, f);
        const stats = fs.statSync(filePath);
        console.log(`  - ${f} (${stats.size} bytes, modificado: ${stats.mtime})`);
      });
    }
    return;
  }
  
  console.log(`✅ Arquivo progress.ndjson existe: ${progressFile}`);
  
  const stats = fs.statSync(progressFile);
  console.log(`   Tamanho: ${stats.size} bytes`);
  console.log(`   Modificado: ${stats.mtime}`);
  console.log('');
  
  try {
    const content = fs.readFileSync(progressFile, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    
    console.log(`📊 Total de linhas: ${lines.length}`);
    console.log('');
    
    if (lines.length === 0) {
      console.log('⚠️  Arquivo está vazio!');
      return;
    }
    
    console.log('📋 Últimos 10 eventos:');
    console.log('');
    
    const lastEvents = lines.slice(-10);
    lastEvents.forEach((line, i) => {
      try {
        const event = JSON.parse(line);
        if (event.__PROGRESS__) {
          console.log(`${i + 1}. [${new Date(event.timestamp).toLocaleTimeString()}] ${event.phase} - ${event.step || 'N/A'} - ${event.message || 'N/A'}`);
          if (event.current !== undefined && event.total !== undefined) {
            console.log(`   Progresso: ${event.current}/${event.total}`);
          }
        }
      } catch (e) {
        console.log(`${i + 1}. [ERRO] Linha inválida: ${line.substring(0, 50)}...`);
      }
    });
    
    console.log('');
    console.log('🔍 Análise de fases:');
    const phases = new Map<string, number>();
    lines.forEach(line => {
      try {
        const event = JSON.parse(line);
        if (event.__PROGRESS__ && event.phase) {
          phases.set(event.phase, (phases.get(event.phase) || 0) + 1);
        }
      } catch (e) {
        // Ignore
      }
    });
    
    phases.forEach((count, phase) => {
      console.log(`  - ${phase}: ${count} eventos`);
    });
    
  } catch (e) {
    console.error(`❌ Erro ao ler arquivo: ${e}`);
  }
}

main();
