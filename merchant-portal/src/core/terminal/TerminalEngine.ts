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
        console.warn("[TerminalEngine] Falha ao enviar heartbeat:", error);
      }
    } catch (err) {
      console.error("[TerminalEngine] Erro crítico no heartbeat:", err);
    }
  }
}
