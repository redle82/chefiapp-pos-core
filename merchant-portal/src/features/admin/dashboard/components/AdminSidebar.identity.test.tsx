/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";

vi.mock("../../../../ui/design-system/sovereign/OSSignature", () => ({
  OSSignature: () => <div data-testid="os-signature">ChefIApp OS</div>,
}));

describe("AdminSidebar identity hierarchy", () => {
  it("does not render user role in the sidebar footer", () => {
    render(
      <MemoryRouter>
        <AdminSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("os-signature")).not.toBeNull();
    expect(screen.queryByText(/owner/i)).toBeNull();
    expect(screen.queryByText(/manager/i)).toBeNull();
    expect(screen.queryByText(/operador/i)).toBeNull();
  });
});

