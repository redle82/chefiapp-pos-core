import { v4 as uuidv4 } from "uuid";
import { dockerCoreClient } from "../../core-boundary/docker-core/connection";

export type TerminalType = "TPV" | "KDS" | "WAITER" | "BACKOFFICE" | "ADMIN";

export interface TerminalMetadata {
  userAgent?: string;
  appVersion?: string;
  ip?: string;
}

export class TerminalEngine {
  private static STORAGE_KEY = "chefiapp_terminal_id";
  /** Evita spam na consola quando o Core está em baixo (404). */
  private static _loggedCoreUnavailable = false;
  /** Após 404/indisponível, deixa de enviar heartbeats nesta sessão (evita Failed to load resource repetidos). */
  private static _skipHeartbeatCoreUnavailable = false;

  /**
   * Obtém ou gera um ID único persistente para este terminal (browser/device)
   */
  static getTerminalId(): string {
    let id = localStorage.getItem(this.STORAGE_KEY);
    if (!id) {
      id = uuidv4();
      localStorage.setItem(this.STORAGE_KEY, id);
    }
    return id;
  }

  /**
   * Envia um sinal de vida (heartbeat) para o Core
   */
  static async sendHeartbeat(options: {
    restaurantId: string;
    type: TerminalType;
    name: string;
    metadata?: TerminalMetadata;
  }): Promise<void> {
    if (TerminalEngine._skipHeartbeatCoreUnavailable) return;

    const id = this.getTerminalId();
    const { restaurantId, type, name, metadata = {} } = options;

    const payload = {
      id,
      restaurant_id: restaurantId,
      type,
      name,
      last_heartbeat_at: new Date().toISOString(),
      metadata: {
        ...metadata,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        timestamp: Date.now(),
      },
    };

    try {
      // Usamos upsert para registrar ou atualizar o terminal
      const { error } = await dockerCoreClient
        .from("gm_terminals")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        const err = error as { message?: string; code?: string };
        const msg = String(err?.message ?? "").toLowerCase();
        const isCoreUnavailable =
          msg.includes("not found") ||
          msg.includes("backend indisponível") ||
          err?.code === "BACKEND_UNAVAILABLE";
        if (isCoreUnavailable) {
          TerminalEngine._skipHeartbeatCoreUnavailable = true;
          if (!TerminalEngine._loggedCoreUnavailable) {
            TerminalEngine._loggedCoreUnavailable = true;
            console.debug(
              "[TerminalEngine] Core indisponível (gm_terminals); heartbeats pausados nesta sessão."
            );
          }
        } else if (!isCoreUnavailable) {
          console.warn("[TerminalEngine] Falha ao enviar heartbeat:", error);
        }
      }
    } catch (err) {
      console.error("[TerminalEngine] Erro crítico no heartbeat:", err);
    }
  }
}
