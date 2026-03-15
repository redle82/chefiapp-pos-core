/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SoftwareTpvPage } from "./SoftwareTpvPage";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "pt-BR" },
  }),
}));

vi.mock("../../../../context/RestaurantRuntimeContext", () => ({
  useRestaurantRuntime: () => ({
    runtime: { restaurant_id: "rest_123" },
  }),
}));

vi.mock("../../../../infra/docker-core/connection", () => ({
  dockerCoreClient: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                locale: "pt-PT",
                timezone: "Europe/Lisbon",
                currency: "EUR",
              },
              error: null,
            }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}));

vi.mock("../../../../core/infra/backendAdapter", () => ({
  BackendType: { docker: "docker" },
  getBackendType: () => "docker",
}));

vi.mock("../tpvPreferencesStorage", () => ({
  getTpvPreferences: () => ({ confirmOnClose: true, quickMode: true }),
  setTpvPreferences: vi.fn(),
}));

vi.mock("../../../../core/operational/openOperationalWindow", () => ({
  openTpvInNewWindow: vi.fn(),
}));

vi.mock("../../dashboard/components/AdminPageHeader", () => ({
  AdminPageHeader: ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle?: string;
  }) => (
    <header>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  ),
}));

describe("SoftwareTpvPage layout", () => {
  it("renders software setup and quick mode blocks", async () => {
    render(
      <MemoryRouter>
        <SoftwareTpvPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("softwareTpv.configCardTitle")).toBeTruthy();
    expect(screen.getByText("softwareTpv.quickModeTitle")).toBeTruthy();
    expect(screen.getByText("softwareTpv.shortcutsTitle")).toBeTruthy();
    expect(screen.getByText("softwareTpv.quickModeDesc")).toBeTruthy();
  });
});
