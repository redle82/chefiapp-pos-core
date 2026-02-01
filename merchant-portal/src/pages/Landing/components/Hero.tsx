/**
 * Hero Component - Landing Page
 *
 * Consciência de runtime (§7): se há sessão, CTA principal = "Voltar ao sistema" → /dashboard;
 * sem sessão = "Entrar em operação" → /auth + microcopy "Configuração guiada. 15 minutos."
 * FlowGate permanece autoridade; landing apenas reflecte estado.
 */
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../../core/auth/useSupabaseAuth';
import { OSCopy } from '../../../ui/design-system/sovereign/OSCopy';

const WHATSAPP_NUMBER =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: { VITE_CONTACT_WHATSAPP?: string } })?.env?.VITE_CONTACT_WHATSAPP) ||
  '351000000000';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`;

const REDIRECT_WHEN_SESSION_MS = 2500;

export const Hero = () => {
    const { session, loading } = useSupabaseAuth();
    const navigate = useNavigate();
    const hasSession = !!session;

    // Redirecionamento silencioso quando já tem sessão (§7)
    useEffect(() => {
        if (!hasSession) return;
        const t = setTimeout(() => navigate('/dashboard', { replace: true }), REDIRECT_WHEN_SESSION_MS);
        return () => clearTimeout(t);
    }, [hasSession, navigate]);

    return (
        <div className="min-h-screen bg-transparent text-white flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-amber-950/10 pointer-events-none z-0" />

            <header className="w-full absolute top-0 left-0 p-6 z-50 flex justify-between items-center">
                <div className="flex items-center gap-3 font-bold opacity-0 md:opacity-100 transition-opacity">
                    <img src="/Logo Chefiapp.png" alt="ChefIApp" className="w-8 h-8 object-contain rounded-full" />
                    <span className="tracking-tight">Chef<span className="text-amber-500">IA</span>pp™</span>
                </div>
                <Link
                    to={hasSession ? '/dashboard' : '/auth'}
                    className="px-6 py-2 bg-neutral-900 border border-neutral-800 rounded-full hover:bg-neutral-800 hover:border-amber-900/50 transition-all text-sm font-medium text-neutral-400 hover:text-white"
                >
                    {hasSession ? 'Voltar ao sistema' : OSCopy.landing.ctaSecondary}
                </Link>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-20 px-6 text-center mt-12 md:mt-0">
                <div className="mb-12 relative group">
                    <div className="absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-50 transition-opacity duration-1000"></div>
                    <img src="/Logo Chefiapp.png" alt="Sovereign Logo"
                        className="w-48 h-48 md:w-64 md:h-64 object-contain relative z-10 drop-shadow-[0_0_50px_rgba(245,158,11,0.3)] mix-blend-screen brightness-90 contrast-125"
                        style={{ maskImage: 'radial-gradient(circle, black 40%, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 70%)' }}
                    />
                </div>

                <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-amber-500/30 bg-black/50 backdrop-blur-sm">
                        <span className="text-sm font-bold tracking-widest text-amber-500">CHEFIAPP™</span>
                        <span className="text-sm font-bold tracking-widest text-red-500">OS</span>
                    </div>
                    {/* Indicador de runtime (§7) — visível para confirmar consciência de sessão */}
                    <span
                        className="text-xs font-medium px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-neutral-400"
                        aria-live="polite"
                    >
                        {loading ? 'A verificar sessão…' : hasSession ? 'Sessão ativa · A redirecionar' : 'Modo visita'}
                    </span>
                </div>

                <h1 className="font-outfit text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight max-w-5xl mx-auto text-white">
                    Sistema <span className="text-amber-500">OPERACIONAL</span> <br />
                    <span>{OSCopy.landing.heroSubtitle}</span>
                </h1>

                <p className="text-xl md:text-2xl text-neutral-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                    {OSCopy.landing.heroDescription}
                </p>

                <p className="text-neutral-400 text-base mb-8">
                    A partir de <strong className="text-white">49 €/mês</strong>. Primeiro mês de teste grátis.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full max-w-2xl mx-auto flex-wrap">
                    {hasSession ? (
                        <>
                            <Link
                                to="/dashboard"
                                className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-lg rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.4)] transition-all transform hover:-translate-y-1"
                            >
                                Voltar ao sistema
                            </Link>
                            <Link
                                to="/demo"
                                className="w-full sm:w-auto px-8 py-4 bg-transparent border border-neutral-600 hover:border-amber-500 text-white hover:text-amber-500 font-bold text-lg rounded-xl transition-all"
                            >
                                {OSCopy.landing.ctaExplorarDemo}
                            </Link>
                            <a
                                href={WHATSAPP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-lg rounded-xl transition-all inline-flex items-center justify-center gap-2"
                            >
                                👉 Fale no WhatsApp
                            </a>
                            <p className="w-full text-center text-neutral-500 text-sm mt-2">
                                A redirecionar para o comando em instantes…
                            </p>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/auth"
                                className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-lg rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.4)] transition-all transform hover:-translate-y-1"
                            >
                                {OSCopy.landing.ctaOperar}
                            </Link>
                            <Link
                                to="/demo"
                                className="w-full sm:w-auto px-8 py-4 bg-transparent border border-neutral-600 hover:border-amber-500 text-white hover:text-amber-500 font-bold text-lg rounded-xl transition-all"
                            >
                                {OSCopy.landing.ctaExplorarDemo}
                            </Link>
                            <a
                                href={WHATSAPP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-lg rounded-xl transition-all inline-flex items-center justify-center gap-2"
                            >
                                👉 Fale no WhatsApp
                            </a>
                            <Link
                                to="/auth"
                                className="w-full sm:w-auto px-6 py-3 text-neutral-500 hover:text-white text-sm font-medium transition-colors"
                            >
                                {OSCopy.landing.ctaJaTenhoAcesso}
                            </Link>
                            <p className="w-full text-center mt-3">
                                <span className="inline-block px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-200/90 text-sm font-medium">
                                    Configuração guiada · 15 minutos
                                </span>
                            </p>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};
