/**
 * TPVSidebar — Barra lateral esquerda do TPV.
 *
 * Two modes: compact (72px, icon-only) and expanded (240px, icon + label).
 * State persisted in localStorage key `tpv_sidebar_expanded`.
 *
 * Architecture — 3 sections separated by dividers:
 *
 *   OPERAÇÃO (daily operations):
 *     POS · Mesas · Turno/Caixa · Comando KDS · Tarefas · Reservas
 *
 *   TELAS (external screens):
 *     Telas
 *
 *   SISTEMA (system/config):
 *     Impressoras · Definições
 *
 * Note: Delivery lives inside Command KDS as a filter/tab, not as
 * a separate sidebar item. The Command KDS is the operational nerve
 * centre — cozinha, bar, expo, delivery pipeline, preparados.
 *
 * Features:
 * - Styled CSS-only tooltips (compact mode only)
 * - Notification badges for Kitchen, Tasks, and Reservations
 * - Role-based visibility via ContextEngine
 * - Restaurant identity at top, app identity at bottom
 * - Exit confirmation modal
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";
import { useContextEngine } from "../../../core/context/ContextEngine";
import type { ModuleVisibility } from "../../../core/context/ContextTypes";
import tpvEventBus from "../../../core/tpv/TPVCentralEvents";
import type { KitchenPressurePayload } from "../../../core/tpv/TPVCentralEvents";
import { dockerCoreClient } from "../../../infra/docker-core/connection";
import { useTPVRestaurantId } from "../hooks/useTPVRestaurantId";

const APP_LOGO_URL = "/Logo%20Chefiapp%20Transparent.png";
const APP_NAME = "ChefIApp";

const SIDEBAR_EXPANDED_KEY = "tpv_sidebar_expanded";
const COMPACT_WIDTH = 72;
const EXPANDED_WIDTH = 240;

/* ── Accent orange (reference design) ──────────────────────────── */
const ACCENT = "#f97316";
const ACCENT_BG = "rgba(249,115,22,0.12)";

/** Polling interval for badge counts (30 seconds) */
const BADGE_POLL_INTERVAL = 30_000;

/* ── SVG inline icons (20x20) ──────────────────────────────────── */

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

function IconScreen() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="16" height="11" rx="2" />
      <line x1="7" y1="17" x2="13" y2="17" />
      <line x1="10" y1="14" x2="10" y2="17" />
    </svg>
  );
}

function IconDelivery() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="16" r="2" />
      <circle cx="16" cy="16" r="2" />
      <path d="M2 4h8v10H4" />
      <path d="M10 7h3l3 4v5h-2" />
      <line x1="8" y1="14" x2="14" y2="14" />
    </svg>
  );
}

function IconPrinter() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="10" height="4" rx="1" />
      <rect x="3" y="6" width="14" height="8" rx="2" />
      <rect x="5" y="12" width="10" height="5" rx="1" />
      <circle cx="14" cy="9" r="0.5" fill="currentColor" />
    </svg>
  );
}

function IconChevronToggle({ expanded }: { expanded: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {expanded ? (
        <>
          <path d="M9 4L5 8l4 4" />
          <path d="M13 4L9 8l4 4" />
        </>
      ) : (
        <>
          <path d="M3 4l4 4-4 4" />
          <path d="M7 4l4 4-4 4" />
        </>
      )}
    </svg>
  );
}

type IconKey =
  | "grid"
  | "cash"
  | "table"
  | "kitchen"
  | "tasks"
  | "calendar"
  | "gear"
  | "screen"
  | "delivery"
  | "printer";

function iconFor(k: IconKey) {
  switch (k) {
    case "grid":
      return <IconGrid />;
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
    case "delivery":
      return <IconDelivery />;
    case "printer":
      return <IconPrinter />;
  }
}

/* ── Sidebar data model ────────────────────────────────────────── */

interface NavItem {
  type: "nav";
  to: string;
  label: string;
  icon: IconKey;
  end?: boolean;
  /** Key used to look up badge counts from badgeCounts map */
  badgeKey?: string;
}

type SidebarItem = NavItem;

interface SidebarSection {
  id: string;
  /** i18n key for section header (used in expanded mode) */
  headerKey: string;
  /** Fallback label if i18n key not found */
  headerFallback: string;
  items: SidebarItem[];
}

