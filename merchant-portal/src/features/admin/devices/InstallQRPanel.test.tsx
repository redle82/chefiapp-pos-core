/**
 * @vitest-environment jsdom
 *
 * InstallQRPanel — unit tests
 * Validates UXG-012: desktop types (TPV/KDS) get single QR + desktop instructions,
 * mobile types (APPSTAFF) keep the two-column iOS/Android layout.
 */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InstallQRPanel } from "./InstallQRPanel";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { deviceType?: string }) => {
      if (key === "qr.desktopHint") {
        return `Escanee este código en el dispositivo donde tiene instalada la aplicación ${options?.deviceType ?? ""} de escritorio.`;
      }

      const dictionary: Record<string, string> = {
        "qr.desktopLinkTitle": "Código de vinculación — Escritorio",
        "qr.mobileLinkTitle": "Código de vinculación — Móvil",
        "qr.desktopComingSoon":
          "App de escritorio en desarrollo — disponible próximamente.",
        "qr.copyUrl": "Copiar URL",
        "qr.copied": "Copiado",
      };

      return dictionary[key] ?? key;
    },
  }),
}));

const BASE_PROPS = {
  token: "abc123def456ghi789",
  secondsLeft: 120,
  baseUrl: "http://192.168.1.100:5175",
};

describe("InstallQRPanel", () => {
  afterEach(() => cleanup());

  // ── Desktop types ──────────────────────────────────────────────────
  describe("desktop type (TPV)", () => {
    it("shows desktop-specific heading", () => {
      render(<InstallQRPanel {...BASE_PROPS} deviceType="TPV" />);
      expect(
        screen.getByText(/Código de vinculación — Escritorio/i),
      ).toBeTruthy();
    });

    it("does NOT show iOS/Android columns", () => {
      render(<InstallQRPanel {...BASE_PROPS} deviceType="TPV" />);
      expect(screen.queryByText("iPhone / iPad")).toBeNull();
      expect(screen.queryByText("Android")).toBeNull();
    });

    it("shows 'en desarrollo' notice", () => {
      render(<InstallQRPanel {...BASE_PROPS} deviceType="TPV" />);
      expect(
        screen.getByText(/en desarrollo — disponible próximamente/i),
      ).toBeTruthy();
    });

    it("renders a copy button", () => {
      render(<InstallQRPanel {...BASE_PROPS} deviceType="TPV" />);
      expect(screen.getByText("Copiar URL")).toBeTruthy();
    });

    it("shows device type in metadata", () => {
      render(<InstallQRPanel {...BASE_PROPS} deviceType="TPV" />);
      expect(screen.getAllByText("TPV").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("desktop type (KDS)", () => {
    it("shows desktop heading for KDS too", () => {
      render(<InstallQRPanel {...BASE_PROPS} deviceType="KDS" />);
      expect(
        screen.getByText(/Código de vinculación — Escritorio/i),
      ).toBeTruthy();
    });

    it("mentions KDS in instructions", () => {
      render(<InstallQRPanel {...BASE_PROPS} deviceType="KDS" />);
      // The text has <strong>KDS</strong> so we use a custom text matcher
      const el = screen.getByText(
        (_content, node) =>
          node?.tagName === "P" && /KDS/.test(node.textContent ?? ""),
      );
      expect(el).toBeTruthy();
    });
  });

  // ── Mobile types ───────────────────────────────────────────────────
  describe("mobile type (APPSTAFF)", () => {
    it("shows platform header 'Código QR por Plataforma'", () => {
      render(<InstallQRPanel {...BASE_PROPS} deviceType="APPSTAFF" />);
      expect(screen.getByText("Código de vinculación — Móvil")).toBeTruthy();
    });

    it("shows iOS and Android columns", () => {
      render(<InstallQRPanel {...BASE_PROPS} deviceType="APPSTAFF" />);
      expect(screen.getByText("iPhone / iPad")).toBeTruthy();
      expect(screen.getByText("Android")).toBeTruthy();
    });

    it("does NOT show desktop 'en desarrollo' notice", () => {
      render(<InstallQRPanel {...BASE_PROPS} deviceType="APPSTAFF" />);
      expect(
        screen.queryByText(/en desarrollo — disponible próximamente/i),
      ).toBeNull();
    });

    it("does NOT show copy button", () => {
      render(<InstallQRPanel {...BASE_PROPS} deviceType="APPSTAFF" />);
      expect(screen.queryByText("Copiar URL")).toBeNull();
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
