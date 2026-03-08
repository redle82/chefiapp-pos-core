/**
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModulesPage } from "./ModulesPage";

const mockNavigate = vi.fn();
const openOperationalInNewWindowMock = vi.fn();

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

vi.mock("../hooks/useDeviceInstall", () => ({
  useDeviceInstall: () => ({
    installing: null,
    error: null,
    hasLocalDevice: true,
    localDeviceModule: "tpv",
    localDeviceName: "TPV_BALCAO_01",
    canInstallPwa: false,
    triggerPwaInstall: vi.fn(),
    installDevice: vi.fn(),
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

vi.mock("../../../../core/operational/openOperationalWindow", () => ({
  openOperationalInNewWindow: (...args: unknown[]) =>
    openOperationalInNewWindowMock(...args),
}));

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
    openOperationalInNewWindowMock.mockReset();
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

  it("com dispositivo TPV vinculado, chama openOperationalInNewWindow para abrir fluxo operacional", () => {
    render(<ModulesPage />);

    fireEvent.click(screen.getByTestId("primary-tpv"));

    expect(openOperationalInNewWindowMock).toHaveBeenCalledTimes(1);
    expect(openOperationalInNewWindowMock.mock.calls[0]?.[0]).toBe("tpv");
  });

  it("com dispositivo TPV vinculado, não redireciona para /admin/devices no clique primário", () => {
    render(<ModulesPage />);
    fireEvent.click(screen.getByTestId("primary-tpv"));

    const allCalls = mockNavigate.mock.calls.map((call) => call[0]);
    expect(allCalls).not.toContain("/admin/devices?module=tpv");
  });
});
