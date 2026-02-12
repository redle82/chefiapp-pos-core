/**
 * RestaurantHeader — Nome do restaurante em destaque (Identity Layer).
 * Usado no topbar e no topo da sidebar. No futuro: logoUrl, cores.
 * Ver docs/design/IDENTITY_LAYER_CONTRACT.md.
 */

import React from "react";

interface RestaurantHeaderProps {
  name: string;
  logoUrl?: string;
  size?: "sm" | "md";
  className?: string;
}

export const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({
  name,
  logoUrl,
  size = "md",
  className = "",
}) => {
  const fontSize = size === "sm" ? 14 : 18;
  const fontWeight = 700;
  const displayName = name || "Restaurante";

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 0,
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          style={{
            width: size === "sm" ? 24 : 32,
            height: size === "sm" ? 24 : 32,
            borderRadius: 6,
            objectFit: "contain",
            flexShrink: 0,
          }}
        />
      ) : null}
      <span
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
