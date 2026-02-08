
export const Solution = () => {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="md:w-1/2">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            Um ciclo completo,<br />
                            <span className="text-gradient-gold">sem intermediários.</span>
                        </h2>
                        <div className="space-y-6">
                            {[
                                "⚡ OperationalHub: Veja tudo que está acontecendo agora — vendas, tarefas, turnos e alertas",
                                "🧠 AppStaff: Cada funcionário sabe exatamente o que fazer — sem perguntar",
                                "📱 Menu Digital: o cardápio muda, a operação não para",
                                "✅ Sistema age antes que você precise pensar. Nada cai no esquecimento"
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm flex-shrink-0">
                                        ✓
                                    </div>
                                    <span className="text-lg">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:w-1/2 relative">
                        <div className="glass-card p-8 border border-primary/20 relative z-10">
                            <div className="space-y-4">
                                <div className="flex items-center justify-center p-4 bg-black/40 rounded-lg border border-white/5 text-center">
                                    <div>
                                        <span className="text-sm text-muted block mb-1">Passo 1</span>
                                        <strong className="text-primary">Página Pública</strong>
                                    </div>
                                </div>
                                <div className="flex justify-center text-muted">↓</div>
                                <div className="flex items-center justify-center p-4 bg-black/40 rounded-lg border border-white/5 text-center">
                                    <div>
                                        <span className="text-sm text-muted block mb-1">Passo 2</span>
                                        <strong className="text-white">Pedido Online</strong>
                                    </div>
                                </div>
                                <div className="flex justify-center text-muted">↓</div>
                                <div className="flex items-center justify-center p-4 bg-black/40 rounded-lg border border-white/5 text-center">
                                    <div>
                                        <span className="text-sm text-muted block mb-1">Passo 3</span>
                                        <strong className="text-green-400">Pagamento & Operação</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
