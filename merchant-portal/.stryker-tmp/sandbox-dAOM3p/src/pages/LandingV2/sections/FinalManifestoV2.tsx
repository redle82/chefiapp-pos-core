/**
 * FinalManifestoV2 — fecho narrativo da landing.
 *
 * Copy em i18n/landingV2Copy (finalManifesto). Voz CEO: contraste ferramentas vs sistema operacional.
 */
// @ts-nocheck

import { useLandingLocale } from "../i18n/LandingLocaleContext";

export const FinalManifestoV2 = () => {
  const { t } = useLandingLocale();
  return (
    <section className="py-20 md:py-24 bg-[#050505] border-t border-white/5">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
          {t("finalManifesto.headline1")}
          <br />
          {t("finalManifesto.headline2")}
        </h2>
        <p className="text-neutral-400 text-sm md:text-base leading-relaxed mb-4">
          {t("finalManifesto.body1")}
        </p>
        <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
          {t("finalManifesto.body2")}{" "}
          <span className="text-neutral-100">{t("finalManifesto.callout")}</span>
        </p>
      </div>
    </section>
  );
};

