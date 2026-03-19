import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TPVHeader } from "./TPVHeader";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "header.searchPlaceholder": "Pesquisar produto por nome, categoria ou SKU",
        "header.clearSearch": "Limpar",
      };
      return map[key] ?? key;
    },
    i18n: { language: "pt-BR", changeLanguage: vi.fn() },
  }),
}));

vi.mock("../../../core/identity/useRestaurantIdentity", () => ({
  useRestaurantIdentity: () => ({
    identity: {
      name: "Restaurante",
      logoUrl: null,
    },
  }),
}));

vi.mock("../../../context/RestaurantRuntimeContext", () => ({
  useRestaurantRuntime: () => ({
    runtime: {
      productMode: "trial",
      coreMode: "online",
    },
  }),
}));

function renderHeader(overrides: { hideSearch?: boolean } = {}) {
  const onSearchChange = vi.fn();

  render(
    <TPVHeader
      searchQuery="pizza"
      onSearchChange={onSearchChange}
      staffName="Garçom"
      staffId="1"
      hideSearch={overrides.hideSearch}
    />,
  );

  return { onSearchChange };
}

describe("TPVHeader", () => {
  it("renders restaurant and staff identity", () => {
    renderHeader();

    expect(screen.getByText("Restaurante")).toBeTruthy();
    expect(screen.getByText("Garçom")).toBeTruthy();
  });

  it("shows search bar by default and handles clear", () => {
    const { onSearchChange } = renderHeader();

    expect(screen.getByTitle("Limpar")).toBeTruthy();
    fireEvent.click(screen.getByTitle("Limpar"));
    expect(onSearchChange).toHaveBeenCalledWith("");
  });

  it("hides search bar when hideSearch is true", () => {
    renderHeader({ hideSearch: true });

    expect(screen.queryByTitle("Limpar")).toBeNull();
  });

  it("shows TRIAL mode badge when productMode is trial", () => {
    renderHeader();
    const badge = screen.getByTestId("tpv-mode-badge");
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe("TRIAL");
  });

  it("shows Core status dot with tooltip", () => {
    renderHeader();
    const dot = screen.getByTestId("tpv-core-status");
    expect(dot).toBeTruthy();
    expect(dot.getAttribute("title")).toBe("Core online");
  });
});
