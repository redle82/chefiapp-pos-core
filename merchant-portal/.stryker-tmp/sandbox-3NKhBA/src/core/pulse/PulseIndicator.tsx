/**
 * PulseIndicator — Visual badge showing the restaurant's operational pulse
 *
 * Displays a colored dot (🔴🟡🟢) with the zone label.
 * Animates on zone transitions.
 *
 * Usage: Place in the header/navbar. Gracefully hides when pulse is inactive.
 */
// @ts-nocheck


import React, { useEffect, useState } from "react";
import type { PulseZone } from "../../../../core-engine/pulse";
import { usePulseOptional } from "./PulseProvider";

// ---------------------------------------------------------------------------
// Zone → Visual mapping
// ---------------------------------------------------------------------------

interface ZoneVisual {
  /** CSS color for the dot */
  color: string;
  /** Emoji for the dot */
  emoji: string;
  /** Short label */
  label: string;
  /** Background tint (very subtle) */
  bgTint: string;
}

const ZONE_VISUALS: Record<PulseZone, ZoneVisual> = {
  FLOW_ALTO: {
    color: "#22c55e",
    emoji: "🟢",
    label: "Flow Alto",
    bgTint: "rgba(34,197,94,0.08)",
  },
  FLOW_PARCIAL: {
    color: "#eab308",
    emoji: "🟡",
    label: "Flow Parcial",
    bgTint: "rgba(234,179,8,0.08)",
  },
  FLOW_BASE: {
    color: "#ef4444",
    emoji: "🔴",
    label: "Flow Base",
    bgTint: "rgba(239,68,68,0.08)",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface PulseIndicatorProps {
  /** Show numeric score next to badge */
  showScore?: boolean;
  /** Show zone label text */
  showLabel?: boolean;
  /** Compact mode (dot only) */
  compact?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({
  showScore = false,
  showLabel = true,
  compact = false,
  className = "",
}) => {
  const pulse = usePulseOptional();
  const [animating, setAnimating] = useState(false);

  // Trigger animation on zone change
  useEffect(() => {
    if (pulse?.zoneChanged) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [pulse?.zoneChanged, pulse?.snapshot?.zone]);

  // Don't render when pulse is inactive
  if (!pulse?.isActive || !pulse.snapshot) {
    return null;
  }

  const { snapshot } = pulse;
  const visual = ZONE_VISUALS[snapshot.zone];

  if (compact) {
    return (
      <span
        className={`pulse-indicator pulse-indicator--compact ${className}`}
        title={`${visual.label}: ${snapshot.score}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span
          className={animating ? "pulse-dot pulse-dot--animate" : "pulse-dot"}
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: visual.color,
            display: "inline-block",
            transition: "background-color 0.4s ease",
          }}
        />
      </span>
    );
  }

  return (
    <div
      className={`pulse-indicator ${
        animating ? "pulse-indicator--transition" : ""
      } ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "4px 12px",
        borderRadius: "16px",
        backgroundColor: visual.bgTint,
        border: `1px solid ${visual.color}33`,
        fontSize: "13px",
        fontWeight: 500,
        transition: "all 0.4s ease",
        cursor: "default",
      }}
      title={`Pulso Operacional: ${snapshot.score}/100`}
    >
      <span
        className={animating ? "pulse-dot pulse-dot--animate" : "pulse-dot"}
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: visual.color,
          display: "inline-block",
          transition: "background-color 0.4s ease",
          animation: animating ? "pulse-ping 1.2s ease-out" : "none",
        }}
      />

      {showLabel && (
        <span style={{ color: visual.color, whiteSpace: "nowrap" }}>
          {visual.label}
        </span>
      )}

      {showScore && (
        <span
          style={{
            color: "#666",
            fontSize: "12px",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {snapshot.score}
        </span>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Keyframe injection (only once)
// ---------------------------------------------------------------------------

const STYLE_ID = "pulse-indicator-keyframes";

if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes pulse-ping {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(2.2); opacity: 0.4; }
      100% { transform: scale(1); opacity: 1; }
    }
    .pulse-dot--animate {
      animation: pulse-ping 1.2s ease-out;
    }
  `;
  document.head.appendChild(style);
}
