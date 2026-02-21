/**
 * Official Landing Page — Sistema Operacional do Restaurante
 *
 * Única landing canónica do ChefIApp™ OS. Route canónica: /landing
 * Aliases legados: /landing-v2, /v2.
 * Ver docs/strategy/LANDING_CANON.md — não existe outra landing.
 * i18n: ?lang=pt|en|es (default pt). Copy em i18n/landingV2Copy.ts.
 *
 * Narrative flow: OS declaration → operational stories → manifesto →
 * components → CTA → audience → proof → comparison → pricing →
 * como comecar → hardware → FAQ → values → footer
 *
 * Identity: ChefIApp™ OS. Dark theme. Amber accent. Restaurant = protagonist.
 */
// @ts-nocheck

import { useEffect } from "react";
import { LandingAnalytics } from "../../components/analytics/LandingAnalytics";
import { useFadeIn } from "./hooks/useFadeIn";
import { useLandingLocale } from "./i18n/LandingLocaleContext";
import { ComoComecerV2 } from "./sections/ComoComecerV2";
import { ComparisonV2 } from "./sections/ComparisonV2";
import { CTABannerV2 } from "./sections/CTABannerV2";
import { ExitBannerV2 } from "./sections/ExitBannerV2";
import { FAQV2 } from "./sections/FAQV2";
import { FinalManifestoV2 } from "./sections/FinalManifestoV2";
import { FooterV2 } from "./sections/FooterV2";
import { HardObjectionsV2 } from "./sections/HardObjectionsV2";
import { HardwareV2 } from "./sections/HardwareV2";
import { HeroV2 } from "./sections/HeroV2";
import { HotelMirrorV2 } from "./sections/HotelMirrorV2";
import { InsideSystemV2 } from "./sections/InsideSystemV2";
import { ManifestoV2 } from "./sections/ManifestoV2";
import { MetricsStripV2 } from "./sections/MetricsStripV2";
import { MoneyLeaksV2 } from "./sections/MoneyLeaksV2";
import { NearMissStoryV2 } from "./sections/NearMissStoryV2";
import { OperationalStoriesV2 } from "./sections/OperationalStoriesV2";
import { PlatformV2 } from "./sections/PlatformV2";
import { PricingV2 } from "./sections/PricingV2";
import { ProblemSolutionV2 } from "./sections/ProblemSolutionV2";
import { ReadyToScaleV2 } from "./sections/ReadyToScaleV2";
import { RhythmBreakV2 } from "./sections/RhythmBreakV2";
import { SocialProofV2 } from "./sections/SocialProofV2";
import { SystemLimitsV2 } from "./sections/SystemLimitsV2";
import { TargetAudienceV2 } from "./sections/TargetAudienceV2";
import { TechValuesV2 } from "./sections/TechValuesV2";
import { ToolsAvoidV2 } from "./sections/ToolsAvoidV2";

/** Wrapper that fades in children on scroll */
const FadeIn = ({ children }: { children: React.ReactNode }) => {
  const ref = useFadeIn<HTMLDivElement>();
  return (
    <div ref={ref} className="fade-section">
      {children}
    </div>
  );
};

const LANG_MAP = { pt: "pt", en: "en", es: "es" } as const;

function LandingV2Content() {
  const { t, locale } = useLandingLocale();

  useEffect(() => {
    const prevTitle = document.title;
    const prevMeta = document.querySelector('meta[name="description"]');
    const prevContent = prevMeta?.getAttribute("content") ?? null;
    const prevLang = document.documentElement.getAttribute("lang");

    document.title = t("meta.title");
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", t("meta.description"));

    document.documentElement.setAttribute("lang", LANG_MAP[locale]);

    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const hreflangLinks: HTMLLinkElement[] = [];
    const defaultHref = `${baseUrl}?lang=pt`;
    for (const hreflang of ["x-default", "pt", "en", "es"] as const) {
      const link = document.createElement("link");
      link.setAttribute("rel", "alternate");
      link.setAttribute("hreflang", hreflang);
      link.setAttribute(
        "href",
        hreflang === "x-default" ? defaultHref : `${baseUrl}?lang=${hreflang}`,
      );
      document.head.appendChild(link);
      hreflangLinks.push(link);
    }

    return () => {
      document.title = prevTitle;
      if (prevMeta && prevContent !== null)
        prevMeta.setAttribute("content", prevContent);
      if (prevLang !== null)
        document.documentElement.setAttribute("lang", prevLang);
      else document.documentElement.removeAttribute("lang");
      hreflangLinks.forEach((el) => el.remove());
    };
  }, [locale, t]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased overflow-x-hidden pb-20">
      <LandingAnalytics />
      <HeroV2 />
      <FadeIn>
        <MoneyLeaksV2 />
      </FadeIn>
      <FadeIn>
        <OperationalStoriesV2 />
      </FadeIn>
      <FadeIn>
        <ProblemSolutionV2 />
      </FadeIn>
      <FadeIn>
        <InsideSystemV2 />
      </FadeIn>
      <FadeIn>
        <NearMissStoryV2 />
      </FadeIn>
      <RhythmBreakV2 />
      <FadeIn>
        <ManifestoV2 />
      </FadeIn>
      <FadeIn>
        <MetricsStripV2 />
      </FadeIn>
      <FadeIn>
        <PlatformV2 />
      </FadeIn>
      <FadeIn>
        <ToolsAvoidV2 />
      </FadeIn>
      <CTABannerV2
        headline={t("ctaBanner.headline")}
        cta={t("ctaBanner.cta")}
        variant="warm"
      />
      <FadeIn>
        <TargetAudienceV2 />
      </FadeIn>
      <FadeIn>
        <SocialProofV2 />
      </FadeIn>
      <FadeIn>
        <ComparisonV2 />
      </FadeIn>
      <FadeIn>
        <ReadyToScaleV2 />
      </FadeIn>
      <FadeIn>
        <HotelMirrorV2 />
      </FadeIn>
      <FadeIn>
        <PricingV2 />
      </FadeIn>
      <FadeIn>
        <HardObjectionsV2 />
      </FadeIn>
      <FadeIn>
        <SystemLimitsV2 />
      </FadeIn>
      <FadeIn>
        <ComoComecerV2 />
      </FadeIn>
      <FadeIn>
        <HardwareV2 />
      </FadeIn>
      <FadeIn>
        <FAQV2 />
      </FadeIn>
      <FadeIn>
        <TechValuesV2 />
      </FadeIn>
      <FadeIn>
        <FinalManifestoV2 />
      </FadeIn>
      <FooterV2 />
      <ExitBannerV2
        message={t("exitBanner.message")}
        cta={t("exitBanner.cta")}
        dismissLabel={t("exitBanner.dismiss")}
      />
    </div>
  );
}

/** Provider is at route level (App.tsx). This component is only the content. */
export const OfficialLandingPage = () => <LandingV2Content />;

/** @deprecated Use OfficialLandingPage. Kept for compatibility with legacy imports. */
export const LandingV2Page = OfficialLandingPage;
