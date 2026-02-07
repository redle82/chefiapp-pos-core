import { Link } from 'react-router-dom';
import { useAuth } from '../../../core/auth/useAuth';
import { OSCopy } from '../../../ui/design-system/sovereign/OSCopy';

const WHATSAPP_NUMBER =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: { VITE_CONTACT_WHATSAPP?: string } })?.env?.VITE_CONTACT_WHATSAPP) ||
  '351000000000';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`;
const CONTACT_EMAIL =
  (typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: { VITE_CONTACT_EMAIL?: string } })?.env?.VITE_CONTACT_EMAIL) ||
  'contacto@chefiapp.com';

export const Footer = () => {
    const { session } = useAuth();
    const hasSession = !!session;

    return (
        <footer className="pt-24 pb-12 font-sans relative">
            <div className="container mx-auto px-6">
                <div className="text-center mb-24">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8 text-[var(--text-primary)] font-outfit drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        Pronto para testar sua operação <br />
                        <span className="text-[var(--color-primary)]">
                            no mundo real?
                        </span>
                    </h2>
                    <p className="text-[var(--text-secondary)] text-lg mb-8 max-w-2xl mx-auto space-y-2 leading-relaxed">
                        <span className="block">
                            O tempo de montar o menu, ligar o TPV e pôr a equipa a trabalhar é o tempo de aquecer a chapa. Enquanto um ovo frita, o menu já está online.
                        </span>
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center flex-wrap">
                        <Link
                            to={hasSession ? '/app/dashboard' : '/auth'}
                            className="w-full sm:w-auto px-10 py-5 bg-primary hover:opacity-90 text-[var(--text-inverse)] font-extrabold text-lg rounded-xl shadow-[var(--elevation-primary)] transition-all transform hover:-translate-y-1"
                        >
                            {hasSession ? OSCopy.landing.ctaIrAoSistema : OSCopy.landing.ctaEntrarSistema}
                        </Link>
                        <span className="flex items-center gap-3 text-sm text-[var(--text-tertiary)]">
                            <Link
                                to="/op/tpv?mode=demo"
                                className="font-medium hover:text-[var(--color-primary)] transition-colors"
                            >
                                {OSCopy.landing.ctaVerDemonstracao}
                            </Link>
                            <span className="text-[var(--text-disabled)]">·</span>
                            <Link
                                to="/auth"
                                className="font-medium hover:text-[var(--color-primary)] transition-colors"
                            >
                                {OSCopy.landing.ctaJaTenhoAcesso}
                            </Link>
                            <span className="text-[var(--text-disabled)]">·</span>
                            <a
                                href={WHATSAPP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium hover:text-[#25D366] transition-colors"
                            >
                                WhatsApp
                            </a>
                        </span>
                    </div>
                </div>

                {/* Subtle Divider (Gradient to Transparent) */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12" />

                <div className="flex flex-col md:flex-row justify-between items-center text-sm text-[var(--text-tertiary)] transition-colors gap-4">
                    <div className="flex flex-wrap gap-4 md:gap-8 items-center">
                        <span>© {new Date().getFullYear()} ChefIApp</span>
                        <span className="hidden md:inline text-[var(--text-disabled)]">•</span>
                        <span>Produto para restauração</span>
                        <span className="hidden md:inline text-[var(--text-disabled)]">•</span>
                        <span>Dúvidas?</span>
                        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-primary)] transition-colors font-medium text-[#25D366]">WhatsApp</a>
                        <span>ou</span>
                        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-[var(--color-primary)] transition-colors">{CONTACT_EMAIL}</a>
                    </div>

                    <div className="flex gap-8 mt-4 md:mt-0">
                        <a href="#terms" className="hover:text-[var(--color-primary)] transition-colors">Termos</a>
                        <a href="#privacy" className="hover:text-[var(--color-primary)] transition-colors">Privacidade</a>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-center gap-3 text-xs text-[var(--text-tertiary)] font-mono">
                    <div className="flex items-center gap-2">
                        <img
                            src="/Logo Chefiapp.png"
                            alt="ChefIApp"
                            className="w-5 h-5 object-contain rounded-full opacity-70 grayscale hover:grayscale-0 transition-all"
                        />
                        <span className="font-bold tracking-widest text-[var(--text-tertiary)]">
                            CHEF<span className="text-[var(--color-primary)]">IA</span>PP™
                        </span>
                    </div>

                    <a
                        href="https://goldmonkey.studio"
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors opacity-60 hover:opacity-100"
                    >
                        <span>Feito com <span className="text-[var(--color-primary)] inline-block animate-pulse">⚡</span> por</span>
                        <span className="font-bold tracking-tight text-[var(--text-secondary)] group-hover:text-[var(--color-primary)]">GOLDMONKEY.STUDIO</span>
                    </a>
                </div>
            </div>
        </footer>
    );
};
