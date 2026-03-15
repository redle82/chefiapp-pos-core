import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MadeWithLoveFooter } from "../../../../components/MadeWithLoveFooter";
import { useRestaurantIdentity } from "../../../../core/identity/useRestaurantIdentity";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { OSCopy } from "../../../../ui/design-system/sovereign/OSCopy";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

function getAdminPageSuffix(pathname: string): string {
  if (pathname === "/admin/home" || pathname === "/admin")
    return OSCopy.dashboard.comandoCentral;
  if (pathname.startsWith("/admin/config")) return "Configuração";
  return "Comando Central";
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { pathname } = useLocation();
  const { identity } = useRestaurantIdentity();
  const { runtime } = useRestaurantRuntime();

  useEffect(() => {
    const suffix = getAdminPageSuffix(pathname);
    document.title = identity.name
      ? `${identity.name} — ${suffix}`
      : `ChefIApp OS — ${suffix}`;
  }, [identity.name, pathname]);

  return (
    <div
      className="dashboard-layout"
      data-theme="gastro-2027"
      style={{
        display: "flex",
        minHeight: "100vh",
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
        {!runtime.loading && runtime.productMode === "trial" && (
          <div
            style={{
              backgroundColor: "#92400e",
              color: "#fff",
              padding: "8px 24px",
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 18,
                height: 18,
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.6)",
                fontSize: 11,
              }}
            >
              !
            </span>
            <span>
                Modo demonstração — esta sessão usa dados simulados e não afeta o restaurante real.
            </span>
          </div>
        )}
        <main
          className="admin-content"
          style={{
            flex: 1,
            padding: "24px 32px",
          }}
        >
          {children}
        </main>
        <MadeWithLoveFooter variant="default" />
      </div>
    </div>
  );
}
