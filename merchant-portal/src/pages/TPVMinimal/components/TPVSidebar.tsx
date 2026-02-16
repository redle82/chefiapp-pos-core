/**
 * TPVSidebar — Barra lateral esquerda do TPV: perfil do operador no topo, navegação (POS, Pedidos, Definições), sair.
 * Design: tema escuro, accent dourado (--color-primary) no item ativo.
 */

import React from "react";
import { NavLink } from "react-router-dom";

/** Nome e ID do operador (quando houver auth de staff; por agora placeholder). */
const STAFF_PLACEHOLDER = { name: "Operador", id: "—" };

const SIDEBAR_LINKS = [
  { to: "/op/tpv", label: "POS", icon: "grid" },
  { to: "/op/tpv/orders", label: "Pedidos", icon: "doc" },
  { to: "/op/tpv/kitchen", label: "Cozinha", icon: "kitchen" },
  { to: "/op/tpv/tasks", label: "Tarefas", icon: "tasks" },
  { to: "/op/tpv/reservations", label: "Reservas", icon: "calendar" },
  { to: "/op/tpv/settings", label: "Definições", icon: "gear" },
] as const;

function IconGrid() {
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 1,
            backgroundColor: "currentColor",
          }}
        />
      ))}
    </div>
  );
}

function IconDoc() {
  return <span style={{ fontSize: 18 }}>📄</span>;
}

function IconGear() {
  return <span style={{ fontSize: 18 }}>⚙</span>;
}

/** Ícone de cozinha (panela simplificada) */
function IconKitchen() {
  return <span style={{ fontSize: 18 }}>🍳</span>;
}

/** Ícone de tarefas (checklist) */
function IconTasks() {
  return <span style={{ fontSize: 18 }}>✅</span>;
}

/** Ícone de reservas (calendário) */
function IconCalendar() {
  return <span style={{ fontSize: 18 }}>📅</span>;
}

function iconFor(
  k: "grid" | "doc" | "gear" | "kitchen" | "tasks" | "calendar",
) {
  switch (k) {
    case "grid":
      return <IconGrid />;
    case "doc":
      return <IconDoc />;
    case "gear":
      return <IconGear />;
    case "kitchen":
      return <IconKitchen />;
    case "tasks":
      return <IconTasks />;
    case "calendar":
      return <IconCalendar />;
  }
}

export function TPVSidebar() {
  const staffName = STAFF_PLACEHOLDER.name;
  const staffId = STAFF_PLACEHOLDER.id;

  return (
    <aside
      style={{
        width: 80,
        minWidth: 80,
        backgroundColor: "var(--surface-base, #171717)",
        borderRight: "1px solid var(--surface-border, rgba(255,255,255,0.08))",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 12,
        gap: 8,
      }}
    >
      {/* Perfil do operador: avatar + nome + ID */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          paddingBottom: 12,
          borderBottom:
            "1px solid var(--surface-border, rgba(255,255,255,0.08))",
          width: "100%",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "var(--surface-elevated, #262626)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-primary, #fafafa)",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {staffName.slice(0, 1)}
        </div>
        <span
          style={{
            color: "var(--text-primary, #fafafa)",
            fontWeight: 600,
            fontSize: 11,
            lineHeight: 1.2,
            textAlign: "center",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {staffName}
        </span>
        <span
          style={{
            color: "var(--text-tertiary, #737373)",
            fontSize: 10,
            lineHeight: 1.2,
          }}
        >
          {staffId}
        </span>
      </div>

      {SIDEBAR_LINKS.map(({ to, icon, label }, idx) => (
        <React.Fragment key={to}>
          {/* Separator before hub modules (after Pedidos) */}
          {idx === 2 && (
            <div
              style={{
                width: "60%",
                height: 1,
                backgroundColor:
                  "var(--surface-border, rgba(255,255,255,0.08))",
                margin: "4px 0",
              }}
            />
          )}
          {/* Separator before settings (after Reservas) */}
          {idx === 5 && (
            <div
              style={{
                width: "60%",
                height: 1,
                backgroundColor:
                  "var(--surface-border, rgba(255,255,255,0.08))",
                margin: "4px 0",
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
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              color: isActive
                ? "var(--color-primary, #c9a227)"
                : "var(--text-secondary, #a3a3a3)",
              backgroundColor: isActive
                ? "var(--status-primary-bg, rgba(201,162,39,0.12))"
                : "transparent",
              textDecoration: "none",
              fontSize: 9,
              lineHeight: 1,
              fontWeight: isActive ? 600 : 400,
            })}
          >
            {iconFor(icon)}
          </NavLink>
        </React.Fragment>
      ))}
      <div style={{ flex: 1 }} />
      <a
        href="/app/staff/home"
        title="Sair"
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          color: "var(--text-secondary, #a3a3a3)",
          textDecoration: "none",
        }}
      >
        →
      </a>
    </aside>
  );
}
