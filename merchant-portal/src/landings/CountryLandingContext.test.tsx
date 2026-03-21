import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import {
  CountryLandingProvider,
  useCountryLanding,
} from "./CountryLandingContext";

function LandingProbe() {
  const { countryCode, segment, segmentCopy, setSegment } = useCountryLanding();
  const location = useLocation();

  return (
    <div>
      <div data-testid="country-code">{countryCode}</div>
      <div data-testid="segment">{segment}</div>
      <div data-testid="cta-primary">{segmentCopy.ctaPrimary}</div>
      <div data-testid="search">{location.search || "(none)"}</div>

      <button type="button" onClick={() => setSegment("enterprise")}>
        set-enterprise
      </button>
    </div>
  );
}

function ConsumerWithoutProvider() {
  useCountryLanding();
  return <div>should not render</div>;
}

describe("CountryLandingContext", () => {
  it("uses country fallback gb and segment fallback small when route/query are invalid", () => {
    render(
      <MemoryRouter initialEntries={["/xx?segment=invalid"]}>
        <Routes>
          <Route
            path="*"
            element={
              <CountryLandingProvider>
                <LandingProbe />
              </CountryLandingProvider>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("country-code").textContent).toBe("gb");
    expect(screen.getByTestId("segment").textContent).toBe("small");
    expect(screen.getByTestId("cta-primary").textContent).toBe("Start free");
  });

  it("uses route country and valid query segment", () => {
    render(
      <MemoryRouter initialEntries={["/br?segment=enterprise"]}>
        <Routes>
          <Route
            path="*"
            element={
              <CountryLandingProvider>
                <LandingProbe />
              </CountryLandingProvider>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("country-code").textContent).toBe("br");
    expect(screen.getByTestId("segment").textContent).toBe("enterprise");
    expect(screen.getByTestId("cta-primary").textContent).toBe(
      "Falar com vendas",
    );
  });

  it("setSegment updates search params and derived segment copy", () => {
    render(
      <MemoryRouter initialEntries={["/gb"]}>
        <Routes>
          <Route
            path="*"
            element={
              <CountryLandingProvider>
                <LandingProbe />
              </CountryLandingProvider>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("segment").textContent).toBe("small");
    expect(screen.getByTestId("search").textContent).toBe("(none)");
    expect(screen.getByTestId("cta-primary").textContent).toBe("Start free");

    fireEvent.click(screen.getByRole("button", { name: "set-enterprise" }));

    expect(screen.getByTestId("search").textContent).toBe(
      "?segment=enterprise",
    );
    expect(screen.getByTestId("segment").textContent).toBe("enterprise");
    expect(screen.getByTestId("cta-primary").textContent).toBe("Talk to sales");
  });

  it("throws when useCountryLanding is used outside provider", () => {
    expect(() =>
      render(
        <MemoryRouter>
          <ConsumerWithoutProvider />
        </MemoryRouter>,
      ),
    ).toThrow("useCountryLanding must be used inside CountryLandingProvider");
  });
});
