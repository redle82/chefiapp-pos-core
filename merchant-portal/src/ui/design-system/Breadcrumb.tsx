/**
 * Breadcrumb — Route-aware navigation trail.
 *
 * Usage:
 *   <Breadcrumb items={[
 *     { label: "Config", to: "/admin/config/general" },
 *     { label: "Localizações", to: "/admin/config/locations" },
 *     { label: "Editar local" },
 *   ]} />
 *
 * - Last item is the current page (rendered as plain text, no link).
 * - Items are separated by a › chevron.
 *
 * Phase 3: P0 UX — navigation context (Issue #2).
 */

import { colors, fontSize, space } from "@chefiapp/core-design-system";
import React from "react";
import { Link } from "react-router-dom";

export interface BreadcrumbItem {
  /** Display label. */
  label: string;
  /** Navigation target (omit for the current/last item). */
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Optional extra style on the wrapper. */
  style?: React.CSSProperties;
}

export function Breadcrumb({ items, style }: BreadcrumbProps) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Localização atual"
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: `0 ${space.xs}px`,
        marginBottom: space.md,
        ...style,
      }}
    >
      <ol
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: `0 ${space.xs}px`,
          listStyle: "none",
          margin: 0,
          padding: 0,
          fontSize: `${fontSize.sm}px`,
        }}
      >
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li
              key={`${item.label}-${idx}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: `${space.xs}px`,
              }}
            >
              {idx > 0 && (
                <span
                  aria-hidden="true"
                  style={{ color: colors.textSecondary, userSelect: "none" }}
                >
                  ›
                </span>
              )}
              {isLast || !item.to ? (
                <span
                  aria-current="page"
                  style={{ color: colors.textPrimary, fontWeight: 500 }}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  style={{
                    color: colors.textSecondary,
                    textDecoration: "none",
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      colors.accent as string;
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      colors.textSecondary as string;
                  }}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
