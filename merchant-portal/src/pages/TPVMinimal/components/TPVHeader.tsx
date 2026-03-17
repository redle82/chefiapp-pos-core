/**
 * TPVHeader — Cabeçalho do TPV: restaurante (esquerda), pesquisa (centro), staff + filtro (direita).
 * O logo e nome do restaurante aparecem em destaque para que o operador sinta o sistema como seu.
 * Ref: POS reference layout.
 */

import { useTranslation } from "react-i18next";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
import { RestaurantLogo } from "../../../ui/RestaurantLogo";
import { NotificationBell } from "./NotificationBell";

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

/** Role → badge color mapping */
const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
  owner: { bg: "rgba(249,115,22,0.15)", color: "#f97316" },
  manager: { bg: "rgba(139,92,246,0.15)", color: "#a78bfa" },
  cashier: { bg: "rgba(34,197,94,0.15)", color: "#4ade80" },
  waiter: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
  staff: { bg: "rgba(156,163,175,0.12)", color: "#9ca3af" },
};

interface TPVHeaderProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onFilterClick?: () => void;
  staffName?: string;
  staffId?: string;
  staffRole?: string;
  staffAvatarUrl?: string | null;
  /** Hide search bar + filter (non-POS pages like screens, tables, settings). */
  hideSearch?: boolean;
  /** Lock callback — returns to operator selection screen. */
  onLock?: () => void;
}

/** Ícone cadeado SVG */
function LockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2.5" y="6" width="9" height="6.5" rx="1.5" />
      <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" />
    </svg>
  );
}

export function TPVHeader({
  searchQuery = "",
  onSearchChange,
  onFilterClick,
  staffName = "Dono",
  staffId = "—",
  staffRole = "owner",
  staffAvatarUrl = null,
  hideSearch = false,
  onLock,
}: TPVHeaderProps) {
  const { t } = useTranslation(["tpv", "operational"]);
  const { identity } = useRestaurantIdentity();
  const { runtime } = useRestaurantRuntime();

  const modeBadge =
    runtime.productMode === "trial"
      ? { label: "TRIAL", bg: "rgba(234,179,8,0.15)", color: "#eab308" }
      : runtime.productMode === "pilot"
        ? { label: "PILOT", bg: "rgba(59,130,246,0.15)", color: "#3b82f6" }
        : null;

  const coreStatus =
    runtime.coreMode === "online"
      ? { dot: "#4ade80", tooltip: "Core online" }
      : runtime.coreMode === "offline-intencional"
        ? { dot: "#eab308", tooltip: "Core offline (intencional)" }
        : { dot: "#f87171", tooltip: "Core indisponível" };

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
          data-testid="sovereign-restaurant-name"
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
        {modeBadge && (
          <span
            data-testid="tpv-mode-badge"
            style={{
              fontSize: 9,
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: 4,
              backgroundColor: modeBadge.bg,
              color: modeBadge.color,
              letterSpacing: 0.8,
              flexShrink: 0,
            }}
          >
            {modeBadge.label}
          </span>
        )}
        <span
          data-testid="tpv-core-status"
          title={coreStatus.tooltip}
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            backgroundColor: coreStatus.dot,
            flexShrink: 0,
          }}
        />
      </div>

      {/* Search bar (center, flexible) — only on POS/catalog pages */}
      {!hideSearch && (
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
            placeholder={t("header.searchPlaceholder")}
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
              title={t("header.clearSearch")}
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
      )}

      {/* Spacer when search is hidden */}
      {hideSearch && <div style={{ flex: 1 }} />}

      {/* Notification bell */}
      {runtime.restaurant_id && (
        <NotificationBell restaurantId={runtime.restaurant_id} />
      )}

      {/* Separator (before staff, right side) */}
      <div
        style={{
          width: 1,
          height: 28,
          backgroundColor: "rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      />

      {/* Staff identity: role badge + name + ID — right-aligned */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", textAlign: "right", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
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
            {staffRole && (
              <span
                data-testid="tpv-role-badge"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 4,
                  backgroundColor: (ROLE_BADGE[staffRole] ?? ROLE_BADGE.staff).bg,
                  color: (ROLE_BADGE[staffRole] ?? ROLE_BADGE.staff).color,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  flexShrink: 0,
                }}
              >
                {t(`operational:roles.${staffRole}`, staffRole)}
              </span>
            )}
          </div>
          <span style={{ color: "#737373", fontSize: 12 }}>{staffId}</span>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
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
            <span style={{ color: "#fafafa", fontSize: 14, fontWeight: 600 }}>
              {staffName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        {/* Lock / switch operator button */}
        {onLock && (
          <button
            type="button"
            data-testid="tpv-lock-button"
            onClick={onLock}
            title={t("tpv:header.lockTooltip", "Trocar operador")}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              backgroundColor: "transparent",
              color: "#737373",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "border-color 0.15s, color 0.15s",
            }}
          >
            <LockIcon />
          </button>
        )}
      </div>
    </header>
  );
}
