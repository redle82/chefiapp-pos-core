/**
 * OrderContextGate — Full-view chooser for order destination.
 * Displays 4 large touch-friendly buttons so the operator picks
 * the order context (table, counter, takeaway, delivery) before
 * adding products.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { OrderMode } from "./OrderModeSelector";

interface OrderContextGateProps {
  onSelect: (mode: OrderMode) => void;
  onNavigateToTables: () => void;
}

interface GateButton {
  emoji: string;
  labelKey: string;
  hintKey: string;
  accent: string;
  action: () => void;
}

export function OrderContextGate({
  onSelect,
  onNavigateToTables,
}: OrderContextGateProps) {
  const { t } = useTranslation("tpv");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const buttons: GateButton[] = [
    {
      emoji: "🍽",
      labelKey: "contextGate.table",
      hintKey: "contextGate.tableHint",
      accent: "#f97316",
      action: onNavigateToTables,
    },
    {
      emoji: "🏪",
      labelKey: "contextGate.counter",
      hintKey: "contextGate.counterHint",
      accent: "#22c55e",
      action: () => onSelect("counter"),
    },
    {
      emoji: "📦",
      labelKey: "contextGate.takeaway",
      hintKey: "contextGate.takeawayHint",
      accent: "#3b82f6",
      action: () => onSelect("take_away"),
    },
    {
      emoji: "🛵",
      labelKey: "contextGate.delivery",
      hintKey: "contextGate.deliveryHint",
      accent: "#8b5cf6",
      action: () => onSelect("delivery"),
    },
  ];

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    paddingTop: 32,
    paddingBottom: 24,
    boxSizing: "border-box",
  };

  const innerStyle: React.CSSProperties = {
    maxWidth: 600,
    width: "100%",
    padding: "0 24px",
    boxSizing: "border-box",
  };

  const titleStyle: React.CSSProperties = {
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 22,
    margin: 0,
    textAlign: "center",
  };

  const subtitleStyle: React.CSSProperties = {
    color: "#737373",
    fontSize: 14,
    margin: "8px 0 28px",
    textAlign: "center",
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 16,
  };

  const footerStyle: React.CSSProperties = {
    color: "#525252",
    fontSize: 11,
    textAlign: "center",
    marginTop: 24,
  };

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        <p style={titleStyle}>{t("contextGate.title")}</p>
        <p style={subtitleStyle}>{t("contextGate.subtitle")}</p>

        <div style={gridStyle}>
          {buttons.map((btn, idx) => {
            const isHovered = hoveredIndex === idx;

            const buttonStyle: React.CSSProperties = {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 140,
              borderRadius: 16,
              border: `1px solid ${isHovered ? btn.accent : "#27272a"}`,
              backgroundColor: isHovered
                ? `${btn.accent}15`
                : `${btn.accent}08`,
              cursor: "pointer",
              padding: "20px 12px",
              boxSizing: "border-box",
              transition: "border-color 0.15s, background-color 0.15s",
              WebkitTapHighlightColor: "transparent",
            };

            const emojiStyle: React.CSSProperties = {
              fontSize: 48,
              lineHeight: 1,
              marginBottom: 10,
            };

            const labelStyle: React.CSSProperties = {
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 16,
              margin: 0,
            };

            const hintStyle: React.CSSProperties = {
              color: "#737373",
              fontSize: 12,
              margin: "4px 0 0",
              textAlign: "center",
            };

            return (
              <button
                key={btn.labelKey}
                type="button"
                style={buttonStyle}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={btn.action}
              >
                <span style={emojiStyle}>{btn.emoji}</span>
                <span style={labelStyle}>{t(btn.labelKey)}</span>
                <span style={hintStyle}>{t(btn.hintKey)}</span>
              </button>
            );
          })}
        </div>

        <p style={footerStyle}>{t("contextGate.canChangeLater")}</p>
      </div>
    </div>
  );
}
