import { NavLink, useLocation } from "react-router-dom";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import { ChefIAppSignature } from "../../../../ui/design-system/sovereign/ChefIAppSignature";
import { RestaurantHeader } from "../../../../ui/design-system/sovereign/RestaurantHeader";
import { colors } from "../../../../ui/design-system/tokens/colors";
import styles from "./AdminSidebar.module.css";

const theme = colors.modes.dashboard;

type NavItem = {
  id: string;
  label: string;
  to?: string;
  section?: "top" | "bottom";
};

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Inicio", to: "/admin/home", section: "top" },
  { id: "clients", label: "Clientes", to: "/admin/customers", section: "top" },
  {
    id: "closures",
    label: "Cierres temporales",
    to: "/admin/closures",
    section: "top",
  },
  {
    id: "reservations",
    label: "Gestor de reservas",
    to: "/admin/reservations",
    section: "top",
  },
  { id: "payments", label: "Pagos", to: "/admin/payments", section: "top" },
  {
    id: "promos",
    label: "Promociones",
    to: "/admin/promotions",
    section: "top",
  },
  { id: "catalog", label: "Catálogo", to: "/admin/catalog", section: "top" },
  { id: "reports", label: "Reportes", to: "/admin/reports", section: "top" },
  {
    id: "observability",
    label: "Observabilidade",
    to: "/admin/observability",
    section: "top",
  },
  {
    id: "devices",
    label: "Tienda de dispositivos",
    to: "/admin/devices",
    section: "top",
  },
  {
    id: "settings",
    label: "Configuración",
    to: "/admin/config",
    section: "top",
  },
];

const CONFIG_ITEMS: { path: string; label: string }[] = [
  { path: "general", label: "General" },
  { path: "productos", label: "Productos" },
  { path: "suscripcion", label: "Suscripción" },
  { path: "ubicaciones", label: "Ubicaciones" },
  { path: "entidades-legales", label: "Entidades Legales" },
  { path: "marcas", label: "Marcas" },
  { path: "usuarios", label: "Usuarios Administradores" },
  { path: "dispositivos", label: "Gestión de dispositivos" },
  { path: "impresoras", label: "Impresoras" },
  { path: "integraciones", label: "Integraciones" },
  { path: "delivery", label: "Delivery" },
  { path: "empleados", label: "Empleados" },
  { path: "software-tpv", label: "Software TPV" },
  { path: "reservas", label: "Reservas" },
];

export function AdminSidebar() {
  const location = useLocation();
  const { identity } = useRestaurantIdentity();
  const isConfig = location.pathname.startsWith("/admin/config");

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
            <nav aria-label="Configuração" className={styles.navColumn}>
              {CONFIG_ITEMS.map(({ path, label }) => (
                <AdminSidebarLink
                  key={path}
                  to={`/admin/config/${path}`}
                  end={false}
                >
                  {label}
                </AdminSidebarLink>
              ))}
            </nav>
          </>
        ) : (
          <>
            <nav aria-label="Admin navigation" className={styles.navColumnMain}>
              {NAV_ITEMS.filter((i) => i.section !== "bottom").map((item) => (
                <AdminSidebarLink key={item.id} to={item.to!}>
                  {item.label}
                </AdminSidebarLink>
              ))}
            </nav>
            {NAV_ITEMS.some((i) => i.section === "bottom") && (
              <div className={styles.bottomSection}>
                {NAV_ITEMS.filter((i) => i.section === "bottom").map((item) => (
                  <AdminSidebarLink key={item.id} to={item.to!}>
                    {item.label}
                  </AdminSidebarLink>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <div className={styles.footer}>
        <ChefIAppSignature variant="full" size="sm" tone="light" />
      </div>
    </aside>
  );
}

function AdminSidebarLink({
  to,
  end,
  children,
}: {
  to: string;
  end?: boolean;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: "block",
        padding: "8px 10px",
        borderRadius: 8,
        fontSize: 13,
        color: isActive ? theme.action.base : theme.text.secondary,
        backgroundColor: isActive ? theme.action.base + "18" : "transparent",
        fontWeight: isActive ? 600 : 500,
        textDecoration: "none",
      })}
    >
      {children}
    </NavLink>
  );
}
