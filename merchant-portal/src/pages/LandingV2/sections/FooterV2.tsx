/**
 * Footer V2 — Clean, professional. Identity + links + final CTA.
 *
 * Identity rule: ChefIApp™ = motor invisível. Restaurant = protagonist.
 */
import { Link } from "react-router-dom";
import { ChefIAppSignature } from "../../../ui/design-system/sovereign/ChefIAppSignature";

const WHATSAPP_NUMBER =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: { VITE_CONTACT_WHATSAPP?: string } })
      ?.env?.VITE_CONTACT_WHATSAPP) ||
  "351000000000";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`;

const FOOTER_LINKS = [
  {
    title: "O Sistema",
    links: [
      { label: "O Sistema", href: "#plataforma" },
      { label: "Para quem", href: "#para-quem" },
      { label: "Preço", href: "#preco" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre", href: "mailto:contacto@chefiapp.com" },
      { label: "Blog", href: "mailto:contacto@chefiapp.com" },
      { label: "Carreiras", href: "mailto:contacto@chefiapp.com" },
    ],
  },
  {
    title: "Suporte",
    links: [
      { label: "WhatsApp", href: WHATSAPP_URL, external: true },
      { label: "Email", href: "mailto:contacto@chefiapp.com" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidade", href: "/legal/privacy" },
      { label: "Termos", href: "/legal/terms" },
    ],
  },
];

export const FooterV2 = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-neutral-950 relative">
      {/* Gradient divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/20 to-transparent" />

      {/* Final CTA */}
      <div className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Pronto para testar no{" "}
            <span className="bg-linear-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              mundo real?
            </span>
          </h2>
          <p className="text-neutral-400 text-lg mb-8 max-w-xl mx-auto">
            Regista o restaurante, monta o menu e faz a primeira venda. Tudo em
            menos de 25 minutos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth/phone"
              className="group inline-flex items-center justify-center px-10 py-5 text-lg font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30"
            >
              Começar 14 dias grátis
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
              Ou fale connosco no WhatsApp →
            </a>
          </div>
        </div>
      </div>

      {/* Links grid */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand col */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <ChefIAppSignature variant="full" size="sm" tone="gold" />
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Sistema operacional para restaurantes.
                <br />
                Feito por quem opera.
                <br />
                <span className="text-neutral-500">
                  Um restaurante não perde dinheiro num lugar só. O ChefIApp™
                  existe para fechar cada vazamento operacional.
                </span>
              </p>
            </div>

            {/* Link columns */}
            {FOOTER_LINKS.map((group) => (
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

      {/* Copyright */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-600">
            © {year} ChefIApp™. Todos os direitos reservados.
          </p>
          <p className="text-xs text-neutral-700">
            Feito com disciplina operacional.
          </p>
        </div>
      </div>
    </footer>
  );
};
