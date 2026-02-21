// @ts-nocheck
export const SystemLimitsV2 = () => {
  return (
    <section className="py-20 md:py-24 bg-[#050505] border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-0 w-72 h-72 bg-amber-500/8 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-left md:text-center">
        <p className="text-amber-500 text-sm font-semibold tracking-[0.18em] uppercase mb-3">
          Limites claros
        </p>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
          O que o ChefIApp™ OS não é.
        </h2>
        <p className="text-neutral-400 text-sm md:text-base leading-relaxed mb-6">
          Produto sério também diz o que não promete. O foco aqui é fechar
          vazamentos operacionais de sala, cozinha, stock e turno — sem se
          vender como solução para tudo.
        </p>

        <div className="grid md:grid-cols-2 gap-4 md:gap-5 text-sm text-neutral-300">
          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 px-4 py-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-[0.18em] mb-1.5">
              Não é POS fiscal (ainda)
            </p>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Hoje o OS trabalha em paralelo ao POS fiscal existente: gere
              operação, pré‑conta e controlo de margem. A nota continua a sair
              do teu POS até à certificação fiscal própria.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 px-4 py-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-[0.18em] mb-1.5">
              Não é PMS de hotel
            </p>
            <p className="text-sm text-neutral-300 leading-relaxed">
              O foco é F&amp;B: restaurante, bar, room service, outlets. Gestão
              de quartos, tarifas e reservas de alojamento continuam no PMS que
              já usas — o ChefIApp™ fecha os vazamentos operacionais da parte
              de comida e bebida.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 px-4 py-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-[0.18em] mb-1.5">
            Não é app de tarefas de escritório
            </p>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Não é um gestor genérico de tarefas ou projectos. As tarefas
              operacionais nascem do serviço real — pedidos, turnos, stock —
              para reduzir esquecimento em pico, não para gerir reuniões.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 px-4 py-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-[0.18em] mb-1.5">
              Não é marketplace nem plataforma de reservas
            </p>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Não vende lugares nem cobra comissão sobre cada reserva. A página
              pública e as reservas existem para trazer o cliente directo para o
              teu sistema operacional, não para te tornar dependente de um
              intermediário.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

