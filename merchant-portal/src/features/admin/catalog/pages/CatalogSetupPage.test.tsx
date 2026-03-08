/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setCatalogFeatureFlagsForTests } from "../../../../core/catalog/catalogFeatureFlags";
import { CatalogSetupPage } from "./CatalogSetupPage";

vi.mock("../components/CatalogLayout", () => ({
  CatalogLayout: ({
    title,
    description,
    children,
  }: {
    title: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <section>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {children}
    </section>
  ),
}));

vi.mock("../../../../context/RestaurantRuntimeContext", () => ({
  useRestaurantRuntime: () => ({
    runtime: {
      restaurant_id: "rest-test-1",
    },
  }),
}));

describe("CatalogSetupPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setCatalogFeatureFlagsForTests({
      menuV2Shell: true,
      menuV2QuickBuild: true,
      menuV2CatalogModel: false,
      menuV2Publication: false,
      menuV2Quality: false,
      menuV2ImportAI: false,
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders quick build wizard and advances between steps", () => {
    render(
      <MemoryRouter>
        <CatalogSetupPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Passo 1 de 4")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("Passo 2 de 4")).toBeTruthy();
  });

  it("persists setup draft values by restaurant", () => {
    const { unmount } = render(
      <MemoryRouter>
        <CatalogSetupPage />
      </MemoryRouter>,
    );

    const countryInput = screen.getByLabelText("Pais") as HTMLInputElement;
    fireEvent.change(countryInput, { target: { value: "PT" } });

    unmount();

    render(
      <MemoryRouter>
        <CatalogSetupPage />
      </MemoryRouter>,
    );

    expect((screen.getByLabelText("Pais") as HTMLInputElement).value).toBe(
      "PT",
    );
  });

  it("falls back to legacy guidance when quick build flag is disabled", () => {
    setCatalogFeatureFlagsForTests({ menuV2QuickBuild: false });

    render(
      <MemoryRouter>
        <CatalogSetupPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Quick Build desativado por feature flag."),
    ).toBeTruthy();
    expect(screen.getByText("Ir para produtos"));
  });
});
