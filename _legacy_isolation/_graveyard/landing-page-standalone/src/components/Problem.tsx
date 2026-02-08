
export const Problem = () => {
    return (
        <section className="py-24 bg-gradient-to-b from-fire-vinho/50 via-fire-carvao/40 to-surface/50 relative overflow-hidden -mt-1">
            {/* Fire effect background - INTENSO */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Base gradient de fogo */}
                <div className="absolute inset-0 bg-gradient-to-b from-red-600/30 via-orange-500/20 to-red-600/20 opacity-80 animate-pulse"></div>

                {/* Chamas grandes e vibrantes */}
                <div className="absolute -top-20 -left-40 w-96 h-96 bg-red-500/40 blur-3xl animate-pulse" style={{ animation: 'flame 3s ease-in-out infinite' }}></div>
                <div className="absolute top-10 left-20 w-80 h-80 bg-orange-500/35 blur-2xl" style={{ animation: 'flame 4s ease-in-out infinite' }}></div>
                <div className="absolute top-0 -right-20 w-96 h-96 bg-red-600/35 blur-3xl" style={{ animation: 'flame 3.5s ease-in-out infinite 0.5s' }}></div>
                <div className="absolute top-32 right-32 w-72 h-72 bg-yellow-500/25 blur-2xl" style={{ animation: 'flame 4.5s ease-in-out infinite 1s' }}></div>

                {/* Chamas do meio */}
                <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-red-500/30 blur-3xl" style={{ animation: 'flame 5s ease-in-out infinite 1.5s' }}></div>
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-500/25 blur-3xl" style={{ animation: 'flame 4.5s ease-in-out infinite 2s' }}></div>

                {/* Chamas inferiores */}
                <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-red-600/40 blur-3xl" style={{ animation: 'flame 3.5s ease-in-out infinite 2.5s' }}></div>
                <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-orange-500/35 blur-3xl" style={{ animation: 'flame 4s ease-in-out infinite 3s' }}></div>

                {/* Efeito de calor adicional */}
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.4),transparent_70%)] animate-pulse" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
            </div>

            <style>{`
                @keyframes flame {
                    0%, 100% { transform: translateY(0px) scaleX(1) scaleY(1); opacity: 0.4; }
                    25% { transform: translateY(-40px) scaleX(0.95) scaleY(1.15); opacity: 0.65; }
                    50% { transform: translateY(-60px) scaleX(1.1) scaleY(1.2); opacity: 0.8; }
                    75% { transform: translateY(-40px) scaleX(1.05) scaleY(1.1); opacity: 0.6; }
                }
            `}</style>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        🔥 Se você vive isto todos os dias...
                    </h2>
                </div>

                <div className="max-w-3xl mx-auto space-y-4 mb-12">
                    {[
                        { title: "Turnos bagunsados", desc: "Ninguém sabe quem trabalhou quantas horas" },
                        { title: "Stock que some", desc: "Ingrediente acaba no meio do serviço" },
                        { title: "Tarefas esquecidas", desc: "\"Esqueci de repor cerveja\", \"Ninguém limpou a cozinha\"" },
                        { title: "Papel e planilha", desc: "Informação perdida, nada automatizado" },
                        { title: "Equipa perdida", desc: "Cada um pergunta o que fazer" }
                    ].map((item, idx) => (
                        <div key={idx} className="glass-card p-5 border-l-4 border-red-500/50 hover:border-red-500 transition-colors">
                            <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                            <p className="text-muted text-sm">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="max-w-3xl mx-auto text-center mb-10">
                    <p className="text-base md:text-lg text-muted leading-relaxed">
                        Isso não são problemas diferentes. <br className="hidden md:block" />
                        É a mesma falha operacional a manifestar-se todos os dias.
                    </p>
                </div>

                <div className="text-center">
                    <p className="text-xl font-semibold text-white">
                        Você não precisa de mais um app. <br />
                        <span className="text-primary">Você precisa de um sistema que imponha disciplina operacional.</span>
                    </p>
                </div>
            </div>
        </section>
    );
};
