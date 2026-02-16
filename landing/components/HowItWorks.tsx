"use client";

import { useTranslation } from "@/lib/useTranslation";

export function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    { titleKey: "step_1_title", descKey: "step_1_desc", num: "1" },
    { titleKey: "step_2_title", descKey: "step_2_desc", num: "2" },
    { titleKey: "step_3_title", descKey: "step_3_desc", num: "3" },
  ];
  return (
    <section
      id="how"
      className="py-20 md:py-24 px-6 border-t border-white/5 bg-neutral-950/30"
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4 text-center">
          {t("how_title")}
        </h2>
        <p className="text-neutral-400 text-center mb-12">
          {t("how_subtitle")}
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.num}
              className="relative rounded-2xl border border-white/10 bg-neutral-900/50 p-6"
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 font-bold text-lg mb-4">
                {step.num}
              </span>
              <h3 className="text-lg font-semibold text-white mb-2">
                {t(step.titleKey)}
              </h3>
              <p className="text-neutral-400 text-sm">{t(step.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
