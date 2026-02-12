/**
 * TargetAudience V2 — "Feito para..."
 *
 * Visual cards showing who ChefIApp™ is built for.
 * SVG icons for professional look.
 */

const AUDIENCES = [
  {
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z"
        />
      </svg>
    ),
    title: "Restaurantes de Serviço Completo",
    desc: "Sala, cozinha, bar e caixa sincronizados. Gestão de mesas, reservas e turnos incluídos.",
    features: ["Mapa de mesas", "Reservas", "KDS integrado"],
  },
  {
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
        />
      </svg>
    ),
    title: "Bares & Gastrobares",
    desc: "Atendimento rápido ao balcão. Controle de consumo por cliente e fecho de caixa simplificado.",
    features: ["Pedidos rápidos", "Conta por cliente", "Staff flexível"],
  },
  {
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
        />
      </svg>
    ),
    title: "Dark Kitchens",
    desc: "Foco total na produção. Pedidos online, filas de preparo e analytics de velocidade.",
    features: ["Pedidos online", "KDS prioritário", "Menu digital"],
  },
  {
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
        />
      </svg>
    ),
    title: "Operacoes Multi-marca",
    desc: "Varios conceitos, um sistema operacional. Cardapios distintos com dados consolidados.",
    features: ["Multi-restaurante", "Analytics unificado", "Equipa partilhada"],
  },
];

export const TargetAudienceV2 = () => {
  return (
    <section id="para-quem" className="py-24 md:py-32 bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
            Para quem e
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Feito para quem leva
            <br />
            <span className="text-amber-500">a operacao a serio.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {AUDIENCES.map((a) => (
            <div
              key={a.title}
              className="group p-8 rounded-2xl border border-white/5 bg-[#0a0a0a] hover:border-amber-500/20 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-5 group-hover:bg-amber-500/20 transition-colors">
                {a.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-500 transition-colors">
                {a.title}
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed mb-5">
                {a.desc}
              </p>
              <div className="flex flex-wrap gap-2">
                {a.features.map((f) => (
                  <span
                    key={f}
                    className="text-xs px-3 py-1 rounded-full bg-white/5 text-neutral-400 border border-white/5"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
