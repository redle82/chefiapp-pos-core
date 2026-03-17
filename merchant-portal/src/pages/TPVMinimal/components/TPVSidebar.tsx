/**
 * TPVSidebar — Barra lateral esquerda do TPV (icon-only, 72px).
 *
 * Arquitectura canónica — 3 secções separadas por divisores:
 *
 *   OPERAÇÃO (uso diário):
 *     POS · Mesas · Turno · Cozinha · Tarefas · Reservas
 *
 *   TELAS (lançar ecrãs operacionais em nova janela):
 *     Cozinha KDS · Bar KDS · Expo (em breve) · Display (em breve)
 *
 *   CONFIG (configuração rápida do posto):
 *     Página Web · Definições
 *
 * Isolamento desktop: no app Electron, "Página Web" não é mostrado.
 *
 * Features:
 * - Styled CSS-only tooltips (replaces native title on hover)
 * - Notification badges for Kitchen, Tasks, and Reservations
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";
import { isDesktopApp } from "../../../core/operational/platformDetection";
import tpvEventBus from "../../../core/tpv/TPVCentralEvents";
import type { KitchenPressurePayload } from "../../../core/tpv/TPVCentralEvents";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import { useTPVRestaurantId } from "../hooks/useTPVRestaurantId";

const APP_LOGO_URL = "/Logo%20Chefiapp%20Transparent.png";
const APP_NAME = "ChefIApp";

/* ── Accent orange (reference design) ──────────────────────────── */
const ACCENT = "#f97316";
const ACCENT_BG = "rgba(249,115,22,0.12)";

/** Polling interval for badge counts (30 seconds) */
const BADGE_POLL_INTERVAL = 30_000;

/* ── SVG inline icons (20×20) ──────────────────────────────────── */

function IconGrid() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="3" width="5.5" height="5.5" rx="1.5" />
      <rect x="11.5" y="3" width="5.5" height="5.5" rx="1.5" />
      <rect x="3" y="11.5" width="5.5" height="5.5" rx="1.5" />
      <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.5" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2h10a1 1 0 011 1v14l-2-1.5L12 17l-2-1.5L8 17l-2-1.5L4 17V3a1 1 0 011-1z" />
      <line x1="7" y1="6" x2="13" y2="6" />
      <line x1="7" y1="9" x2="13" y2="9" />
      <line x1="7" y1="12" x2="10" y2="12" />
    </svg>
  );
}

function IconCash() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="14" height="10" rx="2" />
      <circle cx="10" cy="10" r="3" />
      <path d="M7 10h0" />
      <path d="M13 10h0" />
    </svg>
  );
}

function IconTable() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="12" height="6" rx="2" />
      <line x1="6" y1="12" x2="6" y2="16" />
      <line x1="14" y1="12" x2="14" y2="16" />
    </svg>
  );
}

function IconKitchen() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11h14a1 1 0 011 1v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a1 1 0 011-1z" />
      <path d="M5 11V8a5 5 0 0110 0v3" />
      <line x1="10" y1="16" x2="10" y2="18" />
      <line x1="6" y1="18" x2="14" y2="18" />
    </svg>
  );
}

function IconTasks() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M7 10l2 2 4-4" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <line x1="3" y1="8" x2="17" y2="8" />
      <line x1="7" y1="2" x2="7" y2="5" />
      <line x1="13" y1="2" x2="13" y2="5" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="3" />
      <path d="M10 1.5v2M10 16.5v2M3.3 3.3l1.4 1.4M15.3 15.3l1.4 1.4M1.5 10h2M16.5 10h2M3.3 16.7l1.4-1.4M15.3 4.7l1.4-1.4" />
    </svg>
  );
}

function IconExit() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3H5a2 2 0 00-2 2v10a2 2 0 002 2h7" />
      <path d="M8 10h9M14 7l3 3-3 3" />
    </svg>
  );
}

/** Monitor/screen icon — for TELAS section launchers */
function IconScreen() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="16" height="11" rx="2" />
      <line x1="7" y1="17" x2="13" y2="17" />
      <line x1="10" y1="14" x2="10" y2="17" />
    </svg>
  );
}

/** Cocktail glass icon — for Bar KDS launcher */
function IconBar() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3h10l-4 6v5h2" />
      <path d="M7 17h6" />
      <line x1="11" y1="9" x2="11" y2="14" />
    </svg>
  );
}

type IconKey =
  | "grid"
  | "receipt"
  | "cash"
  | "table"
  | "kitchen"
  | "tasks"
  | "calendar"
  | "gear"
  | "screen"
  | "bar";

