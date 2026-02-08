import { useMemo, useState } from "react";
import { DataModeBanner } from "../../components/DataModeBanner";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { useOperationalActivityReport } from "../../core/reports/hooks/useOperationalActivityReport";
import type { TimeRange } from "../../core/reports/reportTypes";

function dateRangeToTimeRange(from: Date, to: Date): TimeRange {
  return {
    from: from.getTime(),
    to: to.getTime(),
  };
}

export function OperationalActivityReportPage() {
  const { runtime } = useRestaurantRuntime();
  const now = useMemo(() => new Date(), []);
  const start = useMemo(() => {
    const d = new Date(now);
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
  const { data, loading, error, reload } = useOperationalActivityReport(period);

  const handleApply = () => {
    reload();
  };

  const hasData = !!data && data.buckets.length > 0;
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
        Atividade da Operação
      </h1>
      <p
        style={{
          fontSize: 14,
          color: '#64748b',
          marginTop: 0,
          marginBottom: 24,
        }}
      >
        Contas abertas, fechadas e canceladas por hora, mais duração média das
        contas. Feito para sentir a energia do turno, não para burocracia.
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
          Dia
          <input
            type="date"
            value={toInput(dateFrom)}
            onChange={(e) => {
              const d = new Date(e.target.value + 'T00:00:00');
              setDateFrom(d);
              const endOfDay = new Date(d);
              endOfDay.setHours(23, 59, 59, 999);
              setDateTo(endOfDay);
            }}
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
          {loading ? 'A carregar…' : 'Atualizar'}
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
            Ainda não dá para sentir o turno.
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: '#64748b',
              maxWidth: 520,
            }}
          >
            Quando começar a abrir e fechar contas ao longo do dia, esta tela
            mostra em que horas a operação ganha ou perde ritmo.
          </p>
        </div>
      )}

      {hasData && data && (
        <div
          style={{
            padding: '20px 24px',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            backgroundColor: '#fff',
          }}
        >
          <h2
            style={{
              margin: 0,
              marginBottom: 12,
              fontSize: 16,
              fontWeight: 600,
              color: '#0f172a',
            }}
          >
            Contas por hora
          </h2>
          <p
            style={{
              margin: 0,
              marginBottom: 12,
              fontSize: 13,
              color: '#64748b',
            }}
          >
            Use como mapa de calor mental: mais contas = mais energia. Cancelamentos
            frequentes em certos horários podem indicar sobrecarga ou falhas de
            processo.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '8px 8px 8px 0',
                      color: '#64748b',
                      fontWeight: 500,
                    }}
                  >
                    Hora
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: 8,
                      color: '#64748b',
                      fontWeight: 500,
                    }}
                  >
                    Abertas
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: 8,
                      color: '#64748b',
                      fontWeight: 500,
                    }}
                  >
                    Fechadas
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: 8,
                      color: '#64748b',
                      fontWeight: 500,
                    }}
                  >
                    Canceladas
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      padding: '8px 0 8px 8px',
                      color: '#64748b',
                      fontWeight: 500,
                    }}
                  >
                    Duração média (min)
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.buckets.map((b) => (
                  <tr
                    key={b.bucketStart}
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                  >
                    <td
                      style={{ padding: '8px 8px 8px 0', color: '#1e293b' }}
                    >
                      {b.bucketLabel}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        textAlign: 'right',
                        color: '#1e293b',
                      }}
                    >
                      {b.ordersOpened}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        textAlign: 'right',
                        color: '#1e293b',
                      }}
                    >
                      {b.ordersClosed}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        textAlign: 'right',
                        color: '#b91c1c',
                      }}
                    >
                      {b.ordersCancelled}
                    </td>
                    <td
                      style={{
                        padding: '8px 0 8px 8px',
                        textAlign: 'right',
                        color: '#1e293b',
                      }}
                    >
                      {b.averageDurationSeconds != null
                        ? (b.averageDurationSeconds / 60).toFixed(1)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

