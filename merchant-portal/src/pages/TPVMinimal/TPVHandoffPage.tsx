import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listTPVHandoffs,
  markTPVHandoffStatus,
  type TPVHandoffRecord,
  type TPVHandoffStatus,
} from "../../core/tpv/TPVHandoffApi";
import { useTPVRestaurantId } from "./hooks/useTPVRestaurantId";

const STATUS_OPTIONS: Array<{ key: TPVHandoffStatus | "all"; label: string }> =
  [
    { key: "all", label: "Todos" },
    { key: "pending", label: "Pronta para fechar" },
    { key: "awaiting_payment", label: "Aguardando pagamento" },
    { key: "closed", label: "Fechada" },
  ];

function formatMoney(cents?: number | null) {
  if (cents == null) return "—";
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function TPVHandoffPage() {
  const restaurantId = useTPVRestaurantId();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<TPVHandoffStatus | "all">(
    "pending",
  );
  const [items, setItems] = useState<TPVHandoffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rpcMissing, setRpcMissing] = useState(false);

  const load = useCallback(async () => {
    if (!restaurantId || rpcMissing) return;
    setLoading(true);
    const result = await listTPVHandoffs(
      restaurantId,
      statusFilter === "all" ? undefined : statusFilter,
    );
    if (result.error) {
      // PGRST202 / FUNCTION_UNAVAILABLE = RPC not present in Core — stop polling
      const code = (result.error as { code?: string }).code;
      const msg = result.error.message ?? "";
      if (
        code === "PGRST202" ||
        code === "FUNCTION_UNAVAILABLE" ||
        msg.includes("not found") ||
        msg.includes("not available")
      ) {
        if (!rpcMissing) {
          console.warn(
            "[TPVHandoff] list_tpv_handoffs RPC not available — migration pending. Polling stopped.",
          );
        }
        setRpcMissing(true);
      }
    } else {
      setItems(result.data);
    }
    setLoading(false);
  }, [restaurantId, statusFilter, rpcMissing]);

  useEffect(() => {
    void load();
    if (rpcMissing) return;
    const id = setInterval(() => {
      void load();
    }, 2000);
    return () => clearInterval(id);
  }, [load, rpcMissing]);

  const grouped = useMemo(() => items, [items]);

  const updateStatus = async (id: string, status: TPVHandoffStatus) => {
    setActingId(id);
    await markTPVHandoffStatus({ handoffId: id, status });
    setActingId(null);
    await load();
  };

  return (
    <div style={{ padding: 16, display: "grid", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, color: "var(--text-primary)" }}>
            Finalizações (Handoff)
          </h1>
          <p
            style={{
              marginTop: 6,
              color: "var(--text-tertiary, #737373)",
              fontSize: 13,
            }}
          >
            Pedidos enviados pelo garçom para fechar/pagar no TPV central.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setStatusFilter(opt.key)}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "6px 10px",
              cursor: "pointer",
              background:
                statusFilter === opt.key
                  ? "var(--color-primary, #c9a227)"
                  : "var(--surface-elevated, #262626)",
              color:
                statusFilter === opt.key
                  ? "#000"
                  : "var(--text-secondary, #a3a3a3)",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {rpcMissing ? (
        <div
          style={{
            color: "var(--text-secondary, #a3a3a3)",
            fontSize: 13,
            padding: "12px 0",
          }}
        >
          Handoff ainda não disponível — migração de base de dados pendente.
          <br />
          <span style={{ fontSize: 11, color: "#525252" }}>
            Execute a migração <code>20260302_tpv_handoffs_inbox.sql</code> no
            Core para ativar.
          </span>
        </div>
      ) : loading ? (
        <div style={{ color: "var(--text-secondary, #a3a3a3)", fontSize: 13 }}>
          A carregar handoffs...
        </div>
      ) : grouped.length === 0 ? (
        <div style={{ color: "var(--text-secondary, #a3a3a3)", fontSize: 13 }}>
          Sem handoffs nesta fila.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {grouped.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid var(--surface-border, #2f2f2f)",
                borderRadius: 12,
                padding: 12,
                background: "var(--surface-elevated, #171717)",
                display: "grid",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  Mesa {item.table_number ?? "—"}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-tertiary, #737373)",
                  }}
                >
                  {timeAgo(item.requested_at)}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  fontSize: 13,
                }}
              >
                <span style={{ color: "var(--text-secondary, #a3a3a3)" }}>
                  {item.waiter_name ?? "Operador"}
                </span>
                <strong style={{ color: "var(--text-primary)" }}>
                  {formatMoney(item.total_estimated_cents)}
                </strong>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => navigate("/op/tpv/tables")}
                  style={actionBtnStyle}
                >
                  Abrir mesa
                </button>
                <button
                  type="button"
                  disabled={actingId === item.id}
                  onClick={async () => {
                    await updateStatus(item.id, "awaiting_payment");
                    navigate("/op/tpv");
                  }}
                  style={actionPrimaryStyle}
                >
                  Finalizar & pagar
                </button>
                <button
                  type="button"
                  disabled={actingId === item.id}
                  onClick={async () => {
                    await updateStatus(item.id, "closed");
                  }}
                  style={actionBtnStyle}
                >
                  Marcar fechada
                </button>
                <button
                  type="button"
                  disabled={actingId === item.id}
                  onClick={async () => {
                    await updateStatus(item.id, "awaiting_payment");
                  }}
                  style={actionBtnStyle}
                >
                  Imprimir conta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  border: "1px solid var(--surface-border, #2f2f2f)",
  borderRadius: 8,
  padding: "7px 10px",
  background: "var(--surface-elevated, #262626)",
  color: "var(--text-primary)",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
};

const actionPrimaryStyle: React.CSSProperties = {
  ...actionBtnStyle,
  border: "none",
  background: "var(--color-primary, #c9a227)",
  color: "#111",
};
