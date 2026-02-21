/**
 * OrderTimer — Timer de Pedido (Fase 3: Tempo Visível)
 *
 * OBJETIVO: Mostrar tempo de forma grande, legível e com feedback visual automático
 *
 * PRINCÍPIO: Se o cozinheiro olha por 1 segundo, ele entende se está atrasado
 *
 * REGRAS:
 * - Tempo grande e legível (sem precisar clicar)
 * - Mudança de cor automática (normal → atenção → atraso)
 * - Destaque visual progressivo (não agressivo)
 * - Sem texto explicativo ("atrasado")
 * - Sem segundos (só minutos)
 * - Sem hover (sempre visível)
 */
// @ts-nocheck


import React, { useEffect, useState } from "react";
import { Colors } from "../../../ui/design-system/tokens";

interface OrderTimerProps {
  createdAt: string;
}

// Thresholds (em minutos)
const THRESHOLDS = {
  NORMAL: 5, // < 5min: Verde (OK)
  WARNING: 15, // 5-15min: Amarelo (Atenção)
  CRITICAL: 15, // > 15min: Vermelho (Atrasado)
} as const;

export const OrderTimer: React.FC<OrderTimerProps> = ({ createdAt }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(createdAt).getTime();

    const update = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
    };

    update(); // Initial
    const timer = setInterval(update, 1000);

    return () => clearInterval(timer);
  }, [createdAt]);

  // Formatar tempo: só minutos (sem segundos)
  // < 1h: "MM min"
  // >= 1h: "H:MM"
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}`;
    }
    return `${minutes} min`;
  };

  // Determinar estado visual
  const minutes = Math.floor(elapsed / 60);
  const isCritical = minutes > THRESHOLDS.CRITICAL;
  const isWarning =
    minutes >= THRESHOLDS.NORMAL && minutes <= THRESHOLDS.WARNING;

  // Cores e estilos por estado
  let color: string;
  let bgColor: string;
  let borderColor: string;
  let icon: string | null = null;
  let animation: string | undefined = undefined;

  if (isCritical) {
    // Vermelho — Atrasado
    color = Colors.risk.high; // #EF4444
    bgColor = "rgba(239, 68, 68, 0.15)";
    borderColor = Colors.risk.high;
    icon = "⚠️";
    animation = "kds-timer-pulse 2s ease-in-out infinite";
  } else if (isWarning) {
    // Amarelo — Atenção
    color = Colors.risk.medium; // #FBBF24
    bgColor = "rgba(251, 191, 36, 0.12)";
    borderColor = Colors.risk.medium;
    icon = null;
    animation = undefined;
  } else {
    // Verde — Normal
    color = Colors.risk.low; // #22C55E
    bgColor = "rgba(34, 197, 94, 0.12)";
    borderColor = Colors.risk.low;
    icon = null;
    animation = undefined;
  }

  return (
    <>
      <style>{`
                @keyframes kds-timer-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.85; transform: scale(1.02); }
                }
            `}</style>
      <span
        style={{
          fontFamily: "monospace",
          fontWeight: "bold",
          fontSize: "16px", // Grande e legível
          color: color,
          padding: "6px 12px",
          borderRadius: "6px",
          background: bgColor,
          border: `2px solid ${borderColor}`,
          minWidth: "80px",
          textAlign: "center",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          boxShadow: isCritical ? `0 0 12px ${borderColor}40` : "none",
          animation: animation,
          transition: "all 0.3s ease",
        }}
      >
        {icon && <span style={{ fontSize: "14px" }}>{icon}</span>}
        <span>{formatTime(elapsed)}</span>
      </span>
    </>
  );
};
