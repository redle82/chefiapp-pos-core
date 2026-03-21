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
              to="/auth/email"
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
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/logo-chefiapp-clean.png"
                  alt="ChefIApp"
                  className="w-12 h-12 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/20"
                />
                <div>
                  <span className="text-base font-bold text-white block">
                    ChefIApp
                    <span className="font-normal text-neutral-500 ml-0.5">
                      ™ OS
                    </span>
                  </span>
                </div>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed mb-3">
                O sistema operacional que o teu restaurante merece.
              </p>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {t("footer.tagline")}
                <br />
                {t("footer.taglineBy")}
                <br />
                <span className="text-neutral-500">
                  {t("footer.taglineMission")}
                </span>
              </p>
              {/* Social links placeholder */}
              <div className="flex items-center gap-3 mt-4">
                <a
                  href="https://twitter.com/chefiapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-600 hover:text-amber-500 transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://instagram.com/chefiapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-600 hover:text-amber-500 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com/company/chefiapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-600 hover:text-amber-500 transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
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
