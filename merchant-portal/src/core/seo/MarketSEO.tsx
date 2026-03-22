import { useEffect } from "react";
import { getSupportedMarkets } from "../market/markets";

interface MarketSEOProps {
  /** Current page path without locale prefix (e.g. "/" for landing) */
  pagePath: string;
  /** Page title */
  title: string;
  /** Page description */
  description: string;
  /** Page type for JSON-LD */
  type?: "WebSite" | "WebPage" | "Product" | "FAQPage";
  /** Base URL */
  baseUrl?: string;
}

export function MarketSEO({
  pagePath,
  title,
  description,
  type = "WebPage",
  baseUrl = "https://chefiapp.com",
}: MarketSEOProps) {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Set meta description + OG tags
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", type === "WebSite" ? "website" : "article");
    setMeta("property", "og:url", `${baseUrl}${pagePath}`);

    // Remove old hreflang links
    document
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach((el) => el.remove());

    // Add hreflang for each supported market
    const markets = getSupportedMarkets();
    const hreflangs: Array<{ lang: string; href: string }> = [];

    for (const market of markets) {
      const route = market.landingRoute ?? pagePath;
      const lang = market.defaultLanguage;
      const region = market.countryCode.toLowerCase();
      hreflangs.push({
        lang: `${lang}-${region}`,
        href: `${baseUrl}${route}`,
      });
    }

    // Add x-default (main landing)
    hreflangs.push({ lang: "x-default", href: `${baseUrl}${pagePath}` });

    for (const { lang, href } of hreflangs) {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = lang;
      link.href = href;
      document.head.appendChild(link);
    }

    // Add canonical
    let canonical = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${baseUrl}${pagePath}`;

    // Add JSON-LD structured data
    const existingJsonLd = document.querySelector(
      "script[data-chefiapp-seo]",
    );
    if (existingJsonLd) existingJsonLd.remove();

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": type,
      name: title,
      description,
      url: `${baseUrl}${pagePath}`,
      inLanguage: markets.map((m) => m.defaultLanguage),
      ...(type === "WebSite"
        ? {
            potentialAction: {
              "@type": "SearchAction",
              target: `${baseUrl}/features?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }
        : {}),
      provider: {
        "@type": "Organization",
        name: "ChefiApp",
        url: baseUrl,
        logo: `${baseUrl}/logo-chefiapp.png`,
      },
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-chefiapp-seo", "true");
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      document
        .querySelectorAll('link[rel="alternate"][hreflang]')
        .forEach((el) => el.remove());
      document.querySelector("script[data-chefiapp-seo]")?.remove();
    };
  }, [pagePath, title, description, type, baseUrl]);

  return null;
}

/** Upsert a <meta> tag by attribute + key. */
function setMeta(attr: string, key: string, content: string) {
  let el = document.querySelector(
    `meta[${attr}="${key}"]`,
  ) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}
