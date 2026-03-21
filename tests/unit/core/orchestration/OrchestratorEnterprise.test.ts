/**
 * Tests: OperationalOrchestrator + OrchestratorLogger + RestaurantSettings
 *
 * Phase 1 — Enterprise Hardening
 */

// ─── Mocks ──────────────────────────────────────────────

jest.mock("../../../../merchant-portal/src/core/infra/backendAdapter", () => ({
  BackendType: { docker: "docker", supabase: "supabase", none: "none" },
  getBackendType: jest.fn(() => "docker"),
}));

const mockInvokeRpc = jest.fn();
jest.mock("../../../../merchant-portal/src/core/infra/coreRpc", () => ({
  invokeRpc: (...args: unknown[]) => mockInvokeRpc(...args),
}));

jest.mock("../../../../merchant-portal/src/core/logger", () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import {
  OperationalOrchestrator,
  type OrchestratorState,
} from "../../../../merchant-portal/src/core/orchestration/OperationalOrchestrator";

import { OrchestratorLogger } from "../../../../merchant-portal/src/core/orchestration/OrchestratorLogger";

import { getBackendType } from "../../../../merchant-portal/src/core/infra/backendAdapter";

// ─── Orchestrator Decision Logic ────────────────────────

describe("OperationalOrchestrator", () => {
  const orch = new OperationalOrchestrator();

  const idleState: OrchestratorState = {
    activeOrdersCount: 0,
    occupiedTablesCount: 0,
    idleMinutesSinceLastOrder: 20,
    shiftOpen: true,
  };

  const busyState: OrchestratorState = {
    activeOrdersCount: 5,
    occupiedTablesCount: 3,
    idleMinutesSinceLastOrder: 2,
    shiftOpen: true,
  };

  const closedState: OrchestratorState = {
    activeOrdersCount: 0,
    occupiedTablesCount: 0,
    idleMinutesSinceLastOrder: 30,
    shiftOpen: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockInvokeRpc.mockResolvedValue({
      data: { id: "log-1", logged: true },
      error: null,
    });
  });

  it("generates MODO_INTERNO when idle and shift open", () => {
    const result = orch.decide(idleState, "restaurant_idle");
    expect(result.action).toBe("generate");
    expect(result.reason).toContain("ocioso");
  });

  it("suppresses MODO_INTERNO when active orders exist", () => {
    const result = orch.decide(busyState, "restaurant_idle");
    expect(result.action).toBe("suppress");
    expect(result.reason).toContain("Pedidos ativos");
  });

  it("suppresses when shift is closed", () => {
    const result = orch.decide(closedState, "restaurant_idle");
    expect(result.action).toBe("suppress");
    expect(result.reason).toContain("Turno fechado");
  });

  it("suppresses when idle time below threshold", () => {
    const lowIdleState: OrchestratorState = {
      ...idleState,
      idleMinutesSinceLastOrder: 5,
    };
    const result = orch.decide(lowIdleState, "restaurant_idle", {
      idleMinutesThreshold: 15,
    });
    expect(result.action).toBe("suppress");
    expect(result.reason).toContain("abaixo do limiar");
  });

  it("allows order_created events", () => {
    const result = orch.decide(busyState, "order_created");
    expect(result.action).toBe("allow");
  });

  it("allows order_delayed events", () => {
    const result = orch.decide(busyState, "order_delayed");
    expect(result.action).toBe("allow");
  });

  it("allows table_unattended events", () => {
    const result = orch.decide(idleState, "table_unattended");
    expect(result.action).toBe("allow");
  });

  it("respects custom idleMinutesThreshold", () => {
    const state: OrchestratorState = {
      ...idleState,
      idleMinutesSinceLastOrder: 25,
    };
    const result = orch.decide(state, "restaurant_idle", {
      idleMinutesThreshold: 30,
    });
    expect(result.action).toBe("suppress");
  });

  it("fires OrchestratorLogger.logDecision when restaurantId is provided", () => {
    orch.decide(idleState, "restaurant_idle", {
      restaurantId: "rest-123",
    });
    // logDecision is fire-and-forget, but invokeRpc should be called
    expect(mockInvokeRpc).toHaveBeenCalledWith(
      "log_orchestrator_decision",
      expect.objectContaining({
        p_restaurant_id: "rest-123",
        p_event_type: "restaurant_idle",
        p_action: "generate",
      }),
    );
  });

  it("does not call logDecision when restaurantId is not provided", () => {
    orch.decide(idleState, "restaurant_idle");
    expect(mockInvokeRpc).not.toHaveBeenCalled();
  });
});

// ─── OrchestratorLogger ─────────────────────────────────

