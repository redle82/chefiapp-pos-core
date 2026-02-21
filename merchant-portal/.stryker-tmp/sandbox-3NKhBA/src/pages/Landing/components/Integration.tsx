// @ts-nocheck
export const Integration = () => {
    return (
        <section className="py-24 bg-black/20">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                    <h2 className="text-3xl md:text-5xl font-bold">
                        Funciona com o que você já usa.
                        <br className="hidden md:block" />
                        Não força trocas desnecessárias.
                    </h2>
                    <p className="text-lg text-muted">
                        ChefIApp integra-se aos sistemas de faturamento e TPV já existentes — com API, webhooks ou fluxo operacional direto.
                    </p>
                    <p className="text-sm text-muted font-semibold">
                        Integrações abertas. Sem dependência.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 text-xs text-muted">
                        <span className="px-3 py-1 rounded-full border border-white/10">Compatível por design</span>
                        <span className="px-3 py-1 rounded-full border border-white/10">Sem lock-in</span>
                        <span className="px-3 py-1 rounded-full border border-white/10">Sem parceiros exclusivos</span>
                        <span className="px-3 py-1 rounded-full border border-white/10">Sem contratos de integração</span>
                    </div>
                    <p className="text-sm text-muted font-semibold">
                        ChefIApp não vende integração. Ele nasce integrável.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 glass-card p-10 border border-white/10">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold">Integração real (sem marketing)</h3>
                        <ul className="space-y-3 text-muted">
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>Sistemas de faturamento (via API ou hooks)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>TPVs fiscais existentes</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>Fluxos de pré-conta e fechamento</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>Sistemas legados, quando necessário</span>
                            </li>
                        </ul>
                        <p className="text-sm text-muted font-semibold">
                            ChefIApp não quebra sua operação para vender um pacote novo.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-primary">O que já entregamos nativamente</h3>
                        <ul className="space-y-3 text-muted">
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>Página web do restaurante (menu público)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>Comandeiro digital</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>Gestão de turnos, tarefas e stock</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>Operação conectada em tempo real</span>
                            </li>
                        </ul>
                        <p className="text-sm text-muted font-semibold">
                            O que outros vendem como módulos separados, aqui nasce junto.
                        </p>
                    </div>
                </div>

                <div className="text-center mt-10 space-y-3">
                    <p className="text-lg md:text-xl text-white font-semibold">
                        ChefIApp não disputa o POS fiscal. Ele governa a operação ao redor dele.
                    </p>
                    <p className="text-muted">
                        Compatível com sistemas de faturamento existentes. Aberto por design. Integrável por padrão.
                    </p>
                    <p className="text-sm text-muted/80 max-w-3xl mx-auto">
                        Integração técnica, não comercial: API, webhooks, exportação/ingestão de dados e fluxos operacionais. Onde existe API, integramos. Onde não existe, conectamos o fluxo. Onde o sistema é fechado, não quebramos a operação.
                    </p>
                </div>
            </div>
        </section>
    );
};

