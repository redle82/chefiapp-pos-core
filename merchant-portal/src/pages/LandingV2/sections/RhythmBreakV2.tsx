/**
 * RhythmBreakV2 — micro-secção de respiração
 *
 * Usada para dar pausa visual depois de blocos densos.
 */

export const RhythmBreakV2 = () => {
  return (
    <section className="py-12 md:py-16 bg-[#050505] border-y border-white/5">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-neutral-500 mb-3">
          Quando importa mesmo
        </p>
        <p className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100">
          Funciona quando o serviço aperta — não só no slide de apresentação.
        </p>
      </div>
    </section>
  );
};

