import { useEffect, useState } from "react";
import { getKitchenLoad, type KitchenLoad } from "../../../core/kitchen/PrepTimerService";

const STATUS_CONFIG = {
  ok: { color: "#22c55e", label: "Kitchen OK", bg: "rgba(34,197,94,0.1)" },
  busy: { color: "#f59e0b", label: "Busy", bg: "rgba(245,158,11,0.1)" },
  overloaded: { color: "#ef4444", label: "Overloaded", bg: "rgba(239,68,68,0.1)" },
} as const;

export default function KitchenLoadWidget() {
  const [load, setLoad] = useState<KitchenLoad>({ activeOrders: 0, estimatedWaitMinutes: 0, status: "ok" });

  useEffect(() => {
    const update = () => setLoad(getKitchenLoad());
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const cfg = STATUS_CONFIG[load.status];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 9999,
        background: cfg.bg,
        fontSize: 12,
        fontWeight: 500,
        color: cfg.color,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: cfg.color,
          display: "inline-block",
          animation: load.status === "overloaded" ? "pulse 1s infinite" : undefined,
        }}
      />
      <span>{cfg.label}</span>
      {load.activeOrders > 0 && (
        <span style={{ color: "#a3a3a3", fontSize: 11 }}>
          {load.activeOrders} orders · ~{load.estimatedWaitMinutes}min
        </span>
      )}
    </div>
  );
}
