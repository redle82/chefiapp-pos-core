/**
 * CENTRAL DE COMANDO DO CHEFIAPP
 *
 * Sistema nervoso visível do Restaurant Operating System
 * Integra todas as camadas de monitoramento em uma interface unificada
 */

import * as http from "http";
import * as path from "path";
import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { getDbPool } from "../db";
import { collectDatabaseMetrics } from "./collectors/database";
import { collectEventSystemMetrics } from "./collectors/events";
import { collectInfrastructureMetrics } from "./collectors/infrastructure";
import { collectOperationMetrics } from "./collectors/operation";
import { collectTaskEngineMetrics } from "./collectors/tasks";
import { collectUsersMetrics } from "./collectors/users";
import {
  getActiveFiles,
  getLatestRunId,
  getPhaseStatus,
} from "./test-progress";
import { createHTML } from "./ui/html";
import { getViewConfig, type ViewMode } from "./views/index";

const PORT = 4321;
const RESULTS_DIR = path.join(process.cwd(), "test-results", "NIVEL_5");

// Docker events streaming (tempo real)
let dockerEventsProcess: ChildProcessWithoutNullStreams | null = null;
const dockerEventClients: http.ServerResponse[] = [];

// RBAC básico por token
type Role = "engineering" | "owner" | "audit";

function getTokenRole(token: string | null): Role | null {
  if (!token) return null;

  const eng = process.env.CENTRAL_TOKEN_ENGINEERING;
  const owner = process.env.CENTRAL_TOKEN_OWNER;
  const audit = process.env.CENTRAL_TOKEN_AUDIT;

  if (!eng && !owner && !audit) {
    // RBAC desabilitado se nenhum token estiver configurado
    return null;
  }

  if (eng && token === eng) return "engineering";
  if (owner && token === owner) return "owner";
  if (audit && token === audit) return "audit";

  return null;
}

function isAuthorized(viewMode: ViewMode, role: Role | null): boolean {
  const eng = process.env.CENTRAL_TOKEN_ENGINEERING;
  const owner = process.env.CENTRAL_TOKEN_OWNER;
  const audit = process.env.CENTRAL_TOKEN_AUDIT;

  // Se nenhum token estiver configurado, RBAC desligado
  if (!eng && !owner && !audit) return true;

  if (!role) return false;

  switch (viewMode) {
    case "laboratory":
    case "operational":
      // Apenas engenharia
      return role === "engineering";
    case "executive":
      // Dono ou engenharia
      return role === "owner" || role === "engineering";
    case "owner":
      return role === "owner";
    case "audit":
      // Auditoria ou engenharia
      return role === "audit" || role === "engineering";
    default:
      return false;
  }
}

function startDockerEventsStream() {
  if (dockerEventsProcess) {
    return;
  }

  try {
    dockerEventsProcess = spawn("docker", ["events", "--format", "{{json .}}"]);

    dockerEventsProcess.stdout.on("data", (data: Buffer) => {
      const lines = data
        .toString("utf-8")
        .split("\n")
        .filter((l) => l.trim().length > 0);

      for (const line of lines) {
        const payload = `data: ${line.trim()}\n\n`;
        for (const client of dockerEventClients) {
          try {
            client.write(payload);
          } catch {
            // ignore broken pipes, cleanup happens on 'close'
          }
        }
      }
    });

    dockerEventsProcess.stderr.on("data", (data: Buffer) => {
      const msg = data.toString("utf-8").trim();
      if (!msg) return;
      const payload = `data: ${JSON.stringify({
        error: msg,
      })}\n\n`;
      for (const client of dockerEventClients) {
        try {
          client.write(payload);
        } catch {
          // ignore
        }
      }
    });

    dockerEventsProcess.on("exit", () => {
      dockerEventsProcess = null;
    });
  } catch (e) {
    console.error("[CENTRAL] Erro ao iniciar docker events:", e);
  }
}

export interface CentralCommandMetrics {
  infrastructure: any;
  database: any;
  events: any;
  tasks: any;
  operation: any;
  users: any;
  testProgress: any;
  timestamp: Date;
}

// Timeout helper
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  defaultValue: T,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(defaultValue), timeoutMs);
    }),
  ]);
}

