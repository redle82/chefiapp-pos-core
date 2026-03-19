/**
 * AdminSidebar — Domain sidebar for the Admin "Comando Central".
 *
 * Characteristics:
 *   - OSSignature brand header (ChefIApp™ OS)
 *   - Exclusive accordion (only 1 group open at a time)
 *   - No icons on items — clean text only
 *   - Large font for readability
 *   - User role from ContextEngine
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import { RestaurantLogo } from "../../../../ui/RestaurantLogo";
import { OSSignature } from "../../../../ui/design-system/sovereign/OSSignature";
import styles from "./AdminSidebar.module.css";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SidebarItem {
  labelKey: string;
  to: string;
  status?: "experimental" | "locked" | "planned" | "active";
}

interface SidebarGroup {
  id: string;
  titleKey: string;
  items: SidebarItem[];
}

/* ------------------------------------------------------------------ */
/*  Navigation structure (labels via sidebar.adminNav)                 */
/* ------------------------------------------------------------------ */

const NAV_GROUPS: SidebarGroup[] = [
  {
    id: "comando",
    titleKey: "adminNav.groupComando",
    items: [
      { labelKey: "adminNav.itemComandoCentral", to: "/admin/home" },
      { labelKey: "adminNav.itemAjustesNucleo", to: "/admin/config" },
    ],
  },
  {
    id: "operar",
    titleKey: "adminNav.groupOperar",
    items: [
      { labelKey: "adminNav.itemCardapio", to: "/admin/catalog" },
      { labelKey: "adminNav.itemPedidos", to: "/admin/orders" },
      { labelKey: "adminNav.itemMesas", to: "/admin/tables" },
      { labelKey: "adminNav.itemReservas", to: "/admin/reservations", status: "planned" },
    ],
  },
  {
    id: "analisar",
    titleKey: "adminNav.groupAnalisar",
    items: [
      { labelKey: "adminNav.itemTransacoes", to: "/admin/payments" },
      { labelKey: "adminNav.itemFechamentos", to: "/admin/closures" },
      { labelKey: "adminNav.itemRecibos", to: "/admin/receipts" },
      { labelKey: "adminNav.itemRelatorios", to: "/admin/reports" },
    ],
  },
  {
    id: "governar",
    titleKey: "adminNav.groupGovernar",
    items: [
      { labelKey: "adminNav.itemEquipa", to: "/admin/config/users" },
      { labelKey: "adminNav.itemTpv", to: "/admin/devices/tpv" },
      { labelKey: "adminNav.itemAppStaff", to: "/admin/devices" },
      { labelKey: "adminNav.itemModulos", to: "/admin/modules" },
      { labelKey: "adminNav.itemObservabilidade", to: "/admin/observability" },
    ],
  },
  {
    id: "conectar",
    titleKey: "adminNav.groupConectar",
    items: [
      { labelKey: "adminNav.itemClientes", to: "/admin/customers" },
      { labelKey: "adminNav.itemPromocoes", to: "/admin/promotions" },
      {
        labelKey: "adminNav.itemIntegracoes",
        to: "/admin/config/integrations",
        status: "experimental",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function findActiveGroup(pathname: string): string | null {
  for (const g of NAV_GROUPS) {
    if (g.items.some((item) => pathname.startsWith(item.to))) {
      return g.id;
    }
  }
  return NAV_GROUPS[0]?.id ?? null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminSidebar() {
  const { t } = useTranslation("sidebar");
  const location = useLocation();
  const { identity } = useRestaurantIdentity();

  // Exclusive accordion: only 1 group open at a time
  const [openGroup, setOpenGroup] = useState<string | null>(() =>
    findActiveGroup(location.pathname),
  );

  const toggleGroup = (id: string) => {
    setOpenGroup((prev) => (prev === id ? null : id));
  };

  const getBadgeKey = (status: string) => {
    if (status === "experimental") return "adminNav.badgeExperimental";
    if (status === "planned") return "adminNav.badgePlanned";
    return "adminNav.badgeOff";
  };

  return (
    <aside className={`${styles.sidebar} admin-sidebar-shell`}>
      <div className={styles.sidebarInner}>
        {/* Restaurant identity + ChefIApp™ OS */}
        <div className={styles.brandSection}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: "100%" }}>
            <RestaurantLogo
              logoUrl={identity.logoUrl}
              name={identity.name}
              size={48}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#e5e5e5", textAlign: "center", lineHeight: 1.2 }}>
              {identity.name || "Restaurante"}
            </span>
          </div>
          <OSSignature state="ember" size="md" />
        </div>

        {/* Navigation groups — exclusive accordion */}
        <nav aria-label="Admin navigation" className={styles.navColumnMain}>
          {NAV_GROUPS.map((group) => {
            const isOpen = openGroup === group.id;
            const hasActive = group.items.some((item) =>
              location.pathname.startsWith(item.to),
            );
            return (
              <div key={group.id} className={styles.sidebarGroup}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={styles.groupHeader}
                  data-active={hasActive ? "" : undefined}
                  data-open={isOpen ? "" : undefined}
                >
                  <span className={styles.groupTitle}>{t(group.titleKey)}</span>
                  <span className={styles.groupChevron}>›</span>
                </button>
                {isOpen && (
                  <div className={styles.groupItems}>
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          [styles.navLink, isActive && styles.navLinkActive]
                            .filter(Boolean)
                            .join(" ")
                        }
                      >
                        {t(item.labelKey)}
                        {item.status && item.status !== "active" && (
                          <span
                            className={
                              item.status === "experimental"
                                ? styles.statusBadgeExperimental
                                : styles.statusBadgeOther
                            }
                          >
                            {t(getBadgeKey(item.status))}
                          </span>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
