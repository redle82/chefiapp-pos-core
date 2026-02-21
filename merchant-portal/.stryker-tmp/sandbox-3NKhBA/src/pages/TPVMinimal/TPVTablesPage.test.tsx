// @ts-nocheck
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TPVTablesPage } from "./TPVTablesPage";

const useTables = vi.fn();

vi.mock("./hooks/useTPVRestaurantId", () => ({
  useTPVRestaurantId: () => "rest-1",
}));

vi.mock("../TPV/context/TableContext", () => ({
  TableProvider: ({ children }: { children: React.ReactNode }) => children,
  useTables: () => useTables(),
}));

vi.mock("../../ui/design-system/domain/TableMapPanel", () => ({
  TableMapPanel: ({ tables }: { tables: Array<{ id: string }> }) => (
    <div data-testid="table-map">{tables.length} mesas</div>
  ),
}));

describe("TPVTablesPage", () => {
  it("renders the table map", () => {
    useTables.mockReturnValue({
      tables: [
        { id: "t-1", number: 1, status: "free", seats: 2 },
        { id: "t-2", number: 2, status: "occupied", seats: 4 },
      ],
      loading: false,
      refreshTables: vi.fn(),
      updateTableStatus: vi.fn(),
      updateTablePosition: vi.fn(),
    });

    render(<TPVTablesPage />);

    expect(screen.getByText(/Mapa de Mesas/i)).toBeTruthy();
    expect(screen.getByTestId("table-map").textContent).toContain("2");
  });
});
