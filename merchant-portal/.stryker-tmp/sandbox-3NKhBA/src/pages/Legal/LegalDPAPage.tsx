/**
 * LegalDPAPage — Acordo de Tratamento de Dados (Data Processing Agreement).
 * Conteúdo jurídico para subcontratados/processadores; referência em /legal/privacy.
 */
// @ts-nocheck


import { useTranslation } from "react-i18next";

const sectionClass = "mt-8";
const headingClass = "text-xl font-semibold text-white mb-2";
const paraClass = "text-white/70 leading-relaxed mt-2";

export function LegalDPAPage() {
  const { t } = useTranslation("legal");
  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white">
      <div className="container mx-auto px-6 py-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("dpaTitle")}</h1>
        <p className={paraClass}>{t("dpaIntro1")}</p>
        <p className={paraClass}>{t("dpaIntro2")}</p>

        <section className={sectionClass}>
          <h2 className={headingClass}>{t("dpaS1Title")}</h2>
          <p className={paraClass}>{t("dpaS1Body")}</p>
        </section>
        <section className={sectionClass}>
          <h2 className={headingClass}>{t("dpaS2Title")}</h2>
          <p className={paraClass}>{t("dpaS2Body")}</p>
        </section>
        <section className={sectionClass}>
          <h2 className={headingClass}>{t("dpaS3Title")}</h2>
          <p className={paraClass}>{t("dpaS3Body")}</p>
        </section>
      </div>
    </main>
  );
}
