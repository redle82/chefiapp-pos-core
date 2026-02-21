// @ts-nocheck

export const Positioning = () => {
    return (
        <section className="py-24">
            <div className="container mx-auto px-6">
                <div className="glass-card max-w-5xl mx-auto p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

                    <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-12 relative z-10">
                        <div className="md:w-1/2 text-center md:text-left">
                            <h2 className="text-3xl font-bold mb-2">ChefIApp</h2>
                            <p className="text-2xl md:text-4xl font-bold text-primary leading-tight mb-3">
                                Um sistema operacional leve para restauração.
                            </p>
                            <p className="text-muted md:text-lg">
                                Identidade própria. Não responde a categorias antigas.
                            </p>
                        </div>

                        <div className="hidden md:block w-px h-64 bg-white/10" />

                        <div className="md:w-1/2">
                            <h2 className="text-3xl font-bold mb-4">Soluções que resolvem partes, não a operação:</h2>
                            <div className="space-y-4">
                                {[
                                    "Um marketplace",
                                    "Um plugin de pedidos",
                                    "Um construtor genérico de sites"
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-red-400">
                                        <span className="text-xl">❌</span>
                                        <span className="text-lg md:text-xl font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-muted mt-6 font-medium">
                                Operação exige sistema, não remendo.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
