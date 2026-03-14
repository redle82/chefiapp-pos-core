/**
 * @vitest-environment jsdom
 *
 * Verifica comportamento contextual de /admin/devices com ?type=
 */

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { Terminal } from "./api/devicesApi";
import { AdminDevicesPage } from "./AdminDevicesPage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("../../../context/RestaurantRuntimeContext", () => ({
  useRestaurantRuntime: () => ({
    runtime: {
      restaurant_id: "rest-ctx-1",
    },
  }),
}));

const fetchTerminalsMock = vi.fn<[], Promise<Terminal[]>>();

vi.mock("./api/devicesApi", () => ({
  fetchTerminals: () => fetchTerminalsMock(),
  revokeTerminal: vi.fn().mockResolvedValue(undefined),
  createInstallToken: vi.fn().mockResolvedValue({
    token: "TKN_TEST",
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  }),
}));

vi.mock("../dashboard/components/AdminPageHeader", () => ({
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

describe("AdminDevicesPage contextual filtering", () => {
  it("quando type=TPV, pré-seleciona TPV e filtra tabela só para terminais TPV", async () => {
    fetchTerminalsMock.mockResolvedValueOnce([
      {
        id: "t-tpv-1",
        restaurant_id: "rest-ctx-1",
        type: "TPV",
        name: "TPV_CAIXA_01",
        registered_at: "2024-01-01T00:00:00.000Z",
        last_heartbeat_at: null,
        last_seen_at: null,
        status: "active",
        metadata: {},
      },
      {
        id: "t-app-1",
        restaurant_id: "rest-ctx-1",
        type: "APPSTAFF",
        name: "STAFF_IPHONE_01",
        registered_at: "2024-01-02T00:00:00.000Z",
        last_heartbeat_at: null,
        last_seen_at: null,
        status: "active",
        metadata: {},
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/admin/devices?type=TPV"]}>
        <AdminDevicesPage />
      </MemoryRouter>,
    );

    // Select "Tipo" principal (QR de instalação) deve vir pré-preenchido com TPV
    const tipoSelects = await screen.findAllByLabelText("Tipo");
    const tipoSelect = tipoSelects[0] as HTMLSelectElement;
    expect(tipoSelect.value).toBe("TPV");

    // Tabela deve mostrar apenas o terminal TPV
    await waitFor(() => {
      expect(screen.getByText("TPV_CAIXA_01")).toBeTruthy();
    });
    expect(screen.queryByText("STAFF_IPHONE_01")).toBeNull();
  });
});

