export const IntegrationDelivery = () => {
    return (
        <section className="py-24 bg-black/20">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">
                        Delivery entra na operação. Não governa ela.
                    </h2>
                    <p className="text-lg text-muted">
                        ChefApp integra pedidos externos ao fluxo real do restaurante — sem duplicar telas, sem reinventar processos.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 glass-card p-10 border border-white/10">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold">Integração com plataformas de delivery</h3>
                        <ul className="space-y-3 text-muted">
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>Pedidos de delivery entram no mesmo fluxo operacional</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>Sem re-digitar pedidos</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>Sem trocar de sistema no meio do serviço</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>Sem dependência de “um tablet por app”</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>Sem criar uma operação paralela</span>
                            </li>
                        </ul>
                        <p className="text-sm text-muted font-semibold">
                            Delivery deixa de ser um problema separado. Vira parte do turno.
                        </p>
                        <p className="text-xs text-muted/70">
                            Compatível com plataformas líderes via integrações técnicas (API, webhooks ou fluxos indiretos). Sem logos, sem “parceria obrigatória”.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-primary">Integração com terceiros (sem aprisionamento)</h3>
                        <ul className="space-y-3 text-muted">
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>Plataformas de delivery</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>Sistemas de faturamento e TPVs fiscais</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>Ferramentas legadas já em uso</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary text-xl">•</span>
                                <span>Soluções específicas da empresa</span>
                            </li>
                        </ul>
                        <p className="text-sm text-muted font-semibold">
                            Integração técnica, não comercial: API, webhooks ou fluxo operacional direto (quando não existe API).
                        </p>
                        <p className="text-sm text-muted font-semibold">
                            ChefApp não força você a trocar o que já funciona nem prende a parceiros exclusivos.
                        </p>
                    </div>
                </div>

                <div className="text-center mt-10 space-y-3">
                    <h3 className="text-2xl font-bold">Quando a integração é o produto, a operação vira refém.</h3>
                    <p className="text-muted max-w-3xl mx-auto">
                        ChefApp faz o inverso: a operação é o centro, as integrações orbitam, o fluxo permanece único.
                    </p>
                    <p className="text-white font-semibold">
                        Delivery, POS, equipa e operação. Um sistema. Um fluxo.
                    </p>
                    <p className="text-sm text-muted/70">
                        Exemplo seguro: “Compatível com plataformas de delivery e POS amplamente usados na Europa.” Sem logos, sem prometer integração oficial.
                    </p>
                </div>
            </div>
        </section>
    );
};

