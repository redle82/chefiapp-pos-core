// @ts-nocheck
import { Component, type ErrorInfo, type ReactNode } from "react";
import { GlobalEventStore } from "../../core/events/EventStore";
import { SealGenerator } from "../../core/events/SealGenerator";
import type { EventEnvelope } from "../../core/events/SealTypes";
import { Logger, Sentry } from "../../core/logger";
import { Button } from "./Button";
import styles from "./ErrorBoundary.module.css";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string; // e.g. "TPV", "Kitchen", "Root"
}

interface State {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

/**
 * ErrorBoundary - The Safety Net (Layer 4)
 *
 * Prevents the "White Screen of Death".
 * Captures errors to Sentry for monitoring.
 * Adheres to CANON Law 1: Tool Sovereignty (Maintain control).
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    eventId: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("💥 Uncaught error:", error, errorInfo);

    // H.3 Observability: Centralized Logging + Sentry
    Logger.critical("Uncaught Error in Boundary", error, {
      context: this.props.context || "Global",
      componentStack: errorInfo.componentStack,
    });

    // Persist error in the local EventStore with hash chain sealing.
    void this.persistBoundaryError(error, errorInfo);

    // Send to Sentry with full context
    Sentry?.withScope?.(
      (scope: {
        setTag: (key: string, value: string) => void;
        setContext: (key: string, context: Record<string, unknown>) => void;
      }) => {
        scope.setTag("boundary_context", this.props.context || "Global");
        scope.setContext("react_error_info", {
          componentStack: errorInfo.componentStack,
        });
        const eventId = Sentry?.captureException?.(error);
        if (eventId) this.setState({ eventId });
      },
    );
  }

  private handleReload = () => {
    window.location.reload();
  };

  private async persistBoundaryError(error: Error, errorInfo: ErrorInfo) {
    try {
      const now = Date.now();
      const lastEvent = await GlobalEventStore.getLast();
      const prevHash = lastEvent?.seal?.hash || "GENESIS_HASH";

      const eventId =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${now}-${Math.random().toString(16).slice(2)}`;

      const event: Omit<EventEnvelope, "seal"> = {
        eventId,
        type: "UI_ERROR_BOUNDARY",
        payload: {
          message: error.message,
          stack: error.stack,
          context: this.props.context || "Global",
          componentStack: errorInfo.componentStack,
          path: window.location.pathname,
        },
        meta: {
          timestamp: now,
          actorId: "system",
          version: 1,
        },
      };

      const seal = await SealGenerator.seal(event, prevHash, "ui-boundary");
      await GlobalEventStore.append({ ...event, seal });
    } catch (persistError) {
      console.warn("[ErrorBoundary] Failed to persist event", persistError);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className={styles.root}>
          <h2 className={styles.title}>Algo correu mal</h2>
          <p className={styles.message}>
            {this.props.context
              ? `Problema em ${this.props.context}`
              : "Aconteceu um problema inesperado."}
          </p>

          <div className={styles.stack}>
            {this.state.error?.message || "Erro desconhecido"}
          </div>

          <Button variant="primary" onClick={this.handleReload}>
            Tentar de novo
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
