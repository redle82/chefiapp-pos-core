/**
 * MarketGuard — Route-level guard that blocks access based on market status.
 *
 * Wraps routes that require specific market capabilities.
 * Shows elegant unavailability messages for restricted/blocked markets.
 * Captures leads via waitlist for restricted markets.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Mail, ArrowLeft, Clock, ShieldAlert } from "lucide-react";
import { useMarket } from "./MarketContext";

interface MarketGuardProps {
  /** What capability is being guarded */
  requires: "onboarding" | "checkout" | "install";
  /** Children to render if market allows */
  children: React.ReactNode;
}

export function MarketGuard({ requires, children }: MarketGuardProps) {
  const { geo, canOnboard, canCheckout, canInstall, isBlocked, isRestricted } = useMarket();

  const isAllowed =
    requires === "onboarding" ? canOnboard :
    requires === "checkout" ? canCheckout :
    requires === "install" ? canInstall :
    false;

  if (isAllowed) {
    return <>{children}</>;
  }

  if (isBlocked) {
    return <BlockedMarketScreen market={geo.market.name} disclaimer={geo.market.disclaimer} />;
  }

  if (isRestricted) {
    return (
      <RestrictedMarketScreen
        market={geo.market.name}
        disclaimer={geo.market.disclaimer}
        requires={requires}
      />
    );
  }

  return <>{children}</>;
}

/* ─── Blocked Market Screen ─── */
function BlockedMarketScreen({
  market,
  disclaimer,
}: {
  market: string;
  disclaimer: string | null;
}) {
  return (
    <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          Not available in {market}
        </h1>
        <p className="text-neutral-400 mb-6">
          {disclaimer ?? "ChefiApp is not yet available in your region. We're working on expanding to more markets."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white text-sm hover:border-amber-500/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <a
            href="mailto:contacto@chefiapp.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact us
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Restricted Market Screen (with waitlist) ─── */
function RestrictedMarketScreen({
  market,
  disclaimer,
  requires,
}: {
  market: string;
  disclaimer: string | null;
  requires: string;
}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // TODO: Send to backend / analytics
    if (import.meta.env.DEV) {
      console.log("[Market] Waitlist signup:", { email, market, requires });
    }

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">
          Coming soon to {market}
        </h1>
        <p className="text-neutral-400 mb-6">
          {disclaimer ?? "ChefiApp is expanding to your region. Join the waitlist and we'll notify you when we launch."}
        </p>

        {!submitted ? (
          <form onSubmit={handleWaitlist} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-neutral-500 text-sm focus:border-amber-500/50 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors"
            >
              Join the waitlist
            </button>
          </form>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-emerald-400 text-sm font-medium">
              You're on the list! We'll reach out when ChefiApp launches in {market}.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:text-white hover:border-white/20 transition-colors"
          >
            <Globe className="w-4 h-4" />
            Explore the platform
          </Link>
        </div>
      </div>
    </div>
  );
}
