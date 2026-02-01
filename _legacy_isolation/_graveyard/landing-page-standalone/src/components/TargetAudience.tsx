
export const TargetAudience = () => {
    return (
        <section className="py-24 bg-surface/50">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Para quem é</h2>
                    <p className="text-muted text-xl max-w-2xl mx-auto">
                        Feito para quem leva a operação a sério.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Restaurants */}
                    <div className="glass-card p-8 hover:transform hover:-translate-y-2 transition-transform duration-300">
                        <div className="text-5xl mb-6">🍽️</div>
                        <h3 className="text-2xl font-bold mb-4">Restaurantes Médios</h3>
                        <ul className="space-y-3 text-muted">
                            <li className="flex gap-2">
                                <span className="text-primary">•</span> Controlo de pedidos
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary">•</span> Menos erros na ponta
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary">•</span> Margem protegida
                            </li>
                        </ul>
                    </div>

                    {/* Bars */}
                    <div className="glass-card p-8 border-primary/30 shadow-[0_0_30px_rgba(201,162,39,0.1)] hover:transform hover:-translate-y-2 transition-transform duration-300 relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent" />
                        <div className="text-5xl mb-6">🍸</div>
                        <h3 className="text-2xl font-bold mb-4">Bares & Gastrobares</h3>
                        <ul className="space-y-3 text-muted">
                            <li className="flex gap-2">
                                <span className="text-primary">•</span> Pedidos rápidos
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary">•</span> Menus simples
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary">•</span> Zero comissão
                            </li>
                        </ul>
                    </div>

                    {/* Dark kitchens / Grupos de restauração */}
                    <div className="glass-card p-8 hover:transform hover:-translate-y-2 transition-transform duration-300">
                        <div className="text-5xl mb-6">👩‍🍳</div>
                        <h3 className="text-2xl font-bold mb-4">Dark kitchens & Grupos de restauração</h3>
                        <ul className="space-y-3 text-muted">
                            <li className="flex gap-2">
                                <span className="text-primary">•</span> Operações híbridas e multi-marca
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary">•</span> Equipa e turnos sob pressão
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary">•</span> Escalar sem trocar sistema
                            </li>
                        </ul>
                    </div>
                </div>

                <p className="text-center text-sm text-muted mt-8">
                    Operações maiores ou híbridas podem adaptar o sistema conforme necessidade.
                </p>
            </div>
        </section>
    );
};
