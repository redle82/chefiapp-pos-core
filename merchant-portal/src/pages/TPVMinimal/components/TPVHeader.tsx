/**
 * TPVHeader — Cabeçalho do TPV: restaurante (esquerda), pesquisa (centro), staff + filtro (direita).
 * O logo e nome do restaurante aparecem em destaque para que o operador sinta o sistema como seu.
 * Ref: POS reference layout.
 */

import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
import { RestaurantLogo } from "../../../ui/RestaurantLogo";

/* ── Accent orange ─────────────────────────────────────────────── */
const ACCENT = "#f97316";

/** Ícone lupa SVG */
function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="#737373"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="5.5" />
      <line x1="12" y1="12" x2="16" y2="16" />
    </svg>
  );
}

/** Ícone filtro SVG */
function FilterIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="4" cy="4" r="1.5" />
      <circle cx="12" cy="4" r="1.5" />
      <circle cx="4" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <line x1="4" y1="5.5" x2="4" y2="10.5" />
      <line x1="12" y1="5.5" x2="12" y2="10.5" />
      <line x1="5.5" y1="4" x2="10.5" y2="4" />
      <line x1="5.5" y1="12" x2="10.5" y2="12" />
    </svg>
  );
}

interface TPVHeaderProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onFilterClick?: () => void;
  staffName?: string;
  staffId?: string;
  staffAvatarUrl?: string | null;
}

export function TPVHeader({
  searchQuery = "",
  onSearchChange,
  onFilterClick,
  staffName = "Operador",
  staffId = "—",
  staffAvatarUrl = null,
}: TPVHeaderProps) {
  const { identity } = useRestaurantIdentity();

  return (
    <header
      style={{
        height: 64,
        minHeight: 64,
        backgroundColor: "#1a1a1a",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        paddingLeft: 20,
        paddingRight: 20,
      }}
    >
      {/* Restaurant identity: logo + name */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 0,
          flexShrink: 0,
        }}
      >
        <RestaurantLogo
          logoUrl={identity.logoUrl}
          name={identity.name || "R"}
          size={32}
          style={{
            borderRadius: "50%",
            border: "1.5px solid rgba(255,255,255,0.12)",
          }}
        />
        <span
          style={{
            color: "#fafafa",
            fontWeight: 700,
            fontSize: 15,
            lineHeight: 1.2,
            maxWidth: 160,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {identity.name || "Restaurante"}
        </span>
      </div>

      {/* Separator */}
      <div
        style={{
          width: 1,
          height: 28,
          backgroundColor: "rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      />

      {/* Staff identity: avatar + name + ID */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          minWidth: 160,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "#2a2a2a",
            border: "2px solid rgba(255,255,255,0.1)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {staffAvatarUrl ? (
            <img
              src={staffAvatarUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ color: "#fafafa", fontSize: 16, fontWeight: 600 }}>
              {staffName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              color: "#fafafa",
              fontWeight: 600,
              fontSize: 14,
              lineHeight: 1.3,
            }}
          >
            {staffName}
          </span>
          <span style={{ color: "#737373", fontSize: 12 }}>{staffId}</span>
        </div>
      </div>

      {/* Search bar (center, flexible) */}
      <div
        style={{
          flex: 1,
          maxWidth: 520,
          position: "relative",
          display: "flex",
          alignItems: "center",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 14,
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <SearchIcon />
        </span>
        <input
          type="search"
          placeholder="Search product by name, categories or SKU"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          style={{
            width: "100%",
            height: 42,
            paddingLeft: 42,
            paddingRight: 16,
            borderRadius: 21,
            border: "1px solid rgba(255,255,255,0.1)",
            backgroundColor: "#141414",
            color: "#fafafa",
            fontSize: 14,
            outline: "none",
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange?.("")}
            title="Limpar"
            style={{
              position: "absolute",
              right: 10,
              width: 24,
              height: 24,
              borderRadius: 12,
              border: "none",
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "#a3a3a3",
              cursor: "pointer",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Orange Filter button */}
      <button
        type="button"
        onClick={onFilterClick}
        style={{
          height: 42,
          paddingLeft: 18,
          paddingRight: 18,
          borderRadius: 21,
          border: "none",
          backgroundColor: ACCENT,
          color: "#fff",
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          transition: "opacity 0.15s ease",
        }}
      >
        <FilterIcon />
        Filter
      </button>
    </header>
  );
}
