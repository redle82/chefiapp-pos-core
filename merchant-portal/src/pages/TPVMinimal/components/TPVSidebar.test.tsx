import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TPVSidebar } from "./TPVSidebar";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "sidebar.pos": "POS",
        "sidebar.tables": "Mesas",
        "sidebar.shift": "Turno",
        "sidebar.kitchen": "Cozinha",
        "sidebar.tasks": "Tarefas",
        "sidebar.reservations": "Reservas",
        "sidebar.screens": "Telas",
        "sidebar.webPage": "Pagina Web",
        "sidebar.settings": "Definições",
        "sidebar.exitConfirmTitle": "Tem a certeza que quer sair do TPV?",
        "sidebar.exitConfirmBody": "A sessão operacional será encerrada.",
        "sidebar.exitCancel": "Cancelar",
        "sidebar.exitConfirm": "Sair",
        "sidebar.exitTooltip": "Sair do TPV",
        "sidebar.comingSoon": "Em breve",
        "sidebar.newWindow": "Nova janela",
      };
      return map[key] ?? key;
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

describe("TPVSidebar", () => {
  afterEach(() => {
    delete (window as Window & { electronBridge?: unknown }).electronBridge;
  });

  it("renders operation section nav items", () => {
    render(
      <MemoryRouter>
        <TPVSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByTitle("POS")).toBeTruthy();
    expect(screen.getByTitle("Mesas")).toBeTruthy();
    expect(screen.getByTitle("Turno")).toBeTruthy();
    expect(screen.getByTitle("Cozinha")).toBeTruthy();
    expect(screen.getByTitle("Tarefas")).toBeTruthy();
    expect(screen.getByTitle("Reservas")).toBeTruthy();
    expect(screen.getByText(/chefiapp/i)).toBeTruthy();
  });

  it("renders TELAS section with single 'Telas' NavLink to /op/tpv/screens", () => {
    render(
      <MemoryRouter>
        <TPVSidebar />
      </MemoryRouter>,
    );

    const telasLink = screen.getByTitle("Telas");
    expect(telasLink).toBeTruthy();
    expect(telasLink.getAttribute("href")).toBe("/op/tpv/screens");
  });

  it("renders Pagina Web pointing to /op/tpv/web-editor (not admin)", () => {
    render(
      <MemoryRouter>
        <TPVSidebar />
      </MemoryRouter>,
    );

    const link = screen.getByTitle("Pagina Web");
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/op/tpv/web-editor");
  });

  it("hides Pagina Web in desktop app", () => {
    (window as Window & { electronBridge?: unknown }).electronBridge = {};
    render(
      <MemoryRouter>
        <TPVSidebar />
      </MemoryRouter>,
    );
    expect(screen.queryByTitle("Pagina Web")).toBeNull();
    expect(screen.getByTitle("Definições")).toBeTruthy();
  });

  it("exit button shows confirmation modal", () => {
    render(
      <MemoryRouter>
        <TPVSidebar />
      </MemoryRouter>,
    );

    const exitBtn = screen.getByTitle("Sair do TPV");
    expect(exitBtn.tagName).toBe("BUTTON");

    fireEvent.click(exitBtn);

    expect(screen.getByText("Tem a certeza que quer sair do TPV?")).toBeTruthy();
    expect(screen.getByText("A sessão operacional será encerrada.")).toBeTruthy();
    expect(screen.getByText("Cancelar")).toBeTruthy();
    expect(screen.getByText("Sair")).toBeTruthy();
  });

  it("exit modal cancel closes the modal", () => {
    render(
      <MemoryRouter>
        <TPVSidebar />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTitle("Sair do TPV"));
    expect(screen.getByTestId("exit-modal")).toBeTruthy();

    fireEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByTestId("exit-modal")).toBeNull();
  });

  it("renders styled tooltip elements for sidebar items", () => {
    render(
      <MemoryRouter>
        <TPVSidebar />
      </MemoryRouter>,
    );

    const tooltips = screen.getAllByRole("tooltip");
    expect(tooltips.length).toBeGreaterThan(0);
    expect(tooltips[0].textContent).toBe("POS");
  });
});
