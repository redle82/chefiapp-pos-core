import { useEffect } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useSupabaseAuth } from "../../core/auth/useSupabaseAuth";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { Text } from "../../ui/design-system/primitives/Text";
import AppStaff from "./AppStaff";
import { StaffProvider } from "./context/StaffContext";
// 🛰️ SATÉLITE DE STAFF
// Agora conectado ao Auth + Identidade do Restaurante
export default function StaffModule() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { identity } = useRestaurantIdentity();
  const { runtime } = useRestaurantRuntime();

  // 🔒 ARQUITETURA LOCKED: Staff-style browser tab title for isolated tool context
  // Ver: E2E_SOVEREIGN_NAVIGATION_VALIDATION.md
  useEffect(() => {
    document.title = "ChefIApp POS — Staff";
    return () => {
      document.title = "ChefIApp POS";
    };
  }, []);

  const loading = authLoading || identity.loading || runtime.loading;

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

  const restaurantId = identity.id || getTabIsolated("chefiapp_restaurant_id");
  const hasTasksModule = runtime.installed_modules.includes("tasks");

  if (!hasTasksModule) {
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
          AppStaff em modo limitado
        </Text>
        <Text size="sm" color="tertiary">
          O módulo de tarefas ainda não está ativado neste ambiente. Ative
          "Tarefas" no Dashboard ou na System Tree para liberar o fluxo completo
          do AppStaff.
        </Text>
      </div>
    );
  }

  return (
    <StaffProvider
      restaurantId={restaurantId || undefined}
      userId={user?.id || null}
    >
      <AppStaff />
    </StaffProvider>
  );
}
