/**
 * MenuPerformancePage — Boston Matrix + product ranking table.
 *
 * Route: /admin/analytics/menu
 */

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ExportButtons } from "../../../../components/common/ExportButtons";
import type { MenuPerformanceResult, MenuProductPerformance } from "../../../../core/analytics/AdvancedAnalyticsService";
import { getMenuPerformance } from "../../../../core/analytics/AdvancedAnalyticsService";
import { currencyService } from "../../../../core/currency/CurrencyService";
import { centsToDecimalStr } from "../../../../core/export/ExportService";
import { useExportBranding } from "../../../../core/export/useExportBranding";
import { GlobalLoadingView } from "../../../../ui/design-system/components";
import { useRestaurantId } from "../../../../ui/hooks/useRestaurantId";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg-on-dark, var(--surface-elevated))",
  borderRadius: 8,
  padding: 20,
  marginBottom: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
  border: "1px solid var(--surface-border, rgba(255,255,255,0.08))",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "var(--text-primary)",
  margin: "0 0 12px 0",
};

const subText: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-secondary)",
};

const quadrantColors: Record<string, { bg: string; border: string; text: string }> = {
  star: { bg: "rgba(34,197,94,0.12)", border: "#22c55e", text: "#22c55e" },
  cashCow: { bg: "rgba(59,130,246,0.12)", border: "#3b82f6", text: "#3b82f6" },
  questionMark: { bg: "rgba(245,158,11,0.12)", border: "#f59e0b", text: "#f59e0b" },
  dog: { bg: "rgba(239,68,68,0.12)", border: "#ef4444", text: "#ef4444" },
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-secondary)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  cursor: "pointer",
  userSelect: "none",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 13,
  color: "var(--text-primary)",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
};

type SortKey = "name" | "category" | "salesCount" | "revenueCents" | "costCents" | "marginPercent";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function fmtCents(cents: number): string {
  return currencyService.formatAmount(cents);
}

function TrendArrow({ trend }: { trend: 1 | -1 | 0 }) {
  if (trend === 1) return <span style={{ color: "#22c55e", fontWeight: 700 }}>^</span>;
  if (trend === -1) return <span style={{ color: "#ef4444", fontWeight: 700 }}>v</span>;
  return <span style={{ color: "var(--text-secondary)" }}>--</span>;
}

/* ------------------------------------------------------------------ */
/*  Boston Matrix (CSS scatter)                                         */
/* ------------------------------------------------------------------ */

