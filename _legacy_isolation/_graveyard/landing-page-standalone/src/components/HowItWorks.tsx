
export const HowItWorks = () => {
    const steps = [
        {
            num: "01",
            title: "Primeiro serviço ao vivo",
            desc: "Mostramos a operação real (casa Sofia Gastrobar). Você vê exatamente o que vai ter.",
            action: "15 minutos"
        },
        {
            num: "02",
            title: "Setup inicial",
            desc: "Criamos seu restaurante, você adiciona 5 itens do menu. Pronto, já funciona.",
            action: "10 minutos"
        },
        {
            num: "03",
            title: "Operação real",
            desc: "Sua equipa usa de verdade. Turnos, stock, tarefas. Zero compromisso, zero custo.",
            action: "14 dias"
        },
        {
            num: "04",
            title: "Decisão",
            desc: "Gostou? Fica. Não gostou? Cancela. Simples assim.",
            action: "Dia 15"
        }
    ];

    return (
        <section className="py-24">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 text-center">🚀 Como funciona o piloto de 14 dias</h2>
                <p className="text-center text-muted mb-16 max-w-2xl mx-auto">
                    Zero risco. Se em 14 dias você não sentir diferença real no caos do dia a dia, cancela e pronto.
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                    {/* Connector Line */}
                    <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                    {steps.map((step, idx) => (
                        <div key={idx} className="relative z-10 text-center group">
                            <div className="w-24 h-24 mx-auto bg-background border border-primary/20 rounded-full flex items-center justify-center text-2xl font-bold text-primary mb-6 shadow-xl shadow-black/50 group-hover:border-primary transition-colors duration-300">
                                {step.num}
                            </div>
                            <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                            <p className="text-muted mb-4 px-4">{step.desc}</p>
                            <span className="text-xs uppercase tracking-widest text-primary/70">{step.action}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