function iconFor(k: IconKey) {
  switch (k) {
    case "grid":
      return <IconGrid />;
    case "receipt":
      return <IconReceipt />;
    case "cash":
      return <IconCash />;
    case "table":
      return <IconTable />;
    case "kitchen":
      return <IconKitchen />;
    case "tasks":
      return <IconTasks />;
    case "calendar":
      return <IconCalendar />;
    case "gear":
      return <IconGear />;
    case "screen":
      return <IconScreen />;
    case "bar":
      return <IconBar />;
  }
}

/* ── Sidebar data model ────────────────────────────────────────── */

interface NavItem {
  type: "nav";
  to: string;
  label: string;
  icon: IconKey;
  end?: boolean;
  hideDesktop?: boolean;
  /** Key used to look up badge counts from badgeCounts map */
  badgeKey?: string;
}

interface LauncherItem {
  type: "launcher";
  url: string;
  label: string;
  icon: IconKey;
  disabled?: boolean;
}

type SidebarItem = NavItem | LauncherItem;

interface SidebarSection {
  id: string;
  items: SidebarItem[];
}

const SECTIONS: SidebarSection[] = [
  {
    id: "operacao",
    items: [
      { type: "nav", to: "/op/tpv", label: "pos", icon: "grid", end: true },
      { type: "nav", to: "/op/tpv/tables", label: "tables", icon: "table" },
      { type: "nav", to: "/op/tpv/shift", label: "shift", icon: "cash" },
      { type: "nav", to: "/op/tpv/kitchen", label: "kitchen", icon: "kitchen", badgeKey: "kitchen" },
      { type: "nav", to: "/op/tpv/tasks", label: "tasks", icon: "tasks", badgeKey: "tasks" },
      { type: "nav", to: "/op/tpv/reservations", label: "reservations", icon: "calendar", badgeKey: "reservations" },
    ],
  },
  {
    id: "telas",
    items: [
      { type: "nav", to: "/op/tpv/screens", label: "screens", icon: "screen" },
    ],
  },
  {
    id: "config",
    items: [
      { type: "nav", to: "/op/tpv/web-editor", label: "webPage", icon: "receipt", hideDesktop: true },
      { type: "nav", to: "/op/tpv/settings", label: "settings", icon: "gear" },
    ],
  },
];

/* ── CSS-only tooltip styles (injected once) ─────────────────── */

const TOOLTIP_STYLE_ID = "tpv-sidebar-tooltip-styles";

function ensureTooltipStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(TOOLTIP_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = TOOLTIP_STYLE_ID;
  style.textContent = `
    .tpv-sidebar-tooltip-wrap {
      position: relative;
    }
    .tpv-sidebar-tooltip-wrap .tpv-sidebar-tooltip {
      position: absolute;
      left: calc(100% + 12px);
      top: 50%;
      transform: translateY(-50%);
      background: #1a1a1a;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 8px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 150ms ease;
      z-index: 1000;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    .tpv-sidebar-tooltip-wrap .tpv-sidebar-tooltip::before {
      content: '';
      position: absolute;
      right: 100%;
      top: 50%;
      transform: translateY(-50%);
      border: 5px solid transparent;
      border-right-color: #1a1a1a;
    }
    .tpv-sidebar-tooltip-wrap:hover .tpv-sidebar-tooltip {
      opacity: 1;
      transition-delay: 200ms;
    }
  `;
  document.head.appendChild(style);
}

/* ── Tooltip wrapper component ───────────────────────────────── */

function TooltipWrap({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="tpv-sidebar-tooltip-wrap">
      {children}
      <span className="tpv-sidebar-tooltip" role="tooltip">
        {label}
      </span>
    </div>
  );
}

/* ── Notification badge component ────────────────────────────── */

const BADGE_STYLE: React.CSSProperties = {
  position: "absolute",
  top: 2,
  right: 2,
  minWidth: 16,
  height: 16,
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 10,
  fontWeight: 700,
  lineHeight: 1,
  padding: "0 4px",
  color: "#fff",
  border: "2px solid #141414",
};

