// LEGACY: secção de solução da landing antiga. Mantida apenas para
// referência; a enumeração atual dos módulos vive em LandingV2.
import { OSCopy } from '../../../ui/design-system/sovereign/OSCopy';

export const Solution = () => {
    return (
        <section className="py-32 bg-transparent relative">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-16 items-center">

                    {/* Left Column: Narrative */}
                    <div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-8 font-outfit leading-tight text-white">
                            {OSCopy.landing.cycleTitle} <br />
                            <span className="text-amber-500">sem intermediários.</span>
                        </h2>

                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                    <span className="text-amber-500 text-xs">⚡</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">OperationalHub</h3>
                                    <p className="text-neutral-400 text-sm leading-relaxed">
                                        Veja tudo que está acontecendo agora — vendas, tarefas, turnos e alertas.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                    <span className="text-amber-500 text-xs">🧠</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">AppStaff</h3>
                                    <p className="text-neutral-400 text-sm leading-relaxed">
                                        Cada funcionário sabe exatamente o que fazer — sem perguntar.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                    <span className="text-amber-500 text-xs">📱</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold mb-1">Menu Digital</h3>
                                    <p className="text-neutral-400 text-sm leading-relaxed">
                                        O cardápio muda, a operação não para. Atualiza sem reimprimir.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                    <span className="text-green-500 text-xs">✓</span>
                                </div>
                                <div>
                                    <p className="text-neutral-300 text-sm font-medium">
                                        Sistema age antes que você precise pensar. Nada cai no esquecimento.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: The Cycle Diagram */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-amber-500/5 blur-3xl opacity-30 rounded-full"></div>
                        <div className="relative z-10 bg-neutral-900/50 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">

                            {/* Step 1 */}
                            <div className="bg-black/40 border border-white/5 rounded-lg p-6 text-center mb-4 relative group hover:border-amber-500/30 transition-colors">
                                <span className="text-xs font-mono text-neutral-500 uppercase mb-2 block">Passo 1</span>
                                <h4 className="text-amber-400 font-bold">Página Pública</h4>
                                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-neutral-600">↓</div>
                            </div>

                            {/* Step 2 */}
                            <div className="bg-black/40 border border-white/5 rounded-lg p-6 text-center mb-4 relative group hover:border-amber-500/30 transition-colors">
                                <span className="text-xs font-mono text-neutral-500 uppercase mb-2 block">Passo 2</span>
                                <h4 className="text-white font-bold">Pedido Online</h4>
                                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-neutral-600">↓</div>
                            </div>

                            {/* Step 3 */}
                            <div className="bg-black/40 border border-white/5 rounded-lg p-6 text-center group hover:border-green-500/30 transition-colors">
                                <span className="text-xs font-mono text-neutral-500 uppercase mb-2 block">Passo 3</span>
                                <h4 className="text-green-400 font-bold">Pagamento & Operação</h4>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};
