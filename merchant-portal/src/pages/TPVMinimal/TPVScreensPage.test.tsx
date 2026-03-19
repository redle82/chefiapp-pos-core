import { fireEvent, render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { TPVScreensPage } from "./TPVScreensPage";

// ── i18n mock: return pt-PT translations for tpv.screens.* ──────────────
const PT_SCREENS: Record<string, string> = {
  "screens.title": "Telas Operacionais",
  "screens.subtitle": "Crie e gira ecrãs externos do restaurante — KDS, tarefas, display e página web.",
  "screens.createNew": "Criar nova tela",
  "screens.activeScreens": "Telas ativas",
  "screens.instanceSummary": "Resumo de instâncias",
  "screens.noActiveScreens": "Nenhuma tela ativa. Crie uma tela acima para começar.",
  "screens.noRunningScreens": "Nenhuma tela em execução. Crie uma tela acima para começar a monitorizar.",
  "screens.comingSoon": "Em breve",
  "screens.nameLabel": "Nome:",
  "screens.open": "Abrir",
  "screens.cancel": "Cancelar",
  "screens.focus": "Focar",
  "screens.copyLink": "Copiar link",
  "screens.close": "Fechar",
  "screens.remove": "Remover",
  "screens.closed": "Fechada",
  "screens.openedNow": "Aberta agora",
  "screens.openedMinutes": "Aberta há {{mins}} min",
  "screens.openedHours": "Aberta há {{h}}h{{m}}m",
  "screens.linkCopiedTitle": "Link copiado",
  "screens.linkCopiedDescription": "O link da tela foi copiado para a área de transferência.",
  "screens.suffixMain": "Principal",
  "screens.suffixOperation": "Operação",
  "screens.suffixEditor": "Editor",
  "screens.badgeKDS": "KDS",
  "screens.badgeTasks": "TAREFAS",
  "screens.badgeWeb": "WEB",
  "screens.types.KDS_KITCHEN.label": "Cozinha KDS",
  "screens.types.KDS_KITCHEN.description": "Ecrã dedicado de execução para a cozinha. Sem navegação TPV.",
  "screens.types.KDS_BAR.label": "Bar KDS",
  "screens.types.KDS_BAR.description": "Ecrã dedicado de execução para o bar. Sem navegação TPV.",
  "screens.types.KDS_EXPO.label": "Expo",
  "screens.types.KDS_EXPO.description": "Ecrã de expedição — conferência antes de servir.",
  "screens.types.CUSTOMER_DISPLAY.label": "Display Cliente",
  "screens.types.CUSTOMER_DISPLAY.description": "Ecrã virado para o cliente. Sem controlos operacionais.",
  "screens.types.DELIVERY.label": "Tela Delivery",
  "screens.types.DELIVERY.description": "Gestão de entregas e estado dos pedidos em trânsito.",
  "screens.types.TASKS.label": "Tarefas",
  "screens.types.TASKS.description": "Lista de tarefas operacionais do turno.",
  "screens.types.WEB_EDITOR.label": "Página Web",
  "screens.types.WEB_EDITOR.description": "Editor rápido da página pública do restaurante.",
  // common namespace keys
  "common:close": "Fechar",
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOpts?: string | Record<string, unknown>) => {
      const template = PT_SCREENS[key];
      if (!template) {
        // Return fallback string if provided as 2nd arg, else the key itself
        return typeof fallbackOrOpts === "string" ? fallbackOrOpts : key;
      }
      // Handle {{variable}} interpolation
      if (typeof fallbackOrOpts === "object" && fallbackOrOpts !== null) {
        return template.replace(/\{\{(\w+)\}\}/g, (_, varName) =>
          String((fallbackOrOpts as Record<string, unknown>)[varName] ?? `{{${varName}}}`),
        );
      }
      return template;
    },
    i18n: { language: "pt-PT", changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));

// Mock useToast
vi.mock("../../ui/design-system/Toast", () => ({
  useToast: () => ({ show: vi.fn() }),
}));

// Mock platformDetection
vi.mock("../../core/operational/platformDetection", () => ({
  isDesktopApp: () => false,
  isInstalledApp: () => false,
  isElectron: () => false,
  isTauri: () => false,
}));

// Mock window.open
const mockWindowClose = vi.fn();
const mockWindowFocus = vi.fn();
function createMockWindow(closed = false) {
  return {
    closed,
    close: mockWindowClose,
    focus: mockWindowFocus,
  } as unknown as Window;
}

beforeEach(() => {
  vi.spyOn(window, "open").mockReturnValue(createMockWindow());
  mockWindowClose.mockClear();
  mockWindowFocus.mockClear();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <TPVScreensPage />
    </MemoryRouter>,
  );
}

