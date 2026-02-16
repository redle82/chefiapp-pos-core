function createChain() {
  const c: any = {};
  c.insert = jest.fn().mockReturnValue(c);
  c.select = jest.fn().mockReturnValue(c);
  c.single = jest.fn();
  c.eq = jest.fn().mockReturnValue(c);
  c.order = jest.fn().mockReturnValue(c);
  c.limit = jest.fn().mockReturnValue(c);
  c.update = jest.fn().mockReturnValue(c);
  return c;
}

const chains: Record<string, any> = {};
const mockFrom = jest.fn((table: string) => {
  if (!chains[table]) chains[table] = createChain();
  return chains[table];
});

jest.mock("../../../merchant-portal/src/core/db", () => ({
  db: { from: (table: string) => mockFrom(table) },
}));

import { FiscalReconciliationService } from "../../../merchant-portal/src/core/services/FiscalReconciliationService";

beforeEach(() => {
  jest.clearAllMocks();
  for (const key of Object.keys(chains)) delete chains[key];
});

describe("FiscalReconciliationService", () => {
  describe("createFiscalSnapshot", () => {
    it("should insert snapshot and return id", async () => {
      const snapChain = createChain();
      const eventChain = createChain();
      mockFrom.mockImplementation((table: string) => {
        if (table === "gm_fiscal_snapshots") return snapChain;
        return eventChain;
      });
      snapChain.single.mockResolvedValueOnce({ data: { id: "snap-1" }, error: null });
      eventChain.single.mockResolvedValueOnce({ data: { id: "ev-1" }, error: null });

      const result = await FiscalReconciliationService.createFiscalSnapshot({
        restaurantId: "r-1",
        posSystem: "chefiapp",
        source: "API",
        totalFiscalCents: 100000,
      });
      expect(result).toBe("snap-1");
    });

    it("should throw on database error", async () => {
      const snapChain = createChain();
      const eventChain = createChain();
      mockFrom.mockImplementation((table: string) => {
        if (table === "gm_fiscal_snapshots") return snapChain;
        return eventChain;
      });
      snapChain.single.mockResolvedValueOnce({ data: null, error: { message: "insert failed" } });
      eventChain.single.mockResolvedValueOnce({ data: { id: "ev-1" }, error: null });

      await expect(
        FiscalReconciliationService.createFiscalSnapshot({
          restaurantId: "r-1",
          posSystem: "chefiapp",
          source: "API",
          totalFiscalCents: 100000,
        }),
      ).rejects.toThrow("Falha ao criar snapshot fiscal");
    });
  });

  describe("calculateReconciliation", () => {
    it("should return PENDING_DATA when no fiscal snapshot provided", async () => {
      const reconChain = createChain();
      mockFrom.mockImplementation(() => reconChain);
      reconChain.single.mockResolvedValueOnce({ data: { id: "recon-1" }, error: null });

      const result = await FiscalReconciliationService.calculateReconciliation({
        restaurantId: "r-1",
        totalOperationalCents: 50000,
      });
      expect(result.status).toBe("PENDING_DATA");
      expect(result.reasonCode).toBe("AWAITING_FISCAL_SYNC");
    });

    it("should return OK when difference within tolerance", async () => {
      const snapChain = createChain();
      const reconChain = createChain();
      mockFrom.mockImplementation((table: string) => {
        if (table === "gm_fiscal_snapshots") return snapChain;
        return reconChain;
      });
      snapChain.single.mockResolvedValueOnce({ data: { id: "snap-1", total_fiscal_cents: 50005 }, error: null });
      reconChain.single.mockResolvedValueOnce({ data: { id: "recon-2" }, error: null });

      const result = await FiscalReconciliationService.calculateReconciliation({
        restaurantId: "r-1",
        totalOperationalCents: 50010,
        fiscalSnapshotId: "snap-1",
      });
      expect(result.status).toBe("OK");
    });

    it("should return DIVERGENT when difference exceeds tolerance", async () => {
      const snapChain = createChain();
      const reconChain = createChain();
      mockFrom.mockImplementation((table: string) => {
        if (table === "gm_fiscal_snapshots") return snapChain;
        return reconChain;
      });
      snapChain.single.mockResolvedValueOnce({ data: { id: "snap-1", total_fiscal_cents: 40000 }, error: null });
      reconChain.single.mockResolvedValueOnce({ data: { id: "recon-3" }, error: null });

      const result = await FiscalReconciliationService.calculateReconciliation({
        restaurantId: "r-1",
        totalOperationalCents: 50000,
        fiscalSnapshotId: "snap-1",
      });
      expect(result.status).toBe("DIVERGENT");
      expect(result.differenceCents).toBe(10000);
    });
  });

  describe("updateReconciliationNotes", () => {
    it("should update notes without error", async () => {
      const reconChain = createChain();
      mockFrom.mockImplementation(() => reconChain);
      reconChain.eq.mockResolvedValueOnce({ error: null });

      await expect(
        FiscalReconciliationService.updateReconciliationNotes("recon-1", "MANUAL_OK", "Verified"),
      ).resolves.toBeUndefined();
    });

    it("should throw on error", async () => {
      const reconChain = createChain();
      mockFrom.mockImplementation(() => reconChain);
      reconChain.eq.mockResolvedValueOnce({ error: { message: "update failed" } });

      await expect(
        FiscalReconciliationService.updateReconciliationNotes("recon-1", null, null),
      ).rejects.toThrow("Falha ao atualizar");
    });
  });
});
