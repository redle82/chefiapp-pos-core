export const SetupReal = () => {
    const withChef = [
        "Restaurante criado instantaneamente",
        "Menu web publicado em minutos",
        "TPV conectado no mesmo fluxo",
        "Equipa ativa no mesmo dia",
        "Operação funcional sem falar com suporte",
        "Tempo real: 10–25 minutos"
    ];

    return (
        <section className="py-24">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                        Setup real. Sem chamadas. Sem espera.
                    </h2>
                    <p className="text-lg text-muted">
                        O que outros chamam de “onboarding”, aqui é só começar a operar.
                    </p>
                </div>

                <div className="glass-card max-w-4xl mx-auto p-10 border border-white/10 relative overflow-hidden">
                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                    <div className="relative z-10">
                        <ul className="space-y-4">
                            {withChef.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-white">
                                    <span className="text-primary text-xl">•</span>
                                    <span className="text-base md:text-lg">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-8 text-sm md:text-base text-muted font-semibold">
                            Se precisa falar com alguém para começar, não é sistema. É serviço disfarçado.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};



