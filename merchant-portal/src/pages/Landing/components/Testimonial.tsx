export const Testimonial = () => {
    return (
        <section className="py-32 bg-transparent relative">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl md:text-5xl font-bold mb-16 text-center text-white font-outfit flex items-center justify-center gap-4">
                    <span className="text-4xl">🗣️</span> Quem já testou
                </h2>

                <div className="max-w-4xl mx-auto">
                    <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-10 md:p-12 relative overflow-hidden group hover:border-amber-500/20 transition-all">
                        <div className="absolute top-0 left-0 text-9xl text-amber-500/10 font-serif leading-none select-none">“</div>

                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center border-l-2 border-amber-500/30 pl-0 md:pl-8">
                            {/* Quote */}
                            <div className="flex-1">
                                <p className="text-xl md:text-2xl text-neutral-300 italic leading-relaxed mb-6 font-light">
                                    "Sistema simples, direto. Parei de perder tempo procurando papel.
                                    <span className="text-white font-medium not-italic"> Turno fica rastreado automaticamente.</span> Vale muito."
                                </p>
                            </div>

                            {/* Logo / Author */}
                            <div className="flex-shrink-0 flex flex-col items-center md:items-end text-center md:text-right">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-amber-500/20 mb-4 bg-black">
                                    <img
                                        src="/logo-demo.jpg"
                                        alt="Sofia Gastrobar"
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <img
                                        src="/PHOTO-2026-01-04-23-43-41.jpg"
                                        alt="Sofia Gastrobar Ibiza"
                                        className="h-8 md:h-10 w-auto object-contain brightness-0 invert opacity-80 mb-2"
                                    />
                                    <p className="text-sm text-neutral-400">Ibiza · Verão 2025</p>
                                    <p className="text-xs text-amber-500/80 uppercase tracking-widest font-bold">Sistema em uso real</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-neutral-500 text-xs mt-8 italic font-mono">
                        * Primeiro restaurante em produção. Mais cases chegando em breve.
                    </p>
                </div>
            </div>
        </section>
    );
};
