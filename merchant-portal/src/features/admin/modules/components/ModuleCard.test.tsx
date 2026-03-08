/**
 * @vitest-environment jsdom
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ModuleCard } from "./ModuleCard";

afterEach(() => {
  cleanup();
});

describe("ModuleCard UXG-003", () => {
  it("shows desktop-only badge and linked device status", () => {
    render(
      <ModuleCard
        module={{
          id: "tpv",
          name: "Software TPV",
          description: "Gestão de pedidos",
          platform: "desktop",
          status: "active",
          icon: "🖥️",
          primaryAction: "Open",
          primaryLabelOverride: "Abrir no app",
          deviceStatusLabel: "Dispositivo: TPV_BALCAO_01 ✓",
          secondaryAction: "Desactivar",
          block: "essenciais",
        }}
      />,
    );

    expect(screen.getByText("Desktop only")).toBeTruthy();
    expect(screen.getByText("Dispositivo: TPV_BALCAO_01 ✓")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Abrir no app" })).toBeTruthy();
  });

  it("uses default primary label mapping when override is absent", () => {
    const onPrimaryAction = vi.fn();

    render(
      <ModuleCard
        module={{
          id: "stock",
          name: "Stock",
          description: "Inventário",
          platform: "web",
          status: "inactive",
          icon: "📦",
          primaryAction: "Activate",
          block: "essenciais",
        }}
        onPrimaryAction={onPrimaryAction}
      />,
    );

    const button = screen.getByRole("button", { name: "Activar" });
    expect(button).toBeTruthy();
    button.click();
    expect(onPrimaryAction).toHaveBeenCalledWith("stock");
    expect(screen.queryByText("Desktop only")).toBeNull();
  });
});
