/**
 * FAQ V2 — Strategic objection killer.
 * Copy via useLandingLocale + getFAQ (i18n/landingV2Copy).
 */
import { useRef, useState } from "react";
import { CANONICAL_MONTHLY_PRICE_LABEL } from "../../../core/pricing/canonicalPrice";
import { getFAQ, type FAQItem } from "../i18n/landingV2Copy";
import { useLandingLocale } from "../i18n/LandingLocaleContext";

const PRICE_PLACEHOLDER = "{{price}}";

function resolveAnswer(a: string): string {
  return a.replace(PRICE_PLACEHOLDER, CANONICAL_MONTHLY_PRICE_LABEL);
}

function FAQItem({ q, a }: FAQItem) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`border-b border-white/5 transition-colors duration-300 ${
        open ? "bg-neutral-900/30" : "hover:bg-neutral-900/20"
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-6 px-6 text-left group"
      >
        <span className="text-base font-semibold text-white pr-4 group-hover:text-amber-500/90 transition-colors duration-200">
          {q}
        </span>
        <span
          className={`text-neutral-500 transition-all duration-300 shrink-0 ${
            open ? "rotate-45 text-amber-500" : ""
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </span>
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: open ? contentRef.current?.scrollHeight ?? 200 : 0,
          opacity: open ? 1 : 0,
        }}
      >
        <div className="px-6 pb-6">
          <p className="text-sm text-neutral-400 leading-relaxed max-w-3xl">
            {resolveAnswer(a)}
          </p>
        </div>
      </div>
    </div>
  );
}

export const FAQV2 = () => {
  const { locale } = useLandingLocale();
  const faq = getFAQ(locale);

  return (
    <section
      id="faq"
      className="py-24 md:py-32 bg-[#0a0a0a] relative overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/3 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6 relative">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
            {faq.sectionLabel}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            {faq.headline}{" "}
            <span className="bg-linear-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              {faq.headlineAccent}
            </span>
          </h2>
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm shadow-2xl shadow-black/30 ring-1 ring-white/5">
          {faq.items.map((item) => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-neutral-500 text-sm mb-4">{faq.anotherQuestion}</p>
          <a
            href="mailto:contacto@chefiapp.com"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white hover:border-amber-500/30 hover:bg-white/5 transition-all text-sm font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>{" "}
            {faq.contactUs}
          </a>
        </div>
      </div>
    </section>
  );
};
