import { describe, expect, it } from "vitest";

import {
  copy,
  getComoComecer,
  getComparison,
  getFAQ,
  getHardware,
  getInsideSystem,
  getIntegrationDelivery,
  getLandingCopy,
  getManifesto,
  getMetricsStrip,
  getMoneyLeaks,
  getOperationalStories,
  getPlatform,
  getPricing,
  getProblemSolution,
  getRhythmBreak,
  getSocialProof,
  getTargetAudience,
  getToolsAvoid,
} from "./landingV2Copy";

const locales = ["pt", "en", "es"] as const;
const fallbackLocale = "xx" as any;

describe("landingV2Copy", () => {
  it("returns non-empty structures for each locale across all section getters", () => {
    for (const locale of locales) {
      expect(getFAQ(locale).items.length).toBeGreaterThan(0);
      expect(getPricing(locale).included.length).toBeGreaterThan(0);
      expect(
        getIntegrationDelivery(locale).level1Points.length,
      ).toBeGreaterThan(0);
      expect(getManifesto(locale).osReasons.length).toBeGreaterThan(0);
      expect(getTargetAudience(locale).audiences.length).toBeGreaterThan(0);
      expect(getComoComecer(locale).steps.length).toBeGreaterThan(0);
      expect(getToolsAvoid(locale).items.length).toBeGreaterThan(0);
      expect(getHardware(locale).devices.length).toBeGreaterThan(0);
      expect(getPlatform(locale).modules.length).toBeGreaterThan(0);
      expect(getMoneyLeaks(locale).leaks.length).toBeGreaterThan(0);
      expect(getMetricsStrip(locale).metrics.length).toBeGreaterThan(0);
      expect(getRhythmBreak(locale).headline.length).toBeGreaterThan(0);
      expect(getSocialProof(locale).trustLabels.length).toBeGreaterThan(0);
      expect(getInsideSystem(locale).steps.length).toBeGreaterThan(0);
      expect(getProblemSolution(locale).problems.length).toBeGreaterThan(0);
      expect(getOperationalStories(locale).scenarios.length).toBeGreaterThan(0);
      expect(getComparison(locale).rows.length).toBeGreaterThan(0);
    }
  });

  it("falls back to pt when locale is unknown", () => {
    expect(getFAQ(fallbackLocale)).toEqual(getFAQ("pt"));
    expect(getPricing(fallbackLocale)).toEqual(getPricing("pt"));
    expect(getIntegrationDelivery(fallbackLocale)).toEqual(
      getIntegrationDelivery("pt"),
    );
    expect(getManifesto(fallbackLocale)).toEqual(getManifesto("pt"));
    expect(getTargetAudience(fallbackLocale)).toEqual(getTargetAudience("pt"));
    expect(getComoComecer(fallbackLocale)).toEqual(getComoComecer("pt"));
    expect(getToolsAvoid(fallbackLocale)).toEqual(getToolsAvoid("pt"));
    expect(getHardware(fallbackLocale)).toEqual(getHardware("pt"));
    expect(getPlatform(fallbackLocale)).toEqual(getPlatform("pt"));
    expect(getMoneyLeaks(fallbackLocale)).toEqual(getMoneyLeaks("pt"));
    expect(getMetricsStrip(fallbackLocale)).toEqual(getMetricsStrip("pt"));
    expect(getRhythmBreak(fallbackLocale)).toEqual(getRhythmBreak("pt"));
    expect(getSocialProof(fallbackLocale)).toEqual(getSocialProof("pt"));
    expect(getInsideSystem(fallbackLocale)).toEqual(getInsideSystem("pt"));
    expect(getProblemSolution(fallbackLocale)).toEqual(
      getProblemSolution("pt"),
    );
    expect(getOperationalStories(fallbackLocale)).toEqual(
      getOperationalStories("pt"),
    );
    expect(getComparison(fallbackLocale)).toEqual(getComparison("pt"));
  });

  it("resolves nested copy and falls back to key when path is missing", () => {
    expect(getLandingCopy("pt", "faq.headline").length).toBeGreaterThan(0);
    expect(getLandingCopy(fallbackLocale, "faq.headline")).toBe(
      getLandingCopy("pt", "faq.headline"),
    );
    expect(getLandingCopy("pt", "non.existent.path")).toBe("non.existent.path");
  });

  it("falls back to null/empty defaults when socialProof optional fields are missing", () => {
    const originalFeatured = (copy as any).pt.socialProof.featuredTestimonial;
    const originalSecondary = (copy as any).pt.socialProof
      .secondaryTestimonials;

    (copy as any).pt.socialProof.featuredTestimonial = undefined;
    (copy as any).pt.socialProof.secondaryTestimonials = undefined;

    const result = getSocialProof("pt");
    expect(result.featuredTestimonial).toBeNull();
    expect(result.secondaryTestimonials).toEqual([]);

    (copy as any).pt.socialProof.featuredTestimonial = originalFeatured;
    (copy as any).pt.socialProof.secondaryTestimonials = originalSecondary;
  });
});
