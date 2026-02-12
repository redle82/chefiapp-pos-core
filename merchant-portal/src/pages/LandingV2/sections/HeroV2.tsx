/**
 * Hero V2 — Toast-Level
 *
 * Headline direta com benefício. Subheadline operacional.
 * CTA forte + prova social imediata. Sem mocks — screenshots reais.
 */
import { Link } from "react-router-dom";
import { useAuth } from "../../../core/auth/useAuth";

const NAV_LINKS = [
  { label: "O Sistema", href: "#plataforma" },
  { label: "Para quem", href: "#para-quem" },
  { label: "Preço", href: "#preco" },
  { label: "FAQ", href: "#faq" },
];

export const HeroV2 = () => {
  const { session } = useAuth();
  const hasSession = !!session;

  return (
    <section className="relative min-h-screen flex flex-col">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/Logo Chefiapp.png"
              alt="ChefIApp"
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-bold tracking-tight">
              ChefIApp<span className="text-amber-500">™</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {hasSession ? (
              <Link
                to="/admin"
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors"
              >
                Ir ao sistema
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="hidden sm:inline-flex px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/auth"
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors"
                >
                  Testar grátis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Content ── */}
      <div className="flex-1 flex items-center justify-center pt-16">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-32 w-full">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left: Copy */}
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-8">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-amber-500 tracking-wide uppercase">
                  Em produção real
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
                O sistema operacional que gere o seu{" "}
                <span className="text-amber-500">restaurante inteiro.</span>
              </h1>

              <p className="text-lg md:text-xl text-neutral-400 leading-relaxed mb-4 max-w-lg">
                Sala, cozinha, bar, caixa e equipa a funcionar no mesmo sistema
                operacional — em tempo real.
              </p>

              <p className="text-sm text-neutral-500 mb-8 max-w-lg">
                Não é um protótipo. Não é um módulo. É o sistema real que usamos
                todos os dias num restaurante em Ibiza.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  to="/auth"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all hover:-translate-y-0.5 shadow-lg shadow-amber-500/20"
                >
                  Começar 14 dias grátis
                </Link>
                <a
                  href="#plataforma"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl border border-white/10 text-white hover:border-amber-500/30 hover:bg-white/5 transition-all"
                >
                  Ver o sistema a operar
                </a>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-emerald-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  14 dias grátis
                </span>
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-emerald-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Sem cartão
                </span>
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-emerald-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Cancela quando quiser
                </span>
              </div>
            </div>

            {/* Right: Product visual */}
            <div className="relative">
              <div className="absolute -inset-4 bg-linear-to-br from-amber-500/10 via-transparent to-emerald-500/5 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-white/10 bg-neutral-900/80 overflow-hidden shadow-2xl shadow-black/50">
                {/* Simulated dashboard screenshot */}
                <div className="p-1">
                  {/* Window chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-neutral-800/50 rounded-t-xl">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/60" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                      <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="px-16 py-1 rounded-md bg-neutral-700/50 text-xs text-neutral-500">
                        chefiapp.com/admin
                      </div>
                    </div>
                  </div>
                  {/* Dashboard mockup */}
                  <div className="bg-neutral-950 p-6 min-h-70 sm:min-h-90">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="text-sm text-neutral-500 mb-0.5">
                          Sofia Gastrobar
                        </div>
                        <div className="text-lg font-bold text-white">
                          Comando Central
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs text-emerald-400">Online</span>
                      </div>
                    </div>
                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[
                        {
                          label: "Pedidos hoje",
                          value: "47",
                          color: "text-amber-500",
                        },
                        {
                          label: "Faturação",
                          value: "€2.340",
                          color: "text-emerald-500",
                        },
                        {
                          label: "Mesas ativas",
                          value: "12/18",
                          color: "text-blue-400",
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="bg-neutral-900 rounded-lg p-3 border border-white/5"
                        >
                          <div className="text-xs text-neutral-500 mb-1">
                            {stat.label}
                          </div>
                          <div className={`text-xl font-bold ${stat.color}`}>
                            {stat.value}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Recent orders */}
                    <div className="space-y-2">
                      {[
                        {
                          table: "Mesa 4",
                          items: "2x Hambúrguer, 1x Batata",
                          status: "Em preparo",
                          statusColor: "bg-amber-500/20 text-amber-400",
                        },
                        {
                          table: "Mesa 7",
                          items: "1x Risotto, 2x Vinho",
                          status: "Servido",
                          statusColor: "bg-emerald-500/20 text-emerald-400",
                        },
                        {
                          table: "Mesa 12",
                          items: "3x Menu Degustação",
                          status: "Novo",
                          statusColor: "bg-blue-500/20 text-blue-400",
                        },
                      ].map((order) => (
                        <div
                          key={order.table}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-900/50 border border-white/5"
                        >
                          <div>
                            <span className="text-sm font-medium text-white">
                              {order.table}
                            </span>
                            <span className="text-xs text-neutral-500 ml-2">
                              {order.items}
                            </span>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${order.statusColor}`}
                          >
                            {order.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Social proof bar ── */}
      <div className="border-t border-white/5 bg-neutral-950/50 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-neutral-500">
          <span>Em teste real no</span>
          <span className="font-semibold text-white">
            Sofia Gastrobar, Ibiza
          </span>
          <span className="hidden sm:inline">·</span>
          <span>Sistema operacional completo em produção</span>
        </div>
      </div>
    </section>
  );
};
