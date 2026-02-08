import { useMemo, useState } from "react";
import { DataModeBanner } from "../../components/DataModeBanner";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { useSalesSummaryReport } from "../../core/reports/hooks/useSalesSummaryReport";
import type { TimeRange } from "../../core/reports/reportTypes";

function dateRangeToTimeRange(from: Date, to: Date): TimeRange {
  return {
    from: from.getTime(),
    to: to.getTime(),
  };
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format((cents || 0) / 100);
}

export function SalesSummaryReportPage() {
  const { runtime } = useRestaurantRuntime();
  const now = useMemo(() => new Date(), []);
  const start = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
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

  const period = dateRangeToTimeRange(dateFrom, dateTo);
  const { data, loading, error, reload } = useSalesSummaryReport(period);

  const handleApply = () => {
    reload();
  };

  const hasData = !!data && data.ordersCount > 0;

  const toInput = (d: Date) => d.toISOString().slice(0, 10);

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
    <div style={{ padding: '24px', maxWidth: 960, margin: '0 auto' }}>
      <DataModeBanner dataMode={runtime.dataMode} />
      <h1
        style={{
          fontSize: '20px',
          fontWeight: 700,
          marginBottom: 8,
          color: '#0f172a',
        }}
      >
        Resumo de Vendas
      </h1>
      <p
        style={{
          fontSize: 14,
          color: '#64748b',
          marginTop: 0,
          marginBottom: 24,
        }}
      >
        Visão rápida de faturação por período: total de vendas, cancelamentos e
        ticket médio. Ideal para responder “como foi o dia?” em segundos.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            color: '#475569',
          }}
        >
          De
          <input
            type="date"
            value={toInput(dateFrom)}
            onChange={(e) =>
              setDateFrom(new Date(e.target.value + 'T00:00:00'))
            }
            style={{
              padding: '8px 12px',
              fontSize: 14,
              border: '1px solid #e2e8f0',
              borderRadius: 8,
            }}
          />
        </label>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            color: '#475569',
          }}
        >
          Até
          <input
            type="date"
            value={toInput(dateTo)}
            onChange={(e) =>
              setDateTo(new Date(e.target.value + 'T23:59:59'))
            }
            style={{
              padding: '8px 12px',
              fontSize: 14,
              border: '1px solid #e2e8f0',
              borderRadius: 8,
            }}
          />
        </label>
        <button
          type="button"
          onClick={handleApply}
          disabled={loading}
          style={{
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 500,
            color: '#fff',
            backgroundColor: '#0f172a',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'A carregar…' : 'Aplicar'}
        </button>
      </div>

      {error && (
        <p style={{ fontSize: 14, color: '#dc2626', marginBottom: 16 }}>
          {error}
        </p>
      )}

      {!hasData && !loading && !error && (
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 14,
            border: '1px dashed #e2e8f0',
            backgroundColor: '#f8fafc',
          }}
        >
          <h2
            style={{
              margin: 0,
              marginBottom: 8,
              fontSize: 16,
              fontWeight: 600,
              color: '#0f172a',
            }}
          >
            Ainda não há dados suficientes.
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: '#64748b',
              maxWidth: 520,
            }}
          >
            Assim que começar a fechar contas regularmente, este painel mostra o
            total vendido, cancelamentos e ticket médio do período escolhido.
          </p>
        </div>
      )}

      {hasData && data && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              backgroundColor: '#0f172a',
              color: '#e5e7eb',
            }}
          >
            <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>
              Vendas brutas
            </p>
            <p
              style={{
                margin: 0,
                marginTop: 8,
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              {formatCurrency(data.grossTotalCents)}
            </p>
          </div>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
              Ticket médio
            </p>
            <p
              style={{
                margin: 0,
                marginTop: 8,
                fontSize: 20,
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              {formatCurrency(data.averageTicketCents)}
            </p>
          </div>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
              Contas fechadas
            </p>
            <p
              style={{
                margin: 0,
                marginTop: 8,
                fontSize: 20,
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              {data.ordersCount - data.cancelledOrdersCount}
            </p>
          </div>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 14,
              border: '1px solid #fee2e2',
              backgroundColor: '#fef2f2',
            }}
          >
            <p style={{ margin: 0, fontSize: 12, color: '#b91c1c' }}>
              Cancelamentos
            </p>
            <p
              style={{
                margin: 0,
                marginTop: 8,
                fontSize: 20,
                fontWeight: 600,
                color: '#b91c1c',
              }}
            >
              {data.cancelledOrdersCount}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

