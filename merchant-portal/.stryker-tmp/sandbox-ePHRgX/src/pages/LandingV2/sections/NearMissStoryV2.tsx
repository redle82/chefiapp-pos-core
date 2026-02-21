// @ts-nocheck
export const NearMissStoryV2 = () => {
  return (
    <section className="py-16 md:py-20 bg-[#050505] border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 left-1/3 w-72 h-72 bg-amber-500/8 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6">
        <div className="rounded-2xl border border-amber-500/25 bg-neutral-950/80 px-5 py-5 md:px-7 md:py-6">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-[0.2em] mb-2">
            Falha que quase acontecia — e não aconteceu
          </p>
          <p className="text-sm md:text-base text-neutral-200 leading-relaxed mb-3">
            Serviço de jantar cheio. Várias mesas a entrar ao mesmo tempo,
            pedidos a acumular na grelha e na estação de entradas. Num cenário
            normal, o atraso só apareceria quando o primeiro cliente começasse
            a olhar para o relógio.
          </p>
          <p className="text-sm md:text-base text-neutral-200 leading-relaxed mb-3">
            Com o ChefIApp™ OS, o KDS e o Monitor de Risco sinalizaram que uma
            estação ia estourar o tempo aceitável. A equipa ajustou prioridades
            e reforçou a estação antes de qualquer reclamação chegar à sala.
          </p>
          <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
            Antes, este tipo de atraso só aparecia no fecho, como “hoje foi
            caótico”. Agora aparece durante o serviço, como alerta concreto que
            evita perder margem e paciência de cliente.
          </p>
        </div>
      </div>
    </section>
  );
};

