/**
 * SocialProof V2 — Prova social pesada
 *
 * Real case: Sofia Gastrobar. Real numbers. Real testimonial.
 * Creates "if they're using it, it works" confidence.
 */

export const SocialProofV2 = () => {
  return (
    <section className="py-24 md:py-32 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 md:mb-20">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-4">
            Em Produção Real
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Não é protótipo.{" "}
            <span className="text-amber-500">É o sistema real.</span>
          </h2>
        </div>

        {/* Featured case */}
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-neutral-900/40 overflow-hidden">
            {/* Quote */}
            <div className="p-8 md:p-12">
              <svg
                className="w-10 h-10 text-amber-500/40 mb-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z" />
              </svg>
              <blockquote className="text-xl md:text-2xl font-medium text-white leading-relaxed mb-8">
                Montámos o menu, abrimos o TPV e na primeira noite já estávamos
                a operar. Sem técnico, sem instalação, sem stress. A equipa
                aprendeu sozinha.
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-lg">
                  SG
                </div>
                <div>
                  <div className="font-bold text-white">Sofia Gastrobar</div>
                  <div className="text-xs text-amber-500/70 font-medium mb-0.5">
                    Powered by ChefIApp™ OS
                  </div>
                  <div className="text-sm text-neutral-400">
                    Ibiza, Espanha · Em produção desde 2026
                  </div>
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div className="border-t border-white/5 bg-neutral-950/50 grid grid-cols-2 md:grid-cols-4">
              {[
                { value: "< 25 min", label: "Setup completo" },
                { value: "17", label: "Componentes activos" },
                { value: "0€", label: "Custo de setup" },
                { value: "1º dia", label: "Primeira venda" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-6 text-center border-r border-white/5 last:border-r-0"
                >
                  <div className="text-2xl font-bold text-amber-500 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-neutral-500">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-emerald-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Dados reais, não simulados
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-emerald-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Restaurante real a operar
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-emerald-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Suporte direto pelo fundador
          </div>
        </div>
      </div>
    </section>
  );
};
