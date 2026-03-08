/**
 * AdminSidebar — Strategic hierarchy for the Admin "Comando Central".
 *
 * Mental model del dueño de restaurante:
 *   💰 Finanzas  →  🍽 Operación  →  👥 Clientes  →  📦 Producto  →  📊 Inteligencia  →  ⚙️ Sistema
 *
 * Config view (/admin/config/*) keeps its own flat list.
 */
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import { isDesktopApp } from "../../../../core/operational/platformDetection";
import { ChefIAppSignature } from "../../../../ui/design-system/sovereign/ChefIAppSignature";
import { RestaurantHeader } from "../../../../ui/design-system/sovereign/RestaurantHeader";
import styles from "./AdminSidebar.module.css";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SidebarLeaf = { label: string; to: string };
type SidebarGroup = {
  id: string;
  title: string;
  icon: string;
  items: SidebarLeaf[];
};

/* ------------------------------------------------------------------ */
/*  Strategic nav tree — what the restaurant owner thinks about        */
/* ------------------------------------------------------------------ */

const NAV_GROUPS: SidebarGroup[] = [
  {
    id: "finanzas",
    title: "Finanzas",
    icon: "💰",
    items: [
      { label: "Transacciones", to: "/admin/payments" },
      { label: "Reembolsos", to: "/admin/payments/refunds" },
      { label: "Cierres", to: "/admin/closures" },
    ],
  },
  {
    id: "operacion",
    title: "Operación",
    icon: "🍽",
    items: [
      { label: "Reservas", to: "/admin/reservations" },
      { label: "Promociones", to: "/admin/promotions" },
    ],
  },
  {
    id: "clientes",
    title: "Clientes",
    icon: "👥",
    items: [{ label: "Directorio", to: "/admin/customers" }],
  },
  {
    id: "producto",
    title: "Producto",
    icon: "📦",
    items: [{ label: "Catálogo", to: "/admin/catalog" }],
  },
  {
    id: "inteligencia",
    title: "Inteligencia",
    icon: "📊",
    items: [{ label: "Reportes", to: "/admin/reports" }],
  },
  {
    id: "sistema",
    title: "Sistema",
    icon: "⚙️",
    items: [
      { label: "Configuración", to: "/admin/config" },
      { label: "Dispositivos", to: "/admin/devices" },
      { label: "Módulos", to: "/admin/modules" },
      { label: "Observabilidad", to: "/admin/observability" },
    ],
  },
];

