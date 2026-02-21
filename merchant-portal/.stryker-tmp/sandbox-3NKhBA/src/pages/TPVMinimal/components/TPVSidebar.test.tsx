// @ts-nocheck
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { TPVSidebar } from "./TPVSidebar";

describe("TPVSidebar", () => {
  it("omits the orders link after consolidation", () => {
    render(
      <MemoryRouter>
        <TPVSidebar />
      </MemoryRouter>,
    );

    expect(screen.queryByTitle("Pedidos")).toBeNull();
    expect(screen.getByTitle("Cozinha")).toBeTruthy();
    expect(screen.getByTitle("Pagina Web")).toBeTruthy();
    expect(screen.getByText(/chefiapp/i)).toBeTruthy();
  });
});
