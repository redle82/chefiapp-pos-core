/**
 * @vitest-environment jsdom
 *
 * InstallQRPanel — unit tests
 * After desktop-portal-p0: desktop types (TPV/KDS) are handled by DesktopPairingSection,
 * so InstallQRPanel returns null for them. Mobile types keep the two-column iOS/Android layout.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InstallQRPanel } from "./InstallQRPanel";

const BASE_PROPS = {
  token: "abc123def456ghi789",
  secondsLeft: 120,
  baseUrl: "http://192.168.1.100:5175",
};

describe("InstallQRPanel", () => {
  afterEach(() => cleanup());

  // ── Desktop types → null ───────────────────────────────────────────
  describe("desktop type (TPV)", () => {
    it("returns null — desktop pairing handled by DesktopPairingSection", () => {
      const { container } = render(
        <InstallQRPanel {...BASE_PROPS} deviceType="TPV" />,
      );
      expect(container.innerHTML).toBe("");
    });
  });

  describe("desktop type (KDS)", () => {
    it("returns null for KDS too", () => {
      const { container } = render(
        <InstallQRPanel {...BASE_PROPS} deviceType="KDS" />,
      );
      expect(container.innerHTML).toBe("");
    });
  });

  // ── Mobile types ───────────────────────────────────────────────────
  describe("mobile type (APPSTAFF)", () => {
    it("shows platform header 'Código QR por Plataforma'", () => {
      render(<InstallQRPanel {...BASE_PROPS} deviceType="APPSTAFF" />);
      expect(screen.getByText("Código QR por Plataforma")).toBeTruthy();
    });

    it("shows iOS and Android columns", () => {
      render(<InstallQRPanel {...BASE_PROPS} deviceType="APPSTAFF" />);
      expect(screen.getByText("iPhone / iPad")).toBeTruthy();
      expect(screen.getByText("Android")).toBeTruthy();
    });
  });

  // ── Expiry states ──────────────────────────────────────────────────
  describe("expiry indicator", () => {
    it("shows normal expiry when > 60s", () => {
      render(<InstallQRPanel {...BASE_PROPS} deviceType="APPSTAFF" />);
      expect(screen.getByText("120s")).toBeTruthy();
    });

    it("shows critical style when < 60s", () => {
      render(
        <InstallQRPanel
          {...BASE_PROPS}
          deviceType="APPSTAFF"
          secondsLeft={30}
        />,
      );
      expect(screen.getByText("30s")).toBeTruthy();
    });
  });
});
