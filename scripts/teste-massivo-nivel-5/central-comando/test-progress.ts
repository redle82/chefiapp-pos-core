/**
 * Funções auxiliares para progresso de testes
 * (Reutiliza lógica do monitor-web.ts)
 */

import * as fs from "fs";
import * as path from "path";

const RESULTS_DIR = path.join(process.cwd(), "test-results", "NIVEL_5");

export interface PhaseStatus {
  name: string;
  status: "pending" | "running" | "complete" | "failed";
  duration?: number;
  current?: number;
  total?: number;
  message?: string;
  lastUpdate?: Date;
}

export interface ActiveFile {
  path: string;
  phase: string;
  operation: string;
  timestamp: Date;
}

const PHASES = [
  "FASE 0: Preflight",
  "FASE 1: Setup Massivo",
  "FASE 2: Pedidos Caos",
  "FASE 3: KDS Stress",
  "FASE 4: Task Extreme",
  "FASE 5: Estoque Cascata",
  "FASE 6: Multi-Dispositivo",
  "FASE 7: Time Warp",
  "FASE 8: Relatório Final",
];

export function getLatestRunId(): string | null {
  if (!fs.existsSync(RESULTS_DIR)) {
    return null;
  }

  try {
    const dirs = fs
      .readdirSync(RESULTS_DIR)
      .filter((d) => {
        if (d === "logs") return false;
        const dirPath = path.join(RESULTS_DIR, d);
        if (!fs.statSync(dirPath).isDirectory()) return false;
        
        const progressPath = path.join(dirPath, "progress.ndjson");
        // Aceitar arquivo mesmo se recém-criado (pode estar vazio ainda)
        return fs.existsSync(progressPath);
      })
      .map((d) => {
        const progressPath = path.join(RESULTS_DIR, d, "progress.ndjson");
        try {
          // Use progress.ndjson file mtime for accurate ordering
          const stats = fs.statSync(progressPath);
          const mtime = stats.mtime.getTime();
          // Priorizar arquivos que foram modificados nos últimos 30 minutos
          // (runs ativos) sobre runs antigos
          const isRecent = Date.now() - mtime < 30 * 60 * 1000;
          return { name: d, mtime, isRecent };
        } catch {
          return null;
        }
      })
      .filter((d): d is { name: string; mtime: number; isRecent: boolean } => d !== null)
      .sort((a, b) => {
        // Runs recentes primeiro, depois por mtime
        if (a.isRecent !== b.isRecent) {
          return a.isRecent ? -1 : 1;
        }
        return b.mtime - a.mtime;
      });

    if (dirs.length > 0) {
      const selected = dirs[0];
      // Log apenas se mudou de run ou a cada 10 chamadas (evitar spam)
      if (!getLatestRunId._lastRunId || getLatestRunId._lastRunId !== selected.name) {
        console.log(
          `[TEST-PROGRESS] Using run ID: ${selected.name} (mtime: ${new Date(
            selected.mtime,
          ).toISOString()}, recent: ${selected.isRecent})`,
        );
        getLatestRunId._lastRunId = selected.name;
      }
      return selected.name;
    }
  } catch (e) {
    console.error("[TEST-PROGRESS] Error getting latest run ID:", e);
  }

  return null;
}

// Cache interno para evitar logs repetidos
getLatestRunId._lastRunId = null as string | null;

export function getPhaseStatus(runId: string | null): PhaseStatus[] {
  const statuses: PhaseStatus[] = PHASES.map((name) => ({
    name,
    status: "pending" as const,
  }));

  if (!runId) {
    return statuses;
  }

  const progressFile = path.join(RESULTS_DIR, runId, "progress.ndjson");

  if (!fs.existsSync(progressFile)) {
    return statuses;
  }

  try {
    const content = fs.readFileSync(progressFile, "utf-8");
    const lines = content.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      try {
        const event = JSON.parse(line);

        if (!event.__PROGRESS__ || !event.phase) {
          continue;
        }

        const phaseIndex = PHASES.findIndex((p) => {
          const phaseNumber = p.split(":")[0].trim();
          const eventPhaseNumber = event.phase.split(":")[0].trim();
          return (
            event.phase === p ||
            eventPhaseNumber === phaseNumber ||
            event.phase.includes(p) ||
            p.includes(event.phase)
          );
        });

        if (phaseIndex === -1) {
          continue;
        }

        const phase = statuses[phaseIndex];

        if (event.step === "start") {
          phase.status = "running";
        } else if (event.step === "complete") {
          phase.status = "complete";
          if (event.message) {
            const match = event.message.match(/\((\d+)ms\)/);
            if (match) {
              phase.duration = parseInt(match[1]);
            }
          }
        } else if (
          event.step === "failed" ||
          event.step === "abort" ||
          event.op === "ERROR"
        ) {
          // Sempre sobrescrever para failed, mesmo se antes marcou complete.
          // Caso típico: FASE 2 completou parcialmente e abortou por erro crítico.
          phase.status = "failed";
        } else if (event.step && phase.status === "pending") {
          phase.status = "running";
        }

        if (event.current !== undefined && event.total !== undefined) {
          // Prefer higher totals (e.g., order count 1000 vs day count 7)
          // This ensures we show order progress instead of day progress
          if (phase.total === undefined || event.total >= phase.total) {
            phase.current = event.current;
            phase.total = event.total;
            phase.message = event.message;
            phase.lastUpdate = new Date(event.timestamp);
          }
        }
      } catch (e) {
        continue;
      }
    }
  } catch (e) {
    return statuses;
  }

  return statuses;
}

export function getActiveFiles(runId: string | null): ActiveFile[] {
  const activeFiles: ActiveFile[] = [];

  if (!runId) {
    return activeFiles;
  }

  const progressFile = path.join(RESULTS_DIR, runId, "progress.ndjson");

  if (!fs.existsSync(progressFile)) {
    return activeFiles;
  }

  try {
    const content = fs.readFileSync(progressFile, "utf-8");
    const lines = content.split("\n").filter((line) => line.trim());
    const recentEvents = lines.slice(-20).reverse();

    for (const line of recentEvents) {
      try {
        const event = JSON.parse(line);

        if (!event.__PROGRESS__ || !event.phase) {
          continue;
        }

        if (event.phase === "BOOT" && event.step === "init") {
          continue;
        }

        const phase = event.phase;
        let operation = event.op || "INFO";
        let path = "";

        if (event.resource) {
          path = event.resource;
        } else if (event.step) {
          path = event.step;
        } else {
          path = event.phase;
        }

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
        continue;
      }
    }
  } catch (e) {
    return activeFiles;
  }

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
