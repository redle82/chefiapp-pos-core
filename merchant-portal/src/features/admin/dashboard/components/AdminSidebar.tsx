import { NavLink, useLocation } from "react-router-dom";

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
  const isConfig = location.pathname.startsWith("/admin/config");

  return (
    <aside
      style={{
        width: 248,
        backgroundColor: "#ffffff",
        borderRight: "1px solid #e5e7eb",
        padding: "20px 16px 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: 0,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {isConfig ? (
          <>
            <NavLink
              to="/admin/home"
              style={{
                display: "block",
                padding: "8px 10px",
                borderRadius: 8,
                fontSize: 12,
                color: "#6b7280",
                fontWeight: 500,
                textDecoration: "none",
                marginBottom: 4,
              }}
            >
              ← Volver al menú
            </NavLink>
            <div
              style={{
                marginBottom: 8,
                paddingLeft: 8,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#9ca3af",
              }}
            >
              Configuración
            </div>
            <nav
              aria-label="Configuración"
              style={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
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
            <div
              style={{
                marginBottom: 16,
                paddingLeft: 8,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "-0.03em",
              }}
            >
              Last.app-like
            </div>
            <nav
              aria-label="Admin navigation"
              style={{ display: "flex", flexDirection: "column", gap: 4 }}
            >
              {NAV_ITEMS.filter((i) => i.section !== "bottom").map((item) => (
                <AdminSidebarLink key={item.id} to={item.to!}>
                  {item.label}
                </AdminSidebarLink>
              ))}
            </nav>
            {NAV_ITEMS.some((i) => i.section === "bottom") && (
              <div style={{ marginTop: 8 }}>
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
        color: isActive ? "#4c1d95" : "#4b5563",
        backgroundColor: isActive ? "#ede9fe" : "transparent",
        fontWeight: isActive ? 600 : 500,
        textDecoration: "none",
      })}
    >
      {children}
    </NavLink>
  );
}
