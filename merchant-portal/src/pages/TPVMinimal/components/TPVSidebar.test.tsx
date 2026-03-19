import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TPVSidebar } from "./TPVSidebar";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const map: Record<string, string> = {
        "sidebar.pos": "POS",
        "sidebar.tables": "Mesas",
        "sidebar.shift": "Turno",
        "sidebar.kitchen": "Cozinha",
        "sidebar.tasks": "Tarefas",
        "sidebar.reservations": "Reservas",
        "sidebar.delivery": "Delivery",
        "sidebar.screens": "Telas",
        "sidebar.printers": "Impressoras",
        "sidebar.settings": "Definicoes",
        "sidebar.sectionOperacao": "OPERACAO",
        "sidebar.sectionTelas": "TELAS",
        "sidebar.sectionSistema": "SISTEMA",
        "sidebar.exitConfirmTitle": "Tem a certeza que quer sair do TPV?",
        "sidebar.exitConfirmBody": "A sessao operacional sera encerrada.",
        "sidebar.exitCancel": "Cancelar",
        "sidebar.exitConfirm": "Sair",
        "sidebar.exitTooltip": "Sair do TPV",
        "sidebar.collapse": "Recolher",
        "sidebar.expand": "Expandir",
        "sidebar.restaurantName": "Restaurante",
      };
      return map[key] ?? fallback ?? key;
    },
    i18n: { language: "pt-BR", changeLanguage: vi.fn() },
  }),
}));

vi.mock("../../../infra/docker-core/connection", () => ({
  dockerCoreClient: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ count: 0, error: null }),
        }),
      }),
    }),
  },
}));

vi.mock("../hooks/useTPVRestaurantId", () => ({
  useTPVRestaurantId: () => "test-restaurant-id",
}));

function renderSidebar() {
  return render(
    <MemoryRouter>
      <TPVSidebar />
    </MemoryRouter>,
  );
}

describe("TPVSidebar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders operation section nav items", () => {
    renderSidebar();

    expect(screen.getByTitle("POS")).toBeTruthy();
    expect(screen.getByTitle("Mesas")).toBeTruthy();
    expect(screen.getByTitle("Turno")).toBeTruthy();
    expect(screen.getByTitle("Cozinha")).toBeTruthy();
    expect(screen.getByTitle("Tarefas")).toBeTruthy();
    expect(screen.getByTitle("Reservas")).toBeTruthy();
    expect(screen.getByTitle("Delivery")).toBeTruthy();
    expect(screen.getByText(/chefiapp/i)).toBeTruthy();
  });

  it("renders TELAS section with Telas NavLink to /op/tpv/screens", () => {
    renderSidebar();

    const telasLink = screen.getByTitle("Telas");
    expect(telasLink).toBeTruthy();
    expect(telasLink.getAttribute("href")).toBe("/op/tpv/screens");
  });

  it("renders SISTEMA section items", () => {
    renderSidebar();

    const printersLink = screen.getByTitle("Impressoras");
    expect(printersLink).toBeTruthy();
    expect(printersLink.getAttribute("href")).toBe("/op/tpv/printers");

    const settingsLink = screen.getByTitle("Definicoes");
    expect(settingsLink).toBeTruthy();
    expect(settingsLink.getAttribute("href")).toBe("/op/tpv/settings");
  });

  it("renders delivery nav item pointing to /op/tpv/delivery", () => {
    renderSidebar();

    const link = screen.getByTitle("Delivery");
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/op/tpv/delivery");
  });

  it("exit button shows confirmation modal", () => {
    renderSidebar();

    const exitBtn = screen.getByTitle("Sair do TPV");
    expect(exitBtn.tagName).toBe("BUTTON");

    fireEvent.click(exitBtn);

    expect(screen.getByText("Tem a certeza que quer sair do TPV?")).toBeTruthy();
    expect(screen.getByText("A sessao operacional sera encerrada.")).toBeTruthy();
    expect(screen.getByText("Cancelar")).toBeTruthy();
    expect(screen.getByText("Sair")).toBeTruthy();
  });

  it("exit modal cancel closes the modal", () => {
    renderSidebar();

    fireEvent.click(screen.getByTitle("Sair do TPV"));
    expect(screen.getByTestId("exit-modal")).toBeTruthy();

    fireEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByTestId("exit-modal")).toBeNull();
  });

  it("renders styled tooltip elements for sidebar items", () => {
    renderSidebar();

    const tooltips = screen.getAllByRole("tooltip");
    expect(tooltips.length).toBeGreaterThan(0);
    expect(tooltips[0].textContent).toBe("POS");
  });

  it("renders section dividers between sections", () => {
    renderSidebar();

    const dividers = screen.getAllByTestId("section-divider");
    // 1 after restaurant identity + 2 between 3 sections = 3 total
    expect(dividers.length).toBe(3);
  });

  it("starts in compact mode by default", () => {
    renderSidebar();

    const sidebar = screen.getByTestId("tpv-sidebar");
    expect(sidebar.style.width).toBe("72px");
  });

  it("toggle button expands the sidebar", () => {
    renderSidebar();

    const toggleBtn = screen.getByTestId("sidebar-toggle");
    fireEvent.click(toggleBtn);

    const sidebar = screen.getByTestId("tpv-sidebar");
    expect(sidebar.style.width).toBe("220px");
  });

  it("shows section headers when expanded", () => {
    renderSidebar();

    // No headers in compact mode
    expect(screen.queryAllByTestId("section-header").length).toBe(0);

    // Expand
    fireEvent.click(screen.getByTestId("sidebar-toggle"));

    const headers = screen.getAllByTestId("section-header");
    expect(headers.length).toBe(3);
    expect(headers[0].textContent).toBe("OPERACAO");
    expect(headers[1].textContent).toBe("TELAS");
    expect(headers[2].textContent).toBe("SISTEMA");
  });

  it("persists expanded state to localStorage", () => {
    renderSidebar();

    fireEvent.click(screen.getByTestId("sidebar-toggle"));
    expect(localStorage.getItem("tpv_sidebar_expanded")).toBe("true");

    fireEvent.click(screen.getByTestId("sidebar-toggle"));
    expect(localStorage.getItem("tpv_sidebar_expanded")).toBe("false");
  });

  it("restores expanded state from localStorage", () => {
    localStorage.setItem("tpv_sidebar_expanded", "true");
    renderSidebar();

    const sidebar = screen.getByTestId("tpv-sidebar");
    expect(sidebar.style.width).toBe("220px");
  });

  it("shows restaurant identity section", () => {
    renderSidebar();

    const restaurantLogo = screen.getByAltText("Restaurant");
    expect(restaurantLogo).toBeTruthy();
    expect(restaurantLogo.getAttribute("width")).toBe("36");
  });

  it("shows restaurant name when expanded", () => {
    localStorage.setItem("tpv_sidebar_expanded", "true");
    renderSidebar();

    expect(screen.getByText("Restaurante")).toBeTruthy();
  });
});
