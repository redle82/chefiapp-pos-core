/**
 * @vitest-environment jsdom
 *
 * DesktopComingSoonBanner — unit tests
 * Validates UXG-011: honest "coming soon" banner replaces dead download cards.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DesktopComingSoonBanner } from "./DesktopComingSoonBanner";

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
