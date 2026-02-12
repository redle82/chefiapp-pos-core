/**
 * CTA Banner V2 — Repeated conversion band
 *
 * Toast repeats CTAs throughout the page. This is a reusable
 * interstitial banner placed between sections.
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
  const bgClass =
    variant === "warm"
      ? "bg-gradient-to-r from-amber-950/30 via-amber-900/20 to-amber-950/30"
      : "bg-neutral-950";

  return (
    <section className={`py-16 md:py-20 ${bgClass} border-y border-white/5`}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-8">
          {headline}
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/auth"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all hover:-translate-y-0.5 shadow-lg shadow-amber-500/20"
          >
            {cta}
          </Link>
          <a
            href="#plataforma"
            className="text-sm text-neutral-400 hover:text-white transition-colors font-medium"
          >
            ou ver como funciona →
          </a>
        </div>
      </div>
    </section>
  );
};
