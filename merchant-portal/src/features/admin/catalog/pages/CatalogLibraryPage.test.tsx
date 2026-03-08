/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CatalogLibraryPage } from "./CatalogLibraryPage";

const listLibraryItemsMock = vi.fn();

vi.mock("../../../../core/catalog/catalogApi", () => ({
  listLibraryItems: (...args: unknown[]) => listLibraryItemsMock(...args),
}));

vi.mock("../../../../context/RestaurantRuntimeContext", () => ({
  useRestaurantRuntime: () => ({
    runtime: {
      restaurant_id: "rest-library-1",
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

describe("CatalogLibraryPage", () => {
  it("renders library items loaded from ACL api", async () => {
    listLibraryItemsMock.mockResolvedValueOnce([
      {
        id: "category:c1",
        type: "category",
        canonicalName: "Bebidas",
        localizedNames: {},
        baseDescription: null,
        taxCategory: null,
        baseMetadata: {},
        status: "active",
        sourceRef: { entity: "ProductCategory", id: "c1" },
      },
      {
        id: "product:p1",
        type: "product",
        canonicalName: "Cafe solo",
        localizedNames: {},
        baseDescription: null,
        taxCategory: null,
        baseMetadata: {},
        status: "active",
        sourceRef: { entity: "CatalogProduct", id: "p1" },
      },
    ]);

    render(
      <MemoryRouter>
        <CatalogLibraryPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Cafe solo")).toBeTruthy();
    expect(screen.getByText("Bebidas")).toBeTruthy();
    expect(screen.getByText("2 itens na biblioteca"));
  });
});
