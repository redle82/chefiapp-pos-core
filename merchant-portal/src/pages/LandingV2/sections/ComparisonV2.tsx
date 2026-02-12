/**
 * Comparison V2 — "Por que diferente?"
 *
 * Premium comparison table with row hover effects,
 * gradient header accents, and stronger visual contrast.
 */

const ROWS = [
  {
    aspect: "Setup inicial",
    traditional: "Dias ou semanas com técnico",
    chefiapp: "Pronto em menos de 25 minutos",
  },
  {
    aspect: "Sistemas",
    traditional: "POS + Staff + Stock separados",
    chefiapp: "Tudo integrado num único OS",
  },
  {
    aspect: "Suporte",
    traditional: "Ticket e espera",
    chefiapp: "WhatsApp direto",
  },
  {
    aspect: "Alterações no menu",
    traditional: "Depende de terceiros",
    chefiapp: "Você altera na hora",
  },
  {
    aspect: "Contrato",
    traditional: "Fidelização 12-24 meses",
    chefiapp: "Sem contrato. Cancela a qualquer momento.",
  },
  {
    aspect: "Custo de hardware",
    traditional: "€2.000-€5.000 em equipamento",
    chefiapp: "Funciona no tablet ou PC que já tens",
  },
  {
    aspect: "Actualizações",
    traditional: "Pagas e com interrupção",
    chefiapp: "Automáticas e contínuas",
  },
];

export const ComparisonV2 = () => {
  return (
    <section className="py-24 md:py-32 bg-[#0a0a0a] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-amber-500/3 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
            A diferença
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Porque mudar{" "}
            <span className="bg-linear-to-r from-amber-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              faz sentido.
            </span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            A maioria dos restaurantes opera com ferramentas desconectadas. O
            ChefIApp™ OS elimina essa fricção.
          </p>
        </div>

        {/* Comparison table */}
        <div className="rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="grid grid-cols-3 bg-neutral-900/90">
            <div className="p-4 md:p-5 text-sm font-semibold text-neutral-500" />
            <div className="p-4 md:p-5 text-sm font-semibold text-neutral-500 text-center border-l border-white/5">
              Modelo Tradicional
            </div>
            <div className="p-4 md:p-5 text-sm font-semibold text-center border-l border-white/5">
              <span className="bg-linear-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
                ChefIApp™ OS
              </span>
            </div>
          </div>

          {/* Rows */}
          {ROWS.map((row, i) => (
            <div
              key={row.aspect}
              className={`grid grid-cols-3 transition-colors duration-200 hover:bg-white/[0.03] ${
                i % 2 === 0 ? "bg-neutral-950/50" : "bg-neutral-900/30"
              } border-t border-white/5`}
            >
              <div className="p-4 md:p-5 text-sm font-medium text-white">
                {row.aspect}
              </div>
              <div className="p-4 md:p-5 text-sm text-neutral-500 text-center flex items-center justify-center gap-2 border-l border-white/5">
                <svg
                  className="w-4 h-4 text-red-400/70 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                {row.traditional}
              </div>
              <div className="p-4 md:p-5 text-sm text-emerald-400 text-center flex items-center justify-center gap-2 border-l border-white/5">
                <svg
                  className="w-4 h-4 text-emerald-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                {row.chefiapp}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
