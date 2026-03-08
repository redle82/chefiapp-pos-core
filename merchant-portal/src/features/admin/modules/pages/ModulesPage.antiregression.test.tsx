/**
 * @vitest-environment jsdom
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as fs from "node:fs";
import * as path from "node:path";
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
      installed_modules: ["tpv", "appstaff", "stock"],
      active_modules: ["tpv", "appstaff", "stock"],
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

vi.mock("../../../../core/operational/openOperationalWindow", () => ({
  openOperationalInNewWindow: (...args: unknown[]) =>
    openOperationalInNewWindowMock(...args),
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
    {
      id: "appstaff",
      name: "AppStaff",
      description: "desc",
      icon: "📱",
      block: "essenciais",
      status: "active",
      primaryAction: "Abrir",
      secondaryAction: "Desactivar",
    },
    {
      id: "stock",
      name: "Stock",
      description: "desc",
      icon: "📦",
      block: "canais",
      status: "active",
      primaryAction: "Abrir",
      secondaryAction: "Desactivar",
    },
  ],
}));

vi.mock("../../dashboard/components/AdminPageHeader", () => ({
  AdminPageHeader: ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle: string;
  }) => (
    <header>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  ),
}));

vi.mock("../components/ModuleCard", () => ({
  ModuleCard: ({
    module,
    onPrimaryAction,
    onSecondaryAction,
    secondaryLabel,
    secondaryDisabled,
    secondaryTooltip,
  }: {
    module: { id: string };
    onPrimaryAction: (id: string) => void;
    onSecondaryAction?: (id: string) => void;
    secondaryLabel?: string;
    secondaryDisabled?: boolean;
    secondaryTooltip?: string;
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
          title={secondaryTooltip}
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  ),
}));

describe("ModulesPage anti-regression", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mockNavigate.mockReset();
    openOperationalInNewWindowMock.mockReset();
    // @ts-expect-error tests can mutate env
    import.meta.env.MODE = "production";
    // @ts-expect-error tests can mutate env
    import.meta.env.VITE_DESKTOP_DOWNLOAD_BASE = "";
    // @ts-expect-error tests can mutate env
    import.meta.env.VITE_DESKTOP_DOWNLOAD_MAC_FILE = "ChefIApp-Desktop.dmg";
    // @ts-expect-error tests can mutate env
    import.meta.env.VITE_DESKTOP_DOWNLOAD_WINDOWS_FILE =
      "ChefIApp-Desktop-Setup.exe";
  });

  it("routes AppStaff primary action to canonical web path", () => {
    render(<ModulesPage />);

    fireEvent.click(screen.getByTestId("primary-appstaff"));

    expect(openOperationalInNewWindowMock).toHaveBeenCalledTimes(1);
    expect(openOperationalInNewWindowMock.mock.calls[0]?.[0]).toBe("appstaff");
  });

  it("does not render secondary action for AppStaff", () => {
    render(<ModulesPage />);

    expect(screen.queryByTestId("secondary-appstaff")).toBeNull();
  });

  it("without published release, TPV secondary keeps device install action", () => {
    render(<ModulesPage />);

    const tpvSecondary = screen.getByTestId("secondary-tpv");
    expect(tpvSecondary.textContent).toBe("Instalar dispositivo");
    expect(tpvSecondary.hasAttribute("disabled")).toBe(false);
    expect(screen.queryByText("modulesPage.viewDesktopPage")).toBeNull();
  });

  it("without published release, TPV secondary routes to devices with module filter", () => {
    render(<ModulesPage />);

    fireEvent.click(screen.getByTestId("secondary-tpv"));

    expect(mockNavigate).toHaveBeenCalledWith("/admin/devices?module=tpv");
  });

  it("with published release, TPV secondary still routes to devices with module filter", () => {
    // @ts-expect-error tests can mutate env
    import.meta.env.VITE_DESKTOP_DOWNLOAD_BASE =
      "https://github.com/goldmonkey777/ChefIApp-POS-CORE/releases/latest/download";

    render(<ModulesPage />);

    const tpvSecondary = screen.getByTestId("secondary-tpv");
    expect(tpvSecondary.textContent).toBe("Instalar dispositivo");
    expect(tpvSecondary.hasAttribute("disabled")).toBe(false);
    expect(screen.queryByText("modulesPage.viewDesktopPage")).toBeNull();

    fireEvent.click(tpvSecondary);

    const allCalls = mockNavigate.mock.calls.map((call) => call[0]);
    expect(allCalls).toContain("/admin/devices?module=tpv");
    expect(allCalls).not.toContain("/admin/desktop");
  });

  it("keeps non-operational modules on their canonical primary path", () => {
    render(<ModulesPage />);

    fireEvent.click(screen.getByTestId("primary-stock"));

    expect(mockNavigate).toHaveBeenCalledWith("/inventory-stock");
  });

  it("keeps core module behavior dependencies in ModulesPage source", () => {
    const sourcePath = path.resolve(__dirname, "ModulesPage.tsx");
    const source = fs.readFileSync(sourcePath, "utf8");

    expect(source).not.toContain("DeviceInstallDialog");
    expect(source).toContain("useDeviceInstall");
    expect(source).toContain("openOperationalInNewWindow");
    expect(source).not.toContain("wouldGuardAllow");
    expect(source).toContain("Instalar dispositivo");
  });

  it("manifest files exist for web/PWA assets", () => {
    const projectRoot = path.resolve(__dirname, "../../../../..");
    const workspaceRoot = path.resolve(projectRoot, "..");
    const candidates = [
      path.join(projectRoot, "manifest.json"),
      path.join(projectRoot, "manifest.webmanifest"),
      path.join(projectRoot, "public", "manifest.json"),
      path.join(workspaceRoot, "public", "app", "manifest.json"),
      path.join(workspaceRoot, "public", "app", "manifest.webmanifest"),
    ];
    for (const filePath of candidates) {
      expect(
        fs.existsSync(filePath),
        `manifest file should exist: ${filePath}`,
      ).toBe(true);
    }
  });

  it("ModulesPage source does not reference PWA install code", () => {
    const sourcePath = path.resolve(__dirname, "ModulesPage.tsx");
    const source = fs.readFileSync(sourcePath, "utf8");

    expect(source).not.toContain("canInstallPwa");
    expect(source).not.toContain("triggerPwaInstall");
    expect(source).not.toContain("beforeinstallprompt");
  });
});
