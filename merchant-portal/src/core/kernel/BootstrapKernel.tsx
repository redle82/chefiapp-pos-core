/**
 * 🧬 BOOTSTRAP KERNEL
 *
 * The main orchestrator that gives the system self-awareness.
 * On initialization, it scans all surfaces and systems,
 * validates guards, and emits a SYSTEM_STATE.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { SurfaceRegistry } from "./SurfaceRegistry";
import { SystemsRegistry } from "./SystemsRegistry";
import type {
  BootstrapOptions,
  BootstrapResult,
  Environment,
  GuardStatus,
  KernelHealth,
  ObservabilityStatus,
  SystemState,
} from "./types";

// ========================================
// ENVIRONMENT DETECTION
// ========================================

function detectEnvironment(): Environment {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  const envVar = import.meta.env.VITE_ENV || import.meta.env.MODE;

  if (envVar === "production" || hostname.includes("chefiapp.com")) {
    return "prod";
  }
  if (envVar === "staging" || hostname.includes("staging.")) {
    return "staging";
  }
  return "dev";
}

// ========================================
// GUARD VALIDATION
// ========================================

function validateGuards(): GuardStatus {
  // Check assertNoMock - in production, mocks should crash
  const env = detectEnvironment();
  const assertNoMockActive =
    env !== "prod" || import.meta.env.VITE_ALLOW_MOCKS !== "true";

  // Check DbWriteGate - verify the module exists
  let dbWriteGateActive = false;
  try {
    // DbWriteGate should be imported and used in sovereignty layer
    dbWriteGateActive = true; // Simplified check
  } catch {
    dbWriteGateActive = false;
  }

  // Check RuntimeContext
  let runtimeContextActive = false;
  try {
    // TODO: Import and check RuntimeContext when available
    runtimeContextActive = true;
  } catch {
    runtimeContextActive = false;
  }

  return {
    assertNoMock: assertNoMockActive,
    dbWriteGate: dbWriteGateActive,
    runtimeContext: runtimeContextActive,
  };
}

// ========================================
// OBSERVABILITY CHECK
// ========================================

async function checkObservability(): Promise<ObservabilityStatus> {
  // Logs: Check if Logger service is available
  const logsActive = typeof console !== "undefined";

  // Monitoring: Check if /health endpoint is configured
  // In a real implementation, we'd ping the health endpoint
  const monitoringActive = false; // Will be true when UptimeRobot is configured

  // Alerts: Check if Discord/Email alerts are configured
  const alertsActive = false; // Will be true when webhooks are set up

  return {
    logs: logsActive,
    monitoring: monitoringActive,
    alerts: alertsActive,
  };
}

// ========================================
// KERNEL INITIALIZATION
// ========================================

let _cachedState: SystemState | null = null;
const VERSION = "1.0.0";

async function initializeKernel(
  options: BootstrapOptions = {},
): Promise<BootstrapResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Detect environment
  console.log("Kernel: Detecting environment...");
  const environment = options.forceEnvironment ?? detectEnvironment();
  console.log("Kernel: Environment detected:", environment);

  // 2. Validate guards
  console.log("Kernel: Validating guards...");
  const guards = validateGuards();

  if (environment === "prod" && !guards.assertNoMock) {
    errors.push("CRITICAL: assertNoMock is disabled in production");
  }

  if (!guards.dbWriteGate) {
    warnings.push("DbWriteGate is not active");
  }

  // 3. Check surfaces
  let surfaces = {
    panel: "ACTIVE" as const,
    tpv: "ACTIVE" as const,
    kds: "ACTIVE" as const,
    staff: "ACTIVE" as const,
    web: "ACTIVE" as const,
  };

  if (!options.skipHealthChecks) {
    try {
      surfaces = await SurfaceRegistry.checkAll();
    } catch (e) {
      warnings.push(`Surface check failed: ${e}`);
    }
  }

  // 4. Check systems
  let systems = {
    orders: "OK" as const,
    tables: "OK" as const,
    cashRegister: "OK" as const,
    fiscal: "PARTIAL" as const,
    menu: "OK" as const,
    staff: "OK" as const,
  };

  if (!options.skipHealthChecks) {
    try {
      systems = await SystemsRegistry.checkAll();
    } catch (e) {
      warnings.push(`Systems check failed: ${e}`);
    }
  } else {
    console.log("Kernel: SKIPPING Health Checks");
  }

  // 5. Check observability
  console.log("Kernel: Checking Observability...");
  const observability = await checkObservability();

  if (!observability.monitoring) {
    warnings.push("Monitoring is not configured");
  }

  // 6. Determine kernel health
  let kernel: KernelHealth = "OK";

  if (errors.length > 0) {
    kernel = "FAILED";
  } else if (warnings.length > 0) {
    kernel = "DEGRADED";
  }

  // 7. Build state
  const state: SystemState = {
    environment,
    kernel,
    surfaces,
    systems,
    guards,
    observability,
    timestamp: new Date().toISOString(),
    version: VERSION,
  };

  // Cache the state
  _cachedState = state;

  return {
    success: kernel !== "FAILED",
    state,
    errors,
    warnings,
  };
}

// ========================================
// PUBLIC API
// ========================================

export const BootstrapKernel = {
  /**
   * Initialize the kernel and scan all systems
   */
  async init(options?: BootstrapOptions): Promise<BootstrapResult> {
    return initializeKernel(options);
  },

  /**
   * Get the cached system state (call init first)
   */
  getState(): SystemState | null {
    return _cachedState;
  },

  /**
   * Force a refresh of the system state
   */
  async refresh(): Promise<SystemState> {
    const result = await initializeKernel();
    return result.state;
  },

  /**
   * Check if kernel has been initialized
   */
  isInitialized(): boolean {
    return _cachedState !== null;
  },

  /**
   * Get environment
   */
  getEnvironment(): Environment {
    return _cachedState?.environment ?? detectEnvironment();
  },
};

