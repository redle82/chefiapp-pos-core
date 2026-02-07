/**
 * UsageMeterRow — Linha de quota (uso/limite) com estado OK / Atenção / Estourado e CTA.
 * Ref: Uso del plan — dispositivos POS, integrações, delivery, SMS.
 */

import { useNavigate } from "react-router-dom";
import type { UsageMeter } from "../types";

function getStatus(used: number, limit: number): "ok" | "warning" | "over" {
  if (limit <= 0) return "ok";
  const pct = used / limit;
  if (pct >= 1) return "over";
  if (pct >= 0.8) return "warning";
  return "ok";
}

function getStatusColor(status: "ok" | "warning" | "over") {
  switch (status) {
    case "ok":
      return "#10b981";
    case "warning":
      return "#f59e0b";
    case "over":
      return "#ef4444";
  }
}

interface UsageMeterRowProps {
  meter: UsageMeter;
}

export function UsageMeterRow({ meter }: UsageMeterRowProps) {
  const navigate = useNavigate();
  const status = getStatus(meter.used, meter.limit);
  const color = getStatusColor(status);
  const pct = meter.limit > 0 ? Math.min(100, (meter.used / meter.limit) * 100) : 0;

  const handleManage = () => {
    if (meter.manageHref) navigate(meter.manageHref);
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
          {meter.label}
        </div>
        {meter.hint && (
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              marginTop: 2,
            }}
          >
            {meter.hint}
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 14, color: "#374151", whiteSpace: "nowrap" }}>
          {meter.limit > 0
            ? `${meter.used}/${meter.limit}${meter.unit ? ` ${meter.unit}` : ""}`
            : `${meter.used} ${meter.unit ?? ""}`}
        </span>
        {meter.limit > 0 && (
          <div
            style={{
              width: 80,
              height: 8,
              backgroundColor: "#e5e7eb",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                backgroundColor: color,
                borderRadius: 4,
              }}
            />
          </div>
        )}
        {status === "warning" && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#f59e0b",
            }}
          >
            Atención
          </span>
        )}
        {status === "over" && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#ef4444",
            }}
          >
            Límite superado
          </span>
        )}
      </div>
      {(meter.manageLabel || meter.manageHref) && (
        <button
          type="button"
          onClick={handleManage}
          style={{
            fontSize: 13,
            color: "#7c3aed",
            fontWeight: 500,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {meter.manageLabel ?? "Gestionar"}
        </button>
      )}
    </div>
  );
}
