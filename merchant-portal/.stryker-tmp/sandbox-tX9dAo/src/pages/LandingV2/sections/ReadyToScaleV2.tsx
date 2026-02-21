/**
 * ReadyToScaleV2 — bloco leve para grupos e cadeias.
 *
 * Posiciona o ChefIApp™ como infra pronta para multi-unidade.
 */

export const ReadyToScaleV2 = () => {
  return (
    <section className="py-20 md:py-24 bg-neutral-950 relative overflow-hidden">
      <div className="hidden md:block absolute -bottom-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-amber-500/4 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative text-center md:text-left">
        <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-3">
          Pronto para crescer
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Começa com um restaurante.
          <br />
          Escala para várias casas sem trocar de sistema.
        </h2>
        <p className="text-neutral-400 text-lg leading-relaxed mb-8 max-w-2xl">
          O mesmo sistema operacional que aguenta um serviço em casa cheia
          aguenta também grupos, marcas e unidades múltiplas — com uma visão
          central da operação.
        </p>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] px-6 py-5 text-left">
            <h3 className="text-sm font-semibold text-white mb-2">
              Multi-unidade sem fricção
            </h3>
            <ul className="space-y-1.5 text-sm text-neutral-400">
              <li>Visão central de todas as unidades em tempo real.</li>
              <li>Relatórios consolidados por casa, marca e canal.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] px-6 py-5 text-left">
            <h3 className="text-sm font-semibold text-white mb-2">
              Controlo sem perder autonomia local
            </h3>
            <ul className="space-y-1.5 text-sm text-neutral-400">
              <li>Permissões por equipa e por localização.</li>
              <li>Mesma infraestrutura operacional, realidades diferentes por casa.</li>
            </ul>
          </div>
        </div>

        <p className="mt-6 text-xs md:text-sm text-neutral-500">
          Compatível com operações de hotelaria: F&amp;B integrado, múltiplos
          outlets e visão centralizada por turno.
        </p>
      </div>
    </section>
  );
};

