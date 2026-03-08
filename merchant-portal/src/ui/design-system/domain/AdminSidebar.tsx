import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CoreStatusBadge } from "../../../components/CoreStatusBadge/CoreStatusBadge";
import { getAuthActions } from "../../../core/auth/authAdapter";
import { recordLogout } from "../../../core/auth/authAudit";
import { useContextEngine } from "../../../core/context";
import { removeTabIsolated } from "../../../core/storage/TabIsolatedStorage";
import { BillingWarningBadge } from "../../billing/BillingWarningBadge";
import { Button } from "../Button";
import { Text } from "../primitives/Text";
import { OSSignature } from "../sovereign/OSSignature";
import styles from "./AdminSidebar.module.css";

interface AdminSidebarProps {
  activePath: string;
  onNavigate: (path: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activePath,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const { role, visibleModules } = useContextEngine();

  // Track expanded groups. EVOLVE is collapsed by default (meta-produto + comercial).
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      Comando: true,
      Operar: true,
      Analisar: true,
      Governar: true,
      Conectar: true,
      Evolve: false, // Collapsed by default
    },
  );

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleLogout = async () => {
    await recordLogout();
    await getAuthActions().signOut();
    removeTabIsolated("chefiapp_restaurant_id");
    removeTabIsolated("chefiapp_trial_mode");
    navigate("/start");
  };

  const handleItemClick = (item: SidebarItem) => {
    // All items navigate via SPA — no window.open() for operational modules.
    // TPV/KDS/AppStaff installation goes through /admin/devices hub.
    onNavigate(item.id);
  };

  interface SidebarItem {
    label: string;
    id: string;
    icon: string;
    status?: "experimental" | "locked" | "planned" | "active";
    show?: boolean;
  }

  interface SidebarGroup {
    title: string;
    visible?: boolean;
    collapsible?: boolean;
    items: SidebarItem[];
  }

  const GROUPS: SidebarGroup[] = [
    {
      title: "Comando",
      visible: role === "owner" || role === "manager",
      items: [
        { label: "Comando Central", id: "/app/dashboard", icon: "⚡️" },
        { label: "Rede (Enterprise)", id: "/app/organization", icon: "🏢" }, // New Organization Link
        { label: "Ajustes do Núcleo", id: "/app/settings", icon: "⚙️" },
      ],
    },
    {
      title: "Operar",
      visible: true, // Always visible, but items filtered
      items: [
        { label: "TPV (Caixa)", id: "/admin/devices", icon: "🖥️", show: true },
        {
          label: "KDS (Cozinha)",
          id: "/admin/devices",
          icon: "👨‍🍳",
          show: visibleModules.kitchen,
        },
        {
          label: "Cardápio",
          id: "/app/menu",
          icon: "🍔",
          show: visibleModules.menu,
        },
        {
          label: "Pedidos",
          id: "/app/orders",
          icon: "📃",
          show: visibleModules.orders,
        },
        {
          label: "Operação Hub",
          id: "/app/operational-hub",
          icon: "📦",
          status: "experimental",
          show: visibleModules.settings,
        },
        {
          label: "Inventário",
          id: "/app/inventory",
          icon: "🧺",
          status: "experimental",
          show: visibleModules.settings,
        },
        {
          label: "Mesas",
          id: "/app/tables",
          icon: "🪑",
          show: visibleModules.tables,
        }, // Added explicit tables item
        {
          label: "Reservas",
          id: "/app/reservations",
          icon: "📅",
          status: "planned",
          show: visibleModules.settings,
        },
      ],
    },
    {
      title: "Analisar",
      visible: visibleModules.reports || visibleModules.finance,
      items: [
        {
          label: "Fecho Diário",
          id: "/app/reports/daily-closing",
          icon: "📊",
          show: visibleModules.reports,
        },
        {
          label: "Vendas por período",
          id: "/app/reports/sales-by-period",
          icon: "📈",
          show: visibleModules.reports,
        },
        {
          label: "Finanças",
          id: "/app/reports/finance",
          icon: "💰",
          show: visibleModules.finance,
        },
        {
          label: "Clientes (CRM)",
          id: "/app/crm",
          icon: "👥",
          show: visibleModules.reports,
        },
        {
          label: "Fidelidade",
          id: "/app/loyalty",
          icon: "🎁",
          show: visibleModules.reports,
        },
      ],
    },
    {
      title: "Governar",
      visible: visibleModules.settings,
      items: [
        {
          label: "Equipa",
          id: "/app/team",
          icon: "👥",
          show: visibleModules.settings,
        },
        {
          label: "Controlo de Acesso",
          id: "/app/govern-manage",
          icon: "🔐",
          show: visibleModules.settings,
        },
        {
          label: "Auditoria",
          id: "/app/audit",
          icon: "📋",
          show: visibleModules.settings,
        },
        {
          label: "Página Web",
          id: "/app/web/preview",
          icon: "🌐",
          show: visibleModules.settings,
        },
        {
          label: "Segurança Alimentar",
          id: "/app/govern",
          icon: "🧼",
          status: "locked",
          show: visibleModules.settings,
        },
        {
          label: "Centro de Ajuda",
          id: "/app/help",
          icon: "❓",
          show: true,
        },
      ],
    },
    {
      title: "Conectar",
      visible: visibleModules.settings,
      items: [
        {
          label: "Conectores",
          id: "/app/settings/connectors",
          icon: "🔌",
          status: "experimental",
          show: visibleModules.settings,
        },
        {
          label: "Reputação Hub",
          id: "/app/reputation-hub",
          icon: "⭐",
          status: "locked",
          show: visibleModules.settings,
        },
      ],
    },
    {
      title: "Evolve",
      collapsible: true, // Meta-produto + Comercial unificados
      visible: role === "owner",
      items: [
        { label: "Evolve Hub", id: "/app/evolve", icon: "🔮", show: true },
      ],
    },
  ];

  // Filter Groups
  const filteredGroups = GROUPS.filter((g) => g.visible)
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => i.show !== false),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className={styles.container}>
      {/* Brand */}
      <div className={styles.brand}>
        <OSSignature state="ember" size="md" />
        <BillingWarningBadge />
      </div>

      {/* Navigation */}
      <nav className={styles.navColumn}>
        {filteredGroups.map((group) => (
          <div key={group.title} className={styles.groupContainer}>
            {/* Group Header - Clickable for toggle */}
            <div
              onClick={() => toggleGroup(group.title)}
              className={styles.groupHeader}
              data-expanded={!!expandedGroups[group.title]}
            >
              <span>{group.title}</span>
              {/* Chevron / Indicator */}
              {group.title === "Evolve" && (
                <span className={styles.chevron}>
                  {expandedGroups[group.title] ? "▼" : "▶"}
                </span>
              )}
            </div>

            {/* Items Container - Conditional Render */}
            {expandedGroups[group.title] && (
              <div className={styles.groupItems}>
                {group.items.map((item) => {
                  const isActive =
                    activePath === item.id || activePath.startsWith(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={styles.navItem}
                      data-active={isActive}
                      data-locked={item.status === "locked"}
                    >
                      <div className={styles.navItemLeft}>
                        <span className={styles.navItemIcon}>{item.icon}</span>
                        <span
                          className={styles.navItemLabel}
                          data-active={isActive}
                        >
                          {item.label}
                        </span>
                      </div>
                      {item.status && item.status !== "active" && (
                        <div
                          className={
                            item.status === "experimental"
                              ? styles.statusBadgeExperimental
                              : styles.statusBadgeOther
                          }
                        >
                          {item.status === "experimental"
                            ? "BETA"
                            : item.status === "planned"
                            ? "BREVE"
                            : "OFF"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.coreStatusRow}>
          <CoreStatusBadge />
        </div>
        <Button
          variant="ghost"
          tone="neutral"
          onClick={() => navigate("/app/select-tenant")}
          style={{
            width: "100%",
            marginBottom: "0.5rem",
            justifyContent: "flex-start",
            color: "#a1a1aa",
          }}
        >
          🏢 Trocar Restaurante
        </Button>
        <Button
          variant="ghost"
          tone="destructive"
          onClick={handleLogout}
          style={{
            width: "100%",
            marginBottom: "0.75rem",
            justifyContent: "flex-start",
          }}
        >
          🚪 Encerrar Turno
        </Button>

        {/* CONTRATO_OWNER_ONLY_WEB: sem seletor de papel; web = Dono apenas. */}
        <Text size="xs" color="tertiary" style={{ marginTop: "0.75rem" }}>
          {role.toUpperCase()} • v2.2 (Context Engine)
        </Text>
      </div>
    </div>
  );
};
