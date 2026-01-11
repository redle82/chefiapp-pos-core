export const HowItWorks = () => {
    const steps = [
        {
            num: "01",
            title: "Demo ao vivo",
            desc: "Mostramos o dashboard com dados reais do Sofia Gastrobar. Você vê exatamente o que vai ter.",
            action: "15 MINUTOS"
        },
        {
            num: "02",
            title: "Setup inicial",
            desc: "Criamos seu restaurante, você adiciona 5 itens do menu. Pronto, já funciona.",
            action: "10 MINUTOS"
        },
        {
            num: "03",
            title: "Teste real",
            desc: "Sua equipa usa de verdade. Turnos, stock, tarefas. Zero compromisso, zero custo.",
            action: "14 DIAS GRÁTIS"
        },
        {
            num: "04",
            title: "Decisão",
            desc: "Gostou? Fica. Não gostou? Cancela. Simples assim.",
            action: "DIA 15"
        }
    ];

    return (
        <section className="py-24 bg-transparent relative">
            <div className="container mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white font-outfit">🚀 Como funciona o piloto de 14 dias</h2>
                    <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
                        Zero risco. Se em 14 dias você não sentir diferença real no caos do dia a dia, cancela e pronto.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                    {/* Connector Line */}
                    <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

                    {steps.map((step, idx) => (
                        <div key={idx} className="relative z-10 text-center group">
                            <div className="w-24 h-24 mx-auto bg-neutral-900 border border-white/5 rounded-full flex items-center justify-center text-2xl font-bold text-amber-500 mb-8 shadow-xl shadow-black/50 group-hover:border-amber-500/50 group-hover:bg-amber-500/5 transition-all duration-300">
                                {step.num}
                            </div>
                            <h3 className="text-xl font-bold mb-4 text-white">{step.title}</h3>
                            <p className="text-neutral-400 text-sm mb-6 px-4 leading-relaxed">{step.desc}</p>
                            <span className="text-xs uppercase tracking-widest text-amber-500 font-bold">{step.action}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
