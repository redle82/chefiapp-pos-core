/**
 * @vitest-environment jsdom
 *
 * DesktopComingSoonBanner — unit tests
 * Validates UXG-011: honest "coming soon" banner replaces dead download cards.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DesktopComingSoonBanner } from "./DesktopComingSoonBanner";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const dictionary: Record<string, string> = {
        "comingSoon.title": "Software de escritorio en desarrollo",
        "comingSoon.body":
          "Los módulos TPV y KDS requieren una aplicación de escritorio dedicada que estamos preparando. Mientras tanto, puede vincular dispositivos móviles (AppStaff) usando el código QR de arriba.",
        "comingSoon.requestEarlyAccess": "Solicitar acceso anticipado",
        "comingSoon.learnMore": "Saber más",
      };
      return dictionary[key] ?? key;
    },
  }),
}));

describe("DesktopComingSoonBanner", () => {
  afterEach(() => cleanup());

  it("renders the 'en desarrollo' title", () => {
    render(<DesktopComingSoonBanner />);
    expect(
      screen.getByText(/Software de escritorio en desarrollo/i),
    ).toBeTruthy();
  });

  it("has a mailto CTA for early access", () => {
    render(<DesktopComingSoonBanner />);
    const cta = screen.getByText(/Solicitar acceso anticipado/i);
    expect(cta).toBeTruthy();
    expect((cta as HTMLAnchorElement).href).toContain("mailto:");
  });

  it("has a 'Saber más' link to config/general", () => {
    render(<DesktopComingSoonBanner />);
    const link = screen.getByText(/Saber más/i);
    expect(link).toBeTruthy();
    expect((link as HTMLAnchorElement).getAttribute("href")).toBe(
      "/admin/config/general",
    );
  });

  it("mentions AppStaff as available alternative", () => {
    render(<DesktopComingSoonBanner />);
    expect(screen.getByText(/AppStaff/)).toBeTruthy();
  });
});
