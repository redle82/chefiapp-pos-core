/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CatalogQualityPage } from "./CatalogQualityPage";

const listQualityIssuesMock = vi.fn();

vi.mock("../../../../core/catalog/catalogApi", () => ({
  listQualityIssues: (...args: unknown[]) => listQualityIssuesMock(...args),
}));

vi.mock("../../../../context/RestaurantRuntimeContext", () => ({
  useRestaurantRuntime: () => ({
    runtime: {
      restaurant_id: "rest-quality-1",
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

describe("CatalogQualityPage", () => {
  it("renders quality diagnostics loaded from api", async () => {
    listQualityIssuesMock.mockResolvedValueOnce([
      {
        id: "q1",
        ruleCode: "MISSING_CATEGORY",
        severity: "critical",
        message: "Produto sem categoria",
        sourceRef: {
          entity: "CatalogProduct",
          id: "p1",
        },
      },
      {
        id: "q2",
        ruleCode: "MISSING_PRICE",
        severity: "critical",
        message: "Produto sem preco",
        sourceRef: {
          entity: "CatalogProduct",
          id: "p2",
        },
      },
    ]);

    render(
      <MemoryRouter>
        <CatalogQualityPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Produto sem categoria")).toBeTruthy();
    expect(screen.getByText("2 alertas identificados")).toBeTruthy();
  });
});
