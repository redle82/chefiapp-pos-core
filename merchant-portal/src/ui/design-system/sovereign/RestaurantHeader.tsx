/**
 * RestaurantHeader — Nome do restaurante + logo ou iniciais (Identity Layer).
 * Usado no topbar e no topo da sidebar. Sempre mostra identidade visual: logo quando existe, iniciais em círculo quando não.
 * Ver docs/design/IDENTITY_LAYER_CONTRACT.md e DESIGN_SYSTEM.md.
 */

import React from "react";
import { RestaurantLogo } from "../../RestaurantLogo";

interface RestaurantHeaderProps {
  name: string;
  logoUrl?: string;
  size?: "sm" | "md";
  className?: string;
}

const LOGO_SIZE = { sm: 28, md: 36 } as const;

export const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({
  name,
  logoUrl,
  size = "md",
  className = "",
}) => {
  const fontSize = size === "sm" ? 14 : 18;
  const fontWeight = 700;
  const displayName = name || "Restaurante";
  const logoPx = LOGO_SIZE[size];

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 0,
        color: "var(--text-primary, #fff)",
      }}
    >
      <RestaurantLogo
        logoUrl={logoUrl}
        name={displayName}
        size={logoPx}
        style={{ flexShrink: 0 }}
      />
      <span
        data-testid="sovereign-restaurant-name"
        style={{
          fontSize,
          fontWeight,
          letterSpacing: "-0.04em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {displayName}
      </span>
    </div>
  );
};
