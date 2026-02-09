import { useMemo, useState, useCallback } from "react";
import { DataModeBanner } from "../../components/DataModeBanner";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { useGamificationImpactReport } from "../../core/reports/hooks/useGamificationImpactReport";
import { exportCsv, centsToDecimal } from "../../core/reports/csvExport";
import { currencyService } from "../../core/currency/CurrencyService";
import type { TimeRange } from "../../core/reports/reportTypes";

function dateRangeToTimeRange(from: Date, to: Date): TimeRange {
  return {
    from: from.getTime(),
    to: to.getTime(),
  };
}

function formatCurrency(cents: number): string {
  return currencyService.formatAmount(cents);
}

export function GamificationImpactReportPage() {
  const { runtime } = useRestaurantRuntime();
  const now = useMemo(() => new Date(), []);
  const start = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 13);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);
  const end = useMemo(() => {
    const d = new Date(now);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [now]);

  const [dateFrom, setDateFrom] = useState<Date>(start);
  const [dateTo, setDateTo] = useState<Date>(end);

  const globalPeriod = dateRangeToTimeRange(dateFrom, dateTo);

  const mid = useMemo(() => {
    const half = new Date(dateFrom.getTime());
    half.setDate(
      half.getDate() +
        Math.floor((dateTo.getTime() - dateFrom.getTime()) / (2 * 86400000)),
    );
    return half;
  }, [dateFrom, dateTo]);

  const windows = useMemo(
    () => [
      {
        id: "before",
        label: "Antes",
        period: dateRangeToTimeRange(dateFrom, mid),
      },
      {
        id: "after",
        label: "Depois",
        period: dateRangeToTimeRange(mid, dateTo),
      },
    ],
    [dateFrom, mid, dateTo],
  );

  const { data, loading, error, reload } = useGamificationImpactReport(
    windows,
    globalPeriod,
  );

  const toInput = (d: Date) => d.toISOString().slice(0, 10);
  const hasData = !!data && data.points.some((p) => p.ordersCount > 0);

  const handleApply = () => {
    reload();
  };

  const handleExportCsv = useCallback(() => {
    if (!data) return;
    const fromStr = toInput(dateFrom);
    const toStr = toInput(dateTo);
    exportCsv(
      ["Período", "Pedidos", "Ticket Médio"],
      data.points.map((p) => [
        p.windowLabel,
        p.ordersCount,
        centsToDecimal(p.averageTicketCents),
      ]),
      `gamificacao-impacto-${fromStr}-${toStr}.csv`,
    );
  }, [data, dateFrom, dateTo]);

  if (!runtime) {
    return (
      <GlobalLoadingView
        message="A carregar..."
        layout="portal"
        variant="fullscreen"
      />
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: 960, margin: "0 auto" }}>
      <DataModeBanner dataMode={runtime.dataMode} />
      <h1
        style={{
          fontSize: "20px",
          fontWeight: 700,
          marginBottom: 8,
          color: "#0f172a",
        }}
      >
        Impacto da Gamificação
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "#64748b",
          marginTop: 0,
          marginBottom: 24,
        }}
      >
        Compara pedido médio e volume de vendas antes e depois de um período
        (por exemplo, o início de uma campanha ou missões para a equipa).
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            color: "#475569",
          }}
        >
          De
          <input
            type="date"
            value={toInput(dateFrom)}
            onChange={(e) =>
              setDateFrom(new Date(e.target.value + "T00:00:00"))
            }
            style={{
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid #e2e8f0",
              borderRadius: 8,
            }}
          />
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            color: "#475569",
          }}
        >
          Até
          <input
            type="date"
            value={toInput(dateTo)}
            onChange={(e) => setDateTo(new Date(e.target.value + "T23:59:59"))}
            style={{
              padding: "8px 12px",
              fontSize: 14,
              border: "1px solid #e2e8f0",
              borderRadius: 8,
            }}
          />
        </label>
        <button
          type="button"
          onClick={handleApply}
          disabled={loading}
          style={{
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 500,
            color: "#fff",
            backgroundColor: "#0f172a",
            border: "none",
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "A carregar…" : "Aplicar"}
        </button>
        {hasData && (
          <button
            type="button"
            onClick={handleExportCsv}
            style={{
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 500,
              color: "#0f172a",
              backgroundColor: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            ⬇ Exportar CSV
          </button>
        )}
      </div>

      {error && (
        <p style={{ fontSize: 14, color: "#dc2626", marginBottom: 16 }}>
          {error}
        </p>
      )}

      {!hasData && !loading && !error && (
        <div
          style={{
            padding: "20px 24px",
            borderRadius: 14,
            border: "1px dashed #e2e8f0",
            backgroundColor: "#f8fafc",
          }}
        >
          <h2
            style={{
              margin: 0,
              marginBottom: 8,
              fontSize: 16,
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            Ainda não dá para medir o efeito.
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "#64748b",
              maxWidth: 520,
            }}
          >
            Quando tiver pedidos suficientes antes e depois do período
            escolhido, este painel mostra se a equipa e a gamificação estão a
            empurrar o ticket médio para cima.
          </p>
        </div>
      )}

      {hasData && data && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {data.points.map((p) => (
            <div
              key={p.windowLabel}
              style={{
                padding: "16px 20px",
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                backgroundColor:
                  p.windowLabel === "Depois" ? "#ecfdf3" : "#f8fafc",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: 0.04,
                }}
              >
                {p.windowLabel}
              </p>
              <p
                style={{
                  margin: 0,
                  marginTop: 8,
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                Pedidos
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                {p.ordersCount}
              </p>
              <p
                style={{
                  margin: 0,
                  marginTop: 8,
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                Ticket médio
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                {formatCurrency(p.averageTicketCents)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
