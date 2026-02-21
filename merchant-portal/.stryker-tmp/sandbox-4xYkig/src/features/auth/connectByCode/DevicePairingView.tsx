/**
 * DevicePairingView — Tela "Vincular dispositivo" (CODE_AND_DEVICE_PAIRING_CONTRACT).
 * Mostrar quando o dispositivo não tem identidade pareada; input PIN → pairLocal → salva identity + inicia heartbeat.
 * TODO: secure storage for deviceSecret when backend exists.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setInstalledDevice } from "../../../core/storage/installedDeviceStorage";
import {
  pairLocal,
  startHeartbeatMock,
} from "./devicePairing";

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0a0a0a",
    color: "#fafafa",
    fontFamily: "Inter, system-ui, sans-serif",
    textAlign: "center",
  },
  title: { fontSize: 22, marginBottom: 8, fontWeight: 700 },
  subtitle: { fontSize: 15, color: "#a3a3a3", marginBottom: 24, maxWidth: 360 },
  input: {
    padding: "14px 18px",
    fontSize: 20,
    letterSpacing: 6,
    textAlign: "center",
    border: "2px solid #404040",
    borderRadius: 8,
    background: "#171717",
    color: "#fafafa",
    width: 200,
    marginBottom: 16,
  },
  button: {
    padding: "12px 24px",
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    backgroundColor: "#eab308",
    color: "#0a0a0a",
  },
  error: { fontSize: 14, color: "#f87171", marginTop: 12 },
};

type DeviceType = "tpv" | "kds";

export function DevicePairingView({
  deviceType = "tpv",
}: {
  deviceType?: DeviceType;
}) {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVincular = () => {
    setError(null);
    setLoading(true);
    const result = pairLocal(pin.trim());
    setLoading(false);
    if (!result) {
      setError("PIN inválido ou expirado. Peça um novo PIN no portal.");
      return;
    }
    setInstalledDevice({
      device_id: result.deviceId,
      restaurant_id: result.restaurantId,
      module_id: result.deviceType,
      device_name: `${result.deviceType.toUpperCase()}_${result.deviceId.slice(0, 8)}`,
    });
    startHeartbeatMock(result.deviceId);
    const path = result.deviceType === "tpv" ? "/op/tpv" : "/op/kds";
    navigate(path, { replace: true });
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Vincular dispositivo</h1>
      <p style={styles.subtitle}>
        Digite o PIN gerado no portal (Gestión de dispositivos). O PIN expira em 60 segundos.
      </p>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        placeholder="PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        style={styles.input}
        autoFocus
      />
      <button
        type="button"
        onClick={handleVincular}
        disabled={loading || pin.length < 4}
        style={styles.button}
      >
        {loading ? "A vincular..." : "Vincular"}
      </button>
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}
