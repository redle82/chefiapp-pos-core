/**
 * ScreenLayout — Layout dedicado para telas operacionais isoladas.
 *
 * Substituí o TPVLayout quando a tela é lançada pelo hub de Telas.
 * Sem sidebar do TPV, sem search, sem filter, sem navegação lateral.
 * Header mínimo: logo + nome da estação + relógio + botão voltar ao TPV.
 *
 * Usado por: /screen/kitchen, /screen/bar, /screen/delivery,
 *            /screen/customer-display, /screen/expo
 */

import { useEffect, useState, type ReactNode } from "react";

interface ScreenLayoutProps {
  /** Station label shown in the header (e.g. "Cozinha KDS", "Bar KDS") */
  stationLabel: string;
  /** Accent color for the station badge */
  stationColor?: string;
  /** If true, hides the "Voltar ao TPV" button (e.g. customer display) */
  hideBackButton?: boolean;
  children: ReactNode;
}

function Clock() {
  const [time, setTime] = useState(() => formatTime());

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span style={{ fontSize: 14, fontWeight: 600, color: "#a3a3a3", fontVariantNumeric: "tabular-nums" }}>
      {time}
    </span>
  );
}

function formatTime() {
  const now = new Date();
  return now.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

export function ScreenLayout({
  stationLabel,
  stationColor = "#f97316",
  hideBackButton = false,
  children,
}: ScreenLayoutProps) {
  const handleBack = () => {
    // Navigate to TPV screens hub in the opener window, then close this one
    if (window.opener && !window.opener.closed) {
      window.opener.focus();
    }
    window.close();
    // Fallback if window.close() is blocked (non-popup context)
    window.location.href = "/op/tpv/screens";
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        backgroundColor: "#0a0a0a",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#fafafa",
      }}
    >
      {/* Minimal header */}
      <header
        style={{
          height: 52,
          minHeight: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backgroundColor: "#0a0a0a",
        }}
      >
        {/* Left: logo + station */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/Logo%20Chefiapp%20Transparent.png"
            alt="ChefIApp"
            width={28}
            height={28}
            style={{ borderRadius: "50%" }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 6,
              backgroundColor: `${stationColor}20`,
              color: stationColor,
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}
          >
            {stationLabel}
          </span>
        </div>

        {/* Right: clock + back button */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Clock />
          {!hideBackButton && (
            <button
              type="button"
              onClick={handleBack}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)",
                backgroundColor: "transparent",
                color: "#a3a3a3",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Voltar ao TPV
            </button>
          )}
        </div>
      </header>

      {/* Content — 100% of the station */}
      <main
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </main>
    </div>
  );
}
