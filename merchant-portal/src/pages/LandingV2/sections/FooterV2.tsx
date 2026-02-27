/**
 * Footer V2 — Clean, professional. Identity + links + final CTA.
 * Copy via useLandingLocale (i18n/landingV2Copy).
 * WhatsApp: uses country-specific number when on /{countryCode} route,
 * falls back to VITE_CONTACT_WHATSAPP env var for /landing.
 */
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../../components/MadeWithLoveFooter";
import { useLandingLocale } from "../i18n/LandingLocaleContext";

const ENV_WHATSAPP_NUMBER =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: { VITE_CONTACT_WHATSAPP?: string } })
      ?.env?.VITE_CONTACT_WHATSAPP) ||
  "351000000000";

export const FooterV2 = () => {
  const { t, country } = useLandingLocale();
  const year = new Date().getFullYear();

  // Country-specific WhatsApp — hide CTA if whatsAppNumber is empty (e.g. US)
  const whatsAppNumber = country?.config.whatsAppNumber || ENV_WHATSAPP_NUMBER;
  const hasWhatsApp = !!whatsAppNumber && whatsAppNumber !== "351000000000";
  const whatsAppBase = `https://wa.me/${whatsAppNumber.replace(/\D/g, "")}`;
  const whatsAppMsg = encodeURIComponent(
    country?.config.whatsAppMessage ??
      "Olá, quero agendar uma demo do ChefIApp.",
  );
  const whatsAppUrl = `${whatsAppBase}?text=${whatsAppMsg}`;

  const footerGroups = [
    {
      title: t("footer.groupSystem"),
      links: [
        { label: t("footer.linkSystem"), href: "#plataforma" },
        { label: t("footer.linkAudience"), href: "#para-quem" },
        { label: t("footer.linkPrice"), href: "#preco" },
        { label: t("footer.linkFaq"), href: "#faq" },
      ],
    },
    {
      title: t("footer.groupCompany"),
      links: [
        { label: t("footer.linkAbout"), href: "mailto:contacto@chefiapp.com" },
        { label: t("footer.linkBlog"), href: "/blog/tpv-restaurantes" },
        { label: t("footer.linkChangelog"), href: "/changelog" },
        {
          label: t("footer.linkCareers"),
          href: "mailto:contacto@chefiapp.com",
        },
      ],
    },
    {
      title: t("footer.groupSupport"),
      links: [
        {
          label: t("footer.linkWhatsApp"),
          href: whatsAppUrl,
          external: true as const,
        },
        { label: t("footer.linkEmail"), href: "mailto:contacto@chefiapp.com" },
        { label: t("footer.linkStatus"), href: "/status" },
      ],
    },
    {
      title: t("footer.groupLegal"),
      links: [
        { label: t("footer.linkPrivacy"), href: "/legal/privacy" },
        { label: t("footer.linkTerms"), href: "/legal/terms" },
        { label: t("footer.linkSecurity"), href: "/security" },
      ],
    },
  ];

  return (
    <footer className="bg-neutral-950 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/20 to-transparent" />

      <div className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            {t("footer.ctaHeadline")}{" "}
            <span className="bg-linear-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              {t("footer.ctaHeadlineAccent")}
            </span>
          </h2>
          <p className="text-neutral-400 text-lg mb-8 max-w-xl mx-auto">
            {t("footer.ctaSub")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
            <Link
              to="/auth/phone"
              className="group inline-flex items-center justify-center px-10 py-5 text-lg font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30"
            >
              {t("footer.ctaButton")}
              <svg
                className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200"
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
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/60 transition-all"
            >
              {t("footer.agendarDemo")}
              <svg
                className="w-4 h-4 ml-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
            <a
              href={whatsAppBase}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-neutral-400 hover:text-emerald-400 transition-colors font-medium"
            >
              {t("footer.whatsapp")}
            </a>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/logo-chefiapp-clean.png"
                  alt="ChefIApp"
                  className="w-7 h-7 rounded"
                />
                <span className="text-sm font-semibold text-white">
                  ChefIApp
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {t("footer.tagline")}
                <br />
                {t("footer.taglineBy")}
                <br />
                <span className="text-neutral-500">
                  {t("footer.taglineMission")}
                </span>
              </p>
            </div>

            {footerGroups.map((group) => (
              <div key={group.title}>
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                  {group.title}
                </h4>
                <ul className="space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {"external" in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-neutral-400 hover:text-white transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : link.href.startsWith("mailto:") ||
                        link.href.startsWith("#") ? (
                        <a
                          href={link.href}
                          className="text-sm text-neutral-400 hover:text-white transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-sm text-neutral-400 hover:text-white transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-600">
            © {year} ChefIApp™. {t("footer.copyright")}
          </p>
          <MadeWithLoveFooter variant="inline" />
        </div>
      </div>
    </footer>
  );
};
