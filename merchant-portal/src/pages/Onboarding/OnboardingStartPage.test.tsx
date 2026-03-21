import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingStartPage } from "./OnboardingStartPage";

const { mockNavigate, mockInitializeOnboarding, mockStartTrial, mockTrack } =
  vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockInitializeOnboarding: vi.fn(),
    mockStartTrial: vi.fn(),
    mockTrack: vi.fn(),
  }));

vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...mod,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../hooks/useOnboarding", () => ({
  useOnboarding: () => ({
    initializeOnboarding: mockInitializeOnboarding,
  }),
}));

vi.mock("../../core/billing/trialEngine", () => ({
  startTrial: (...args: unknown[]) => mockStartTrial(...args),
}));

vi.mock("../../commercial/tracking", () => ({
  commercialTracking: {
    track: (...args: unknown[]) => mockTrack(...args),
  },
  isCommercialTrackingEnabled: () => true,
  detectDevice: () => "desktop",
}));

describe("OnboardingStartPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInitializeOnboarding.mockResolvedValue({
      restaurant_id: "11111111-1111-1111-1111-111111111111",
    });
    mockStartTrial.mockResolvedValue({ ok: true });
  });

  it("tracks trial_started and redirects to onboarding after successful submit", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <OnboardingStartPage />
      </MemoryRouter>,
    );

    await user.type(
      screen.getByLabelText(/Nome do restaurante/i),
      "Restaurante Teste",
    );
    await user.click(screen.getByRole("button", { name: /Continuar/i }));

    expect(mockInitializeOnboarding).toHaveBeenCalledWith("Restaurante Teste");
    expect(mockStartTrial).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
    );
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: "trial_started" }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/onboarding", { replace: true });
  });
});
