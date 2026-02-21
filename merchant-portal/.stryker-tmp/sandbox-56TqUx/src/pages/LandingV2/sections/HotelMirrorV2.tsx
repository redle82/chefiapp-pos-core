/**
 * HotelMirrorV2 — micro-bloco "E na hotelaria?"
 *
 * Tradução semântica dos mesmos vazamentos para a realidade de hotel / resort.
 */
// @ts-nocheck


export const HotelMirrorV2 = () => {
  return (
    <section className="py-20 md:py-24 bg-[#050505] border-t border-white/5">
      <div className="max-w-5xl mx-auto px-6">
        <div className="max-w-3xl mb-10">
          <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-3">
            E na hotelaria?
          </p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
            A mesma operação. Mais complexidade.
          </h2>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
            Hotéis, resorts e aparthotéis vivem a mesma realidade operacional:
            picos de ocupação, vários pontos de consumo e equipas em turnos
            longos. O problema é o mesmo — margem a perder-se em vazamentos
            invisíveis.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6 text-sm text-neutral-300">
          <div className="rounded-2xl border border-white/5 bg-neutral-950 px-5 py-5">
            <h3 className="text-base font-semibold text-white mb-2">
              Room service e outlets descoordenados
            </h3>
            <p className="text-neutral-400 mb-3">
              Pedidos a entrar por vários canais, atrasos que viram reclamações
              no front desk, refeições refeitas e extras não lançados.
            </p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
              Receita que nunca aparece no relatório de turno.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-neutral-950 px-5 py-5">
            <h3 className="text-base font-semibold text-white mb-2">
              F&amp;B cego em picos de ocupação
            </h3>
            <p className="text-neutral-400 mb-3">
              Pequeno-almoço lotado, bar cheio, eventos a decorrer — sem visão
              única de faturação, tempo médio e gargalos por outlet.
            </p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
              Hóspedes em fila, margem a cair em cada turno.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-neutral-950 px-5 py-5">
            <h3 className="text-base font-semibold text-white mb-2">
              Turnos longos sem visibilidade real
            </h3>
            <p className="text-neutral-400 mb-3">
              Staff cansado, rotatividade alta, dificuldade em saber quem fez
              o quê em cada período de serviço ou turno de noite.
            </p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
              Performance sem contexto operacional.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-neutral-950 px-5 py-5">
            <h3 className="text-base font-semibold text-white mb-2">
              Stock por outlet sem visão central
            </h3>
            <p className="text-neutral-400 mb-3">
              Cada bar e restaurante a pedir \"à parte\" — compras reactivas,
              desperdício e ruturas que afetam a experiência do hóspede.
            </p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
              O mesmo vazamento, espalhado por vários pontos de consumo.
            </p>
          </div>
        </div>

        <div className="mt-10 text-xs md:text-sm text-neutral-500 text-center md:text-left">
          Mesmo cérebro operacional. Mais pontos de consumo — restaurante,
          rooftop, lobby bar, piscina, room service.
        </div>
      </div>
    </section>
  );
};