function NotificationBadge({
  count,
  color,
}: {
  count: number;
  color: "red" | "orange" | "gray";
}) {
  if (count <= 0) return null;

  const bgMap = { red: "#dc2626", orange: "#f59e0b", gray: "#6b7280" };

  return (
    <span
      data-testid="sidebar-badge"
      style={{
        ...BADGE_STYLE,
        backgroundColor: bgMap[color],
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/* ── Badge counts hook ───────────────────────────────────────── */

interface BadgeCounts {
  kitchen: { count: number; color: "red" | "orange" | "gray" };
  tasks: { count: number; color: "red" | "orange" | "gray" };
  reservations: { count: number; color: "red" | "orange" | "gray" };
}

const EMPTY_BADGES: BadgeCounts = {
  kitchen: { count: 0, color: "gray" },
  tasks: { count: 0, color: "gray" },
  reservations: { count: 0, color: "gray" },
};

function useSidebarBadges(restaurantId: string): BadgeCounts {
  const [badges, setBadges] = useState<BadgeCounts>(EMPTY_BADGES);
  const mountedRef = useRef(true);

  // Kitchen pressure — from event bus (already exists, merge into badges)
  const [kitchenPressure, setKitchenPressure] = useState<{
    delayed: number;
    level: "low" | "medium" | "high";
  } | null>(null);

  useEffect(() => {
    const unsub = tpvEventBus.on<KitchenPressurePayload>(
      "kitchen.pressure_change",
      (event) => {
        const p = event.payload as KitchenPressurePayload;
        setKitchenPressure({
          delayed: p.delayedOrders,
          level: p.currentLevel,
        });
      },
    );
    return unsub;
  }, []);

  // Poll tasks + reservations counts
  const fetchCounts = useCallback(async () => {
    if (!restaurantId) return;

    try {
      const [tasksResult, reservationsResult] = await Promise.allSettled([
        dockerCoreClient
          .from("gm_tasks")
          .select("id", { count: "exact", head: true })
          .eq("status", "OPEN")
          .eq("restaurant_id", restaurantId),
        dockerCoreClient
          .from("gm_reservations")
          .select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurantId)
          .eq("reservation_date", new Date().toISOString().slice(0, 10)),
      ]);

      if (!mountedRef.current) return;

      const tasksCount =
        tasksResult.status === "fulfilled" && !tasksResult.value.error
          ? tasksResult.value.count ?? 0
          : 0;

      const reservationsCount =
        reservationsResult.status === "fulfilled" && !reservationsResult.value.error
          ? reservationsResult.value.count ?? 0
          : 0;

      setBadges((prev) => ({
        ...prev,
        tasks: {
          count: tasksCount,
          color: tasksCount >= 5 ? "red" : tasksCount > 0 ? "orange" : "gray",
        },
        reservations: {
          count: reservationsCount,
          color: reservationsCount > 0 ? "orange" : "gray",
        },
      }));
    } catch {
      // Silently ignore — table might not exist yet
    }
  }, [restaurantId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchCounts();
    const interval = setInterval(fetchCounts, BADGE_POLL_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchCounts]);

  // Merge kitchen pressure into badges
  const kitchenBadge: BadgeCounts["kitchen"] = useMemo(() => {
    if (!kitchenPressure || kitchenPressure.delayed <= 0) {
      return { count: 0, color: "gray" };
    }
    return {
      count: kitchenPressure.delayed,
      color:
        kitchenPressure.level === "high"
          ? "red"
          : kitchenPressure.level === "medium"
            ? "orange"
            : "gray",
    };
  }, [kitchenPressure]);

  return useMemo(
    () => ({
      ...badges,
      kitchen: kitchenBadge,
    }),
    [badges, kitchenBadge],
  );
}

/* ── Separator line ────────────────────────────────────────────── */

function SectionDivider() {
  return (
    <div
      style={{
        width: 32,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.06)",
        margin: "6px 0",
      }}
    />
  );
}

/* ── Item button style (shared) ────────────────────────────────── */

const ITEM_BASE: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "transparent",
  textDecoration: "none",
  transition: "all 0.15s ease",
  padding: 0,
};

/* ── Exit confirmation modal ───────────────────────────────────── */

function ExitModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const { t } = useTranslation("tpv");
  return (
    <div
      data-testid="exit-modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.7)",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: "#1a1a1a",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: "32px 28px 24px",
          maxWidth: 340,
          width: "90%",
          textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <IconExit />
        <h3 style={{ color: "#fafafa", fontSize: 16, fontWeight: 700, margin: "16px 0 8px" }}>
          {t("sidebar.exitConfirmTitle")}
        </h3>
        <p style={{ color: "#737373", fontSize: 13, margin: "0 0 24px" }}>
          {t("sidebar.exitConfirmBody")}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              backgroundColor: "transparent",
              color: "#a3a3a3",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("sidebar.exitCancel")}
          </button>
          <button
            type="button"
            data-testid="exit-confirm"
            onClick={onConfirm}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "none",
              backgroundColor: ACCENT,
              color: "#0a0a0a",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t("sidebar.exitConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────── */

export function TPVSidebar() {
  const { t } = useTranslation("tpv");
  const [showExitModal, setShowExitModal] = useState(false);
  const navigate = useNavigate();
  const desktop = useMemo(() => isDesktopApp(), []);
  const restaurantId = useTPVRestaurantId();

  // Inject tooltip CSS once on mount
  useEffect(() => {
    ensureTooltipStyles();
  }, []);

  // Badge counts from event bus + polling
  const badgeCounts = useSidebarBadges(restaurantId);

  const sections = useMemo(() => {
    return SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.type === "nav" && item.hideDesktop && desktop) return false;
        return true;
      }),
    }));
  }, [desktop]);

  return (
    <aside
      style={{
        width: 72,
        minWidth: 72,
        backgroundColor: "#141414",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 16,
        paddingBottom: 16,
        gap: 4,
      }}
    >
      {/* Sections */}
      {sections.map((section, sIdx) => (
        <React.Fragment key={section.id}>
          {sIdx > 0 && <SectionDivider />}
          {section.items.map((item) => {
            if (item.type === "nav") {
              const tooltipLabel = t(`sidebar.${item.label}`);
              const badge = item.badgeKey
                ? badgeCounts[item.badgeKey as keyof BadgeCounts]
                : null;

              return (
                <TooltipWrap key={item.to} label={tooltipLabel}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    title={tooltipLabel}
                    style={({ isActive }) => ({
                      ...ITEM_BASE,
                      color: isActive ? ACCENT : "#737373",
                      backgroundColor: isActive ? ACCENT_BG : "transparent",
                      position: "relative" as const,
                    })}
                  >
                    {iconFor(item.icon)}
                    {badge && badge.count > 0 && (
                      <NotificationBadge count={badge.count} color={badge.color} />
                    )}
                  </NavLink>
                </TooltipWrap>
              );
            }

            // Launcher: disabled placeholder
            if (item.disabled) {
              const disabledLabel = `${t(`sidebar.${item.label}`)} — ${t("sidebar.comingSoon")}`;
              return (
                <TooltipWrap key={item.label} label={disabledLabel}>
                  <button
                    type="button"
                    title={disabledLabel}
                    disabled
                    style={{
                      ...ITEM_BASE,
                      color: "#737373",
                      opacity: 0.35,
                      cursor: "not-allowed",
                    }}
                  >
                    {iconFor(item.icon)}
                  </button>
                </TooltipWrap>
              );
            }

            // Launcher: active
            // Desktop (Electron): open in new window
            // Browser: navigate in-window (BrowserBlockGuard blocks new tabs)
            if (desktop) {
              const desktopLabel = `${t(`sidebar.${item.label}`)} — ${t("sidebar.newWindow")}`;
              return (
                <TooltipWrap key={item.label} label={desktopLabel}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    title={desktopLabel}
                    style={{
                      ...ITEM_BASE,
                      color: "#737373",
                      cursor: "pointer",
                    }}
                  >
                    {iconFor(item.icon)}
                  </a>
                </TooltipWrap>
              );
            }

            const launcherLabel = t(`sidebar.${item.label}`);
            return (
              <TooltipWrap key={item.label} label={launcherLabel}>
                <button
                  type="button"
                  title={launcherLabel}
                  onClick={() => navigate(item.url)}
                  style={{
                    ...ITEM_BASE,
                    color: "#737373",
                    cursor: "pointer",
                  }}
                >
                  {iconFor(item.icon)}
                </button>
              </TooltipWrap>
            );
          })}
        </React.Fragment>
      ))}

      <div style={{ flex: 1 }} />

      {/* Exit with confirmation */}
      <TooltipWrap label={t("sidebar.exitTooltip")}>
        <button
          type="button"
          title={t("sidebar.exitTooltip")}
          onClick={() => setShowExitModal(true)}
          style={{
            ...ITEM_BASE,
            color: "#737373",
            cursor: "pointer",
          }}
        >
          <IconExit />
        </button>
      </TooltipWrap>

      {/* App signature — discrete brand mark below exit */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: 12,
          gap: 4,
          opacity: 0.55,
        }}
      >
        <img
          src={APP_LOGO_URL}
          alt={APP_NAME}
          width={52}
          height={52}
          style={{
            borderRadius: "50%",
            objectFit: "cover",
            imageRendering: "auto",
            filter: "contrast(1.05) brightness(1.02)",
          }}
        />
        <span
          style={{
            color: "#737373",
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {APP_NAME}
        </span>
      </div>

      {showExitModal && (
        <ExitModal
          onCancel={() => setShowExitModal(false)}
          onConfirm={() => {
            window.location.href = "/app/staff/home";
          }}
        />
      )}
    </aside>
  );
}
