/**
 * CountryIntelligenceBanner — Verifies banner renders and tracks.
 */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CountryConfig } from "../countries";
import { CountryIntelligenceBanner } from "./CountryIntelligenceBanner";

const mockTrack = vi.fn();
vi.mock("../../commercial/tracking", () => ({
  commercialTracking: { track: (...args: unknown[]) => mockTrack(...args) },
  detectDevice: () => "desktop",
  isCommercialTrackingEnabled: () => true,
}));

const countryEs: CountryConfig = {
  code: "es",
  locale: "es",
  currency: "EUR",
  whatsAppNumber: "34",
  whatsAppMessage: "Hola",
  meta: { title: "Test", description: "Test" },
  hero: { h1: "Test", subhead: "Test" },
  deliveryMessage: "Test",
};

describe("CountryIntelligenceBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders banner with country-specific message", () => {
    render(
      <MemoryRouter>
        <CountryIntelligenceBanner country={countryEs} />
      </MemoryRouter>,
    );
    expect(
      screen.getByText(/Los mejores restaurantes|Restaurantes punteros|España/),
    ).toBeTruthy();
  });

  it("tracks banner_click on CTA click", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CountryIntelligenceBanner country={countryEs} />
      </MemoryRouter>,
    );
    const cta = screen.getByRole("link", {
      name: /Ver planos Pro|Upgrade Plan/,
    });
    await user.click(cta);
    expect(mockTrack).toHaveBeenCalledWith(
      expect.objectContaining({ event: "banner_click" }),
    );
  });

  it("rotates messages without runtime errors", () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter>
        <CountryIntelligenceBanner country={countryEs} />
      </MemoryRouter>,
    );

    const before = screen.getByText(
      /Los mejores restaurantes|Restaurantes punteros|los restaurantes que crecen/i,
    ).textContent;

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    const after = screen.getByText(
      /Los mejores restaurantes|Restaurantes punteros|los restaurantes que crecen/i,
    ).textContent;

    expect(after).not.toBe(before);
  });
});