async function collectAllMetrics(
  pool: any,
  viewMode: ViewMode,
): Promise<CentralCommandMetrics> {
  const config = getViewConfig(viewMode);

  // Coletar métricas em paralelo com timeout (apenas as permitidas)
  const collectors: Promise<any>[] = [];
  const TIMEOUT = 5000; // 5 segundos por coletor

  if (
    config.allowedMetrics.includes("*") ||
    config.allowedMetrics.includes("infrastructure")
  ) {
    collectors.push(
      withTimeout(collectInfrastructureMetrics(), TIMEOUT, null).catch((e) => {
        console.error("[CENTRAL] Erro ao coletar infraestrutura:", e);
        return null;
      }),
    );
  } else {
    collectors.push(Promise.resolve(null));
  }

  if (
    config.allowedMetrics.includes("*") ||
    config.allowedMetrics.includes("database")
  ) {
    collectors.push(
      withTimeout(collectDatabaseMetrics(pool), TIMEOUT, null).catch((e) => {
        console.error("[CENTRAL] Erro ao coletar banco:", e);
        return null;
      }),
    );
  } else {
    collectors.push(Promise.resolve(null));
  }

  if (
    config.allowedMetrics.includes("*") ||
    config.allowedMetrics.includes("events")
  ) {
    collectors.push(
      withTimeout(collectEventSystemMetrics(pool), TIMEOUT, null).catch((e) => {
        console.error("[CENTRAL] Erro ao coletar eventos:", e);
        return null;
      }),
    );
  } else {
    collectors.push(Promise.resolve(null));
  }

  // Progresso do teste (sempre coletar - rápido) - usado para filtrar tasks por run_id
  const runId = getLatestRunId();

  if (
    config.allowedMetrics.includes("*") ||
    config.allowedMetrics.includes("tasks")
  ) {
    collectors.push(
      withTimeout(collectTaskEngineMetrics(pool, runId), TIMEOUT, null).catch((e) => {
        console.error("[CENTRAL] Erro ao coletar tasks:", e);
        return null;
      }),
    );
  } else {
    collectors.push(Promise.resolve(null));
  }

  if (
    config.allowedMetrics.includes("*") ||
    config.allowedMetrics.includes("operation")
  ) {
    collectors.push(
      withTimeout(collectOperationMetrics(pool), TIMEOUT, null).catch((e) => {
        console.error("[CENTRAL] Erro ao coletar operação:", e);
        return null;
      }),
    );
  } else {
    collectors.push(Promise.resolve(null));
  }

  if (
    config.allowedMetrics.includes("*") ||
    config.allowedMetrics.includes("users")
  ) {
    collectors.push(
      withTimeout(collectUsersMetrics(pool), TIMEOUT, null).catch((e) => {
        console.error("[CENTRAL] Erro ao coletar usuários:", e);
        return null;
      }),
    );
  } else {
    collectors.push(Promise.resolve(null));
  }

  const [infrastructure, database, events, tasks, operation, users] =
    await Promise.all(collectors);

  // Progresso do teste (sempre coletar - rápido)
  // Nota: runId já foi coletado acima para filtrar tasks
  const testProgress = {
    runId,
    phases: getPhaseStatus(runId),
    activeFiles: getActiveFiles(runId),
  };

  return {
    infrastructure,
    database,
    events,
    tasks,
    operation,
    users,
    testProgress,
    timestamp: new Date(),
  };
}

