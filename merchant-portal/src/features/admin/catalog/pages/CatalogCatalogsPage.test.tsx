/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CatalogCatalogsPage } from "./CatalogCatalogsPage";

const listCatalogVariantsMock = vi.fn();
const saveCatalogVariantMock = vi.fn();
const savePriceOverrideMock = vi.fn();
const saveAvailabilityRuleMock = vi.fn();

vi.mock("../../../../core/catalog/catalogApi", () => ({
  listCatalogVariants: (...args: unknown[]) => listCatalogVariantsMock(...args),
  saveCatalogVariant: (...args: unknown[]) => saveCatalogVariantMock(...args),
  savePriceOverride: (...args: unknown[]) => savePriceOverrideMock(...args),
  saveAvailabilityRule: (...args: unknown[]) =>
    saveAvailabilityRuleMock(...args),
}));

vi.mock("../../../../context/RestaurantRuntimeContext", () => ({
  useRestaurantRuntime: () => ({
    runtime: {
      restaurant_id: "rest-catalogs-1",
    },
  }),
}));

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

describe("CatalogCatalogsPage", () => {
  it("renders variants and allows creating a derived variant", async () => {
    listCatalogVariantsMock.mockResolvedValue([
      {
        id: "var-1",
        baseCatalogId: "base-1",
        name: "Sofia / QR",
        brandId: "brand-sofia",
        channel: "LOCAL",
        platform: "SHOP",
        inherited: true,
        overridesCount: 1,
      },
    ]);

    saveCatalogVariantMock.mockResolvedValue({
      id: "var-2",
      baseCatalogId: "base-1",
      name: "Nova variante",
      brandId: null,
      channel: "LOCAL",
      platform: undefined,
      inherited: true,
      overridesCount: 0,
    });

    savePriceOverrideMock.mockResolvedValue({
      id: "po-1",
      libraryItemId: "product:p-seed",
      catalogVariantId: "var-1",
      currency: "EUR",
      priceCents: 420,
      reason: "Teste",
    });

    saveAvailabilityRuleMock.mockResolvedValue({
      id: "ar-1",
      libraryItemId: "product:p-seed",
      catalogVariantId: "var-1",
      schedule: "Mon-Sun 10:00-23:00",
      channelConstraints: ["LOCAL"],
      visibility: "visible",
    });

    render(
      <MemoryRouter>
        <CatalogCatalogsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Sofia / QR")).toBeTruthy();
    expect(screen.getByText("1 variantes configuradas")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Criar variante" }));

    expect(await screen.findByText("Nova variante")).toBeTruthy();

    expect(saveCatalogVariantMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Nova variante",
      }),
      "rest-catalogs-1",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Override preco var-1" }),
    );

    expect(
      await screen.findByText("Override criado para Sofia / QR."),
    ).toBeTruthy();

    expect(savePriceOverrideMock).toHaveBeenCalledWith(
      expect.objectContaining({
        catalogVariantId: "var-1",
      }),
      "rest-catalogs-1",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Regra disponibilidade var-1" }),
    );

    expect(
      await screen.findByText(
        "Regra de disponibilidade criada para Sofia / QR.",
      ),
    ).toBeTruthy();

    expect(saveAvailabilityRuleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        catalogVariantId: "var-1",
      }),
      "rest-catalogs-1",
    );
  });
});
