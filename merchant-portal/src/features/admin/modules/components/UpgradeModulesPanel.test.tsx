import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UpgradeModulesPanel } from "./UpgradeModulesPanel";

const { mockTrack, mockNavigate, mockUseSubscription } = vi.hoisted(() => ({
  mockTrack: vi.fn(),
  mockNavigate: vi.fn(),
  mockUseSubscription: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const orig = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...orig,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../../hooks/useSubscription", () => ({
  useSubscription: () => mockUseSubscription(),
}));

vi.mock("../../../../commercial/tracking", () => ({
  commercialTracking: { track: mockTrack },
  detectDevice: () => "desktop",
  isCommercialTrackingEnabled: () => true,
}));

function renderPanel() {
  return render(
    <MemoryRouter>
      <UpgradeModulesPanel />
    </MemoryRouter>
  );
}

describe("UpgradeModulesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when loading", () => {
    mockUseSubscription.mockReturnValue({
      subscription: null,
      loading: true,
    });
    const { container } = renderPanel();
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when no locked modules (enterprise plan)", () => {
    mockUseSubscription.mockReturnValue({
      subscription: {
        plan_tier: "enterprise",
        status: "active",
      },
      loading: false,
    });
    const { container } = renderPanel();
    expect(container.firstChild).toBeNull();
  });

  it("renders locked modules when starter plan and tracks upgrade_click", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    mockUseSubscription.mockReturnValue({
      subscription: {
        plan_tier: "starter",
        status: "active",
      },
      loading: false,
    });
    renderPanel();
    expect(screen.getByText("Team Pulse")).toBeTruthy();
    const upgradeBtns = screen.getAllByRole("button", {
      name: /View plans/,
    });
    const upgradeBtn = upgradeBtns[0];
    await user.click(upgradeBtn);
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "upgrade_click",
        placement: "upgrade_panel",
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith("/app/billing");
  });

  it("tracks module_interest on hover", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    mockUseSubscription.mockReturnValue({
      subscription: {
        plan_tier: "starter",
        status: "active",
      },
      loading: false,
    });
    renderPanel();
    const card = screen.getByText("Team Pulse").closest("div");
    expect(card).toBeTruthy();
    if (card) {
      await user.hover(card);
      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "module_interest",
          module: "team_pulse",
        })
      );
    }
  });
});
