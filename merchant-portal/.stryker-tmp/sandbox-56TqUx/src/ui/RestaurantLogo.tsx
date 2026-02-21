/**
 * RestaurantLogo — Identidade visual do restaurante.
 *
 * Exibe o logo quando logoUrl existe; caso contrário fallback (nome + ícone).
 * Ver docs/architecture/RESTAURANT_LOGO_IDENTITY_CONTRACT.md
 */
// @ts-nocheck


import React, { useEffect, useState } from "react";

export interface RestaurantLogoProps {
  /** URL do logo (gm_restaurants.logo_url). */
  logoUrl?: string | null;
  /** Nome do restaurante para fallback e alt. */
  name: string;
  /** Tamanho em px (largura e altura). Default 40. */
  size?: number;
  /** Classe CSS adicional. */
  className?: string;
  /** Estilo inline. */
  style?: React.CSSProperties;
}

function FallbackCircle({
  name,
  size,
  className,
  style,
}: {
  name: string;
  size: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      role="img"
      aria-label={name || "Restaurante"}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--restaurant-logo-fallback-bg, #374151)",
        color: "var(--restaurant-logo-fallback-fg, #f9fafb)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.max(12, Math.floor(size * 0.4)),
        flexShrink: 0,
        ...style,
      }}
    >
      {name ? name.charAt(0).toUpperCase() : "🍽️"}
    </div>
  );
}

export function RestaurantLogo({
  logoUrl,
  name,
  size = 40,
  className,
  style,
}: RestaurantLogoProps) {
  const [imgError, setImgError] = useState(false);
  const s = size;
  const showImg = logoUrl && logoUrl.trim() && !imgError;
  if (showImg) {
    return (
      <img
        src={logoUrl!}
        alt={name || "Logo do restaurante"}
        width={s}
        height={s}
        className={className}
        style={{
          objectFit: "contain",
          borderRadius: "50%",
          flexShrink: 0,
          ...style,
        }}
        onError={(e) => {
          console.warn("[RestaurantLogo] Image load failed:", {
            logoUrl,
            error: e,
          });
          setImgError(true);
        }}
      />
    );
  }
  return (
    <FallbackCircle name={name} size={s} className={className} style={style} />
  );
}
