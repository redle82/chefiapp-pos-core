/**
 * PricingByCountry — Preços por moeda local.
 * Smart toggle: Monthly / Annual (-20%). Tracks pricing_toggle, pricing_conversion_click.
 * Ref: docs/commercial/PRICING_AND_PACKAGES.md
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  commercialTracking,
  detectDevice,
  isCommercialTrackingEnabled,
} from "../../commercial/tracking";
import { type CountryConfig, type SupportedCurrency } from "../countries";
import { CURRENCY_SYMBOLS, getMonthlyPrice } from "../pricingEngine";

export interface PricingByCountryProps {
  country: CountryConfig;
  className?: string;
}

export function PricingByCountry({
  country,
  className,
}: PricingByCountryProps) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const sectionRef = useRef<HTMLElement>(null);
  const trackedRef = useRef(false);

  const handleToggle = useCallback(() => {
    const next: "monthly" | "annual" =
      billing === "monthly" ? "annual" : "monthly";
    setBilling(next);
    if (isCommercialTrackingEnabled()) {
      commercialTracking.track({
        timestamp: new Date().toISOString(),
        country: country.code,
        segment: "small",
        landing_version: "country-v1",
        device: detectDevice(),
        path: typeof window !== "undefined" ? window.location.pathname : "",
        event: "pricing_toggle",
        value: next,
      });
    }
  }, [billing, country.code]);

  const handleConversionClick = useCallback(
    (plan: string) => {
      if (isCommercialTrackingEnabled()) {
        commercialTracking.track({
          timestamp: new Date().toISOString(),
          country: country.code,
          segment: "small",
          landing_version: "country-v1",
          device: detectDevice(),
          path: typeof window !== "undefined" ? window.location.pathname : "",
          event: "pricing_conversion_click",
          plan,
          billing,
        });
      }
    },
    [country.code, billing]
  );

  // Track pricing_view once section enters viewport
  useEffect(() => {
    if (
      !isCommercialTrackingEnabled() ||
      !sectionRef.current ||
      trackedRef.current
    )
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !trackedRef.current) {
          trackedRef.current = true;
          const base = {
            timestamp: new Date().toISOString(),
            country: country.code,
            segment: "small" as const,
            landing_version: "country-v1",
            device: detectDevice(),
            path: typeof window !== "undefined" ? window.location.pathname : "",
          };
          commercialTracking.track({
            ...base,
            event: "pricing_view",
            plan: "all",
          });
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [country.code]);
  const currency = country.currency as SupportedCurrency;
  const symbol = CURRENCY_SYMBOLS[currency] ?? "€";

  return (
    <section
      ref={sectionRef}
      id="preco"
      className={`py-24 bg-neutral-950 px-6 ${className ?? ""}`}
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
          {country.locale === "en"
            ? "Simple pricing"
            : country.locale === "es"
            ? "Precios simples"
            : "Preços simples"}
        </h2>
        <p className="text-neutral-400 text-center mb-6">
          {country.locale === "en"
            ? "Core + POS + Workforce. One price, everything included."
            : country.locale === "es"
            ? "Core + POS + Workforce. Un precio, todo incluido."
            : "Core + POS + Workforce. Um preço, tudo incluído."}
        </p>

        <div className="flex justify-center gap-2 mb-12">
          <button
            type="button"
            onClick={handleToggle}
            aria-pressed={billing === "monthly"}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              billing === "monthly"
                ? "bg-amber-500 text-black"
                : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            {country.locale === "en" ? "Monthly" : country.locale === "es" ? "Mensual" : "Mensal"}
          </button>
          <button
            type="button"
            onClick={handleToggle}
            aria-pressed={billing === "annual"}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              billing === "annual"
                ? "bg-amber-500 text-black"
                : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            {country.locale === "en"
              ? `Annual (-${Math.round(20)}%)`
              : country.locale === "es"
                ? `Anual (-${Math.round(20)}%)`
                : `Anual (-${Math.round(20)}%)`}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {(
            [
              { key: "starter" as const, label: "Starter" },
              { key: "pro" as const, label: "Pro" },
              { key: "enterprise" as const, label: "Enterprise" },
            ] as const
          ).map(({ key, label }) => {
            const displayPrice = getMonthlyPrice(key, currency, billing === "annual");
            const period =
              billing === "annual"
                ? country.locale === "en"
                  ? "/year"
                  : country.locale === "es"
                  ? "/año"
                  : "/ano"
                : country.locale === "en"
                ? "/month"
                : "/mês";
            return (
              <div
                key={key}
                className="rounded-2xl border border-amber-500/20 bg-neutral-900/50 p-6"
              >
                <h3 className="text-lg font-bold text-white mb-2">{label}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black text-white tabular-nums">
                    {displayPrice}
                    {symbol}
                  </span>
                  <span className="text-neutral-500 text-sm">{period}</span>
                </div>
                <Link
                  to="/auth/phone"
                  onClick={() => handleConversionClick(key)}
                  className="block w-full text-center py-3 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
                >
                  {country.locale === "en" ? "Start free" : "Começar grátis"}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
