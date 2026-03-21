import { describe, it, expect } from "vitest";

/**
 * Tests CSV generation logic (mirrors generateCsv in EnterpriseDashboardPage)
 */
function generateCsv(
  data: {
    total_locations: number;
    total_revenue_cents: number;
    total_discrepancy_cents: number;
    overall_status: string;
    locations: { restaurant_name: string; revenue_cents: number; discrepancy_cents: number; status: string }[];
  },
  date: string,
  weekDataPerLocation?: { restaurant_name: string; days: { date: string; discrepancyCents: number }[] }[]
): string {
  const ratio =
    data.total_revenue_cents > 0
      ? ((data.total_discrepancy_cents / data.total_revenue_cents) * 100).toFixed(2)
      : "0.00";

  const rows: string[] = [
    "Data,Total Locais,Receita (€),Discrepância (€),Ratio (%),Estado",
    [
      date,
      data.total_locations,
      (data.total_revenue_cents / 100).toFixed(2),
      (data.total_discrepancy_cents / 100).toFixed(2),
      ratio,
      data.overall_status,
    ].join(","),
    "",
    "Restaurante,Receita (€),Discrepância (€),Estado",
    ...data.locations.map((l) =>
      [
        `"${l.restaurant_name.replace(/"/g, '""')}"`,
        (l.revenue_cents / 100).toFixed(2),
        (l.discrepancy_cents / 100).toFixed(2),
        l.status,
      ].join(",")
    ),
  ];

  if (weekDataPerLocation && weekDataPerLocation.length > 0) {
    rows.push("", "Heatmap Semanal (discrepância por local e dia)", "");
    const dates = weekDataPerLocation[0]?.days.map((d) => d.date) ?? [];
    rows.push("Local," + dates.join(","));
    for (const loc of weekDataPerLocation) {
      const vals = loc.days.map((d) => (d.discrepancyCents / 100).toFixed(2));
      rows.push(`"${loc.restaurant_name.replace(/"/g, '""')}",${vals.join(",")}`);
    }
  }

  return rows.join("\n");
}

describe("enterprise CSV generation", () => {
  const baseData = {
    total_locations: 2,
    total_revenue_cents: 100000,
    total_discrepancy_cents: 500,
    overall_status: "yellow" as const,
    locations: [
      { restaurant_name: "Rest A", revenue_cents: 50000, discrepancy_cents: 250, status: "yellow" },
      { restaurant_name: "Rest B", revenue_cents: 50000, discrepancy_cents: 250, status: "yellow" },
    ],
  };

  it("includes org summary row with date, status, ratio", () => {
    const csv = generateCsv(baseData, "2026-02-25");
    expect(csv).toContain("Data,Total Locais,Receita (€),Discrepância (€),Ratio (%),Estado");
    expect(csv).toContain("2026-02-25");
    expect(csv).toContain("yellow");
    expect(csv).toContain("0.50"); // ratio
  });

  it("includes restaurant breakdown rows", () => {
    const csv = generateCsv(baseData, "2026-02-25");
    expect(csv).toContain("Restaurante,Receita (€),Discrepância (€),Estado");
    expect(csv).toContain("Rest A");
    expect(csv).toContain("Rest B");
    expect(csv).toContain("500.00"); // revenue
    expect(csv).toContain("2.50"); // discrepancy
  });

  it("adds heatmap section when weekDataPerLocation provided", () => {
    const weekData = [
      {
        restaurant_name: "Rest A",
        days: [
          { date: "2026-02-24", discrepancyCents: 0 },
          { date: "2026-02-25", discrepancyCents: 100 },
        ],
      },
    ];
    const csv = generateCsv(baseData, "2026-02-25", weekData);
    expect(csv).toContain("Heatmap Semanal");
    expect(csv).toContain("Local,2026-02-24,2026-02-25");
    expect(csv).toContain("Rest A");
  });

  it("works when heatmap is empty (no crash)", () => {
    const csv = generateCsv(baseData, "2026-02-25", []);
    expect(csv).not.toContain("Heatmap Semanal");
    expect(csv).toContain("Rest A");
  });
});
