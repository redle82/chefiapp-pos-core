// LEGACY: secção de público-alvo da landing antiga. A versão canónica vive
// em `LandingV2/sections/TargetAudienceV2.tsx`.
import { OSCopy } from '../../../ui/design-system/sovereign/OSCopy';

export const TargetAudience = () => {
    return (
        <section className="py-24 bg-transparent relative">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white font-outfit">
                        {OSCopy.landing.audienceTitle}
                    </h2>
                    <p className="text-neutral-400 text-xl max-w-2xl mx-auto">
                        {OSCopy.landing.audienceSubtitle}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Restaurants */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-8 hover:border-amber-500/30 transition-all group">
                        <div className="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all">🍽️</div>
                        <h3 className="text-xl font-bold mb-4 text-white">Restaurantes Médios</h3>
                        <ul className="space-y-3">
                            {[
                                "Contrato de pedidos",
                                "Menos erros na ponta",
                                "Margem protegida"
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm text-neutral-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Bars */}
                    <div className="bg-neutral-900/50 border border-amber-500/20 rounded-xl p-8 hover:border-amber-500/50 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50" />
                        <div className="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all">🍸</div>
                        <h3 className="text-xl font-bold mb-4 text-white">Bares & Gastrobares</h3>
                        <ul className="space-y-3">
                            {[
                                "Pedidos rápidos",
                                "Menus simples",
                                "Zero comissão"
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm text-neutral-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Dark kitchens */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-8 hover:border-amber-500/30 transition-all group">
                        <div className="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all">👩‍🍳</div>
                        <h3 className="text-xl font-bold mb-4 text-white">Dark kitchens & Grupos de restauração</h3>
                        <ul className="space-y-3">
                            {[
                                "Operações híbridas e multi-marca",
                                "Equipa e turnos sob pressão",
                                "Escalar sem trocar sistema"
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm text-neutral-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <p className="text-center text-xs text-neutral-500 mt-12 font-mono uppercase tracking-wider">
                    Operações maiores ou híbridas podem adaptar o sistema conforme necessidade.
                </p>
            </div>
        </section>
    );
};
