/**
 * Typed event catalog for the ChefiApp merchant onboarding funnel.
 *
 * Each union member maps to a discrete step in the canonical funnel:
 *   Marketing -> Auth -> Setup -> Install -> TPV Activation -> Commissioning -> Operational
 */

export type FunnelEvent =
  // ── Marketing ──────────────────────────────────────────────
  | { name: "landing_viewed"; properties?: { source?: string; lang?: string } }
  | { name: "landing_cta_clicked"; properties: { cta: string; position: string } }

  // ── Auth ───────────────────────────────────────────────────
  | { name: "auth_email_entered"; properties?: Record<string, never> }
  | { name: "auth_otp_sent"; properties?: Record<string, never> }
  | { name: "auth_otp_verified"; properties?: Record<string, never> }
  | { name: "auth_completed"; properties: { isNewUser: boolean } }

  // ── Setup ──────────────────────────────────────────────────
  | { name: "setup_started"; properties?: Record<string, never> }
  | { name: "setup_section_entered"; properties: { section: string } }
  | { name: "setup_section_completed"; properties: { section: string; durationMs: number } }
  | { name: "setup_progress_updated"; properties: { progress: number; phase: string } }
  | {
      name: "setup_review_reached";
      properties: { completedSections: number; totalSections: number };
    }
  | { name: "setup_activated"; properties: { totalDurationMs: number } }

  // ── Install ────────────────────────────────────────────────
  | { name: "install_started"; properties: { platform: "mac" | "windows" | "unknown" } }
  | { name: "install_download_clicked"; properties: { platform: string } }
  | { name: "install_pair_started"; properties?: Record<string, never> }
  | { name: "install_pair_completed"; properties: { deviceId: string } }
  | { name: "install_check_passed"; properties: { checksRun: number; checksPassed: number } }

  // ── TPV Activation ─────────────────────────────────────────
  | { name: "tpv_first_open"; properties?: Record<string, never> }
  | {
      name: "activation_step_completed";
      properties: { step: string; stepsRemaining: number };
    }
  | { name: "activation_skipped"; properties: { stepsRemaining: number } }
  | { name: "activation_completed"; properties: { totalDurationMs: number } }

  // ── Commissioning ──────────────────────────────────────────
  | { name: "commissioning_started"; properties?: Record<string, never> }
  | { name: "commissioning_test_order_created"; properties: { orderId: string } }
  | {
      name: "commissioning_kds_received";
      properties: { orderId: string; latencyMs: number };
    }
  | {
      name: "commissioning_state_change";
      properties: { orderId: string; from: string; to: string };
    }
  | { name: "commissioning_passed"; properties: { testsRun: number; testsPassed: number } }
  | {
      name: "commissioning_failed";
      properties: { testsRun: number; testsFailed: number; failures: string[] };
    }

  // ── Recovery ──────────────────────────────────────────────
  | { name: "recovery_diagnosed"; properties: { action: string; severity: string } }
  | { name: "recovery_retry_started"; properties: { target: string; retryCount: number } }
  | { name: "recovery_completed"; properties: { target: string; durationMs: number } }
  | { name: "stalled_detected"; properties: { level: string; inactiveHours: number; setupProgress: number } }

  // ── Final ──────────────────────────────────────────────────
  | {
      name: "restaurant_operational";
      properties: { setupDurationMs: number; sectionsCompleted: number };
    };