const SECTIONS: SidebarSection[] = [
  {
    id: "operacao",
    headerKey: "sidebar.sectionOperacao",
    headerFallback: "OPERACAO",
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
    headerKey: "sidebar.sectionTelas",
    headerFallback: "TELAS",
    items: [
      { type: "nav", to: "/op/tpv/screens", label: "screens", icon: "screen" },
    ],
  },
  {
    id: "sistema",
    headerKey: "sidebar.sectionSistema",
    headerFallback: "SISTEMA",
    items: [
      { type: "nav", to: "/op/tpv/printers", label: "printers", icon: "printer" },
      { type: "nav", to: "/op/tpv/settings", label: "settings", icon: "gear" },
    ],
  },
];

/* ── Role-based visibility mapping ────────────────────────────── */

/**
 * Maps sidebar nav paths to ContextEngine module visibility keys.
 * `null` means always visible regardless of role.
 */
const NAV_TO_MODULE: Record<string, keyof ModuleVisibility | "canCloseRegister" | null> = {
  "/op/tpv": null,                    // POS: always visible
  "/op/tpv/tables": "tables",
  "/op/tpv/shift": "canCloseRegister", // Shift: manager+ (uses permission)
  "/op/tpv/kitchen": "kitchen",
  "/op/tpv/tasks": null,               // Tasks: everyone sees their own
  "/op/tpv/reservations": "tables",    // Reservations = table management
  "/op/tpv/screens": "settings",       // Screens: manager+
  "/op/tpv/printers": "settings",
  "/op/tpv/settings": "settings",
};

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
    .tpv-sidebar-expanded .tpv-sidebar-tooltip-wrap:hover .tpv-sidebar-tooltip {
      opacity: 0 !important;
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

function SectionDivider({ expanded }: { expanded: boolean }) {
  return (
    <div
      data-testid="section-divider"
      style={{
        width: expanded ? "100%" : 32,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.06)",
        margin: expanded ? "8px 0" : "6px auto",
        flexShrink: 0,
      }}
    />
  );
}

/* ── Section header (visible only in expanded mode) ──────────── */

