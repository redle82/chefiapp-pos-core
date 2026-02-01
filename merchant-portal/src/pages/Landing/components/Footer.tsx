import { Link } from 'react-router-dom';
import { useSupabaseAuth } from '../../../core/auth/useSupabaseAuth';
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
    const { session } = useSupabaseAuth();
    const hasSession = !!session;

    return (
        <footer className="pt-24 pb-12 font-sans relative">
            <div className="container mx-auto px-6">
                <div className="text-center mb-24">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white font-outfit drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        Pronto para testar sua operação <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                            no mundo real?
                        </span>
                    </h2>
                    <p className="text-neutral-300 text-lg mb-8 max-w-2xl mx-auto space-y-2 leading-relaxed">
                        <span className="block">
                            O tempo de montar o menu, ligar o TPV e pôr a equipa a trabalhar é o tempo de aquecer a chapa. Enquanto um ovo frita, o menu já está online.
                        </span>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
                        <Link
                            to={hasSession ? '/dashboard' : '/auth'}
                            className="w-full sm:w-auto px-10 py-5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-lg rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.4)] transition-all transform hover:-translate-y-1"
                        >
                            {hasSession ? 'Voltar ao sistema' : `${OSCopy.landing.ctaOperar} · 14 dias grátis`}
                        </Link>
                        <Link
                            to="/demo"
                            className="w-full sm:w-auto px-10 py-5 bg-transparent border border-neutral-600 hover:border-amber-500 text-white hover:text-amber-500 font-bold text-lg rounded-xl transition-all"
                        >
                            {OSCopy.landing.ctaExplorarDemo}
                        </Link>
                        <a
                            href={WHATSAPP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-10 py-5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-lg rounded-xl transition-all inline-flex items-center justify-center"
                        >
                            👉 WhatsApp
                        </a>
                        <Link
                            to={hasSession ? '/dashboard' : '/auth'}
                            className="w-full sm:w-auto px-10 py-5 bg-transparent border border-neutral-700 hover:border-neutral-500 text-white hover:text-amber-500 font-bold text-lg rounded-xl transition-all"
                        >
                            {hasSession ? 'Voltar ao comando' : OSCopy.landing.ctaJaTenhoAcesso}
                        </Link>
                    </div>
                </div>

                {/* Subtle Divider (Gradient to Transparent) */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-12" />

                <div className="flex flex-col md:flex-row justify-between items-center text-sm text-neutral-500/80 hover:text-neutral-400 transition-colors gap-4">
                    <div className="flex flex-wrap gap-4 md:gap-8 items-center">
                        <span>© {new Date().getFullYear()} ChefIApp</span>
                        <span className="hidden md:inline text-neutral-700">•</span>
                        <span>Produto para restauração</span>
                        <span className="hidden md:inline text-neutral-700">•</span>
                        <span>Dúvidas?</span>
                        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 transition-colors font-medium text-[#25D366]">WhatsApp</a>
                        <span>ou</span>
                        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-amber-500 transition-colors">{CONTACT_EMAIL}</a>
                    </div>

                    <div className="flex gap-8 mt-4 md:mt-0">
                        <a href="#terms" className="hover:text-amber-500 transition-colors">Termos</a>
                        <a href="#privacy" className="hover:text-amber-500 transition-colors">Privacidade</a>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-center gap-3 text-xs text-neutral-600 font-mono">
                    <div className="flex items-center gap-2">
                        <img
                            src="/Logo Chefiapp.png"
                            alt="ChefIApp"
                            className="w-5 h-5 object-contain rounded-full opacity-70 grayscale hover:grayscale-0 transition-all"
                        />
                        <span className="font-bold tracking-widest text-neutral-500">
                            CHEF<span className="text-amber-600">IA</span>PP™
                        </span>
                    </div>

                    <a
                        href="https://goldmonkey.studio"
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-2 hover:text-amber-500 transition-colors opacity-60 hover:opacity-100"
                    >
                        <span>Feito com <span className="text-amber-500 inline-block animate-pulse">⚡</span> por</span>
                        <span className="font-bold tracking-tight text-neutral-400 group-hover:text-amber-400">GOLDMONKEY.STUDIO</span>
                    </a>
                </div>
            </div>
        </footer>
    );
};