describe("OrchestratorLogger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getBackendType as jest.Mock).mockReturnValue("docker");
  });

  describe("logDecision", () => {
    it("calls log_orchestrator_decision RPC and returns id", async () => {
      mockInvokeRpc.mockResolvedValue({
        data: { id: "log-abc", logged: true },
        error: null,
      });

      const result = await OrchestratorLogger.logDecision(
        "rest-1",
        "restaurant_idle",
        { action: "generate", reason: "idle" },
        {
          activeOrdersCount: 0,
          occupiedTablesCount: 0,
          idleMinutesSinceLastOrder: 20,
          shiftOpen: true,
        },
      );

      expect(result.logged).toBe(true);
      expect(result.id).toBe("log-abc");
      expect(mockInvokeRpc).toHaveBeenCalledWith(
        "log_orchestrator_decision",
        expect.objectContaining({
          p_restaurant_id: "rest-1",
          p_event_type: "restaurant_idle",
          p_action: "generate",
          p_reason: "idle",
        }),
      );
    });

    it("returns { logged: false } when RPC fails", async () => {
      mockInvokeRpc.mockResolvedValue({
        data: null,
        error: { message: "RPC error" },
      });

      const result = await OrchestratorLogger.logDecision(
        "rest-1",
        "restaurant_idle",
        { action: "suppress", reason: "busy" },
        {
          activeOrdersCount: 3,
          occupiedTablesCount: 2,
          idleMinutesSinceLastOrder: 1,
          shiftOpen: true,
        },
      );

      expect(result.logged).toBe(false);
    });

    it("returns { logged: false } when not Docker backend", async () => {
      (getBackendType as jest.Mock).mockReturnValue("none");

      const result = await OrchestratorLogger.logDecision(
        "rest-1",
        "order_created",
        { action: "allow", reason: "ok" },
        {
          activeOrdersCount: 1,
          occupiedTablesCount: 1,
          idleMinutesSinceLastOrder: 0,
          shiftOpen: true,
        },
      );

      expect(result.logged).toBe(false);
      expect(mockInvokeRpc).not.toHaveBeenCalled();
    });
  });

  describe("getLogs", () => {
    it("returns logs from get_orchestrator_logs RPC", async () => {
      mockInvokeRpc.mockResolvedValue({
        data: [
          { id: "log-1", event_type: "restaurant_idle", action: "generate" },
          { id: "log-2", event_type: "order_created", action: "allow" },
        ],
        error: null,
      });

      const logs = await OrchestratorLogger.getLogs("rest-1", { limit: 50 });
      expect(logs).toHaveLength(2);
      expect(logs[0].id).toBe("log-1");
      expect(mockInvokeRpc).toHaveBeenCalledWith(
        "get_orchestrator_logs",
        expect.objectContaining({
          p_restaurant_id: "rest-1",
          p_limit: 50,
        }),
      );
    });

    it("returns empty array on RPC failure", async () => {
      mockInvokeRpc.mockResolvedValue({
        data: null,
        error: { message: "fail" },
      });

      const logs = await OrchestratorLogger.getLogs("rest-1");
      expect(logs).toEqual([]);
    });
  });

  describe("getSettings", () => {
    it("returns settings from get_restaurant_settings RPC", async () => {
      mockInvokeRpc.mockResolvedValue({
        data: {
          restaurant_id: "rest-1",
          orchestrator_enabled: false,
          idle_threshold_minutes: 30,
          max_kds_load: 10,
          updated_at: "2026-02-25T00:00:00Z",
        },
        error: null,
      });

      const settings = await OrchestratorLogger.getSettings("rest-1");
      expect(settings.orchestrator_enabled).toBe(false);
      expect(settings.idle_threshold_minutes).toBe(30);
      expect(settings.max_kds_load).toBe(10);
    });

    it("returns defaults when not Docker backend", async () => {
      (getBackendType as jest.Mock).mockReturnValue("none");

      const settings = await OrchestratorLogger.getSettings("rest-1");
      expect(settings.orchestrator_enabled).toBe(true);
      expect(settings.idle_threshold_minutes).toBe(15);
      expect(settings.max_kds_load).toBe(20);
    });

    it("returns defaults when RPC fails", async () => {
      mockInvokeRpc.mockRejectedValue(new Error("network"));

      const settings = await OrchestratorLogger.getSettings("rest-1");
      expect(settings.orchestrator_enabled).toBe(true);
      expect(settings.idle_threshold_minutes).toBe(15);
    });
  });

  describe("updateSettings", () => {
    it("calls upsert_restaurant_settings RPC", async () => {
      mockInvokeRpc.mockResolvedValue({
        data: {
          restaurant_id: "rest-1",
          orchestrator_enabled: false,
          idle_threshold_minutes: 25,
          max_kds_load: 15,
          updated_at: "2026-02-25T12:00:00Z",
        },
        error: null,
      });

      const result = await OrchestratorLogger.updateSettings("rest-1", {
        orchestrator_enabled: false,
        idle_threshold_minutes: 25,
      });

      expect(result).not.toBeNull();
      expect(result!.orchestrator_enabled).toBe(false);
      expect(result!.idle_threshold_minutes).toBe(25);
      expect(mockInvokeRpc).toHaveBeenCalledWith(
        "upsert_restaurant_settings",
        expect.objectContaining({
          p_restaurant_id: "rest-1",
          p_orchestrator_enabled: false,
          p_idle_threshold_minutes: 25,
          p_max_kds_load: null,
        }),
      );
    });

    it("returns null when not Docker backend", async () => {
      (getBackendType as jest.Mock).mockReturnValue("none");

      const result = await OrchestratorLogger.updateSettings("rest-1", {
        orchestrator_enabled: true,
      });
      expect(result).toBeNull();
    });

    it("returns null on RPC failure", async () => {
      mockInvokeRpc.mockResolvedValue({
        data: null,
        error: { message: "constraint violation" },
      });

      const result = await OrchestratorLogger.updateSettings("rest-1", {
        idle_threshold_minutes: 999,
      });
      expect(result).toBeNull();
    });
  });
});
