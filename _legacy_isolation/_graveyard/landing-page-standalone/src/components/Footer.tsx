/**
 * Footer Component - Landing Page
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

export const Footer = () => {
    // 🚨 ALERTA ARQUITETURAL: NUNCA mais altere este path para /login ou /onboarding.
    // A landing page APENAS redireciona para /app. O FlowGate decide o resto.
    const appEntryPoint = getMerchantPortalUrl('/app');

    return (
        <footer className="bg-black/80 pt-24 pb-12 border-t border-white/5">
            <div className="container mx-auto px-6">
                {/* Final CTA */}
                <div className="text-center mb-24">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8">
                        Pronto para testar sua operação no mundo real?<br />
                        <span className="text-gray-500">Operação real · 14 dias · Zero compromisso.</span>
                    </h2>
                    <p className="text-muted text-lg mb-8 max-w-2xl mx-auto space-y-2">
                        <span className="block">
                            O tempo de montar o menu, ligar o TPV e pôr a equipa a trabalhar é o tempo de aquecer a chapa. Enquanto um ovo frita, o menu já está online. Enquanto o café sai, o TPV já conversa com a operação.
                        </span>
                        <span className="block">
                            Se a casa abre rápido, o sistema acompanha. Se funciona no primeiro serviço, funciona no dia a dia — com os seus equipamentos.
                        </span>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {/* 🚨 ALERTA ARQUITETURAL: NUNCA mais altere este link para /login ou /onboarding. */}
                        {/* A landing page APENAS redireciona para /app. O FlowGate decide o resto. */}
                        <a
                            href={appEntryPoint}
                            className="btn-primary flex items-center justify-center gap-2"
                        >
                            🚀 Começar agora
                        </a>
                        {/* 🚨 ALERTA ARQUITETURAL: NUNCA mais altere este link para /login ou /onboarding. */}
                        {/* A landing page APENAS redireciona para /app. O FlowGate decide o resto. */}
                        <a
                            href={appEntryPoint}
                            className="btn-outline border-white/20 text-white hover:bg-white/5"
                        >
                            Já tenho conta
                        </a>
                    </div>
                </div>

                <div className="h-px w-full bg-white/5 mb-12" />

                <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted">
                    <div className="flex gap-8">
                        <span>© {new Date().getFullYear()} ChefIApp</span>
                        <span>Produto para restauração</span>
                    </div>

                    <div className="flex gap-8 mt-4 md:mt-0">
                        <a href="#terms" className="hover:text-primary transition-colors">Termos</a>
                        <a href="#privacy" className="hover:text-primary transition-colors">Privacidade</a>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-[4px] text-sm text-muted">
                    <img
                        src="/logo.png"
                        alt="ChefIApp"
                        className="w-8 h-8 object-contain"
                    />
                    <span className="font-bold text-white">Chef<span className="text-primary">IA</span>pp™</span>
                    <a
                        href="https://goldmonkey.studio"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary transition-colors"
                    >
                        Feito com <span className="text-primary">❤</span> por GoldMonkey.studio
                    </a>
                </div>
            </div>
        </footer>
    );
};
