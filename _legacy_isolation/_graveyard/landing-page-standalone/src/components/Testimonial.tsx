
export const Testimonial = () => {
    return (
        <section className="py-24 bg-surface/30">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center">
                    🗣️ Quem já testou
                </h2>

                <div className="max-w-3xl mx-auto">
                    <div className="glass-card p-8 border border-primary/20 relative">
                        <div className="absolute top-6 left-6 text-6xl text-primary/20">"</div>
                        <div className="relative z-10 pt-8">
                            <p className="text-xl text-muted italic leading-relaxed mb-6">
                                Sistema simples, direto. Parei de perder tempo procurando papel. 
                                Turno fica rastreado automaticamente. Vale muito.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden">
                                    <img
                                        src="/logo-demo.jpg"
                                        alt="Sofia Gastrobar"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <img
                                        src="/PHOTO-2026-01-04-23-43-41.jpg"
                                        alt="Sofia Gastrobar Ibiza"
                                        className="h-10 md:h-12 w-auto object-contain"
                                    />
                                    <p className="text-sm text-muted">Ibiza · Verão 2025</p>
                                    <p className="text-xs text-muted/80">Sistema em uso real · Operação diária</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-muted text-sm mt-6 italic">
                        * Primeiro restaurante em produção. Mais cases chegando em janeiro 2026.
                    </p>
                </div>
            </div>
        </section>
    );
};