function BostonMatrix({ products, t: translate }: { products: MenuProductPerformance[]; t: (key: string) => string }) {
  const quadrants: Record<string, MenuProductPerformance[]> = {
    star: [],
    cashCow: [],
    questionMark: [],
    dog: [],
  };
  for (const p of products) quadrants[p.quadrant].push(p);

  const renderQuadrant = (key: string, labelKey: string, descKey: string) => {
    const items = quadrants[key];
    const style = quadrantColors[key];
    return (
      <div
        style={{
          background: style.bg,
          border: `1px solid ${style.border}`,
          borderRadius: 8,
          padding: 14,
          minHeight: 100,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, color: style.text, marginBottom: 2 }}>
          {translate(labelKey)} ({items.length})
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>
          {translate(descKey)}
        </div>
        {items.slice(0, 5).map((p) => (
          <div key={p.productId} style={{ fontSize: 12, color: "var(--text-primary)", padding: "2px 0" }}>
            {p.name}
            <span style={{ ...subText, marginLeft: 6 }}>{fmtCents(p.revenueCents)}</span>
          </div>
        ))}
        {items.length > 5 && (
          <div style={subText}>+{items.length - 5} more</div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {renderQuadrant("star", "menu.stars", "menu.starsDesc")}
      {renderQuadrant("questionMark", "menu.questionMarks", "menu.questionMarksDesc")}
      {renderQuadrant("cashCow", "menu.cashCows", "menu.cashCowsDesc")}
      {renderQuadrant("dog", "menu.dogs", "menu.dogsDesc")}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function MenuPerformancePage() {
  const { t } = useTranslation("analytics");
  const { restaurantId, loading: loadingId } = useRestaurantId();
  const branding = useExportBranding();
  const [data, setData] = useState<MenuPerformanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("__all__");
  const [sortKey, setSortKey] = useState<SortKey>("revenueCents");
  const [sortAsc, setSortAsc] = useState(false);
  const [periodDays, setPeriodDays] = useState(30);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    setLoading(true);
    const now = new Date();
    const from = new Date(now.getTime() - periodDays * 86400 * 1000);
    getMenuPerformance(restaurantId, { from, to: now })
      .then((result) => { if (!cancelled) setData(result); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [restaurantId, periodDays]);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    let items = [...data.products];
    if (categoryFilter !== "__all__") {
      items = items.filter((p) => p.category === categoryFilter);
    }
    items.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return items;
  }, [data, categoryFilter, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortAsc ? " ^" : " v";
  };

  if (loadingId || !restaurantId) return <GlobalLoadingView />;
  if (loading) return <GlobalLoadingView message={t("loading")} />;

  const hasDogs = filteredProducts.some((p) => p.quadrant === "dog");
  const hasQuestions = filteredProducts.some((p) => p.quadrant === "questionMark");

  return (
    <section className="page-enter admin-content-page" aria-label={t("menu.title")}>
      <AdminPageHeader
        title={t("menu.title")}
        subtitle={t("menu.subtitle")}
        actions={
          data && data.products.length > 0 ? (
            <ExportButtons
              title={t("menu.title")}
              filename="menu-performance"
              branding={branding}
              formats={["pdf", "excel", "csv"]}
              orientation="landscape"
              datasets={[
                {
                  name: t("menu.productRanking"),
                  columns: [
                    { header: t("menu.colName") },
                    { header: t("menu.colCategory") },
                    { header: t("menu.colSold"), align: "right", format: "number" },
                    { header: t("menu.colRevenue"), align: "right", format: "currency" },
                    { header: t("menu.colCost"), align: "right", format: "currency" },
                    { header: t("menu.colMargin"), align: "right" },
                  ],
                  rows: filteredProducts.map((p) => [
                    p.name,
                    p.category,
                    p.salesCount,
                    centsToDecimalStr(p.revenueCents),
                    centsToDecimalStr(p.costCents),
                    `${p.marginPercent}%`,
                  ]),
                },
              ]}
            />
          ) : undefined
        }
      />

      {/* Period selector */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
        {[7, 14, 30, 90].map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => setPeriodDays(days)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: periodDays === days ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.1)",
              background: periodDays === days ? "rgba(59,130,246,0.15)" : "transparent",
              color: periodDays === days ? "#60a5fa" : "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {days}d
          </button>
        ))}
      </div>

      {/* Boston Matrix */}
      {data && data.products.length > 0 && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>{t("menu.bostonMatrix")}</h3>
          <BostonMatrix products={data.products} t={t} />
        </div>
      )}

      {/* Actionable tips */}
      {(hasDogs || hasQuestions) && (
        <div style={{ ...cardStyle, borderColor: "#f59e0b", background: "rgba(245,158,11,0.06)" }}>
          {hasDogs && (
            <p style={{ fontSize: 13, color: "#f59e0b", margin: "0 0 4px 0" }}>
              {t("menu.tipRemoveDogs")}
            </p>
          )}
          {hasQuestions && (
            <p style={{ fontSize: 13, color: "#f59e0b", margin: 0 }}>
              {t("menu.tipPromoteQuestions")}
            </p>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ marginBottom: 12, display: "flex", gap: 12, alignItems: "center" }}>
        <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {t("menu.filterCategory")}:
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              marginLeft: 8,
              padding: "4px 8px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#1a1a1a",
              color: "var(--text-primary)",
              fontSize: 13,
            }}
          >
            <option value="__all__">{t("menu.allCategories")}</option>
            {data?.categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Product Ranking Table */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>{t("menu.productRanking")}</h3>
        {filteredProducts.length === 0 ? (
          <p style={subText}>{t("menu.noProducts")}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle} onClick={() => handleSort("name")}>
                    {t("menu.colName")}{sortIndicator("name")}
                  </th>
                  <th style={thStyle} onClick={() => handleSort("category")}>
                    {t("menu.colCategory")}{sortIndicator("category")}
                  </th>
                  <th style={{ ...thStyle, textAlign: "right" }} onClick={() => handleSort("salesCount")}>
                    {t("menu.colSold")}{sortIndicator("salesCount")}
                  </th>
                  <th style={{ ...thStyle, textAlign: "right" }} onClick={() => handleSort("revenueCents")}>
                    {t("menu.colRevenue")}{sortIndicator("revenueCents")}
                  </th>
                  <th style={{ ...thStyle, textAlign: "right" }} onClick={() => handleSort("costCents")}>
                    {t("menu.colCost")}{sortIndicator("costCents")}
                  </th>
                  <th style={{ ...thStyle, textAlign: "right" }} onClick={() => handleSort("marginPercent")}>
                    {t("menu.colMargin")}{sortIndicator("marginPercent")}
                  </th>
                  <th style={thStyle}>{t("menu.colTrend")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const qStyle = quadrantColors[p.quadrant];
                  return (
                    <tr key={p.productId}>
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: qStyle.border,
                            marginRight: 8,
                          }}
                        />
                        {p.name}
                      </td>
                      <td style={tdStyle}>{p.category}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{p.salesCount}</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fmtCents(p.revenueCents)}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{fmtCents(p.costCents)}</td>
                      <td style={{ ...tdStyle, textAlign: "right", color: qStyle.text, fontWeight: 600 }}>
                        {p.marginPercent}%
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <TrendArrow trend={p.trend} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
