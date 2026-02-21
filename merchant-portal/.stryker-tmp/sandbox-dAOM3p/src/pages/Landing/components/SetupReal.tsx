// @ts-nocheck
export const SetupReal = () => {
  return (
    <section className="py-24 bg-transparent relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white font-outfit">
            O que antes levava dias, agora <br />
            <span className="text-amber-500">leva minutos.</span>
          </h2>
          <p className="text-neutral-500 text-sm font-mono uppercase tracking-wider">
            Não é má vontade. É modelo de negócio.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Traditional Model */}
          <div className="bg-neutral-900/30 border border-white/5 rounded-xl p-8 opacity-75">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              Modelo tradicional de software para restauração
            </h3>
            <ul className="space-y-4">
              {[
                "Cadastro manual + validação",
                "Espera por contacto do suporte",
                "Demo Guide agendado (quando possível)",
                "Configuração feita por terceiros",
                "Alterações dependem de ticket",
                "Tempo total: dias ou semanas",
              ].map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-neutral-400 text-sm"
                >
                  <span className="text-red-500 text-lg leading-none">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-neutral-600 font-mono">
              Cada passo cria dependência.
            </p>
          </div>

          {/* ChefIApp Model */}
          <div className="bg-neutral-900 border border-amber-500/30 rounded-xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.1)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-400"></div>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-amber-500">ChefIApp</span> — sistema
              operacional direto
            </h3>
            <ul className="space-y-4">
              {[
                "Criação imediata do restaurante",
                "Menu web criado em poucos cliques",
                "TPV e operação conectados no mesmo fluxo",
                "Equipa ativa em minutos",
                "Ajustes feitos por você, em tempo real",
                "Tempo total: minutos",
              ].map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-white text-sm"
                >
                  <span className="text-amber-500 text-xs mt-1">●</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-neutral-500 font-mono">
              Sem intermediários. Sem espera.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto text-center mt-16 bg-neutral-900/50 border border-white/5 rounded-xl p-8 backdrop-blur-sm">
          <p className="text-white font-medium mb-2">
            Quando o sistema é simples, o suporte deixa de ser uma armadilha.
          </p>
          <p className="text-neutral-500 text-xs leading-relaxed max-w-xl mx-auto">
            Menu web, TPV e operação não são produtos separados. No ChefIApp,
            eles nascem juntos. O mesmo sistema que cria o menu público ativa o
            TPV e organiza a operação interna. Um fluxo. Não três contratos.
            <br />
            <br />
            Se configurar um sistema exige horas de chamadas, o problema não é
            você. É o sistema.
          </p>
        </div>
      </div>
    </section>
  );
};
