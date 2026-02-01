
export const FAQ = () => {
    const faqs = [
        {
            q: "Isso substitui meu POS fiscal?",
            a: "Não. E isso é intencional. ChefIApp é gestão operacional + pré-conta. O POS fiscal continua responsável pela nota. Certificação fiscal está prevista para Q2 2026."
        },
        {
            q: "Preciso de internet o tempo todo?",
            a: "Sim, mas com tolerância. Sistema aguenta 5 min offline. Para operações críticas (pagamento, fechamento), precisa de internet ativa. Para o resto da operação, o sistema continua funcional."
        },
        {
            q: "Minha equipe não sabe usar computador.",
            a: "Interface mobile-first. Funciona no celular. A equipa só vê o que precisa fazer — quando precisa fazer. Na demo você decide se é simples o suficiente."
        },
        {
            q: "Quanto custa depois do piloto?",
            a: "Teste primeiro. Se fizer sentido, €49/mês (Starter) ou €99/mês (Professional)."
        },
        {
            q: "Isso dá mais trabalho pra mim?",
            a: "Não. Depois do setup inicial (≈25 min), o sistema começa a cobrar o que antes dependia de você lembrar."
        },
        {
            q: "Posso cancelar quando quiser?",
            a: "Sempre. Sem contrato, sem multa. Cancela no painel com 1 clique. Exporta todos os dados antes de sair."
        }
    ];

    return (
        <section className="py-24 bg-black/20">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center">
                    Perguntas honestas
                </h2>

                <div className="max-w-3xl mx-auto space-y-6">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="glass-card p-6 border border-white/10 hover:border-primary/30 transition-colors">
                            <h3 className="text-xl font-bold mb-3 text-white">{faq.q}</h3>
                            <p className="text-muted leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-16">
                    <p className="text-muted mb-6">Ainda tem dúvidas?</p>
                    <a
                        href="mailto:comercial@chefiapp.com"
                        className="btn-outline inline-block"
                    >
                        Falar connosco
                    </a>
                </div>
            </div>
        </section>
    );
};
