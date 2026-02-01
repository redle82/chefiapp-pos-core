/**
 * MenuBuilderPage — Página standalone do Menu Builder (rota /menu-builder)
 *
 * Define container próprio (maxWidth, padding) para uso fora do OS.
 * Dentro do Dashboard usa-se MenuBuilderPanel, nunca MenuBuilderPage.
 */

import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { MenuBuilderCore } from "./MenuBuilderCore";

export function MenuBuilderPage() {
  const context = useRestaurantRuntime();
  const restaurantId =
    context?.runtime?.restaurant_id ?? "00000000-0000-0000-0000-000000000100";

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