function SectionHeader({ label, expanded }: { label: string; expanded: boolean }) {
  if (!expanded) return null;

  return (
    <div
      data-testid="section-header"
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1.8,
        textTransform: "uppercase",
        color: "#525252",
        padding: "12px 2px 6px",
        width: "100%",
        userSelect: "none",
        boxSizing: "border-box",
      }}
    >
      {label}
    </div>
  );
}

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
  const restaurantId = useTPVRestaurantId();
  const { visibleModules, permissions } = useContextEngine();

  // Expanded/collapsed state persisted in localStorage
  const [expanded, setExpanded] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_EXPANDED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_EXPANDED_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Inject tooltip CSS once on mount
  useEffect(() => {
    ensureTooltipStyles();
  }, []);

  // Badge counts from event bus + polling
  const badgeCounts = useSidebarBadges(restaurantId);

  const sidebarWidth = expanded ? EXPANDED_WIDTH : COMPACT_WIDTH;

  const itemStyle = (isActive: boolean): React.CSSProperties => ({
    height: 44,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: expanded ? "flex-start" : "center",
    border: "none",
    background: isActive ? ACCENT_BG : "transparent",
    textDecoration: "none",
    transition: "all 0.15s ease",
    padding: expanded ? "0 14px" : 0,
    width: expanded ? "100%" : 44,
    gap: expanded ? 12 : 0,
    color: isActive ? ACCENT : "#737373",
    position: "relative" as const,
    flexShrink: 0,
    cursor: "pointer",
    boxSizing: "border-box" as const,
    alignSelf: expanded ? "stretch" : "center",
  });

  return (
    <aside
      className={expanded ? "tpv-sidebar-expanded" : ""}
      data-testid="tpv-sidebar"
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        backgroundColor: "#141414",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        alignItems: expanded ? "stretch" : "center",
        paddingTop: 8,
        paddingBottom: 16,
        paddingLeft: expanded ? 12 : 0,
        paddingRight: expanded ? 12 : 0,
        gap: 2,
        transition: "width 200ms ease, min-width 200ms ease",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Toggle expand/collapse button */}
      <button
        type="button"
        data-testid="sidebar-toggle"
        onClick={toggleExpanded}
        title={expanded ? t("sidebar.collapse", "Recolher") : t("sidebar.expand", "Expandir")}
        style={{
          width: expanded ? "100%" : 44,
          height: 32,
          borderRadius: 8,
          border: "none",
          background: "transparent",
          color: "#525252",
          display: "flex",
          alignItems: "center",
          justifyContent: expanded ? "flex-end" : "center",
          cursor: "pointer",
          padding: expanded ? "0 2px" : 0,
          marginBottom: 4,
          flexShrink: 0,
          transition: "all 0.15s ease",
          boxSizing: "border-box",
          alignSelf: expanded ? "stretch" : "center",
        }}
      >
        <IconChevronToggle expanded={expanded} />
      </button>

      {/* Restaurant identity */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: expanded ? 12 : 0,
          padding: expanded ? "8px 2px" : "8px 0",
          width: expanded ? "100%" : "auto",
          flexShrink: 0,
          overflow: "hidden",
          boxSizing: "border-box",
          justifyContent: expanded ? "flex-start" : "center",
        }}
      >
        <img
          src={APP_LOGO_URL}
          alt="Restaurant"
          width={36}
          height={36}
          style={{
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
        {expanded && (
          <span
            style={{
              color: "#fafafa",
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {t("sidebar.restaurantName", "Restaurante")}
          </span>
        )}
      </div>

      <SectionDivider expanded={expanded} />

      {/* Scrollable navigation area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: expanded ? "stretch" : "center",
          gap: 2,
          minHeight: 0,
        }}
      >
      {/* Navigation sections — filtered by operator role */}
      {SECTIONS.map((section, sIdx) => {
        const visibleItems = section.items.filter((item) => {
          const moduleKey = NAV_TO_MODULE[item.to];
          if (moduleKey === null) return true; // always visible
          if (moduleKey === "canCloseRegister") return permissions.canCloseRegister;
          return visibleModules[moduleKey];
        });
        if (visibleItems.length === 0) return null;

        return (
        <React.Fragment key={section.id}>
          {sIdx > 0 && <SectionDivider expanded={expanded} />}
          <SectionHeader
            label={t(section.headerKey, section.headerFallback)}
            expanded={expanded}
          />
          {visibleItems.map((item) => {
            const tooltipLabel = t(`sidebar.${item.label}`, item.label);
            const badge = item.badgeKey
              ? badgeCounts[item.badgeKey as keyof BadgeCounts]
              : null;

            return (
              <TooltipWrap key={item.to} label={tooltipLabel}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  title={tooltipLabel}
                  style={({ isActive }) => itemStyle(isActive)}
                >
                  <span style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {iconFor(item.icon)}
                    {badge && badge.count > 0 && (
                      <NotificationBadge count={badge.count} color={badge.color} />
                    )}
                  </span>
                  {expanded && (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        lineHeight: 1.3,
                      }}
                    >
                      {tooltipLabel}
                    </span>
                  )}
                </NavLink>
              </TooltipWrap>
            );
          })}
        </React.Fragment>
        );
      })}
      </div>

      {/* Exit with confirmation */}
      <TooltipWrap label={t("sidebar.exitTooltip", "Sair do TPV")}>
        <button
          type="button"
          title={t("sidebar.exitTooltip", "Sair do TPV")}
          onClick={() => setShowExitModal(true)}
          style={{
            ...itemStyle(false),
            cursor: "pointer",
          }}
        >
          <span style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconExit />
          </span>
          {expanded && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: "nowrap",
                color: "#737373",
              }}
            >
              {t("sidebar.exitTooltip", "Sair do TPV")}
            </span>
          )}
        </button>
      </TooltipWrap>

      {/* App signature — discrete brand mark */}
      <div
        style={{
          display: "flex",
          flexDirection: expanded ? "row" : "column",
          alignItems: "center",
          justifyContent: expanded ? "flex-start" : "center",
          marginTop: 12,
          gap: expanded ? 8 : 4,
          opacity: 0.55,
          padding: expanded ? "0 2px" : 0,
          width: expanded ? "100%" : "auto",
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        <img
          src={APP_LOGO_URL}
          alt={APP_NAME}
          width={expanded ? 24 : 36}
          height={expanded ? 24 : 36}
          style={{
            borderRadius: "50%",
            objectFit: "cover",
            imageRendering: "auto",
            filter: "contrast(1.05) brightness(1.02)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            color: "#737373",
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
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
