import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import { colors } from "../../../../ui/design-system/tokens/colors";
import { OSCopy } from "../../../../ui/design-system/sovereign/OSCopy";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

const theme = colors.modes.dashboard;

function getAdminPageSuffix(pathname: string): string {
  if (pathname === "/admin/home" || pathname === "/admin") return OSCopy.dashboard.comandoCentral;
  if (pathname.startsWith("/admin/config")) return "Configuração";
  return "Comando Central";
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { pathname } = useLocation();
  const { identity } = useRestaurantIdentity();

  useEffect(() => {
    const suffix = getAdminPageSuffix(pathname);
    document.title = identity.name
      ? `${identity.name} — ${suffix}`
      : `ChefIApp OS — ${suffix}`;
  }, [identity.name, pathname]);

  return (
    <div
      className="dashboard-layout"
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: theme.surface.base,
        color: theme.text.primary,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <AdminSidebar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AdminTopbar />
        <main
          className="admin-content"
          style={{
            padding: "24px 32px",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

