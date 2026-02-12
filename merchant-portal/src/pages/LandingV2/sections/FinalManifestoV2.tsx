/**
 * FinalManifestoV2 — fecho narrativo da landing.
 *
 * Eleva de \"mais uma ferramenta\" para \"infraestrutura operacional\".
 */

export const FinalManifestoV2 = () => {
  return (
    <section className="py-20 md:py-24 bg-[#050505] border-t border-white/5">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
          Restaurantes com ferramentas reagem.
          <br />
          Restaurantes com sistema operacional antecipam.
        </h2>
        <p className="text-neutral-400 text-sm md:text-base leading-relaxed mb-4">
          A maioria dos restaurantes cola ferramentas desconectadas e tenta
          controlar o caos no fim do dia. Erros, atrasos e vazamentos de margem
          aparecem sempre depois do serviço.
        </p>
        <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
          O ChefIApp™ faz o oposto: liga sala, cozinha, stock, equipa e
          faturação no mesmo cérebro operacional.{" "}
          <span className="text-neutral-100">
            Não organizamos o caos — impedimos que ele aconteça.
          </span>
        </p>
      </div>
    </section>
  );
};

