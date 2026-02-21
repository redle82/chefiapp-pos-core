// @ts-nocheck
import React from "react";
import { FireSystem, type FireState } from "./FireSystem";

interface OSSignatureProps {
  /**
   * The Thermal State of the parent layout.
   * The signature will automatically adapt its tone.
   */
  state?: FireState;

  /**
   * Override tone if absolutely necessary (e.g. specialized card).
   * Prefer using `state` to maintain system coherence.
   */
  forcedTone?: "gold" | "ember" | "black" | "light";

  /**
   * Size of the signature.
   * @default 'md'
   */
  size?: "sm" | "md" | "lg" | "xl";

  /** When false, show only "ChefIApp™" (no " OS"). Used for "Powered by ChefIApp™". */
  showOS?: boolean;

  className?: string;
}

export const OSSignature: React.FC<OSSignatureProps> = ({
  state = "ember",
  forcedTone,
  size = "md",
  showOS = true,
  className = "",
}) => {
  // 1. Derive logic from System
  const thermalRules = FireSystem[state];
  const tone = forcedTone || thermalRules.logoTone;

  // 2. Resolve Colors
  const getTextColor = () => {
    switch (tone) {
      case "gold":
        return "#C9A227"; // Ouro Técnico
      case "ember":
        return "#D9381E"; // Brasa (Monochrome Red)
      case "black":
        return "#000000"; // For Alert state
      case "light":
        return "#FFFFFF";
      default:
        return "#C9A227";
    }
  };

  const getOSColor = () => {
    if (state === "alert") return "#000000";
    return thermalRules.osBadgeColor;
  };

  // 3. Resolve Size
  const getTextSize = () => {
    switch (size) {
      case "sm":
        return "14px";
      case "md":
        return "18px";
      case "lg":
        return "24px";
      case "xl":
        return "32px";
    }
  };

  const logoSize =
    size === "xl" ? 32 : size === "lg" ? 24 : size === "md" ? 20 : 16;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontFamily: "var(--font-heading, sans-serif)", // Fallback if var not loaded
        userSelect: "none",
      }}
    >
      {/* Logo canónico ChefIApp (chapéu geométrico dourado). Ver LOGO_IDENTITY_CONTRACT.md */}
      <img
        src="/logo-chefiapp-clean.png"
        alt=""
        width={logoSize}
        height={logoSize}
        style={{
          width: logoSize,
          height: logoSize,
          objectFit: "contain",
          flexShrink: 0,
        }}
        aria-hidden
      />

      {/* WORDMARK */}
      <span
        style={{
          color: getTextColor(),
          fontSize: getTextSize(),
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        ChefIApp™
        {showOS && (
          <span
            style={{
              color: getOSColor(),
              marginLeft: "4px",
              fontWeight: 900,
            }}
          >
            OS
          </span>
        )}
      </span>
    </div>
  );
};
