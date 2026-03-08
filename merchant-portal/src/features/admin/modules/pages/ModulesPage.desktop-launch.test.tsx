/**
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModulesPage } from "./ModulesPage";

const mockNavigate = vi.fn();
const launchDesktopWithHandshakeMock = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../../context/RestaurantRuntimeContext", () => ({
  useRestaurantRuntime: () => ({
    runtime: {
      restaurant_id: "rest-99",
      installed_modules: ["tpv"],
      active_modules: ["tpv"],
    },
  }),
}));

vi.mock("../../../../core/desktop/useDesktopHealth", () => ({
  useDesktopHealth: () => ({
    status: "not_found" as const,
    health: null,
    recheck: vi.fn(),
  }),
}));

vi.mock("../data/modulesDefinitions", () => ({
  buildModulesFromRuntime: () => [
    {
      id: "tpv",
      name: "TPV",
      description: "desc",
      icon: "🧾",
      block: "essenciais",
      status: "active",
      primaryAction: "Abrir",
      secondaryAction: "Desactivar",
    },
  ],
}));

vi.mock("../desktop/DesktopLaunchService", async (orig) => {
  const actual = await (orig as () => Promise<unknown>)();
  return {
    ...actual,
    launchDesktopWithHandshake: (...args: unknown[]) =>
      launchDesktopWithHandshakeMock(...args),
  };
});

vi.mock("../components/ModuleCard", () => ({
  ModuleCard: ({
    module,
    onPrimaryAction,
  }: {
    module: { id: string };
    onPrimaryAction: (id: string) => void;
  }) => (
    <button
      type="button"
      data-testid={`primary-${module.id}`}
      onClick={() => onPrimaryAction(module.id)}
    >
      primary-{module.id}
    </button>
  ),
}));

describe("ModulesPage desktop launch contract", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mockNavigate.mockReset();
    launchDesktopWithHandshakeMock.mockReset();
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_LAUNCH_TIMEOUT_MS = "5000";
    // @ts-expect-error
    import.meta.env.MODE = "production";
    // Necessário: sem URL de instalador, a state machine recusa CLICK_OPEN
    // e mostra o modal directamente (sem lançar deep link).
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DOWNLOAD_BASE = "https://example.com";
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DOWNLOAD_MAC_FILE = "ChefIApp.dmg";
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE = "ChefIApp.exe";
  });

  it("chama DesktopLaunchService.launchDesktopWithHandshake com deep link chefiapp-pos:// para TPV", () => {
    render(<ModulesPage />);

    fireEvent.click(screen.getByTestId("primary-tpv"));

    expect(launchDesktopWithHandshakeMock).toHaveBeenCalledTimes(1);
    const call = launchDesktopWithHandshakeMock.mock.calls[0][0] as {
      url: string;
      moduleId: string;
      restaurantId: string;
      timeoutMs: number;
    };
    expect(call.url.startsWith("chefiapp-pos://open?app=tpv")).toBe(true);
    expect(call.restaurantId).toBe("rest-99");
    expect(call.timeoutMs).toBe(5000);
  });

  it("sem instalador configurado, CLICK_OPEN mostra modal directamente sem chamar handshake", () => {
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DOWNLOAD_BASE = "";
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DOWNLOAD_MAC_FILE = "ChefIApp.dmg";
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE = "ChefIApp.exe";

    render(<ModulesPage />);
    fireEvent.click(screen.getByTestId("primary-tpv"));

    // Não deve chamar handshake — mostra modal directamente.
    expect(launchDesktopWithHandshakeMock).not.toHaveBeenCalled();
  });
});
