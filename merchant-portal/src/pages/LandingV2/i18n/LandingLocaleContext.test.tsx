import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { LandingLocaleProvider, useLandingLocale } from "./LandingLocaleContext";

function LocaleProbe() {
  const { locale } = useLandingLocale();
  return <div data-testid="locale-probe">{locale}</div>;
}

describe("LandingLocaleProvider locale resolution", () => {
  const GEO_KEY = "__CHEFIAPP_GEO_COUNTRY__";
  const STORAGE_KEY = "chefiapp_landing_locale";

  beforeEach(() => {
    // Clean hints between tests
    if (GEO_KEY in window) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      // @ts-expect-error dynamic global cleanup
      delete (window as any)[GEO_KEY];
    }
    window.localStorage.removeItem(STORAGE_KEY);
  });

  afterEach(() => {
    if (GEO_KEY in window) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      // @ts-expect-error dynamic global cleanup
      delete (window as any)[GEO_KEY];
    }
    window.localStorage.removeItem(STORAGE_KEY);
  });

  it("uses ?lang query param when present", () => {
    render(
      <MemoryRouter initialEntries={["/landing?lang=en"]}>
        <LandingLocaleProvider>
          <LocaleProbe />
        </LandingLocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("locale-probe").textContent).toBe("en");
  });

  it("falls back to geo country hint when no ?lang or stored locale", () => {
    (window as any)[GEO_KEY] = "ES";

    render(
      <MemoryRouter initialEntries={["/landing"]}>
        <LandingLocaleProvider>
          <LocaleProbe />
        </LandingLocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("locale-probe").textContent).toBe("es");
  });

  it("prefers stored locale over geo hint", () => {
    window.localStorage.setItem(STORAGE_KEY, "en");
    (window as any)[GEO_KEY] = "ES";

    render(
      <MemoryRouter initialEntries={["/landing"]}>
        <LandingLocaleProvider>
          <LocaleProbe />
        </LandingLocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("locale-probe").textContent).toBe("en");
  });
});

