import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShiftContext } from "../../core/shift/ShiftContext";

vi.mock("../../core/audit/legalConsent", () => ({
  recordLegalConsent: vi.fn().mockResolvedValue({}),
}));

import { OnboardingRitualPage } from "./OnboardingRitualPage";

const RESTAURANT_ID = "11111111-1111-1111-1111-111111111111";

describe("OnboardingRitualPage", () => {
  beforeEach(() => {
    sessionStorage.setItem("chefiapp_storage_migrated_v1", "true");
    sessionStorage.setItem("chefiapp_restaurant_id", RESTAURANT_ID);
    localStorage.setItem("chefiapp_restaurant_id", RESTAURANT_ID);
  });

  it("requires accepting terms before enabling actions", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ShiftContext.Provider
          value={{
            isShiftOpen: false,
            isChecking: false,
            lastCheckedAt: null,
            refreshShiftStatus: vi.fn(async () => {}),
            markShiftOpen: vi.fn(),
          }}
        >
          <OnboardingRitualPage />
        </ShiftContext.Provider>
      </MemoryRouter>,
    );

    const termsCheckbox = screen.getByRole("checkbox", {
      name: /Termos.*Privacidade/i,
    });
    const openShiftButton = screen.getByRole("button", {
      name: /Abrir turno agora/i,
    });
    const panelButton = screen.getByRole("button", {
      name: /Ir para o painel/i,
    });

    expect(openShiftButton.getAttribute("disabled")).not.toBeNull();
    expect(panelButton.getAttribute("disabled")).not.toBeNull();

    await user.click(termsCheckbox);

    expect(openShiftButton.getAttribute("disabled")).toBeNull();
    expect(panelButton.getAttribute("disabled")).toBeNull();
  });
});
