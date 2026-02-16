/**
 * TPVSidebar — Barra lateral esquerda do TPV (icon-only).
 * Design: dark theme, accent orange no item ativo, SVG icons.
 * Ref: POS reference layout com brand logo no topo + 6 nav icons + exit.
 */

import React from "react";
import { NavLink } from "react-router-dom";
import { useRestaurantIdentity } from "../../../core/identity/useRestaurantIdentity";
import { RestaurantLogo } from "../../../ui/RestaurantLogo";

/* ── Accent orange (reference design) ──────────────────────────── */
const ACCENT = "#f97316";
const ACCENT_BG = "rgba(249,115,22,0.12)";

/* ── SVG inline icons (20×20) ──────────────────────────────────── */

/* BrandLogo removed — sidebar now shows the restaurant's own logo via RestaurantLogo. */

function IconGrid() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <rect x="3" y="3" width="5.5" height="5.5" rx="1.5" />
      <rect x="11.5" y="3" width="5.5" height="5.5" rx="1.5" />
      <rect x="3" y="11.5" width="5.5" height="5.5" rx="1.5" />
      <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.5" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 2h10a1 1 0 011 1v14l-2-1.5L12 17l-2-1.5L8 17l-2-1.5L4 17V3a1 1 0 011-1z" />
      <line x1="7" y1="6" x2="13" y2="6" />
      <line x1="7" y1="9" x2="13" y2="9" />
      <line x1="7" y1="12" x2="10" y2="12" />
    </svg>
  );
}

function IconKitchen() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11h14a1 1 0 011 1v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a1 1 0 011-1z" />
      <path d="M5 11V8a5 5 0 0110 0v3" />
      <line x1="10" y1="16" x2="10" y2="18" />
      <line x1="6" y1="18" x2="14" y2="18" />
    </svg>
  );
}

function IconTasks() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M7 10l2 2 4-4" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <line x1="3" y1="8" x2="17" y2="8" />
      <line x1="7" y1="2" x2="7" y2="5" />
      <line x1="13" y1="2" x2="13" y2="5" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="10" r="3" />
      <path d="M10 1.5v2M10 16.5v2M3.3 3.3l1.4 1.4M15.3 15.3l1.4 1.4M1.5 10h2M16.5 10h2M3.3 16.7l1.4-1.4M15.3 4.7l1.4-1.4" />
    </svg>
  );
}

function IconExit() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3H5a2 2 0 00-2 2v10a2 2 0 002 2h7" />
      <path d="M8 10h9M14 7l3 3-3 3" />
    </svg>
  );
}

type IconKey = "grid" | "receipt" | "kitchen" | "tasks" | "calendar" | "gear";

function iconFor(k: IconKey) {
  switch (k) {
    case "grid":
      return <IconGrid />;
    case "receipt":
      return <IconReceipt />;
    case "kitchen":
      return <IconKitchen />;
    case "tasks":
      return <IconTasks />;
    case "calendar":
      return <IconCalendar />;
    case "gear":
      return <IconGear />;
  }
}

const SIDEBAR_LINKS: { to: string; label: string; icon: IconKey }[] = [
  { to: "/op/tpv", label: "POS", icon: "grid" },
  { to: "/op/tpv/orders", label: "Pedidos", icon: "receipt" },
  { to: "/op/tpv/kitchen", label: "Cozinha", icon: "kitchen" },
  { to: "/op/tpv/tasks", label: "Tarefas", icon: "tasks" },
  { to: "/op/tpv/reservations", label: "Reservas", icon: "calendar" },
  { to: "/op/tpv/settings", label: "Definições", icon: "gear" },
];

export function TPVSidebar() {
  const identity = useRestaurantIdentity();

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
      {/* Restaurant logo + abbreviated name */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: 16,
          gap: 6,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: `2px solid ${ACCENT}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <RestaurantLogo
            logoUrl={identity.logoUrl}
            name={identity.name || "R"}
            size={40}
            style={{ borderRadius: "50%" }}
          />
        </div>
        {identity.name && (
          <span
            style={{
              color: "#a3a3a3",
              fontSize: 9,
              fontWeight: 600,
              textAlign: "center",
              width: 60,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}
          >
            {identity.name}
          </span>
        )}
      </div>

      {/* Navigation icons */}
      {SIDEBAR_LINKS.map(({ to, icon, label }, idx) => (
        <React.Fragment key={to}>
          {/* Separators */}
          {(idx === 2 || idx === 5) && (
            <div
              style={{
                width: 32,
                height: 1,
                backgroundColor: "rgba(255,255,255,0.06)",
                margin: "6px 0",
              }}
            />
          )}
          <NavLink
            to={to}
            end={to === "/op/tpv"}
            title={label}
            style={({ isActive }) => ({
              width: 44,
              height: 44,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isActive ? ACCENT : "#737373",
              backgroundColor: isActive ? ACCENT_BG : "transparent",
              textDecoration: "none",
              transition: "all 0.15s ease",
            })}
          >
            {iconFor(icon)}
          </NavLink>
        </React.Fragment>
      ))}

      <div style={{ flex: 1 }} />

      {/* Exit */}
      <a
        href="/app/staff/home"
        title="Sair do TPV"
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#737373",
          textDecoration: "none",
          transition: "color 0.15s ease",
        }}
      >
        <IconExit />
      </a>
    </aside>
  );
}
