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
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { OSSignature } from "../../../../ui/design-system/sovereign/OSSignature";
import styles from "./AdminSidebar.module.css";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SidebarItem {
  label: string;
  to: string;
  status?: "experimental" | "locked" | "planned" | "active";
}

interface SidebarGroup {
  id: string;
  title: string;
  items: SidebarItem[];
}

/* ------------------------------------------------------------------ */
/*  Navigation structure                                               */
/* ------------------------------------------------------------------ */

const NAV_GROUPS: SidebarGroup[] = [
  {
    id: "comando",
    title: "Comando",
    items: [
      { label: "Comando Central", to: "/admin/home" },
      { label: "Ajustes do Núcleo", to: "/admin/config" },
    ],
  },
  {
    id: "operar",
    title: "Operar",
    items: [
      { label: "Cardápio", to: "/admin/catalog" },
      { label: "Pedidos", to: "/admin/orders" },
      { label: "Mesas", to: "/admin/tables" },
      { label: "Reservas", to: "/admin/reservations", status: "planned" },
    ],
  },
  {
    id: "analisar",
    title: "Analisar",
    items: [
      { label: "Transações", to: "/admin/payments" },
      { label: "Fechamentos", to: "/admin/closures" },
      { label: "Relatórios", to: "/admin/reports" },
    ],
  },
  {
    id: "governar",
    title: "Governar",
    items: [
      { label: "Equipa", to: "/admin/config/users" },
      { label: "Dispositivos", to: "/admin/devices" },
      { label: "Módulos", to: "/admin/modules" },
      { label: "Observabilidade", to: "/admin/observability" },
    ],
  },
  {
    id: "conectar",
    title: "Conectar",
    items: [
      { label: "Clientes", to: "/admin/customers" },
      { label: "Promoções", to: "/admin/promotions" },
      {
        label: "Integrações",
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
  const location = useLocation();
  const navigate = useNavigate();

  // Exclusive accordion: only 1 group open at a time
  const [openGroup, setOpenGroup] = useState<string | null>(() =>
    findActiveGroup(location.pathname),
  );

  const toggleGroup = (id: string) => {
    setOpenGroup((prev) => (prev === id ? null : id));
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarInner}>
        {/* Brand: ChefIApp™ OS */}
        <div className={styles.brandSection}>
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
                  <span className={styles.groupTitle}>{group.title}</span>
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
                        {item.label}
                        {item.status && item.status !== "active" && (
                          <span
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
