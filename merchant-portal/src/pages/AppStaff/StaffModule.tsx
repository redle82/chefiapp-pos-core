import { useEffect, useState } from "react";
import { Outlet, useSearchParams } from "react-router-dom";
import { CONFIG } from "../../config";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useAuth } from "../../core/auth/useAuth";
import { isDebugMode } from "../../core/debugMode";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { RUNTIME } from "../../core/runtime/RuntimeContext";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { Text } from "../../ui/design-system/primitives/Text";
import { OperatorSessionProvider } from "./context/OperatorSessionContext";
import { isValidStaffRole, StaffProvider } from "./context/StaffContext";
import type { StaffRole } from "./context/StaffCoreTypes";

/** StaffModule — parte da cadeia real: AppStaffWrapper → StaffModule → StaffAppGate → StaffAppShellLayout → páginas. Fornece StaffProvider + OperatorSessionProvider; renderiza Outlet (rotas nested). */
export default function StaffModule() {
  const { user, loading: authLoading } = useAuth();
  const { identity } = useRestaurantIdentity();
  const { runtime } = useRestaurantRuntime();
  const [searchParams] = useSearchParams();

  // Identity Layer: tab title = restaurante protagonista (docs/design/IDENTITY_LAYER_CONTRACT.md)
  useEffect(() => {
    document.title = identity.name
      ? `${identity.name} — Staff`
      : "ChefIApp POS — Staff";
    return () => {
      document.title = "ChefIApp POS";
    };
  }, [identity.name]);

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

  // DEBUG: Log loading states to identify blocking state
  useEffect(() => {
    console.log("[StaffModule] Loading states:", {
      authLoading,
      identityLoading: identity.loading,
      runtimeLoading: runtime.loading,
      restaurantId,
      identityId: identity.id,
    });
  }, [
    authLoading,
    identity.loading,
    runtime.loading,
    restaurantId,
    identity.id,
  ]);

  // ESCAPE HATCH: If still loading after 5s, force continue with degraded state
  const [forceLoad, setForceLoad] = useState(false);
  useEffect(() => {
    if (loading && !forceLoad) {
      const timeout = setTimeout(() => {
        console.warn("[StaffModule] Loading timeout - forcing continue");
        setForceLoad(true);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [loading, forceLoad]);

  // Role EXCLUSIVAMENTE da sessão em fluxo canónico; ?role= em trial ou debug (permite testar visibilidade por papel)
  const roleParam =
    CONFIG.ALLOW_STAFF_ROLE_QUERY && (isDebugMode() || RUNTIME.isTrial)
      ? searchParams.get("role")
      : null;
  const initialRole: StaffRole | undefined =
    roleParam && isValidStaffRole(roleParam)
      ? (roleParam as StaffRole)
      : undefined;

  if (loading && !forceLoad) {
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
        <Text size="xs" color="tertiary" style={{ marginTop: 16 }}>
          {authLoading && "• Verificando autenticação..."}
          {identity.loading && "• Carregando identidade do restaurante..."}
          {runtime.loading && "• Inicializando runtime..."}
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
