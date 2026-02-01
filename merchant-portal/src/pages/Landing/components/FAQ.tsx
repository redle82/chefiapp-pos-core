const CONTACT_EMAIL =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: { VITE_CONTACT_EMAIL?: string } })?.env?.VITE_CONTACT_EMAIL) ||
  'contacto@chefiapp.com';

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
        <section className="py-24 bg-transparent relative">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center text-white font-outfit">
                    Perguntas honestas
                </h2>

                <div className="max-w-3xl mx-auto space-y-4">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className="bg-neutral-900/50 p-6 border border-white/5 hover:border-amber-500/30 transition-colors rounded-lg group">
                            <h3 className="text-lg font-bold mb-3 text-white group-hover:text-amber-500 transition-colors">{faq.q}</h3>
                            <p className="text-neutral-400 leading-relaxed text-sm">{faq.a}</p>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-16">
                    <p className="text-neutral-500 mb-6 font-mono text-xs uppercase tracking-wider">Ainda tem dúvidas?</p>
                    <a
                        href={`mailto:${CONTACT_EMAIL}`}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-white/10 text-white hover:bg-white/5 hover:border-amber-500/50 transition-all font-medium text-sm"
                    >
                        <span>✉️</span> Falar connosco
                    </a>
                </div>
            </div>
        </section>
    );
};
