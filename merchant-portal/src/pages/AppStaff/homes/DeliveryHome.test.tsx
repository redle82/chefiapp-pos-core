import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { DeliveryHome } from "./DeliveryHome";

const mockedUseStaff = vi.fn();

vi.mock("../context/StaffContext", () => ({
  useStaff: () => mockedUseStaff(),
}));

describe("DeliveryHome", () => {
  it("renders a dispatch-first delivery panel", () => {
    mockedUseStaff.mockReturnValue({
      tasks: [
        {
          id: "delivery-1",
          assigneeRole: "delivery",
          type: "delivery",
          title: "Jaime L.",
          description: "Carrer de la Vénda des Poble, 9",
          status: "pending",
          priority: "urgent",
          createdAt: Date.now(),
          metadata: {
            channel: "delivery",
            distanceKm: 21.4,
            deadlineLabel: "03:34 PM",
            orderNumber: "8A762",
            amountLabel: "$45.50",
          },
        },
        {
          id: "delivery-2",
          assigneeRole: "delivery",
          type: "delivery",
          title: "Rebeca K.",
          description: "Lugar Venda de Safragell, 166",
          status: "focused",
          priority: "attention",
          createdAt: Date.now(),
          metadata: {
            channel: "delivery",
            pickupName: "Sofia GastroBar",
            pickupAddress: "Carrer des Caló, 109",
            driverName: "Gregor R.",
            driverInitials: "GR",
            started: true,
            orderNumber: "DA1DD",
            amountLabel: "$50.00",
          },
        },
      ],
      specDrifts: [],
      activeLocation: { name: "Sofia GastroBar" },
    });

    render(
      <MemoryRouter initialEntries={["/app/staff/home/delivery"]}>
        <Routes>
          <Route path="*" element={<DeliveryHome />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("tab", { name: "Painel" }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.getByText("Entregador")).toBeTruthy();
    expect(screen.getByText("Painel de despacho")).toBeTruthy();
    expect(screen.getByText("Fila crítica")).toBeTruthy();
    expect(screen.getByText("Próxima decisão")).toBeTruthy();
    expect(screen.getAllByText("Atribuir agora").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("tab", { name: "Entregas" }));
    expect(screen.getByText("Por atribuir (1)")).toBeTruthy();
    expect(screen.getAllByText("Atribuir").length).toBeGreaterThan(0);
    expect(screen.getByText("Aguardando atribuição")).toBeTruthy();
  });

  it("reads the active delivery tab from the route and updates it when tab navigation is used", () => {
    mockedUseStaff.mockReturnValue({
      tasks: [
        {
          id: "delivery-1",
          assigneeRole: "delivery",
          type: "delivery",
          title: "Jaime L.",
          description: "Carrer de la Vénda des Poble, 9",
          status: "pending",
          priority: "urgent",
          createdAt: Date.now(),
          metadata: {
            channel: "delivery",
            distanceKm: 21.4,
            deadlineLabel: "03:34 PM",
            orderNumber: "8A762",
            amountLabel: "$45.50",
          },
        },
      ],
      specDrifts: [],
      activeLocation: { name: "Sofia GastroBar" },
    });

    render(
      <MemoryRouter initialEntries={["/app/staff/home/delivery/orders"]}>
        <Routes>
          <Route path="*" element={<DeliveryHome />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen
        .getByRole("tab", { name: "Entregas" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.getByRole("tabpanel", { name: "Entregas" })).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Mapa" }));

    expect(
      screen.getByRole("tab", { name: "Mapa" }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.getByRole("tabpanel", { name: "Mapa" })).toBeTruthy();
    expect(screen.getByText("Cobertura operacional")).toBeTruthy();
  });
});
