import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("../../../merchant-portal/src/core/infra/backendAdapter", () => ({
  BackendType: { docker: "docker" },
  getBackendType: jest.fn(() => "docker"),
}));

const mockInvokeRpc = jest.fn<(...args: any[]) => any>();
jest.mock("../../../merchant-portal/src/core/infra/coreRpc", () => ({
  invokeRpc: (...args: any[]) => mockInvokeRpc(...args),
}));

jest.mock("../../../merchant-portal/src/core/logger", () => ({
  Logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

import { AuditLogService } from "../../../merchant-portal/src/core/services/AuditLogService";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AuditLogService", () => {
  describe("log", () => {
    it("should call invokeRpc with audit event", async () => {
      mockInvokeRpc.mockResolvedValueOnce({
        data: { audit_id: "a-1" },
        error: null,
      });
      const result = await AuditLogService.log({
        restaurantId: "r-1",
        eventType: "order",
        action: "created",
        actorId: "user-1",
        resourceId: "order-1",
      });
      expect(result.success).toBe(true);
      expect(result.auditId).toBe("a-1");
      expect(mockInvokeRpc).toHaveBeenCalledWith(
        "log_audit_event",
        expect.objectContaining({ p_restaurant_id: "r-1" }),
      );
    });

    it("should handle rpc error gracefully", async () => {
      mockInvokeRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "db fail" },
      });
      const result = await AuditLogService.log({
        restaurantId: "r-1",
        eventType: "order",
        action: "created",
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle exception gracefully", async () => {
      mockInvokeRpc.mockRejectedValueOnce(new Error("network fail"));
      const result = await AuditLogService.log({
        restaurantId: "r-1",
        eventType: "order",
        action: "created",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("convenience methods", () => {
    it("logOrderCreated should log order event", async () => {
      mockInvokeRpc.mockResolvedValueOnce({
        data: { audit_id: "a-2" },
        error: null,
      });
      await AuditLogService.logOrderCreated("r-1", "o-1", "t-1", "u-1");
      expect(mockInvokeRpc).toHaveBeenCalledWith(
        "log_audit_event",
        expect.objectContaining({
          p_event_type: "order_created",
          p_action: "create",
        }),
      );
    });

    it("logConfigChanged should log config event", async () => {
      mockInvokeRpc.mockResolvedValueOnce({
        data: { audit_id: "a-3" },
        error: null,
      });
      await AuditLogService.logConfigChanged(
        "r-1",
        "auto_accept",
        false,
        true,
        "u-1",
      );
      expect(mockInvokeRpc).toHaveBeenCalledWith(
        "log_audit_event",
        expect.objectContaining({
          p_event_type: "config_changed",
          p_action: "update",
        }),
      );
    });
  });
});
