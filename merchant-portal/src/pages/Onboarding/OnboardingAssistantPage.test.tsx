import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingAssistantPage } from "./OnboardingAssistantPage";

const { mockNavigate, mockCompleteStep, mockTrack } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockCompleteStep: vi.fn(),
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
    state: {
      current_step: "verification",
      is_complete: false,
      restaurant_name: "Restaurante Teste",
      restaurant_id: "11111111-1111-1111-1111-111111111111",
    },
    stateLoading: false,
    stateError: null,
    initializeOnboarding: vi.fn(),
    completeStep: mockCompleteStep,
    progressPercent: 90,
    isOnboarding: true,
  }),
}));

vi.mock("../../commercial/tracking", () => ({
  commercialTracking: {
    track: (...args: unknown[]) => mockTrack(...args),
  },
  isCommercialTrackingEnabled: () => true,
  detectDevice: () => "desktop",
}));

describe("OnboardingAssistantPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCompleteStep.mockResolvedValue(undefined);
  });

  it("tracks onboarding_completed when finishing verification step", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <OnboardingAssistantPage />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", {
        name: /finish setup|Concluir/i,
      }),
    );

    expect(mockCompleteStep).toHaveBeenCalledWith("complete", {});
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "onboarding_completed",
        restaurant_id: "11111111-1111-1111-1111-111111111111",
      }),
    );
  });
});
