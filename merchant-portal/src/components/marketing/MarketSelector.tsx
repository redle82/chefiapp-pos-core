/**
 * MarketSelector — Global country selector for marketing pages.
 *
 * Shows a dropdown with all available markets (supported + restricted).
 * Blocked markets are excluded. Restricted markets show a "Soon" badge.
 * On selection, persists the override and navigates to the market's landing route.
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, ChevronDown } from "lucide-react";
import { getAvailableMarkets } from "../../core/market/markets";
import {
  setCountryOverride,
  resolveGeoContext,
} from "../../core/market/GeoResolver";

/* ─── Country flag emojis (ISO 3166-1 alpha-2) ─── */
const FLAGS: Record<string, string> = {
  ES: "\uD83C\uDDEA\uD83C\uDDF8",
  GB: "\uD83C\uDDEC\uD83C\uDDE7",
  IE: "\uD83C\uDDEE\uD83C\uDDEA",
  AU: "\uD83C\uDDE6\uD83C\uDDFA",
  NZ: "\uD83C\uDDF3\uD83C\uDDFF",
  US: "\uD83C\uDDFA\uD83C\uDDF8",
  PT: "\uD83C\uDDF5\uD83C\uDDF9",
  NL: "\uD83C\uDDF3\uD83C\uDDF1",
  BE: "\uD83C\uDDE7\uD83C\uDDEA",
  FR: "\uD83C\uDDEB\uD83C\uDDF7",
  DE: "\uD83C\uDDE9\uD83C\uDDEA",
  IT: "\uD83C\uDDEE\uD83C\uDDF9",
  BR: "\uD83C\uDDE7\uD83C\uDDF7",
};

export function MarketSelector() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const geo = resolveGeoContext();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const allMarkets = getAvailableMarkets();
  const currentFlag = FLAGS[geo.countryCode] ?? "\uD83C\uDF0D";

  const handleSelectCountry = (countryCode: string) => {
    setCountryOverride(countryCode);
    const newGeo = resolveGeoContext({ countryOverride: countryCode });

    if (newGeo.market.landingRoute) {
      navigate(newGeo.market.landingRoute);
    } else {
      navigate("/");
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        aria-label="Select country"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">
          {currentFlag} {geo.countryCode}
        </span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#151518] border border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-50"
          role="listbox"
          aria-label="Select your market"
        >
          <div className="p-2">
            <p className="text-[10px] text-white/30 uppercase tracking-wider px-2 py-1">
              Select your market
            </p>
            {allMarkets.map((market) => (
              <button
                key={market.countryCode}
                type="button"
                role="option"
                aria-selected={market.countryCode === geo.countryCode}
                onClick={() => handleSelectCountry(market.countryCode)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  market.countryCode === geo.countryCode
                    ? "bg-amber-500/10 text-amber-500"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-base">
                  {FLAGS[market.countryCode] ?? "\uD83C\uDF0D"}
                </span>
                <span className="flex-1 text-left">{market.name}</span>
                {market.status === "restricted" && (
                  <span className="text-[10px] text-amber-500/60 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
