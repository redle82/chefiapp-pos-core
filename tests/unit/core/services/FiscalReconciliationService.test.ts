import { db } from "../../../../merchant-portal/src/core/db";
import FiscalReconciliationService from "../../../../merchant-portal/src/core/services/FiscalReconciliationService";

jest.mock("../../../../merchant-portal/src/core/db", () => ({
  db: {
    from: jest.fn(),
  },
}));

describe("FiscalReconciliationService", () => {
  const mockFrom = db.from as jest.Mock;

  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("throws a clear error when snapshot insert returns no data", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "gm_fiscal_snapshots") {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      if (table === "gm_audit_logs") {
        return {
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {};
    });

    await expect(
      FiscalReconciliationService.createFiscalSnapshot({
        restaurantId: "rest-1",
        posSystem: "pos",
        source: "API",
        totalFiscalCents: 1200,
      }),
    ).rejects.toThrow("Falha ao criar snapshot fiscal: resposta vazia");
  });

  it("throws a clear error when reconciliation insert returns no data", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "gm_fiscal_snapshots") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: "snap-1", total_fiscal_cents: 1000 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "gm_reconciliations") {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      if (table === "gm_audit_logs") {
        return {
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {};
    });

    await expect(
      FiscalReconciliationService.calculateReconciliation({
        restaurantId: "rest-1",
        fiscalSnapshotId: "snap-1",
        totalOperationalCents: 1500,
      }),
    ).rejects.toThrow("Falha ao criar reconciliação: resposta vazia");
  });
});
