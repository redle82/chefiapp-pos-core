import { useEffect } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import { CONFIG } from "../../config";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useAuth } from "../../core/auth/useAuth";
import { isDebugMode } from "../../core/debugMode";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { RUNTIME } from "../../core/runtime/RuntimeContext";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { Text } from "../../ui/design-system/primitives/Text";
import { isValidStaffRole, StaffProvider } from "./context/StaffContext";
import { OperatorSessionProvider } from "./context/OperatorSessionContext";
import type { StaffRole } from "./context/StaffCoreTypes";

/** StaffModule — parte da cadeia real: AppStaffWrapper → StaffModule → StaffAppGate → StaffAppShellLayout → páginas. Fornece StaffProvider + OperatorSessionProvider; renderiza Outlet (rotas nested). */
export default function StaffModule() {
  const { user, loading: authLoading } = useAuth();
  const { identity } = useRestaurantIdentity();
  const { runtime } = useRestaurantRuntime();
  const [searchParams] = useSearchParams();

  // 🔒 ARQUITETURA LOCKED: Staff-style browser tab title for isolated tool context
  // Ver: E2E_SOVEREIGN_NAVIGATION_VALIDATION.md
  useEffect(() => {
    document.title = "ChefIApp POS — Staff";
    return () => {
      document.title = "ChefIApp POS";
    };
  }, []);

  // Full-screen real (APPSTAFF_HOME_LAUNCHER_CONTRACT): scroll só dentro do conteúdo, nunca da página
  useEffect(() => {
    const c = "staff-app-fullscreen";
    document.documentElement.classList.add(c);
    document.body.classList.add(c);
    return () => {
      document.documentElement.classList.remove(c);
      document.body.classList.remove(c);
    };
  }, []);

  const loading = authLoading || identity.loading || runtime.loading;
  const restaurantId = identity.id || getTabIsolated("chefiapp_restaurant_id");
  // Role EXCLUSIVAMENTE da sessão em fluxo canónico; ?role= em demo ou debug (permite testar visibilidade por papel)
  const roleParam =
    CONFIG.ALLOW_STAFF_ROLE_QUERY && (isDebugMode() || RUNTIME.isDemo)
      ? searchParams.get("role")
      : null;
  const initialRole: StaffRole | undefined =
    roleParam && isValidStaffRole(roleParam) ? (roleParam as StaffRole) : undefined;

  if (loading) {
    return (
      <div
        style={{
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <Text size="md" weight="bold">
          Ligando Staff...
        </Text>
        <Text size="sm" color="tertiary">
          Validando sessão e restaurante.
        </Text>
      </div>
    );
  }

  return (
    <StaffProvider
      restaurantId={restaurantId || undefined}
      userId={user?.id || null}
      initialRole={initialRole ?? null}
    >
      <OperatorSessionProvider>
        <Outlet />
      </OperatorSessionProvider>
    </StaffProvider>
  );
}
