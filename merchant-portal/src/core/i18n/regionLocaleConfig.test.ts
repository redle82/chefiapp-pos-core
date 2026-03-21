/**
 * Tests for core/i18n/regionLocaleConfig.ts
 *
 * Pure functions — no heavy mocks needed.
 * Covers: getLocaleForCountry, getLocaleForRegion, resolveLocale,
 *         getLocaleFromBrowser, toIntlLocale, getFormatLocale.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getFormatLocale,
  getLocaleForCountry,
  getLocaleForRegion,
  getLocaleFromBrowser,
  resolveLocale,
  toIntlLocale,
} from "./regionLocaleConfig";

describe("regionLocaleConfig", () => {
  /** ── getLocaleForCountry ─────────────────────────────────────── */
  describe("getLocaleForCountry", () => {
    it("returns pt-BR for BR", () => {
      expect(getLocaleForCountry("BR")).toBe("pt-BR");
    });
    it("returns pt-PT for PT", () => {
      expect(getLocaleForCountry("PT")).toBe("pt-PT");
    });
    it("returns es for ES", () => {
      expect(getLocaleForCountry("ES")).toBe("es");
    });
    it("returns en for US", () => {
      expect(getLocaleForCountry("US")).toBe("en");
    });
    it("returns en for GB", () => {
      expect(getLocaleForCountry("GB")).toBe("en");
    });
    it("handles lowercase input", () => {
      expect(getLocaleForCountry("br")).toBe("pt-BR");
    });
    it("handles padded input", () => {
      expect(getLocaleForCountry("  pt ")).toBe("pt-PT");
    });
    it("returns en for unknown country", () => {
      expect(getLocaleForCountry("ZZ")).toBe("en");
    });
    it("returns en for null", () => {
      expect(getLocaleForCountry(null)).toBe("en");
    });
    it("returns en for undefined", () => {
      expect(getLocaleForCountry(undefined)).toBe("en");
    });
    it("returns en for empty string", () => {
      expect(getLocaleForCountry("")).toBe("en");
    });
    it("returns es for MX (Latin America)", () => {
      expect(getLocaleForCountry("MX")).toBe("es");
    });
    it("returns es for AD (Andorra)", () => {
      expect(getLocaleForCountry("AD")).toBe("es");
    });
  });

  /** ── getLocaleForRegion ─────────────────────────────────────── */
  describe("getLocaleForRegion", () => {
    it("returns pt-BR for region br when no country", () => {
      expect(getLocaleForRegion("br")).toBe("pt-BR");
    });
    it("returns en for region europe when no country", () => {
      expect(getLocaleForRegion("europe")).toBe("en");
    });
    it("returns en for region rest when no country", () => {
      expect(getLocaleForRegion("rest")).toBe("en");
    });
    it("delegates to getLocaleForCountry when country provided", () => {
      expect(getLocaleForRegion("europe", "PT")).toBe("pt-PT");
    });
    it("ignores region when country is provided", () => {
      expect(getLocaleForRegion("rest", "BR")).toBe("pt-BR");
    });
    it("uses region when country is null", () => {
      expect(getLocaleForRegion("br", null)).toBe("pt-BR");
    });
  });

  /** ── resolveLocale ──────────────────────────────────────────── */
  describe("resolveLocale", () => {
    it("resolves by country first (BR)", () => {
      expect(resolveLocale("BR", "EUR")).toBe("pt-BR");
    });
    it("resolves by country first (ES)", () => {
      expect(resolveLocale("ES", "USD")).toBe("es");
    });
    it("falls back to currency when no country (BRL)", () => {
      expect(resolveLocale(null, "BRL")).toBe("pt-BR");
    });
    it("falls back to currency (EUR)", () => {
      expect(resolveLocale(null, "EUR")).toBe("en");
    });
    it("falls back to currency (USD)", () => {
      expect(resolveLocale(null, "USD")).toBe("en");
    });
    it("handles case-insensitive currency", () => {
      expect(resolveLocale(null, "brl")).toBe("pt-BR");
    });
    it("falls back to en when unknown currency", () => {
      expect(resolveLocale(null, "JPY")).toBe("en");
    });
    it("returns en when both null", () => {
      expect(resolveLocale(null, null)).toBe("en");
    });
    it("returns en when both undefined", () => {
      expect(resolveLocale(undefined, undefined)).toBe("en");
    });
  });

  /** ── getLocaleFromBrowser ───────────────────────────────────── */
  describe("getLocaleFromBrowser", () => {
    const originalNavigator = globalThis.navigator;

    afterEach(() => {
      // restore navigator
      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        configurable: true,
      });
    });

    function mockNavigator(lang: string, langs: string[] = []) {
      Object.defineProperty(globalThis, "navigator", {
        value: { language: lang, languages: langs },
        configurable: true,
      });
    }

    it("returns es for es-ES", () => {
      mockNavigator("es-ES", ["es-ES"]);
      expect(getLocaleFromBrowser()).toBe("es");
    });
    it("returns en for en-US", () => {
      mockNavigator("en-US", ["en-US"]);
      expect(getLocaleFromBrowser()).toBe("en");
    });
    it("returns pt-BR for pt-BR", () => {
      mockNavigator("pt-BR", ["pt-BR"]);
      expect(getLocaleFromBrowser()).toBe("pt-BR");
    });
    it("returns pt-PT for pt-PT", () => {
      mockNavigator("pt-PT", ["pt-PT"]);
      expect(getLocaleFromBrowser()).toBe("pt-PT");
    });
    it("returns pt-BR for plain pt", () => {
      mockNavigator("pt", ["pt"]);
      expect(getLocaleFromBrowser()).toBe("pt-BR");
    });
    it("fallback iterates navigator.languages", () => {
      mockNavigator("de-DE", ["de-DE", "fr-FR", "es-MX"]);
      expect(getLocaleFromBrowser()).toBe("es");
    });
    it("returns en when no supported language found", () => {
      mockNavigator("zh-CN", ["zh-CN", "ja-JP"]);
      expect(getLocaleFromBrowser()).toBe("en");
    });
    it("returns en when language is empty string", () => {
      mockNavigator("", []);
      expect(getLocaleFromBrowser()).toBe("en");
    });
  });

  /** ── toIntlLocale ───────────────────────────────────────────── */
  describe("toIntlLocale", () => {
    it("maps pt-PT → pt-PT", () => {
      expect(toIntlLocale("pt-PT")).toBe("pt-PT");
    });
    it("maps pt-BR → pt-BR", () => {
      expect(toIntlLocale("pt-BR")).toBe("pt-BR");
    });
    it("maps en → en-GB", () => {
      expect(toIntlLocale("en")).toBe("en-GB");
    });
    it("maps es → es-ES", () => {
      expect(toIntlLocale("es")).toBe("es-ES");
    });
    it("falls back to en-GB for unknown", () => {
      // Cast to bypass TS for testing runtime fallback
      expect(toIntlLocale("fr" as never)).toBe("en-GB");
    });
  });

  /** ── getFormatLocale ────────────────────────────────────────── */
  describe("getFormatLocale", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("returns en-GB when nothing saved", () => {
      expect(getFormatLocale()).toBe("en-GB");
    });
    it("returns pt-PT when saved es", () => {
      localStorage.setItem("chefiapp_locale", "es");
      expect(getFormatLocale()).toBe("es-ES");
    });
    it("returns pt-BR when saved pt-BR", () => {
      localStorage.setItem("chefiapp_locale", "pt-BR");
      expect(getFormatLocale()).toBe("pt-BR");
    });
    it("returns en-GB for invalid saved value", () => {
      localStorage.setItem("chefiapp_locale", "zz-ZZ");
      expect(getFormatLocale()).toBe("en-GB");
    });
    it("returns en-GB when localStorage has wrong key", () => {
      localStorage.setItem("other_key", "pt-BR");
      expect(getFormatLocale()).toBe("en-GB");
    });
  });
});
