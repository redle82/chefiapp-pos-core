/**
 * StickyCTAMobile — Fixed bottom CTA bar on mobile.
 * Shows "Get in touch" / WhatsApp. Hidden on desktop.
 */
import { useEffect, useState } from "react";
import type { CountryConfig } from "../countries";
import { WhatsAppCTA } from "./WhatsAppCTA";

export interface StickyCTAMobileProps {
  onLeadClick: () => void;
  country: CountryConfig;
  locale: string;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export function StickyCTAMobile({
  onLeadClick,
  country,
  locale,
}: StickyCTAMobileProps) {
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  const label =
    locale === "es"
      ? "Contactar"
      : locale === "pt-BR" || locale === "pt-PT"
        ? "Contactar"
        : "Get in touch";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-3 px-4 py-3 bg-[#0a0a0a]/95 backdrop-blur border-t border-white/10 md:hidden"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <button
        type="button"
        onClick={onLeadClick}
        className="flex-1 py-2.5 px-4 rounded-lg font-medium bg-amber-500 text-black hover:bg-amber-400 transition-colors"
      >
        {label}
      </button>
      {country.whatsAppNumber && (
        <WhatsAppCTA country={country} placement="sticky_mobile" />
      )}
    </div>
  );
}
