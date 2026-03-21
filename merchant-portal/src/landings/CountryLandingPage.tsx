/**
 * CountryLandingPage — Landing localizada por país (/br, /es, /gb, /us). Gateway-first.
 * SEO, hreflang, segment (?segment=small|multi|enterprise).
 * Ref: docs/commercial/COUNTRY_DEPLOYMENT_SYSTEM.md
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCommercialTracking } from "../commercial/tracking";
import { CountryIntelligenceBanner } from "./components/CountryIntelligenceBanner";
import { CountrySelector } from "./components/CountrySelector";
import { LeadCaptureModal } from "./components/LeadCaptureModal";
import { LiveActivityTicker } from "./components/LiveActivityTicker";
import { StickyCTAMobile } from "./components/StickyCTAMobile";
import { CountryHero } from "./components/CountryHero";
import { DeliveryIntegrations } from "./components/DeliveryIntegrations";
import { ModulesGrid } from "./components/ModulesGrid";
import { PricingByCountry } from "./components/PricingByCountry";
import { WhatsAppCTA } from "./components/WhatsAppCTA";
import { COUNTRY_ROUTES, isValidCountryCode } from "./countries";
import {
  CountryLandingProvider,
  useCountryLanding,
} from "./CountryLandingContext";
import { useExitIntent } from "./hooks/useExitIntent";

const BASE_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}`
    : "https://chefiapp.com";

function CountryLandingContent() {
  const { country, countryCode, segment } = useCountryLanding();
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const { trackPageView } = useCommercialTracking();

  useExitIntent(() => setLeadModalOpen(true), { enabled: true });

  // Track page_view on mount & when country/segment changes
  useEffect(() => {
    trackPageView();
  }, [trackPageView]);

  useEffect(() => {
    document.title = country.meta.title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", country.meta.description);
    document.documentElement.setAttribute("lang", country.locale);

    // Open Graph
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", country.meta.title);
    else {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:title");
      m.setAttribute("content", country.meta.title);
      document.head.appendChild(m);
    }
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", country.meta.description);
    else {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:description");
      m.setAttribute("content", country.meta.description);
      document.head.appendChild(m);
    }

    // JSON-LD SoftwareApplication
    const existing = document.getElementById("chefiapp-jsonld");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "chefiapp-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "ChefIApp",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: country.meta.description,
      offers: { "@type": "Offer", price: "0", priceCurrency: country.currency },
    });
    document.head.appendChild(script);

    // Remove existing hreflang
    document
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach((el) => el.remove());

    // Add hreflang for all countries
    for (const code of COUNTRY_ROUTES) {
      const link = document.createElement("link");
      link.setAttribute("rel", "alternate");
      const hreflangMap: Record<string, string> = {
        br: "pt-BR",
        es: "es",
        pt: "pt-PT",
        gb: "en-GB",
        us: "en",
      };
      link.setAttribute("hreflang", hreflangMap[code] ?? code);
      link.setAttribute("href", `${BASE_URL}/${code}`);
      document.head.appendChild(link);
    }
    const xDefault = document.createElement("link");
    xDefault.setAttribute("rel", "alternate");
    xDefault.setAttribute("hreflang", "x-default");
    xDefault.setAttribute("href", `${BASE_URL}/gb`);
    document.head.appendChild(xDefault);

    return () => {
      document
        .querySelectorAll('link[rel="alternate"][hreflang]')
        .forEach((el) => el.remove());
    };
  }, [country]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur border-b border-white/5 px-6 h-14 flex items-center justify-between">
        <Link to={`/${countryCode}`} className="flex items-center gap-2">
          <img
            src="/logo-chefiapp-clean.png"
            alt="ChefIApp"
            className="w-6 h-6 rounded"
          />
          <span className="font-semibold">ChefIApp</span>
        </Link>
        <div className="flex items-center gap-4">
          <CountrySelector />
          <a
            href="#preco"
            className="text-sm text-neutral-400 hover:text-white"
          >
            {country.locale === "en" ? "Pricing" : "Preços"}
          </a>
          <a
            href="#integracoes"
            className="text-sm text-neutral-400 hover:text-white"
          >
            {country.locale === "en" ? "Delivery" : "Delivery"}
          </a>
          <button
            type="button"
            onClick={() => setLeadModalOpen(true)}
            className="text-sm text-amber-500 hover:text-amber-400 font-medium"
          >
            {country.locale === "en" ? "Get in touch" : country.locale === "es" ? "Contactar" : "Contactar"}
          </button>
          <WhatsAppCTA country={country} placement="nav" />
        </div>
      </nav>

      <main className="pt-14 pb-20 md:pb-0">
        <div className="px-6 py-3 flex justify-center">
          <LiveActivityTicker />
        </div>
        <CountryIntelligenceBanner country={country} />
        <CountryHero country={country} segment={segment} />
        <ModulesGrid locale={country.locale} />
        <PricingByCountry country={country} />
        <DeliveryIntegrations country={country} />
      </main>

      <LeadCaptureModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        country={countryCode}
        placement="nav"
        locale={country.locale}
      />

      <StickyCTAMobile
        onLeadClick={() => setLeadModalOpen(true)}
        country={country}
        locale={country.locale}
      />

      <footer className="py-12 px-6 border-t border-white/5 text-center text-neutral-500 text-sm">
        © ChefIApp.{" "}
        {country.locale === "en"
          ? "All rights reserved."
          : "Todos os direitos reservados."}
      </footer>
    </div>
  );
}

export function CountryLandingPage() {
  const { pathname } = useLocation();
  const countryCode = pathname.replace(/^\//, "").split("/")[0] ?? "";
  if (!isValidCountryCode(countryCode)) {
    return null; // Route is explicit /br, /es, /gb, /us so this shouldn't happen
  }
  return (
    <CountryLandingProvider>
      <CountryLandingContent />
    </CountryLandingProvider>
  );
}
