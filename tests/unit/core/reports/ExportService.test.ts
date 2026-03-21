/**
 * Tests: ExportService + csvExport — Phase 2 Financial Integrity
 */

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

// csvExport.downloadCsvFile creates DOM elements — mock for Node
jest.mock("../../../../merchant-portal/src/core/reports/csvExport", () => {
  const original = jest.requireActual(
    "../../../../merchant-portal/src/core/reports/csvExport",
  ) as Record<string, unknown>;
  return {
    ...original,
    downloadCsvFile: jest.fn(),
  };
});

import {
  ExportService,
  type SalesPeriodRow,
  type ZReportRow,
} from "../../../../merchant-portal/src/core/reports/ExportService";

import { getBackendType } from "../../../../merchant-portal/src/core/infra/backendAdapter";
import {
  buildCsvFromRows,
  centsToDecimal,
  downloadCsvFile,
} from "../../../../merchant-portal/src/core/reports/csvExport";

// ─── csvExport unit tests ───────────────────────────────

describe("csvExport", () => {
  describe("buildCsvFromRows", () => {
    it("creates a BOM-prefixed CSV string", () => {
      const csv = buildCsvFromRows(
        ["Name", "Age"],
        [
          ["Alice", 30],
          ["Bob", 25],
        ],
      );
      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv).toContain("Name,Age");
      expect(csv).toContain("Alice,30");
      expect(csv).toContain("Bob,25");
    });

    it("escapes cells containing commas", () => {
      const csv = buildCsvFromRows(["Notes"], [["hello, world"]]);
      expect(csv).toContain('"hello, world"');
    });

    it("escapes cells containing quotes", () => {
      const csv = buildCsvFromRows(["Notes"], [['say "hi"']]);
      expect(csv).toContain('"say ""hi"""');
    });

    it("handles empty rows", () => {
      const csv = buildCsvFromRows(["A"], []);
      expect(csv).toBe("\uFEFFA");
    });
  });

  describe("centsToDecimal", () => {
    it("converts cents to decimal string", () => {
      expect(centsToDecimal(1500)).toBe("15.00");
      expect(centsToDecimal(99)).toBe("0.99");
      expect(centsToDecimal(0)).toBe("0.00");
    });

    it("handles undefined / NaN gracefully", () => {
      expect(centsToDecimal(undefined as unknown as number)).toBe("0.00");
    });
  });
});

// ─── ExportService ──────────────────────────────────────

