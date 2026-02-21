/**
 * MenuBuilderPage — Página standalone do Menu Builder (rota /menu-builder)
 *
 * Define container próprio (maxWidth, padding) para uso fora do OS.
 * Dentro do Dashboard usa-se MenuBuilderPanel, nunca MenuBuilderPage.
 */
// @ts-nocheck


import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import {
  GlobalErrorView,
  GlobalLoadingView,
} from "../../ui/design-system/components";
import { MenuBuilderCore } from "./MenuBuilderCore";

export function MenuBuilderPage() {
  const { runtime } = useRestaurantRuntime();

  // Prevent premature loading with invalid ID (FK violation risk)
  if (runtime.loading) {
    return <GlobalLoadingView message="A carregar contexto..." />;
  }

  if (runtime.error) {
    return (
      <div style={{ padding: 24, margin: "0 auto", maxWidth: 600 }}>
        <GlobalErrorView
          title="Erro de Contexto"
          message={runtime.error}
          layout="portal"
        />
      </div>
    );
  }

  // Use runtime ID or fallback only if absolutely necessary for trial/dev
  const restaurantId =
    runtime.restaurant_id ?? "bbce08c7-63c0-473d-b693-ec2997f73a68";

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1200,
        margin: "0 auto",
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <MenuBuilderCore restaurantId={restaurantId} variant="page" />
    </div>
  );
}
