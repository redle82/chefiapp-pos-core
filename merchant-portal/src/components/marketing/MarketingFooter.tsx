import { Link } from "react-router-dom";

const LINK_GROUPS = [
  {
    title: "Produto",
    links: [
      { label: "Features", to: "/features" },
      { label: "Preços", to: "/pricing" },
      { label: "Comparar", to: "/compare" },
      { label: "Changelog", to: "/changelog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Termos", to: "/legal/terms" },
      { label: "Privacidade", to: "/legal/privacy" },
      { label: "DPA", to: "/legal/dpa" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre", to: "/about" },
      { label: "Segurança", to: "/security" },
      { label: "Status", to: "/status" },
      { label: "Blog", to: "/blog" },
    ],
  },
] as const;

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-white/[0.02] mt-20">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-amber-500 text-lg">◆</span>
              <span className="text-white font-semibold text-sm">ChefiApp™ OS</span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              Sistema Operacional do Restaurante
            </p>
            <Link
              to="/auth/email"
              className="inline-flex items-center mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors"
            >
              Começar grátis
            </Link>
          </div>

          {LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                {group.title}
              </h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © 2024-{new Date().getFullYear()} ChefiApp™ OS · goldmonkey.studio
          </p>
          <a
            href="https://wa.me/351000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </footer>
  );
}
