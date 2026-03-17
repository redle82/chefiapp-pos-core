/**
 * Segurança e dados — Página pública. Só afirmações verificáveis.
 * Contrato: [TECNICAS_AVANCADAS_SILICON_VALLEY.md] — confiança técnica sem promessas falsas.
 * Rota: /security
 */
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../components/MadeWithLoveFooter";

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function SecurityPage() {
  const { t } = useTranslation("common");

  const metaTitle = t("security.metaTitle");
  const metaDescription = t("security.metaDescription");

  useEffect(() => {
    const prevTitle = document.title;
    document.title = metaTitle;
    setMeta("description", metaDescription);
    setMeta("og:title", metaTitle, true);
    setMeta("og:description", metaDescription, true);
    setMeta("og:type", "website", true);
    return () => {
      document.title = prevTitle;
    };
  }, [metaTitle, metaDescription]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-white/5 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/landing-v2" className="flex items-center gap-2">
            <img
              src="/logo-chefiapp-clean.png"
              alt="ChefIApp"
              className="w-6 h-6 rounded"
            />
            <span className="text-sm font-semibold text-white">ChefIApp</span>
          </Link>
          <Link
            to="/auth/phone"
            className="text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors"
          >
            {t("security.tryFree")}
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12 md:py-16">
        <p className="text-amber-500/90 text-sm font-medium uppercase tracking-wider mb-4">
          {t("security.badge")}
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          {t("security.heading")}
        </h1>
        <p className="text-neutral-400 text-lg mb-12">
          {t("security.intro")}
        </p>

        <section className="space-y-10 mb-14">
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">
              {t("security.sessionAccessTitle")}
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              {t("security.sessionAccessBody")}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">
              {t("security.noDataSaleTitle")}
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              {t("security.noDataSaleBody")}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">
              {t("security.infrastructureTitle")}
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              {t("security.infrastructureBody")}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">
              {t("security.privacyTitle")}
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              {t("security.privacyBodyPrefix")}{" "}
              <Link
                to="/legal/privacy"
                className="text-amber-500 hover:text-amber-400 underline"
              >
                {t("security.privacyPolicyLink")}
              </Link>
              . {t("security.privacyBodySuffix")}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">
              {t("security.disclaimerTitle")}
            </h2>
            <p className="text-neutral-400 leading-relaxed">
              {t("security.disclaimerBody")}
            </p>
          </div>
        </section>

        <nav className="pt-8 border-t border-white/5 flex flex-wrap gap-4">
          <Link
            to="/legal/privacy"
            className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
          >
            {t("security.navPrivacy")}
          </Link>
          <Link
            to="/legal/terms"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            {t("security.navTerms")}
          </Link>
          <Link
            to="/legal/dpa"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            {t("security.navDpa")}
          </Link>
          <Link
            to="/landing-v2"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            {t("security.navBackToLanding")}
          </Link>
        </nav>
      </article>

      <MadeWithLoveFooter variant="default" />
    </main>
  );
}