async function main() {
  const pool = getDbPool();
  const startTime = new Date();

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://${req.headers.host}`);
      const viewMode = (url.searchParams.get("mode") ||
        "laboratory") as ViewMode;

      // Extrair token (query ou header)
      const tokenFromQuery = url.searchParams.get("token");
      const tokenFromHeader =
        (req.headers["x-central-token"] as string | undefined) ?? null;
      const token = tokenFromQuery || tokenFromHeader || null;
      const role = getTokenRole(token);

      // Proteção mínima também para streams:
      // usam mesma regra de laboratório (engenharia) se RBAC estiver ligado.

      // Stream em tempo real de eventos Docker (SSE) - sem timeout
      if (url.pathname === "/stream/docker-events") {
        if (!isAuthorized("laboratory", role)) {
          res.writeHead(401, { "Content-Type": "text/plain" });
          res.end("Unauthorized");
          return;
        }

        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        res.write(":\n\n"); // comentário inicial para abrir o stream

        dockerEventClients.push(res);
        startDockerEventsStream();

        req.on("close", () => {
          const idx = dockerEventClients.indexOf(res);
          if (idx >= 0) {
            dockerEventClients.splice(idx, 1);
          }
        });

        return;
      }

      // Stream em tempo real de progresso de teste (SSE) - sem timeout
      if (url.pathname === "/stream/test-progress") {
        if (!isAuthorized("laboratory", role)) {
          res.writeHead(401, { "Content-Type": "text/plain" });
          res.end("Unauthorized");
          return;
        }

        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        res.write(":\n\n");

        // Enviar primeiro evento imediatamente
        try {
          const initialRunId = getLatestRunId();
          const initialPayload = {
            runId: initialRunId,
            phases: getPhaseStatus(initialRunId),
            activeFiles: getActiveFiles(initialRunId),
            timestamp: new Date().toISOString(),
          };
          res.write(`data: ${JSON.stringify(initialPayload)}\n\n`);
        } catch (e) {
          console.error("[CENTRAL] Error sending initial test progress:", e);
        }

        const interval = setInterval(() => {
          try {
            const runId = getLatestRunId();
            const payload = {
              runId,
              phases: getPhaseStatus(runId),
              activeFiles: getActiveFiles(runId),
              timestamp: new Date().toISOString(),
            };
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
          } catch (e) {
            // Se falhar, enviar payload vazio para manter conexão
            try {
              res.write(`data: ${JSON.stringify({
                runId: null,
                phases: [],
                activeFiles: [],
                timestamp: new Date().toISOString(),
                error: "Failed to read progress"
              })}\n\n`);
            } catch {
              // Conexão fechada, limpar intervalo
              clearInterval(interval);
            }
          }
        }, 1000);

        req.on("close", () => {
          clearInterval(interval);
        });

        return;
      }

      // Timeout total de 10 segundos para a requisição (apenas rotas normais)
      const requestTimeout = setTimeout(() => {
        if (!res.headersSent) {
          res.writeHead(504, { "Content-Type": "text/plain" });
          res.end("Timeout: Coleta de métricas demorou muito");
        }
      }, 10000);

      try {
        // Checar autorização para demais rotas HTML / API
        if (!isAuthorized(viewMode, role)) {
          clearTimeout(requestTimeout);
          if (!res.headersSent) {
            res.writeHead(401, { "Content-Type": "text/plain" });
            res.end("Unauthorized");
          }
          return;
        }

        if (url.pathname === "/" || url.pathname === "/index.html") {
          const metrics = await collectAllMetrics(pool, viewMode);
          clearTimeout(requestTimeout);

          if (!res.headersSent) {
            const html = createHTML(metrics, viewMode, startTime);
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(html);
          }
        } else if (url.pathname === "/api/metrics") {
          const metrics = await collectAllMetrics(pool, viewMode);
          clearTimeout(requestTimeout);

          if (!res.headersSent) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(metrics));
          }
        } else {
          clearTimeout(requestTimeout);
          if (!res.headersSent) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not Found");
          }
        }
      } catch (error: any) {
        clearTimeout(requestTimeout);
        if (!res.headersSent) {
          console.error("[CENTRAL] Erro no servidor:", error);
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end(`Erro: ${error.message}`);
        }
      }
    } catch (error: any) {
      console.error("[CENTRAL] Erro ao processar requisição:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(`Erro: ${error.message}`);
      }
    }
  });

  server.listen(PORT, () => {
    console.log(
      "╔═══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║     🎯 CENTRAL DE COMANDO DO CHEFIAPP - ATIVO                ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════════╝",
    );
    console.log("");
    console.log(`📊 Acesse: http://localhost:${PORT}`);
    console.log(`🏠 Modo Dono: http://localhost:${PORT}?mode=owner`);
    console.log(
      `🧪 Modo Laboratório: http://localhost:${PORT}?mode=laboratory`,
    );
    console.log(
      `🧠 Modo Operacional: http://localhost:${PORT}?mode=operational`,
    );
    console.log(`👔 Modo Executivo: http://localhost:${PORT}?mode=executive`);
    console.log(`⚖️  Modo Auditoria: http://localhost:${PORT}?mode=audit`);
    console.log("");
    console.log("💡 Pressione Ctrl+C para parar");
    console.log("");
  });

  process.on("SIGINT", () => {
    console.log("\n👋 Encerrando Central de Comando...");
    pool.end();
    server.close();
    process.exit(0);
  });
}

main().catch(console.error);
