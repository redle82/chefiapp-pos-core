/**
 * Footer V2 — Clean, professional. Identity + links + final CTA.
 * Copy via useLandingLocale (i18n/landingV2Copy).
 */
import { Link } from "react-router-dom";
import { MadeWithLoveFooter } from "../../../components/MadeWithLoveFooter";
import { useLandingLocale } from "../i18n/LandingLocaleContext";

const WHATSAPP_NUMBER =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: { VITE_CONTACT_WHATSAPP?: string } })
      ?.env?.VITE_CONTACT_WHATSAPP) ||
  "351000000000";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`;

export const FooterV2 = () => {
  const { t } = useLandingLocale();
  const year = new Date().getFullYear();

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
          href: WHATSAPP_URL,
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
              href={WHATSAPP_URL}
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
