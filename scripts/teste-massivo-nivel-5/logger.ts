/**
 * LOGGER - Teste Massivo Nível 5
 * 
 * Sistema centralizado de logging para todas as fases.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { TestLogger } from './types';

const LOGS_DIR = path.join(process.cwd(), 'test-results', 'NIVEL_5', 'logs');

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

export class Logger implements TestLogger {
  private logFile: string;
  private logBuffer: string[] = [];

  constructor(phase: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(LOGS_DIR, `test-n5-${phase}-${timestamp}.log`);
  }

  log(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO'): void {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}`;
    this.logBuffer.push(logLine);
    
    // Console output com cores
    const colors = {
      INFO: '\x1b[36m',   // Cyan
      WARN: '\x1b[33m',   // Yellow
      ERROR: '\x1b[31m',  // Red
      RESET: '\x1b[0m',
    };
    
    console.log(`${colors[level]}${logLine}${colors.RESET}`);
  }

  flush(): void {
    fs.writeFileSync(this.logFile, this.logBuffer.join('\n'));
  }

  getLogPath(): string {
    return this.logFile;
  }
}
