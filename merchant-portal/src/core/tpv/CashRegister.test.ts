import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockInvokeRpc,
  mockGetTableClient,
  mockEmitFirstShiftOpened,
  mockLogger,
} = vi.hoisted(() => ({
  mockInvokeRpc: vi.fn(),
  mockGetTableClient: vi.fn(),
  mockEmitFirstShiftOpened: vi.fn(),
  mockLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../infra/coreRpc", () => ({
  invokeRpc: mockInvokeRpc,
  getTableClient: mockGetTableClient,
}));

vi.mock("../../commercial/activation/activationTracking", () => ({
  emitFirstShiftOpened: mockEmitFirstShiftOpened,
}));

vi.mock("../logger", () => ({
  Logger: mockLogger,
}));

import { CashRegisterEngine, CashRegisterError } from "./CashRegister";

type QueryResult = { data: any; error: any };

function createTableClient(options: {
  single?: QueryResult;
  maybeSingle?: QueryResult;
  ordered?: QueryResult;
}) {
  const singleResult = options.single ?? { data: null, error: null };
  const maybeSingleResult = options.maybeSingle ?? { data: null, error: null };
  const orderedResult = options.ordered ?? { data: [], error: null };

  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => maybeSingleResult),
    single: vi.fn(async () => singleResult),
    order: vi.fn(async () => orderedResult),
  };

  return {
    from: vi.fn().mockReturnValue(builder),
  };
}

const registerRow = {
  id: "reg-1",
  restaurant_id: "11111111-1111-4111-8111-111111111111",
  name: "Main",
  status: "open",
  opened_at: "2026-02-26T10:00:00.000Z",
  closed_at: null,
  opened_by: "user-1",
  closed_by: null,
  opening_balance_cents: 5000,
  closing_balance_cents: null,
  total_sales_cents: 1000,
  created_at: "2026-02-26T10:00:00.000Z",
  updated_at: "2026-02-26T10:10:00.000Z",
};

