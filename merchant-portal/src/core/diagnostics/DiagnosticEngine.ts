// Diagnostics + auth getSession (Core/supabase alias)
import { getTableClient } from "../infra/coreRpc";
import { Logger } from "../logger";
import { getTabIsolated, setTabIsolated } from "../storage/TabIsolatedStorage";
import type { DiagnosticEvent, DiagnosticReport } from "./types";

const MAX_BUFFER_SIZE = 200;
const STORAGE_KEY = "gm_diagnostic_buffer";

// Environment Check
const isBrowser =
  typeof window !== "undefined" &&
  typeof localStorage !== "undefined" &&
  typeof navigator !== "undefined";

class DiagnosticEngineClass {
  private eventBuffer: DiagnosticEvent[] = [];
  private static instance: DiagnosticEngineClass;

  // Made public for internal lazy getter, but generally accessed via wrapper
  public constructor() {
    this.loadBuffer();
  }

  public static getInstance(): DiagnosticEngineClass {
    if (!DiagnosticEngineClass.instance) {
      DiagnosticEngineClass.instance = new DiagnosticEngineClass();
    }
    return DiagnosticEngineClass.instance;
  }

  // --- Sentinel Mode ---
  private rateLimitMap = new Map<string, number>();

  public emit(
    code: string,
    title: string,
    metricType: DiagnosticEvent["metricType"],
    technicalDetails?: any,
    userMessage?: string,
  ) {
    try {
      // 1. Rate Limit (Anti-Flood) - Max 1 event per code every 2 seconds
      const now = Date.now();
      const lastEmit = this.rateLimitMap.get(code) || 0;
      if (now - lastEmit < 2000) return;
      this.rateLimitMap.set(code, now);

      // 2. Sanitization (Anti-Leak)
      const safeDetails = this.sanitize(technicalDetails);

      const event: DiagnosticEvent = {
        code,
        title,
        metricType,
        userMessage,
        technicalDetails: safeDetails,
        timestamp: new Date().toISOString(),
      };

      this.pushToBuffer(event);
      this.logConsole(event);

      // 3. Remote Sync (Critical Only)
      if (metricType === "error" || metricType === "security") {
        this.syncToEmpire(event);
      }
    } catch (e) {
      // Failsafe: Logger should never crash the app
      Logger.error("DiagnosticEngine Fault", e);
    }
  }

  private pushToBuffer(event: DiagnosticEvent) {
    this.eventBuffer.unshift(event);
    if (this.eventBuffer.length > MAX_BUFFER_SIZE) {
      this.eventBuffer.pop();
    }
    this.saveBuffer();
  }

  private loadBuffer() {
    if (!isBrowser) return;
    try {
      const saved = getTabIsolated(STORAGE_KEY);
      if (saved) {
        this.eventBuffer = JSON.parse(saved);
      }
    } catch (e) {}
  }

  private saveBuffer() {
    if (!isBrowser) return;
    try {
      setTabIsolated(STORAGE_KEY, JSON.stringify(this.eventBuffer));
    } catch (e) {}
  }

  // --- Reporting ---

  public generateReport(): DiagnosticReport {
    return {
      events: this.eventBuffer.slice(0, 50), // Limit export to 50 recent events
      systemStatus: {
        status: "ok",
        activeFlags: {},
        version: "1.0.0",
        userAgent: isBrowser ? navigator.userAgent : "non-browser",
      },
      generatedAt: new Date().toISOString(),
    };
  }

  // --- Sync ---

  private async syncToEmpire(event: DiagnosticEvent) {
    try {
      // Auth only (getSession); diagnostics insert via getTableClient
      const { supabase } = await import("../supabase");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const client = await getTableClient();
      await client.from("gm_diagnostics").insert({
        code: event.code,
        title: event.title,
        metric_type: event.metricType,
        details: event.technicalDetails,
        user_id: session?.user?.id,
      });
    } catch (err) {}
  }

  // --- Utils ---

  private sanitize(data: any): any {
    if (!data) return {};
    try {
      const str = JSON.stringify(data, (key, value) => {
        // Redact Sensitive Keys
        if (/token|password|secret|key|authorization/i.test(key))
          return "***REDACTED***";
        return value;
      });
      return JSON.parse(str);
    } catch {
      return { error: "Sanitization Failed" };
    }
  }

  private logConsole(event: DiagnosticEvent) {
    const style =
      event.metricType === "error"
        ? "color: red; font-weight: bold"
        : event.metricType === "warning"
        ? "color: orange"
        : "color: blue";
    Logger.debug(`[GM] ${event.code}: ${event.title}`);
  }
}

// --- Lazy Singleton Wrapper ---
// Prevents side-effects during module import (no 'new DiagnosticEngine()' at top level)

let _engine: DiagnosticEngineClass | null = null;

function getDiagnosticEngine() {
  if (!_engine) _engine = DiagnosticEngineClass.getInstance();
  return _engine;
}

export const DiagnosticEngine = {
  emit: (...args: Parameters<DiagnosticEngineClass["emit"]>) =>
    getDiagnosticEngine().emit(...args),
  generateReport: () => getDiagnosticEngine().generateReport(),
};
