/**
 * ChefIAppSignature — Assinatura sempre com logo (Identity Layer).
 * Nunca renderizar apenas texto "ChefIApp OS"; sempre logo + "ChefIApp™" (e opcionalmente " OS").
 * Ver docs/design/IDENTITY_LAYER_CONTRACT.md.
 */

import React from "react";
import { OSSignature } from "./OSSignature";

export type ChefIAppSignatureVariant = "full" | "powered";

interface ChefIAppSignatureProps {
  /** full = "ChefIApp™ OS"; powered = "Powered by ChefIApp™" (ou poweredLabel) */
  variant?: ChefIAppSignatureVariant;
  size?: "sm" | "md" | "lg" | "xl";
  /** Tom para áreas internas (dashboard/staff): light ou gold */
  tone?: "gold" | "light";
  /** Para variant="powered": texto antes da marca (ex. "Tecnologia" no Staff) */
  poweredLabel?: string;
  className?: string;
}

export const ChefIAppSignature: React.FC<ChefIAppSignatureProps> = ({
  variant = "full",
  size = "sm",
  tone = "light",
  poweredLabel = "Powered by",
  className = "",
}) => {
  if (variant === "powered") {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: size === "sm" ? 11 : size === "md" ? 12 : 14,
          color: "var(--color-neutral-500, #737373)",
          fontWeight: 500,
        }}
      >
        <span>{poweredLabel}</span>
        <OSSignature forcedTone={tone} size={size} showOS={false} />
      </div>
    );
  }
  return <OSSignature forcedTone={tone} size={size} className={className} />;
};