describe("ExportService", () => {
  const sampleZRows: ZReportRow[] = [
    {
      report_id: "z-1",
      report_date: "2026-02-25",
      report_type: "day",
      total_orders: 15,
      total_gross_cents: 150000,
      total_tax_cents: 34500,
      cash_revenue_cents: 60000,
      closed_by: "admin",
      closed_at: "2026-02-25T22:00:00Z",
      notes: null,
    },
  ];

  const sampleSalesRows: SalesPeriodRow[] = [
    {
      sale_date: "2026-02-25",
      total_orders: 20,
      total_gross_cents: 200000,
      total_tax_cents: 46000,
      cash_cents: 80000,
      card_cents: 100000,
      other_cents: 20000,
      average_ticket_cents: 10000,
    },
    {
      sale_date: "2026-02-24",
      total_orders: 12,
      total_gross_cents: 120000,
      total_tax_cents: 27600,
      cash_cents: 40000,
      card_cents: 70000,
      other_cents: 10000,
      average_ticket_cents: 10000,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getBackendType as jest.Mock).mockReturnValue("docker");
  });

  // ─── fetchZReportRows ───────────────────────────────

  describe("fetchZReportRows", () => {
    it("calls export_z_report_csv RPC and returns rows", async () => {
      mockInvokeRpc.mockResolvedValue({ data: sampleZRows, error: null });

      const rows = await ExportService.fetchZReportRows(
        "rest-1",
        "2026-02-01",
        "2026-02-28",
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].report_id).toBe("z-1");
      expect(mockInvokeRpc).toHaveBeenCalledWith(
        "export_z_report_csv",
        expect.objectContaining({
          p_restaurant_id: "rest-1",
          p_from: "2026-02-01",
          p_to: "2026-02-28",
        }),
      );
    });

    it("returns empty array on RPC failure", async () => {
      mockInvokeRpc.mockResolvedValue({
        data: null,
        error: { message: "fail" },
      });
      const rows = await ExportService.fetchZReportRows("rest-1");
      expect(rows).toEqual([]);
    });

    it("returns empty array when backend is not Docker", async () => {
      (getBackendType as jest.Mock).mockReturnValue("none");
      const rows = await ExportService.fetchZReportRows("rest-1");
      expect(rows).toEqual([]);
      expect(mockInvokeRpc).not.toHaveBeenCalled();
    });
  });

  // ─── fetchSalesPeriodRows ─────────────────────────────

  describe("fetchSalesPeriodRows", () => {
    it("calls export_sales_period_csv RPC and returns rows", async () => {
      mockInvokeRpc.mockResolvedValue({ data: sampleSalesRows, error: null });

      const rows = await ExportService.fetchSalesPeriodRows("rest-1");

      expect(rows).toHaveLength(2);
      expect(rows[0].sale_date).toBe("2026-02-25");
    });

    it("returns empty array on exception", async () => {
      mockInvokeRpc.mockRejectedValue(new Error("network"));
      const rows = await ExportService.fetchSalesPeriodRows("rest-1");
      expect(rows).toEqual([]);
    });
  });

  // ─── buildZReportCsv ─────────────────────────────────

  describe("buildZReportCsv", () => {
    it("produces valid CSV with correct headers", () => {
      const csv = ExportService.buildZReportCsv(sampleZRows);
      expect(csv).toContain("ID,Date,Type,Orders");
      expect(csv).toContain("z-1,2026-02-25,day,15");
      expect(csv).toContain("1500.00"); // gross
      expect(csv).toContain("345.00"); // tax
      expect(csv).toContain("600.00"); // cash
    });

    it("returns header-only CSV when no rows", () => {
      const csv = ExportService.buildZReportCsv([]);
      expect(csv).toContain("ID");
      // Only BOM + header line
      const lines = csv.split("\r\n");
      expect(lines).toHaveLength(1);
    });
  });

  // ─── buildSalesPeriodCsv ──────────────────────────────

  describe("buildSalesPeriodCsv", () => {
    it("produces valid CSV with daily breakdown", () => {
      const csv = ExportService.buildSalesPeriodCsv(sampleSalesRows);
      expect(csv).toContain("Date,Orders");
      expect(csv).toContain("2026-02-25,20");
      expect(csv).toContain("2026-02-24,12");
      expect(csv).toContain("1000.00"); // card
      expect(csv).toContain("100.00"); // avg ticket
    });
  });

  // ─── downloadZReportCsv ───────────────────────────────

  describe("downloadZReportCsv", () => {
    it("fetches rows and triggers download", async () => {
      mockInvokeRpc.mockResolvedValue({ data: sampleZRows, error: null });

      const result = await ExportService.downloadZReportCsv(
        "rest-1",
        "2026-02-01",
        "2026-02-28",
      );

      expect(result).toBe(true);
      expect(downloadCsvFile).toHaveBeenCalledWith(
        expect.stringContaining("z-1"),
        "z-reports_2026-02-01_2026-02-28.csv",
      );
    });

    it("returns false when no data", async () => {
      mockInvokeRpc.mockResolvedValue({ data: [], error: null });
      const result = await ExportService.downloadZReportCsv("rest-1");
      expect(result).toBe(false);
      expect(downloadCsvFile).not.toHaveBeenCalled();
    });
  });

  // ─── downloadSalesPeriodCsv ───────────────────────────

  describe("downloadSalesPeriodCsv", () => {
    it("fetches rows and triggers download", async () => {
      mockInvokeRpc.mockResolvedValue({ data: sampleSalesRows, error: null });

      const result = await ExportService.downloadSalesPeriodCsv(
        "rest-1",
        "2026-01-01",
        "2026-01-31",
      );

      expect(result).toBe(true);
      expect(downloadCsvFile).toHaveBeenCalledWith(
        expect.stringContaining("2026-02-25"),
        "sales-period_2026-01-01_2026-01-31.csv",
      );
    });

    it("returns false when no data", async () => {
      mockInvokeRpc.mockResolvedValue({ data: [], error: null });
      const result = await ExportService.downloadSalesPeriodCsv("rest-1");
      expect(result).toBe(false);
    });
  });
});