describe("CashRegisterEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("openCashRegister", () => {
    it("validates required fields", async () => {
      await expect(
        CashRegisterEngine.openCashRegister({
          restaurantId: "",
          openingBalanceCents: 0,
          openedBy: "u1",
        }),
      ).rejects.toMatchObject<CashRegisterError>({ code: "VALIDATION_ERROR" });

      await expect(
        CashRegisterEngine.openCashRegister({
          restaurantId: "11111111-1111-4111-8111-111111111111",
          openingBalanceCents: 0,
          openedBy: "",
        }),
      ).rejects.toMatchObject<CashRegisterError>({ code: "VALIDATION_ERROR" });
    });

    it("maps already-open RPC errors", async () => {
      mockInvokeRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "CASH_REGISTER_ALREADY_OPEN" },
      });

      await expect(
        CashRegisterEngine.openCashRegister({
          restaurantId: "11111111-1111-4111-8111-111111111111",
          openingBalanceCents: 1000,
          openedBy: "u1",
        }),
      ).rejects.toMatchObject<CashRegisterError>({
        code: "CASH_REGISTER_ALREADY_OPEN",
      });
    });

    it("maps generic open RPC errors", async () => {
      mockInvokeRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "unexpected open" },
      });

      await expect(
        CashRegisterEngine.openCashRegister({
          restaurantId: "11111111-1111-4111-8111-111111111111",
          openingBalanceCents: 1000,
          openedBy: "u1",
        }),
      ).rejects.toMatchObject<CashRegisterError>({
        code: "CASH_REGISTER_OPEN_FAILED",
      });
    });

    it("throws verification failure when open register cannot be read", async () => {
      mockInvokeRpc.mockResolvedValueOnce({ data: {}, error: null });
      mockGetTableClient.mockResolvedValueOnce(
        createTableClient({ maybeSingle: { data: null, error: null } }),
      );

      await expect(
        CashRegisterEngine.openCashRegister({
          restaurantId: "11111111-1111-4111-8111-111111111111",
          openingBalanceCents: 1000,
          openedBy: "u1",
        }),
      ).rejects.toMatchObject<CashRegisterError>({
        code: "CASH_REGISTER_VERIFICATION_FAILED",
      });
    });

    it("returns opened register and emits activation event", async () => {
      mockInvokeRpc.mockResolvedValueOnce({ data: {}, error: null });
      mockGetTableClient.mockResolvedValueOnce(
        createTableClient({ maybeSingle: { data: registerRow, error: null } }),
      );

      const result = await CashRegisterEngine.openCashRegister({
        restaurantId: "11111111-1111-4111-8111-111111111111",
        openingBalanceCents: 1000,
        openedBy: "u1",
      });

      expect(result.id).toBe("reg-1");
      expect(mockEmitFirstShiftOpened).toHaveBeenCalledWith(
        "11111111-1111-4111-8111-111111111111",
        "reg-1",
      );
    });
  });

  describe("closeCashRegister", () => {
    it("validates required fields", async () => {
      await expect(
        CashRegisterEngine.closeCashRegister({
          cashRegisterId: "",
          restaurantId: "11111111-1111-4111-8111-111111111111",
          closingBalanceCents: 100,
          closedBy: "u1",
        }),
      ).rejects.toMatchObject<CashRegisterError>({ code: "VALIDATION_ERROR" });
    });

    it("maps NOT_OPEN and NOT_FOUND RPC errors", async () => {
      mockInvokeRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "CASH_REGISTER_NOT_OPEN" },
      });
      await expect(
        CashRegisterEngine.closeCashRegister({
          cashRegisterId: "reg-1",
          restaurantId: "11111111-1111-4111-8111-111111111111",
          closingBalanceCents: 100,
          closedBy: "u1",
        }),
      ).rejects.toMatchObject<CashRegisterError>({
        code: "CASH_REGISTER_NOT_OPEN",
      });

      mockInvokeRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "CASH_REGISTER_NOT_FOUND" },
      });
      await expect(
        CashRegisterEngine.closeCashRegister({
          cashRegisterId: "reg-1",
          restaurantId: "11111111-1111-4111-8111-111111111111",
          closingBalanceCents: 100,
          closedBy: "u1",
        }),
      ).rejects.toMatchObject<CashRegisterError>({
        code: "CASH_REGISTER_NOT_FOUND",
      });
    });

    it("maps generic close RPC errors", async () => {
      mockInvokeRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "unexpected close" },
      });

      await expect(
        CashRegisterEngine.closeCashRegister({
          cashRegisterId: "reg-1",
          restaurantId: "11111111-1111-4111-8111-111111111111",
          closingBalanceCents: 100,
          closedBy: "u1",
        }),
      ).rejects.toMatchObject<CashRegisterError>({
        code: "CASH_REGISTER_CLOSE_FAILED",
      });
    });

    it("returns updated register after successful close", async () => {
      mockInvokeRpc.mockResolvedValueOnce({ data: {}, error: null });
      mockGetTableClient.mockResolvedValueOnce(
        createTableClient({
          single: { data: { ...registerRow, status: "closed" }, error: null },
        }),
      );

      const result = await CashRegisterEngine.closeCashRegister({
        cashRegisterId: "reg-1",
        restaurantId: "11111111-1111-4111-8111-111111111111",
        closingBalanceCents: 100,
        closedBy: "u1",
      });

      expect(result.status).toBe("closed");
    });
  });

  describe("getCashRegisterById", () => {
    it("throws fetch failed when DB returns error", async () => {
      mockGetTableClient.mockResolvedValueOnce(
        createTableClient({
          single: { data: null, error: { message: "db fail" } },
        }),
      );

      await expect(
        CashRegisterEngine.getCashRegisterById("reg", "rest"),
      ).rejects.toMatchObject<CashRegisterError>({
        code: "CASH_REGISTER_FETCH_FAILED",
      });
    });

    it("throws not found when DB returns no data", async () => {
      mockGetTableClient.mockResolvedValueOnce(
        createTableClient({ single: { data: null, error: null } }),
      );

      await expect(
        CashRegisterEngine.getCashRegisterById("reg", "rest"),
      ).rejects.toMatchObject<CashRegisterError>({
        code: "CASH_REGISTER_NOT_FOUND",
      });
    });

    it("returns mapped register when DB read succeeds", async () => {
      mockGetTableClient.mockResolvedValueOnce(
        createTableClient({ single: { data: registerRow, error: null } }),
      );

      const result = await CashRegisterEngine.getCashRegisterById(
        "reg",
        "rest",
      );
      expect(result.id).toBe("reg-1");
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("getOpenCashRegister", () => {
    it("returns null for invalid restaurant id", async () => {
      const result = await CashRegisterEngine.getOpenCashRegister("invalid-id");
      expect(result).toBeNull();
      expect(mockGetTableClient).not.toHaveBeenCalled();
    });

    it("returns null for missing table, connection and abort errors", async () => {
      mockGetTableClient
        .mockResolvedValueOnce(
          createTableClient({
            maybeSingle: {
              data: null,
              error: { code: "42P01", message: "relation does not exist" },
            },
          }),
        )
        .mockResolvedValueOnce(
          createTableClient({
            maybeSingle: {
              data: null,
              error: { message: "Failed to fetch" },
            },
          }),
        )
        .mockResolvedValueOnce(
          createTableClient({
            maybeSingle: {
              data: null,
              error: { name: "AbortError", message: "aborted" },
            },
          }),
        );

      await expect(
        CashRegisterEngine.getOpenCashRegister(
          "11111111-1111-4111-8111-111111111111",
        ),
      ).resolves.toBeNull();
      await expect(
        CashRegisterEngine.getOpenCashRegister(
          "11111111-1111-4111-8111-111111111111",
        ),
      ).resolves.toBeNull();
      await expect(
        CashRegisterEngine.getOpenCashRegister(
          "11111111-1111-4111-8111-111111111111",
        ),
      ).resolves.toBeNull();
    });

    it("throws on unexpected read errors", async () => {
      mockGetTableClient.mockResolvedValueOnce(
        createTableClient({
          maybeSingle: {
            data: null,
            error: { message: "unexpected" },
          },
        }),
      );

      await expect(
        CashRegisterEngine.getOpenCashRegister(
          "11111111-1111-4111-8111-111111111111",
        ),
      ).rejects.toMatchObject<CashRegisterError>({
        code: "CASH_REGISTER_FETCH_OPEN_FAILED",
      });
    });

    it("returns mapped open register when record exists", async () => {
      mockGetTableClient.mockResolvedValueOnce(
        createTableClient({ maybeSingle: { data: registerRow, error: null } }),
      );

      const result = await CashRegisterEngine.getOpenCashRegister(
        "11111111-1111-4111-8111-111111111111",
      );
      expect(result?.id).toBe("reg-1");
      expect(result?.openedAt).toBeInstanceOf(Date);
    });

    it("allows seeded restaurant id bypass", async () => {
      mockGetTableClient.mockResolvedValueOnce(
        createTableClient({ maybeSingle: { data: null, error: null } }),
      );

      const result = await CashRegisterEngine.getOpenCashRegister(
        "00000000-0000-0000-0000-000000000100",
      );
      expect(result).toBeNull();
      expect(mockGetTableClient).toHaveBeenCalled();
    });
  });

  describe("getCashRegisters", () => {
    it("returns [] when table is missing", async () => {
      mockGetTableClient.mockResolvedValueOnce(
        createTableClient({
          ordered: {
            data: null,
            error: { code: "42P01", message: "relation missing" },
          },
        }),
      );

      await expect(CashRegisterEngine.getCashRegisters("r1")).resolves.toEqual(
        [],
      );
    });

    it("throws for unexpected list errors", async () => {
      mockGetTableClient.mockResolvedValueOnce(
        createTableClient({
          ordered: { data: null, error: { message: "boom" } },
        }),
      );

      await expect(
        CashRegisterEngine.getCashRegisters("r1"),
      ).rejects.toMatchObject<CashRegisterError>({
        code: "CASH_REGISTERS_FETCH_FAILED",
      });
    });

    it("maps rows to domain entity", async () => {
      mockGetTableClient.mockResolvedValueOnce(
        createTableClient({ ordered: { data: [registerRow], error: null } }),
      );

      const result = await CashRegisterEngine.getCashRegisters("r1");
      expect(result).toHaveLength(1);
      expect(result[0].restaurantId).toBe(registerRow.restaurant_id);
      expect(result[0].openedAt).toBeInstanceOf(Date);
    });
  });
});
