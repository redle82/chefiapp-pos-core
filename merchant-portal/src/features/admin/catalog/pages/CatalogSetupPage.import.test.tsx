/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CatalogSetupPage } from "./CatalogSetupPage";

const createImportJobMock = vi.fn();

vi.mock("../../../../core/catalog/catalogApi", () => ({
  createImportJob: (...args: unknown[]) => createImportJobMock(...args),
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

vi.mock("../../../../context/RestaurantRuntimeContext", () => ({
  useRestaurantRuntime: () => ({
    runtime: {
      restaurant_id: "rest-import-1",
    },
  }),
}));

describe("CatalogSetupPage import flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    createImportJobMock.mockResolvedValue({ id: "import-job-1" });
  });

  it("creates import draft job when import mode is selected", async () => {
    render(
      <MemoryRouter>
        <CatalogSetupPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    fireEvent.change(screen.getByLabelText("Modo de importacao"), {
      target: { value: "photo" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Criar rascunho de importacao" }),
    );

    expect(
      await screen.findByText(/Rascunho de importacao criado:/),
    ).toBeTruthy();
  });
});
