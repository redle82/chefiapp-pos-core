/**
 * ALERT SERVICE (core-engine stub)
 *
 * Minimal AlertService for core-engine Logger.ts lazy import resolution.
 * Mirrors merchant-portal/src/core/monitoring/AlertService.ts interface.
 */
class AlertService {
  private static instance: AlertService;

  private constructor() {}

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  public async sendCritical(message: string, context?: unknown): Promise<void> {
    console.error("[AlertService] CRITICAL:", message, context);
  }
}

export const Alerts = AlertService.getInstance();
