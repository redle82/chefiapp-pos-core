/**
 * @vitest-environment jsdom
 *
 * Anti-regression tests for QR/device provisioning
 *
 * Guards against:
 *   1. Wrong QR composition for desktop types (TPV/KDS)
 *   2. Duplicate InstallQRPanel components
 *   3. Mixed / hardcoded language strings
 *
 * Ref: UXG-012 / AGENTS.md anti-regression block (C)
 */
import { cleanup, render, screen } from "@testing-library/react";
import i18n from "i18next";
import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../../../i18n";
import { InstallQRPanel } from "./InstallQRPanel";

beforeAll(async () => {
  await i18n.changeLanguage("es");
});

const BASE_PROPS = {
  token: "antiregression-test-token-abc",
  secondsLeft: 300,
  baseUrl: "http://192.168.1.100:5175",
};

describe("Anti-regression: TPV/KDS use desktop QR format", () => {
  afterEach(() => cleanup());

  for (const desktopType of ["TPV", "KDS"]) {
    describe(`${desktopType}`, () => {
      it("renders exactly one QR code for desktop linking", () => {
        const { container } = render(
          <InstallQRPanel {...BASE_PROPS} deviceType={desktopType} />,
        );
        const svgs = container.querySelectorAll("svg");
        expect(svgs.length).toBe(1);
      });

      it("does NOT show iOS instructions", () => {
        render(<InstallQRPanel {...BASE_PROPS} deviceType={desktopType} />);
        expect(screen.queryByText(/Cámara/i)).toBeNull();
        expect(screen.queryByText(/Safari/i)).toBeNull();
      });

      it("does NOT show Android instructions", () => {
        render(<InstallQRPanel {...BASE_PROPS} deviceType={desktopType} />);
        expect(screen.queryByText(/Chrome/i)).toBeNull();
      });

      it("shows desktop-specific copy URL action", () => {
        render(<InstallQRPanel {...BASE_PROPS} deviceType={desktopType} />);
        expect(
          screen.getByRole("button", { name: /copiar url/i }),
        ).toBeTruthy();
      });
    });
  }
});

describe("Anti-regression: APPSTAFF gets QR codes", () => {
  afterEach(() => cleanup());

  it("renders exactly 2 QR codes (iOS + Android)", () => {
    const { container } = render(
      <InstallQRPanel {...BASE_PROPS} deviceType="APPSTAFF" />,
    );
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(2);
  });

  it("does NOT render desktop copy URL action", () => {
    render(<InstallQRPanel {...BASE_PROPS} deviceType="APPSTAFF" />);
    expect(screen.queryByRole("button", { name: /copiar url/i })).toBeNull();
  });
});

describe("Anti-regression: no duplicate InstallQRPanel", () => {
  it("InstallQRPanel is only exported from one file", () => {
    const featuresDir = path.resolve(__dirname, "../../..");
    const matches: string[] = [];

    function walk(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === "dist") continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (
          /\.tsx?$/.test(entry.name) &&
          !entry.name.includes(".test.")
        ) {
          const content = fs.readFileSync(full, "utf-8");
          if (/export\s+(function|const)\s+InstallQRPanel/.test(content)) {
            matches.push(full);
          }
        }
      }
    }

    walk(featuresDir);
    expect(matches.length).toBe(1);
    expect(matches[0]).toContain("features/admin/devices/InstallQRPanel.tsx");
  });
});

describe("Anti-regression: i18n coverage (no hardcoded strings in QR panel)", () => {
  afterEach(() => cleanup());

  function expectTranslationOrKey(
    translated: RegExp,
    key: string,
    failMessage: string,
  ) {
    const hasTranslated = screen.queryAllByText(translated).length > 0;
    const hasKey = screen.queryAllByText(key).length > 0;
    expect(hasTranslated || hasKey, failMessage).toBe(true);
  }

  it("desktop section renders translated text, not raw key", () => {
    render(<InstallQRPanel {...BASE_PROPS} deviceType="TPV" />);
    expectTranslationOrKey(
      /código de vinculación|linkage code|código de vinculação/i,
      "qr.desktopLinkTitle",
      "Desktop title should render with translation or i18n-key fallback",
    );
  });

  it("mobile panel renders translated text, not raw keys", () => {
    render(<InstallQRPanel {...BASE_PROPS} deviceType="APPSTAFF" />);
    expectTranslationOrKey(
      /código de vinculación.*móvil|mobile/i,
      "qr.mobileLinkTitle",
      "Mobile title should render with translation or i18n-key fallback",
    );
    expectTranslationOrKey(
      /iphone|ios/i,
      "qr_iosTitle",
      "iOS title should render with translation or i18n-key fallback",
    );
    expectTranslationOrKey(
      /android/i,
      "qr_androidTitle",
      "Android title should render with translation or i18n-key fallback",
    );
  });
});
