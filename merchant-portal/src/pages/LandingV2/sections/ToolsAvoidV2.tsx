export const ToolsAvoidV2 = () => {
  return (
    <section className="py-24 md:py-32 bg-[#050505] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-0 w-80 h-80 bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] right-[-40px] w-96 h-96 bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mb-12 md:mb-16">
          <p className="text-amber-500 text-sm font-semibold tracking-[0.18em] uppercase mb-3">
            O que cada ferramenta evita
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Não é só o que faz.
            <br />
            É o que tira da tua cabeça e das pernas da equipa.
          </h2>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
            Cada componente do ChefIApp™ OS existe para eliminar passos
            desnecessários, decisões no escuro e erros silenciosos. Não vendemos
            botões; fechamos vazamentos operacionais.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 md:p-6">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.2em] mb-2">
              Staff App · Mini-TPV no bolso
            </p>
            <h3 className="text-sm md:text-base font-semibold text-white mb-2">
              Evita voltas, espera e pedidos na memória.
            </h3>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              O pedido nasce onde o cliente está — não no balcão, não num papel,
              não na cabeça do empregado. Cada passo a menos é tempo recuperado;
              cada pedido certo é margem protegida.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 md:p-6">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.2em] mb-2">
              KDS · Cozinha em tempo real
            </p>
            <h3 className="text-sm md:text-base font-semibold text-white mb-2">
              Evita papel, impressoras e refações silenciosas.
            </h3>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              Prioridade automática e visibilidade por estação evitam tickets
              perdidos, falhas de impressão e discussões sala×cozinha. Cada
              prato que não precisa ser refeito é custo evitado.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 md:p-6">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.2em] mb-2">
              Menu Builder
            </p>
            <h3 className="text-sm md:text-base font-semibold text-white mb-2">
              Evita chamadas para técnico e margem fictícia.
            </h3>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              Preços, margens e modificadores mudam em segundos, antes do
              serviço começar. Evita passar um turno inteiro com preço errado
              ou prato desatualizado.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 md:p-6">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.2em] mb-2">
              Comando Central · Dashboard
            </p>
            <h3 className="text-sm md:text-base font-semibold text-white mb-2">
              Evita decisões cegas no fim do dia.
            </h3>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              Faturação, pedidos e risco operacional em tempo real evitam
              decisões baseadas apenas em feeling no fecho de caixa.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 md:p-6">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.2em] mb-2">
              Analytics Operacionais
            </p>
            <h3 className="text-sm md:text-base font-semibold text-white mb-2">
              Evita decidir amanhã sobre um problema de hoje.
            </h3>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              Ver mix de produto, canais e turnos com números reais evita
              decisões tardias e ajustes só na próxima época alta.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-5 md:p-6">
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-[0.2em] mb-2">
              Tarefas Operacionais
            </p>
            <h3 className="text-sm md:text-base font-semibold text-white mb-2">
              Evitam esquecimento e improviso em pico.
            </h3>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
              Tarefas ligadas ao serviço actual ajudam a não esquecer o que é
              crítico naquele turno. Não é app de produtividade; é execução
              assistida a partir do que está a acontecer agora.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

