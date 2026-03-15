import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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

  it("hides Pagina Web link in desktop app (no admin surface in TPV)", () => {
    (window as Window & { electronBridge?: unknown }).electronBridge = {};
    render(
      <MemoryRouter>
        <TPVSidebar />
      </MemoryRouter>,
    );
    expect(screen.queryByTitle("Pagina Web")).toBeNull();
    expect(screen.getByTitle("Definições")).toBeTruthy();
    delete (window as Window & { electronBridge?: unknown }).electronBridge;
  });
});

afterEach(() => {
  delete (window as Window & { electronBridge?: unknown }).electronBridge;
});
