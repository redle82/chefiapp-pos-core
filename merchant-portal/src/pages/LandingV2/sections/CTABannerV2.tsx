/**
 * CTA Banner V2 — Premium conversion interstitial
 *
 * Gradient ambient glow, arrow micro-interaction,
 * hover shadow escalation. Reusable between sections.
 */
import { Link } from "react-router-dom";

interface CTABannerV2Props {
  headline: string;
  cta: string;
  variant?: "default" | "warm";
}

export const CTABannerV2 = ({
  headline,
  cta,
  variant = "default",
}: CTABannerV2Props) => {
  return (
    <section className="relative py-20 md:py-24 overflow-hidden">
      {/* Gradient dividers */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/20 to-transparent" />

      {/* Ambient glow */}
      {variant === "warm" && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-500/5 rounded-full blur-[120px]" />
        </div>
      )}

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img
            src="/logo-chefiapp-clean.png"
            alt="ChefIApp"
            className="w-8 h-8 rounded-lg shadow-[0_0_16px_rgba(245,158,11,0.25)]"
          />
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
            {headline}
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/auth/email"
            className="group inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30"
          >
            {cta}
            <svg
              className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
          <a
            href="#plataforma"
            className="text-sm text-neutral-400 hover:text-white transition-colors duration-200 font-medium"
          >
            ou ver como funciona →
          </a>
        </div>
      </div>
    </section>
  );
};
