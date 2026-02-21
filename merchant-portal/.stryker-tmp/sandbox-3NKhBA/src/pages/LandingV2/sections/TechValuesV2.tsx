/**
 * TechValuesV2 — Princípios que guiam o sistema.
 *
 * Three horizontal value blocks — dark, minimal, icon-led.
 * No emojis — proper SVG icons.
 */
// @ts-nocheck


export const TechValuesV2 = () => {
  return (
    <section className="py-24 md:py-32 bg-neutral-950 relative overflow-hidden">
      {/* Gradient divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500/20 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* Header */}
        <div className="max-w-2xl mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Construído dentro de um restaurante real.
          </h2>
          <p className="text-neutral-400 text-lg leading-relaxed mb-3">
            Não vendemos promessas — entregamos um sistema operacional que
            funciona quando o serviço aperta, com casa cheia e equipa no limite.
          </p>
          <p className="text-neutral-500 text-sm leading-relaxed">
            O ChefIApp™ corre em paralelo ao POS fiscal: ele fecha vazamentos
            operacionais, o POS emite a nota. Juntos, mantêm a operação e o
            fisco alinhados.
          </p>
        </div>

        {/* Three values — horizontal layout */}
        <div className="grid md:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
          {/* Value 1 */}
          <div className="bg-neutral-950 p-8 md:p-10 group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors">
              <svg
                className="w-6 h-6 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Actualizações contínuas
            </h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Cada mês, o sistema ganha novas capacidades — de IA a analytics —
              sem custo extra, sem interrupção, sem mudar de fornecedor.
            </p>
          </div>

          {/* Value 2 */}
          <div className="bg-neutral-950 p-8 md:p-10 group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors">
              <svg
                className="w-6 h-6 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Feito por quem opera
            </h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Cada botão, cada fluxo, cada micro-interacção foi desenhada por
              quem já trabalhou na linha. Sentimos a pressão do serviço.
            </p>
          </div>

          {/* Value 3 */}
          <div className="bg-neutral-950 p-8 md:p-10 group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors">
              <svg
                className="w-6 h-6 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Sem dependências externas frágeis
            </h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Zero APIs de terceiros, zero conectores frágeis. Tudo nasce dentro
              do mesmo sistema — e por isso tudo funciona junto.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
