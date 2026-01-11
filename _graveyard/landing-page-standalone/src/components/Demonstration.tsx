/**
 * Demonstration Component - Landing Page
 * 
 * 🔒 ARQUITETURA LOCKED (E2E_FLOW = LOCKED)
 * 
 * REGRA DE OURO: Landing só redireciona para /app
 * FlowGate é a única autoridade que decide fluxo.
 * 
 * ⚠️ PROTEÇÃO CONTRA REGRESSÃO:
 * - NUNCA apontar para /login diretamente
 * - NUNCA usar query strings (?oauth=google, etc.)
 * - NUNCA adicionar lógica de "detectar usuário existente"
 * - NUNCA criar múltiplos pontos de decisão
 * 
 * Se alguém sugerir mudar isso → É REGRESSÃO ARQUITETURAL.
 * Ver: ARCHITECTURE_FLOW_LOCKED.md, ADR_001_SOVEREIGN_NAVIGATION_AUTHORITY.md
 */

// Detecta a URL correta do merchant portal baseado no ambiente
const getMerchantPortalUrl = (path: string) => {
    const isDev = import.meta.env.DEV;
    
    if (isDev) {
        // 🚨 ALERTA ARQUITETURAL: NUNCA altere esta URL para /login ou /onboarding.
        // A landing page APENAS redireciona para /app. O FlowGate decide o resto.
        return `http://localhost:5173${path}`;
    }
    
    // Em produção, usar o mesmo host
    return `${window.location.origin}${path}`;
};

export const Demonstration = () => {
    // 🚨 ALERTA ARQUITETURAL: NUNCA mais altere este path para /login ou /onboarding.
    // A landing page APENAS redireciona para /app. O FlowGate decide o resto.
    const appEntryPoint = getMerchantPortalUrl('/app');

    return (
        <section className="py-24 bg-surface/30 border-y border-white/5">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                    Não é mockup.<br />
                    <span className="text-gradient-gold">É sistema a funcionar.</span>
                </h2>
                <p className="text-xl text-muted max-w-2xl mx-auto mb-12">
                    A demonstração mostra exatamente o que o cliente final ve. Sem slides. Sem simulação.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <a
                        href="https://sofiagastrobaribiza.com"
                        target="_blank"
                        rel="noreferrer"
                        className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-zinc-800 px-6 font-medium text-white transition-all duration-300 hover:bg-zinc-700 hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-black"
                    >
                        <span className="mr-2">Ver página pública</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:translate-x-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                    </a>

                    {/* 🚨 ALERTA ARQUITETURAL: NUNCA mais altere este link para /login ou /onboarding. */}
                    {/* A landing page APENAS redireciona para /app. O FlowGate decide o resto. */}
                    <a
                        href={appEntryPoint}
                        className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md border border-white/10 px-6 font-medium text-white transition-all duration-300 hover:bg-white/5"
                    >
                        <span className="mr-2">Abrir Portal</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 transition-transform group-hover:translate-x-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </a>
                </div>

                {/* Static capture of Sofia Gastrobar site + live link */}
                <div className="mt-16 relative mx-auto max-w-6xl w-full">
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full pointer-events-none opacity-40" />
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/70">
                        <img
                            src="/sofiagastrobaribiza.png"
                            alt="Sofia Gastrobar Ibiza - captura real"
                            className="w-full h-auto"
                            loading="lazy"
                        />
                        <div className="bg-black/80 backdrop-blur-sm border-t border-white/10 px-6 py-4 text-sm text-muted flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span>Ver ao vivo no domínio oficial.</span>
                            <a
                                href="https://sofiagastrobaribiza.com"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary/20 text-white hover:bg-primary/30 transition-colors"
                            >
                                🌐 Abrir sofiagastrobaribiza.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
