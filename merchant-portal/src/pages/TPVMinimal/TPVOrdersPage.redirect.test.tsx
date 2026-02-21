import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { TPVOrdersPage } from "./TPVOrdersPage";

vi.mock("../../infra/readers/OrderReader", () => ({
  readActiveOrders: vi.fn().mockResolvedValue([]),
  readOrderItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../core/infra/CoreOrdersApi", () => ({
  updateOrderStatus: vi.fn().mockResolvedValue(undefined),
}));

describe("TPVOrdersPage", () => {
  it("redirects to kitchen view", () => {
    render(
      <MemoryRouter initialEntries={["/op/tpv/orders"]}>
        <Routes>
          <Route path="/op/tpv/orders" element={<TPVOrdersPage />} />
          <Route path="/op/tpv/kitchen" element={<div>Cozinha</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Cozinha")).toBeTruthy();
  });
});
