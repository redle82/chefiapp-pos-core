/**
 * @vitest-environment jsdom
 *
 * Testes de fluxo desktop para /admin/modules sem depender de Electron real.
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModulesPage } from "./ModulesPage";

const mockNavigate = vi.fn();

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
      restaurant_id: "rest-1",
      installed_modules: ["tpv", "kds", "appstaff"],
      active_modules: ["tpv", "kds", "appstaff"],
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
    hasLocalDevice: false,
    localDeviceModule: null,
    localDeviceName: null,
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

// Usamos o ModuleCard real? Para estes testes basta um stub minimal.
vi.mock("../components/ModuleCard", () => ({
  ModuleCard: ({
    module,
    onPrimaryAction,
    onSecondaryAction,
    secondaryLabel,
    secondaryDisabled,
  }: {
    module: { id: string };
    onPrimaryAction: (id: string) => void;
    onSecondaryAction?: (id: string) => void;
    secondaryLabel?: string;
    secondaryDisabled?: boolean;
  }) => (
    <div>
      <button
        type="button"
        data-testid={`primary-${module.id}`}
        onClick={() => onPrimaryAction(module.id)}
      >
        primary-{module.id}
      </button>
      {secondaryLabel && onSecondaryAction && (
        <button
          type="button"
          data-testid={`secondary-${module.id}`}
          onClick={() => onSecondaryAction(module.id)}
          disabled={secondaryDisabled}
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  ),
}));

describe("ModulesPage desktop flow", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mockNavigate.mockReset();
    // Limpar envs para simular instalador não configurado
    // @ts-expect-error env is typed as readonly in Vite, but we can mutate in tests
    import.meta.env.VITE_DESKTOP_DOWNLOAD_BASE = "";
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DOWNLOAD_MAC_FILE = "ChefIApp-Desktop.dmg";
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE =
      "ChefIApp-Desktop-Setup.exe";
    // @ts-expect-error
    import.meta.env.MODE = "production";
  });

  it("quando não há dispositivo local, clicar Abrir TPV redireciona para /admin/devices com módulo", () => {
    render(<ModulesPage />);

    fireEvent.click(screen.getByTestId("primary-tpv"));

    expect(mockNavigate).toHaveBeenCalledWith("/admin/devices?module=tpv");
  });

  it("secondary TPV mantém ação de instalar dispositivo", () => {
    render(<ModulesPage />);

    const secondary = screen.getByTestId("secondary-tpv");
    expect(secondary.textContent).toBe("Instalar dispositivo");
    expect(secondary.hasAttribute("disabled")).toBe(false);

    fireEvent.click(secondary);

    expect(mockNavigate).toHaveBeenCalledWith("/admin/devices?module=tpv");
  });

  it("com release publicada, secondary TPV continua a navegar para /admin/devices com módulo", () => {
    // @ts-expect-error env is typed as readonly in Vite, but we can mutate in tests
    import.meta.env.VITE_DESKTOP_DOWNLOAD_BASE = "https://example.com/download";
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DOWNLOAD_MAC_FILE = "ChefIApp.dmg";
    // @ts-expect-error
    import.meta.env.VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE = "ChefIApp.exe";

    render(<ModulesPage />);

    fireEvent.click(screen.getByTestId("secondary-tpv"));

    const allCalls = mockNavigate.mock.calls.map((call) => call[0]);
    expect(allCalls).toContain("/admin/devices?module=tpv");
    expect(allCalls).not.toContain("/admin/desktop");
  });
});
