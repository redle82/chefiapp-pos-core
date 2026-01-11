/**
 * Hero Component - Landing Page
 * 
 * REGRA DE OURO: Landing só redireciona para /app
 * O FlowGate decide tudo: auth, onboarding, dashboard.
 */
export const Hero = () => {
    return (
        <div className="min-h-screen bg-fire-ignition text-white flex flex-col relative">
            {/* Environmental Micro-Variation: Heat rising from bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-fire-vinho/80 via-transparent to-transparent pointer-events-none z-10"></div>
            <header className="w-full border-b border-white/5 bg-black/40 backdrop-blur">
                <div className="container mx-auto px-6 h-16 flex items-center">
                    <a href="/" className="flex items-center gap-3 font-bold">
                        <img src="/logo.png" alt="ChefIApp" className="w-10 h-10 object-contain" />
                        <span>Chef<span className="text-primary">IA</span>pp™</span>
                    </a>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center relative z-20">
                <div className="text-center px-6 max-w-3xl">
                    <div className="flex flex-col items-center mb-6">
                        <img
                            src="/logo.png"
                            alt="ChefIApp Logo"
                            className="w-[290px] h-[290px] object-contain -mb-12"
                        />
                        <div className="px-6 py-2 border-2 border-primary rounded-full bg-black/20 backdrop-blur-sm">
                            <span className="text-2xl font-bold tracking-widest text-primary uppercase">ChefIApp™ <span className="text-os-red drop-shadow-[0_0_8px_rgba(217,56,30,0.5)]">OS</span></span>
                        </div>
                    </div>
                    <h1 className="font-outfit text-5xl md:text-6xl font-bold mb-4 leading-tight">
                        Sistema <span className="text-gradient-gold">OPERACIONAL</span><br />
                        para Restaurantes
                    </h1>
                    <p className="text-lg text-muted mb-8">
                        Execução em tempo real. Cozinha, salão e caixa no mesmo fluxo.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {/* 🎯 ÚNICO DESTINO: /app - FlowGate decide o resto */}
                        <a href="/app" className="btn-primary flex items-center justify-center">
                            Entrar em operação
                        </a>
                        <a href="/app" className="btn-outline flex items-center justify-center">
                            Já tenho conta
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
};
