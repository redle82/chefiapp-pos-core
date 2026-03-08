/**
 * @vitest-environment jsdom
 */

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CoreOperationalRoutesFragment } from "./CoreOperationalRoutes";

vi.mock("../../components/operational/RequireOperational", () => ({
  RequireOperational: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("../../ui/design-system/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../../pages/RunbookCorePage", () => ({
  RunbookCorePage: () => <div>runbook-core-page</div>,
}));

vi.mock("../../pages/MenuBuilder/MenuBuilderMinimal", () => ({
  MenuBuilderMinimal: () => <div>menu-builder-minimal</div>,
}));

vi.mock("../../pages/Operacao/OperacaoMinimal", () => ({
  OperacaoMinimal: () => <div>operacao-minimal</div>,
}));

vi.mock("../../pages/InventoryStock/InventoryStockMinimal", () => ({
  InventoryStockMinimal: () => <div>inventory-stock-minimal</div>,
}));

vi.mock("../../pages/TaskSystem/TaskSystemMinimal", () => ({
  TaskSystemMinimal: () => <div>task-system-minimal</div>,
}));

vi.mock("../../pages/ShoppingList/ShoppingListMinimal", () => ({
  ShoppingListMinimal: () => <div>shopping-list-minimal</div>,
}));

vi.mock("../../pages/DebugTPV", () => ({
  DebugTPV: () => <div>debug-tpv-page</div>,
}));

describe("CoreOperationalRoutesFragment", () => {
  it("renders the runbook core route", () => {
    render(
      <MemoryRouter initialEntries={["/app/runbook-core"]}>
        <Routes>{CoreOperationalRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("runbook-core-page")).toBeTruthy();
  });

  it("renders the operacao route", () => {
    render(
      <MemoryRouter initialEntries={["/operacao"]}>
        <Routes>{CoreOperationalRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("operacao-minimal")).toBeTruthy();
  });

  it("renders the tpv debug route behind the operational guard", () => {
    render(
      <MemoryRouter initialEntries={["/tpv-test"]}>
        <Routes>{CoreOperationalRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("debug-tpv-page")).toBeTruthy();
  });

  it("renders the inventory stock route", () => {
    render(
      <MemoryRouter initialEntries={["/inventory-stock"]}>
        <Routes>{CoreOperationalRoutesFragment}</Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("inventory-stock-minimal")).toBeTruthy();
  });
});