/** Config sub-page items (flat list, shown when inside /admin/config or /admin/modules) */
const CONFIG_ITEMS: { path: string; label: string; to?: string }[] = [
  { path: "general", label: "General" },
  { path: "productos", label: "Módulos", to: "/admin/modules" },
  { path: "tienda-online", label: "Página web" },
  { path: "suscripcion", label: "Suscripción" },
  { path: "ubicaciones", label: "Ubicaciones" },
  { path: "entidades-legales", label: "Entidades Legales" },
  { path: "marcas", label: "Marcas" },
  { path: "usuarios", label: "Usuarios Administradores" },
  { path: "dispositivos", label: "Gestión de dispositivos" },
  { path: "impresoras", label: "Impresoras" },
  {
    path: "integraciones",
    label: "Integraciones",
    to: "/admin/config/integrations",
  },
  { path: "delivery", label: "Delivery" },
  { path: "empleados", label: "Empleados" },
  { path: "software-tpv", label: "Software TPV" },
  { path: "reservas", label: "Reservas" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Check if any item in a group matches the current pathname. */
function isGroupActive(group: SidebarGroup, pathname: string): boolean {
  return group.items.some((item) => pathname.startsWith(item.to));
}

/** Derive initially open sections from the current url. */
function deriveOpenSections(pathname: string): Set<string> {
  const open = new Set<string>();
  for (const g of NAV_GROUPS) {
    if (isGroupActive(g, pathname)) {
      open.add(g.id);
    }
  }
  return open;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminSidebar() {
  const location = useLocation();
  const { identity } = useRestaurantIdentity();
  const isConfig =
    location.pathname.startsWith("/admin/config") ||
    location.pathname === "/admin/modules";

  const [openSections, setOpenSections] = useState<Set<string>>(() =>
    deriveOpenSections(location.pathname),
  );

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarInner}>
        <div className={styles.brandSection}>
          <RestaurantHeader
            name={identity.name}
            logoUrl={identity.logoUrl}
            size="sm"
          />
        </div>
        {isConfig ? (
          <>
            <NavLink to="/admin/home" className={styles.backLink}>
              ← Volver al menú
            </NavLink>
            <div className={styles.configLabel}>Configuración</div>
            <nav aria-label="Configuración" className={styles.navColumn}>
              {CONFIG_ITEMS.map(({ path, label, to }) => (
                <AdminSidebarLink
                  key={path}
                  to={to ?? `/admin/config/${path}`}
                  end={!!to}
                >
                  {label}
                </AdminSidebarLink>
              ))}
            </nav>
          </>
        ) : (
          <nav aria-label="Admin navigation" className={styles.navColumnMain}>
            {/* Home — always visible, no group */}
            <AdminSidebarLink to="/admin/home">Inicio</AdminSidebarLink>

            <div className={styles.groupsDivider} />

            {/* Strategic groups */}
            {NAV_GROUPS.map((group) => {
              const isOpen = openSections.has(group.id);
              const hasActive = isGroupActive(group, location.pathname);
              return (
                <div key={group.id} className={styles.sidebarGroup}>
                  <button
                    type="button"
                    onClick={() => toggleSection(group.id)}
                    className={styles.groupHeader}
                    data-active={hasActive ? "" : undefined}
                    data-open={isOpen ? "" : undefined}
                  >
                    <span className={styles.groupIcon}>{group.icon}</span>
                    <span className={styles.groupTitle}>{group.title}</span>
                    <span className={styles.groupChevron}>›</span>
                  </button>
                  {isOpen && (
                    <div className={styles.groupItems}>
                      {group.items.map((item) => (
                        <AdminSidebarLink key={item.to} to={item.to}>
                          {item.label}
                        </AdminSidebarLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        )}
      </div>
      <div className={styles.footer}>
        <nav aria-label="Quick links" className={styles.quickLinks}>
          <TpvQuickLink />
          <NavLink to="/app/dashboard" className={styles.quickLink}>
            🏠 Dashboard
          </NavLink>
        </nav>
        <ChefIAppSignature variant="full" size="sm" tone="light" />
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  TpvQuickLink — context-aware "Abrir TPV"                          */
/*  Browser → redirects to /admin/devices (no dead-end lock screen)   */
/*  Desktop runtime → navigates to /op/tpv directly                   */
/*  Ref: UXG-010                                                       */
/* ------------------------------------------------------------------ */
function TpvQuickLink() {
  const { t } = useTranslation("devices");
  const navigate = useNavigate();
  const [showNotice, setShowNotice] = useState(false);

  const handleClick = () => {
    if (isDesktopApp()) {
      navigate("/op/tpv");
      return;
    }
    // Browser: redirect to Devices page with context
    setShowNotice(true);
    setTimeout(() => {
      navigate("/admin/devices", {
        state: { fromTpvAttempt: true },
      });
    }, 1800);
  };

  return (
    <>
      <button type="button" onClick={handleClick} className={styles.quickLink}>
        🖥️ Abrir TPV
      </button>
      {showNotice && (
        <div className={styles.tpvNotice} role="status">
          {t("quickLink.tpvDesktopRequiredRedirectNotice")}
        </div>
      )}
    </>
  );
}

function AdminSidebarLink({
  to,
  end,
  children,
  title,
}: {
  to: string;
  end?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={title}
      className={({ isActive }) =>
        [styles.navLink, isActive && styles.navLinkActive]
          .filter(Boolean)
          .join(" ")
      }
    >
      {children}
    </NavLink>
  );
}
