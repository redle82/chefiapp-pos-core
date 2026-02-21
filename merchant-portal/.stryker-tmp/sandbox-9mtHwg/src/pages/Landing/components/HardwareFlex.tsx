export const HardwareFlex = () => {
    const worksWith = [
        "Funciona com as impressoras que você já tem",
        "Funciona com TPVs e caixas existentes",
        "Funciona com o telefone da equipa",
        "Não exige telas dedicadas ou hardware proprietário",
        "Um telefone por posto já resolve"
    ];

    const evolveWith = [
        "Pode usar tablets, telas de cozinha ou novos dispositivos",
        "Pode adicionar impressoras, pontos ou estações",
        "Pode escalar sem trocar de sistema"
    ];

    return (
        <section className="py-24">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                        Não exige equipamentos novos para começar.
                    </h2>
                    <p className="text-lg text-muted">
                        ChefApp foi desenhado para funcionar com a realidade do restaurante — não com setups ideais de catálogo.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 glass-card p-10 border border-white/10">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold">Funciona com o que você já tem</h3>
                        <ul className="space-y-3 text-muted">
                            {worksWith.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <span className="text-primary text-xl">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-sm text-muted font-semibold">
                            Se já imprime pedidos hoje, provavelmente já funciona aqui.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-primary">Se quiser evoluir, o sistema acompanha</h3>
                        <ul className="space-y-3 text-muted">
                            {evolveWith.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <span className="text-primary text-xl">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-sm text-muted font-semibold">
                            O sistema não trava sua evolução. Ele cresce com ela.
                        </p>
                    </div>
                </div>

                <div className="text-center mt-10 space-y-2">
                    <p className="text-lg md:text-xl text-white font-semibold">
                        Você não adapta sua operação ao sistema. O sistema se adapta à sua operação.
                    </p>
                </div>

                <div className="text-center mt-6 space-y-2">
                    <h3 className="text-xl font-bold">Hardware não é armadilha</h3>
                    <p className="text-muted max-w-2xl mx-auto">
                        ChefApp não vende hardware nem obriga pacotes fechados. Se você já tem equipamentos, usamos. Se não tiver, indicamos o que faz sentido — sem comissões, sem dependência.
                        Você decide quando investir. Não o software.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 text-sm text-muted">
                        <span className="px-3 py-1 rounded-full border border-white/10">Começa com o que você tem</span>
                        <span className="px-3 py-1 rounded-full border border-white/10">Nenhuma compra obrigatória</span>
                        <span className="px-3 py-1 rounded-full border border-white/10">Sem contratos de hardware</span>
                        <span className="px-3 py-1 rounded-full border border-white/10">Compatível por design</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