describe("TPVScreensPage", () => {
  it("renders all 7 screen type cards", () => {
    renderPage();

    expect(screen.getByTestId("tpv-screens-page")).toBeTruthy();
    expect(screen.getByTestId("screen-create-KDS_KITCHEN")).toBeTruthy();
    expect(screen.getByTestId("screen-create-KDS_BAR")).toBeTruthy();
    expect(screen.getByTestId("screen-create-KDS_EXPO")).toBeTruthy();
    expect(screen.getByTestId("screen-create-CUSTOMER_DISPLAY")).toBeTruthy();
    expect(screen.getByTestId("screen-create-DELIVERY")).toBeTruthy();
    expect(screen.getByTestId("screen-create-TASKS")).toBeTruthy();
    expect(screen.getByTestId("screen-create-WEB_EDITOR")).toBeTruthy();
  });

  it("all screen cards are enabled (all surfaces implemented)", () => {
    renderPage();

    const ids = [
      "KDS_KITCHEN", "KDS_BAR", "KDS_EXPO",
      "CUSTOMER_DISPLAY", "DELIVERY", "TASKS", "WEB_EDITOR",
    ];
    for (const id of ids) {
      const btn = screen.getByTestId(`screen-create-${id}`) as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    }
  });

  it("shows empty state when no screens are active", () => {
    renderPage();

    expect(
      screen.getByText("Nenhuma tela ativa. Crie uma tela acima para começar."),
    ).toBeTruthy();
  });

  it("shows instance summary empty state when no screens", () => {
    renderPage();

    expect(screen.getByTestId("instance-summary-empty")).toBeTruthy();
    expect(
      screen.getByText(/Nenhuma tela em execução/),
    ).toBeTruthy();
  });

  it("shows naming popover with type-specific name when clicking available screen", () => {
    renderPage();

    act(() => {
      fireEvent.click(screen.getByTestId("screen-create-KDS_KITCHEN"));
    });

    const popover = screen.getByTestId("screen-naming-popover");
    expect(popover).toBeTruthy();

    const input = popover.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("Cozinha KDS — Principal");
  });

  it("shows Operação suffix for Tarefas screen type", () => {
    renderPage();

    act(() => {
      fireEvent.click(screen.getByTestId("screen-create-TASKS"));
    });

    const popover = screen.getByTestId("screen-naming-popover");
    const input = popover.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("Tarefas — Operação");
  });

  it("confirms naming and creates active screen instance", () => {
    renderPage();

    // Click to open naming popover
    act(() => {
      fireEvent.click(screen.getByTestId("screen-create-KDS_KITCHEN"));
    });

    // Confirm with the suggested name
    const confirmBtn = screen.getByText("Abrir");
    act(() => {
      fireEvent.click(confirmBtn);
    });

    // Screen should appear in the active list and summary
    expect(screen.getAllByText("Cozinha KDS — Principal").length).toBeGreaterThanOrEqual(1);
    // Type badge should show KDS (appears in both sections)
    expect(screen.getAllByText("KDS").length).toBeGreaterThanOrEqual(1);
    // Should show relative time
    expect(screen.getAllByText("Aberta agora").length).toBeGreaterThanOrEqual(1);
  });

  it("active screen card shows action buttons", () => {
    renderPage();

    // Create a screen
    act(() => {
      fireEvent.click(screen.getByTestId("screen-create-KDS_KITCHEN"));
    });
    act(() => {
      fireEvent.click(screen.getByText("Abrir"));
    });

    // Should have action buttons
    expect(screen.getByText("Focar")).toBeTruthy();
    expect(screen.getByText("Copiar link")).toBeTruthy();
    expect(screen.getByText("Fechar")).toBeTruthy();
  });

  it("close marks screen as closed and shows remove button", () => {
    renderPage();

    // Create a screen
    act(() => {
      fireEvent.click(screen.getByTestId("screen-create-KDS_KITCHEN"));
    });
    act(() => {
      fireEvent.click(screen.getByText("Abrir"));
    });

    // Close it
    act(() => {
      fireEvent.click(screen.getByText("Fechar"));
    });

    // Should show "Fechada" and "Remover" button
    expect(screen.getByText("Remover")).toBeTruthy();
    // "Focar" should no longer be visible
    expect(screen.queryByText("Focar")).toBeNull();
  });

  it("remove button removes screen from list entirely", () => {
    renderPage();

    // Create a screen
    act(() => {
      fireEvent.click(screen.getByTestId("screen-create-KDS_KITCHEN"));
    });
    act(() => {
      fireEvent.click(screen.getByText("Abrir"));
    });

    // Close then remove
    act(() => {
      fireEvent.click(screen.getByText("Fechar"));
    });
    act(() => {
      fireEvent.click(screen.getByText("Remover"));
    });

    // Empty state should be back
    expect(
      screen.getByText("Nenhuma tela ativa. Crie uma tela acima para começar."),
    ).toBeTruthy();
  });

  it("instance summary section shows active screens", () => {
    renderPage();

    // Create a screen
    act(() => {
      fireEvent.click(screen.getByTestId("screen-create-KDS_KITCHEN"));
    });
    act(() => {
      fireEvent.click(screen.getByText("Abrir"));
    });

    // Summary section should contain the instance
    const summary = screen.getByTestId("instance-summary-section");
    expect(summary).toBeTruthy();
    // Empty state should be gone
    expect(screen.queryByTestId("instance-summary-empty")).toBeNull();
  });

  it("increments name suffix for duplicate screen types", () => {
    renderPage();

    // Create first KDS Kitchen
    act(() => {
      fireEvent.click(screen.getByTestId("screen-create-KDS_KITCHEN"));
    });
    act(() => {
      fireEvent.click(screen.getByText("Abrir"));
    });

    // Create second KDS Kitchen — should suggest "Principal 2"
    act(() => {
      fireEvent.click(screen.getByTestId("screen-create-KDS_KITCHEN"));
    });

    const popover = screen.getByTestId("screen-naming-popover");
    const input = popover.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("Cozinha KDS — Principal 2");
  });
});
