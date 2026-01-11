/**
 * Hero Component - Landing Page
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
 * Ver: ARCHITECTURE_FLOW_LOCKED.md
 */
import { Link } from 'react-router-dom';
import { OSCopy } from '../../../ui/design-system/sovereign/OSCopy';

export const Hero = () => {
    return (
        <div className="min-h-screen bg-transparent text-white flex flex-col relative overflow-hidden">
            {/* Background: Deep Gold Glow - Reduced opacity to let global gradient show */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-amber-950/10 pointer-events-none z-0" />

            {/* Header */}
            <header className="w-full absolute top-0 left-0 p-6 z-50 flex justify-between items-center">
                <div className="flex items-center gap-3 font-bold opacity-0 md:opacity-100 transition-opacity">
                    <img src="/Logo Chefiapp.png" alt="ChefIApp" className="w-8 h-8 object-contain rounded-full" />
                    <span className="tracking-tight">Chef<span className="text-amber-500">IA</span>pp™</span>
                </div>
                <Link
                    to="/auth"
                    className="px-6 py-2 bg-neutral-900 border border-neutral-800 rounded-full hover:bg-neutral-800 hover:border-amber-900/50 transition-all text-sm font-medium text-neutral-400 hover:text-white"
                >
                    {OSCopy.landing.ctaSecondary}
                </Link>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-20 px-6 text-center mt-12 md:mt-0">
                {/* Logo Central Grande */}
                <div className="mb-12 relative group">
                    <div className="absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-1000"></div>
                    <img src="/Logo Chefiapp.png" alt="Sovereign Logo"
                        className="w-48 h-48 md:w-64 md:h-64 object-contain relative z-10 drop-shadow-[0_0_50px_rgba(245,158,11,0.3)] mix-blend-screen brightness-90 contrast-125"
                        style={{ maskImage: 'radial-gradient(circle, black 40%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 70%)' }}
                    />
                </div>

                {/* Badge System */}
                <div className="mb-8 inline-flex items-center gap-2 px-6 py-2 rounded-full border border-amber-500/30 bg-black/50 backdrop-blur-sm">
                    <span className="text-sm font-bold tracking-widest text-amber-500">CHEFIAPP™</span>
                    <span className="text-sm font-bold tracking-widest text-red-500">OS</span>
                </div>

                {/* Main Headline */}
                <h1 className="font-outfit text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight max-w-5xl mx-auto text-white">
                    Sistema <span className="text-amber-500">OPERACIONAL</span> <br />
                    <span>{OSCopy.landing.heroSubtitle}</span>
                </h1>

                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-neutral-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                    {OSCopy.landing.heroDescription}
                </p>

                {/* CTAs Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-6 justify-center w-full max-w-lg mx-auto">
                    <Link
                        to="/auth"
                        className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-lg rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.4)] transition-all transform hover:-translate-y-1"
                    >
                        Entrar em operação
                    </Link>
                    <Link
                        to="/auth"
                        className="w-full sm:w-auto px-8 py-4 bg-transparent border border-neutral-700 hover:border-neutral-500 text-white hover:text-amber-500 font-bold text-lg rounded-xl transition-all"
                    >
                        Já tenho conta
                    </Link>
                </div>
            </main>
        </div>
    );
};
