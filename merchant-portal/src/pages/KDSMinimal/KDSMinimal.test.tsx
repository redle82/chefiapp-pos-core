/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { KDSMinimal } from "./KDSMinimal";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      const translations: Record<string, string> = {
        tabAll: "Todas",
        tabKitchen: "Cozinha",
        tabBar: "Bar",
        pageTitle: "Restaurante Teste — KDS"
      };
      return translations[key] || opts?.defaultValue || key;
    },
  }),
}));

vi.mock("../../context/RestaurantRuntimeContext", () => ({
  useRestaurantRuntime: () => ({
    runtime: {
      restaurant_id: "00000000-0000-0000-0000-000000000100",
      coreReachable: true,
      loading: false,
    },
  }),
}));

vi.mock("../../core/identity/useRestaurantIdentity", () => ({
  useRestaurantIdentity: () => ({
    identity: {
      id: "rest-1",
      name: "Restaurante Teste",
      logoUrl: null,
      loading: false,
    },
  }),
}));

vi.mock("../../core/readiness", () => ({
  useOperationalReadiness: () => ({
    loading: false,
    ready: true,
    uiDirective: null,
    blockingReason: null,
    redirectTo: null,
  }),
  useDeviceGate: () => ({ loading: false, allowed: true, reason: null }),
  BlockingScreen: () => null,
  DeviceBlockedScreen: () => null,
}));

vi.mock("../../context/GlobalUIStateContext", () => ({
  useGlobalUIState: () => ({
    isLoading: false,
    isError: false,
    isEmpty: false,
    errorMessage: null,
    setScreenLoading: () => {},
    setScreenError: () => {},
    setScreenEmpty: () => {},
  }),
}));

vi.mock("../../hooks/useBootstrapState", () => ({
  useBootstrapState: () => ({
    isBootstrapComplete: true,
    coreStatus: "online",
    operationMode: "operacao-real",
  }),
}));

vi.mock("../../core/shift/ShiftContext", () => ({
  useShift: () => ({
    refreshShiftStatus: () => {},
  }),
}));

vi.mock("../../infra/readers/OrderReader", () => ({
  readActiveOrders: vi.fn().mockResolvedValue([]),
  readOrderItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../infra/readers/TaskReader", () => ({
  readOpenTasks: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../infra/writers/OrderWriter", () => ({
  markItemReady: vi.fn(),
}));

vi.mock("../../core/storage/installedDeviceStorage", () => ({
  getInstalledDevice: () => null,
  getKdsRestaurantId: () => null,
}));

vi.mock("../../core/storage/TabIsolatedStorage", () => ({
  getTabIsolated: () => null,
}));

vi.mock("../../core/infra/backendAdapter", () => ({
  isDockerBackend: () => true,
}));

vi.mock("../../core/operational/platformDetection", () => ({
  isElectron: () => true,
}));

vi.mock("../../features/kds-desktop/kdsPanelProfiles", async () => {
  const actual = (await import(
    "../../features/kds-desktop/kdsPanelProfiles"
  )) as unknown as typeof import("../../features/kds-desktop/kdsPanelProfiles");
  return actual;
});

describe("KDSMinimal - multi painéis", () => {
  it("aplica identidade do restaurante no titulo da janela", async () => {
    render(
      <MemoryRouter initialEntries={["/op/kds?panel=kitchen"]}>
        <KDSMinimal />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(document.title).toBe("Restaurante Teste — KDS");
    });
  });

  it("renderiza tabs operacionais padrão", async () => {
    render(
      <MemoryRouter initialEntries={["/op/kds"]}>
        <KDSMinimal />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Todas" })).toBeTruthy();
      expect(screen.getByRole("button", { name: /Cozinha/i })).toBeTruthy();
      expect(screen.getByRole("button", { name: /Bar/i })).toBeTruthy();
    });
  });

  it("mostra título principal do KDS", async () => {
    render(
      <MemoryRouter initialEntries={["/op/kds"]}>
        <KDSMinimal />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Restaurante Teste — KDS")).toBeTruthy();
    });
  });

  it("nao mostra acao de duplicar painel em modo producao/test", async () => {
    render(
      <MemoryRouter initialEntries={["/op/kds?panel=kitchen"]}>
        <KDSMinimal />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.queryByText("DEV: Duplicar painel")).toBeNull();
    });
  });
});
