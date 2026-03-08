/**
 * @vitest-environment jsdom
 *
 * DesktopDownloadSection — unit tests
 * Validates that download section shows platform buttons, OS highlighting,
 * and handles the "releases not available" state correctly.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DesktopDownloadSection } from "./DesktopDownloadSection";

// Mock platformDetection to control OS detection
vi.mock("../../../core/operational/platformDetection", () => ({
  getDesktopOS: vi.fn(() => "macos"),
}));

describe("DesktopDownloadSection", () => {
  afterEach(() => cleanup());

  it("renders macOS and Windows download cards", () => {
    render(<DesktopDownloadSection />);
    expect(screen.getByText(/Descargar para macOS/)).toBeTruthy();
    expect(screen.getByText(/Descargar para Windows/)).toBeTruthy();
  });

  it("shows 'Tu sistema' badge for the detected OS", () => {
    render(<DesktopDownloadSection />);
    expect(screen.getByText("Tu sistema")).toBeTruthy();
  });

  it("shows 'En desarrollo' badges when releases are not available", () => {
    render(<DesktopDownloadSection />);
    const badges = screen.getAllByText("En desarrollo");
    expect(badges.length).toBe(2); // One for each platform
  });

  it("shows 'Próximamente' as file name when releases are not available", () => {
    render(<DesktopDownloadSection />);
    const items = screen.getAllByText("Próximamente");
    expect(items.length).toBe(2);
  });

  it("has early access mailto link", () => {
    render(<DesktopDownloadSection />);
    const link = screen.getByText(/Solicitar acceso anticipado/);
    expect(link).toBeTruthy();
    expect((link as HTMLAnchorElement).href).toContain("mailto:");
  });

  it("shows single-installer note", () => {
    render(<DesktopDownloadSection />);
    expect(
      screen.getByText(
        /La aplicación de escritorio incluye TPV y KDS en un solo instalador/,
      ),
    ).toBeTruthy();
  });
});
