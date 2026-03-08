import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

const sectionClass = "mt-8";
const headingClass = "text-xl font-semibold text-white mb-2";
const paraClass = "text-white/70 leading-relaxed mt-2";

export function LegalPrivacyPage() {
  const { t } = useTranslation("legal");
  const [searchParams] = useSearchParams();
  const country = searchParams.get("country") || undefined;
  return (
    <main
      className="min-h-screen bg-[#0b0b0f] text-white"
      data-legal-country={country ?? ""}
    >
      <div className="container mx-auto px-6 py-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("privacyTitle")}</h1>
        <p className={paraClass}>{t("privacyIntro1")}</p>
        <p className={paraClass}>{t("privacyIntro2")}</p>

        <section className={sectionClass}>
          <h2 className={headingClass}>{t("privacyS1Title")}</h2>
          <p className={paraClass}>{t("privacyS1Body")}</p>
        </section>
        <section className={sectionClass}>
          <h2 className={headingClass}>{t("privacyS2Title")}</h2>
          <p className={paraClass}>{t("privacyS2Body")}</p>
        </section>
        <section className={sectionClass}>
          <h2 className={headingClass}>{t("privacyS3Title")}</h2>
          <p className={paraClass}>{t("privacyS3Body")}</p>
        </section>
        <section className={sectionClass}>
          <h2 className={headingClass}>{t("privacyS4Title")}</h2>
          <p className={paraClass}>{t("privacyS4Body")}</p>
        </section>
      </div>
    </main>
  );
}
