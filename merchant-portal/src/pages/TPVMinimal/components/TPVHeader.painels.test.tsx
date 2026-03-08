import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TPVHeader } from "./TPVHeader";

vi.mock("../../../core/identity/useRestaurantIdentity", () => ({
  useRestaurantIdentity: () => ({
    identity: {
      name: "Restaurante",
      logoUrl: null,
    },
  }),
}));

function renderHeader() {
  const onSearchChange = vi.fn();
  const onFilterClick = vi.fn();

  render(
    <TPVHeader
      searchQuery="pizza"
      onSearchChange={onSearchChange}
      onFilterClick={onFilterClick}
      staffName="Operador"
      staffId="1"
    />,
  );

  return { onSearchChange, onFilterClick };
}

describe("TPVHeader", () => {
  it("renders restaurant, staff and filter controls", () => {
    renderHeader();

    expect(screen.getByText("Restaurante")).toBeTruthy();
    expect(screen.getByText("Operador")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Filter" })).toBeTruthy();
  });

  it("calls handlers for search clear and filter click", () => {
    const { onSearchChange, onFilterClick } = renderHeader();

    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    expect(onFilterClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTitle("Limpar"));
    expect(onSearchChange).toHaveBeenCalledWith("");
  });
});