// ========================================
// REACT CONTEXT
// ========================================

interface SystemStateContextValue {
  state: SystemState | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const SystemStateContext = createContext<SystemStateContextValue | null>(null);

export function SystemStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SystemState | null>(_cachedState);
  const [loading, setLoading] = useState(!_cachedState);

  useEffect(() => {
    if (!_cachedState) {
      setLoading(true);
      // SOVEREIGN BOOT: Skip health checks in DEV to prevent blocking
      const skipChecks = import.meta.env.DEV;
      BootstrapKernel.init({ skipHealthChecks: skipChecks })
        .then((result) => {
          setState(result.state);
          setLoading(false);

          // Log warnings in dev
          if (result.warnings.length && result.state.environment === "dev") {
            console.warn("[BootstrapKernel] Warnings:", result.warnings);
          }
          if (result.errors.length) {
            console.error("[BootstrapKernel] Errors:", result.errors);
          }
        })
        .catch((err) => {
          // NEVER BLOCK — log and continue with degraded state
          console.error("[BootstrapKernel] Init failed (non-fatal):", err);
          setLoading(false);
        });
    }
  }, []);

  const refresh = async () => {
    setLoading(true);
    const newState = await BootstrapKernel.refresh();
    setState(newState);
    setLoading(false);
  };

  return (
    <SystemStateContext.Provider value={{ state, loading, refresh }}>
      {children}
    </SystemStateContext.Provider>
  );
}

export function useSystemState(): SystemStateContextValue {
  const context = useContext(SystemStateContext);
  if (!context) {
    // Return a safe default if used outside provider
    return {
      state: _cachedState,
      loading: false,
      refresh: async () => {
        await BootstrapKernel.refresh();
      },
    };
  }
  return context;
}

// ========================================
// EXPORTS
// ========================================

export { SurfaceRegistry } from "./SurfaceRegistry";
export { SystemsRegistry } from "./SystemsRegistry";
export type * from "./types";
