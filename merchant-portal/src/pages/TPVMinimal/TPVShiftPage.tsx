import { useCallback, useEffect, useMemo, useState } from "react";
import { useCurrency } from "../../core/currency/useCurrency";
import { useShift } from "../../core/shift/ShiftContext";
import {
  CashRegisterEngine,
  type CashRegister,
} from "../../core/tpv/CashRegister";
import { useTPVRestaurantId } from "./hooks/useTPVRestaurantId";

const DEFAULT_OPERATOR = "Operador TPV";
const DEFAULT_REGISTER_NAME = "Caixa Principal";

export function TPVShiftPage() {
  const restaurantId = useTPVRestaurantId();
  const shift = useShift();
  const { formatAmount } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [register, setRegister] = useState<CashRegister | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openingCash, setOpeningCash] = useState("0");
  const [closingCash, setClosingCash] = useState("");
  const [operatorName, setOperatorName] = useState(DEFAULT_OPERATOR);
  const [closingName, setClosingName] = useState(DEFAULT_OPERATOR);
  const [acting, setActing] = useState(false);

  const expectedBalanceCents = useMemo(() => {
    if (!register) return 0;
    return register.openingBalanceCents + register.totalSalesCents;
  }, [register]);

  const loadRegister = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const openRegister = await CashRegisterEngine.getOpenCashRegister(
        restaurantId,
      );
      setRegister(openRegister);
      if (openRegister) {
        const expected =
          openRegister.openingBalanceCents + openRegister.totalSalesCents;
        setClosingCash((expected / 100).toFixed(2));
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar caixa.";
      setError(msg);
      setRegister(null);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      setError("Restaurante nao definido.");
      return;
    }
    loadRegister();
  }, [restaurantId, loadRegister]);

  const handleOpen = async () => {
    const value = Number.parseFloat(openingCash.replace(",", "."));
    if (Number.isNaN(value) || value < 0) {
      setError("Saldo inicial invalido.");
      return;
    }
    setActing(true);
    setError(null);
    try {
      await CashRegisterEngine.openCashRegister({
        restaurantId,
        name: DEFAULT_REGISTER_NAME,
        openingBalanceCents: Math.round(value * 100),
        openedBy: operatorName || DEFAULT_OPERATOR,
      });
      await shift.refreshShiftStatus();
      await loadRegister();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao abrir turno.";
      setError(msg);
    } finally {
      setActing(false);
    }
  };

  const handleClose = async () => {
    if (!register) return;
    const value = Number.parseFloat(closingCash.replace(",", "."));
    if (Number.isNaN(value) || value < 0) {
      setError("Saldo final invalido.");
      return;
    }
    setActing(true);
    setError(null);
    try {
      await CashRegisterEngine.closeCashRegister({
        cashRegisterId: register.id,
        restaurantId,
        closingBalanceCents: Math.round(value * 100),
        closedBy: closingName || DEFAULT_OPERATOR,
      });
      await shift.refreshShiftStatus();
      setRegister(null);
      setClosingCash("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao fechar turno.";
      setError(msg);
    } finally {
      setActing(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 820, margin: "0 auto" }}>
      <div style={{ marginBottom: 12 }}>
        <h1
          style={{
            color: "var(--text-primary)",
            margin: "4px 0 0",
            fontSize: 24,
          }}
        >
          Turno e Caixa
        </h1>
      </div>

      {loading && (
        <div style={{ color: "var(--text-secondary)", padding: 16 }}>
          A carregar estado do caixa...
        </div>
      )}

      {!loading && error && (
        <div
          style={{
            background: "rgba(239,68,68,0.15)",
            color: "#fecaca",
            border: "1px solid rgba(239,68,68,0.35)",
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {!loading && register && (
        <div
          style={{
            background: "var(--surface-elevated, #1a1a1a)",
            border: "1px solid var(--border-subtle, #333)",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>Caixa aberto</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fafafa" }}>
                {register.name}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              Operador: {register.openedBy || DEFAULT_OPERATOR}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                Saldo inicial
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {formatAmount(register.openingBalanceCents)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>Vendas</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {formatAmount(register.totalSalesCents)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                Saldo esperado
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {formatAmount(expectedBalanceCents)}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                flex: 1,
                minWidth: 220,
              }}
            >
              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                Saldo final (contagem)
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                style={{
                  background: "#0a0a0a",
                  border: "1px solid #333",
                  borderRadius: 8,
                  padding: "10px 12px",
                  color: "#fafafa",
                }}
              />
            </label>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                flex: 1,
                minWidth: 200,
              }}
            >
              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                Operador de fecho
              </span>
              <input
                type="text"
                value={closingName}
                onChange={(e) => setClosingName(e.target.value)}
                style={{
                  background: "#0a0a0a",
                  border: "1px solid #333",
                  borderRadius: 8,
                  padding: "10px 12px",
                  color: "#fafafa",
                }}
              />
            </label>
          </div>

          <button
            onClick={handleClose}
            disabled={acting}
            style={{
              alignSelf: "flex-end",
              background: "#ef4444",
              border: "none",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: 8,
              fontWeight: 700,
              cursor: acting ? "not-allowed" : "pointer",
            }}
          >
            Fechar turno
          </button>
        </div>
      )}

      {!loading && !register && (
        <div
          style={{
            background: "var(--surface-elevated, #1a1a1a)",
            border: "1px solid var(--border-subtle, #333)",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>Caixa fechado</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fafafa" }}>
              Abrir turno
            </div>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              Saldo inicial
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              style={{
                background: "#0a0a0a",
                border: "1px solid #333",
                borderRadius: 8,
                padding: "10px 12px",
                color: "#fafafa",
                maxWidth: 240,
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Operador</span>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              style={{
                background: "#0a0a0a",
                border: "1px solid #333",
                borderRadius: 8,
                padding: "10px 12px",
                color: "#fafafa",
                maxWidth: 320,
              }}
            />
          </label>

          <button
            onClick={handleOpen}
            disabled={acting}
            style={{
              alignSelf: "flex-start",
              background: "#22c55e",
              border: "none",
              color: "#000",
              padding: "10px 16px",
              borderRadius: 8,
              fontWeight: 700,
              cursor: acting ? "not-allowed" : "pointer",
            }}
          >
            Abrir turno
          </button>
        </div>
      )}
    </div>
  );
}
