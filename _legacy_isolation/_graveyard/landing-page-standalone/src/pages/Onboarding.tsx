import React, { useState } from 'react';


type Step = 'INPUT' | 'BUILDING' | 'CONFIRM' | 'SUCCESS';

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

const Header = () => (
    <header className="w-full border-b border-white/5 bg-black/50 backdrop-blur">
        <div className="container mx-auto px-6 h-16 flex items-center">
            <a href="/" className="flex items-center gap-2 text-white font-bold">
                <img src="/logo.png" alt="ChefIApp" className="w-8 h-8 object-contain" />
                <span>ChefIApp™</span>
            </a>
        </div>
    </header>
);

const Footer = () => (
    <footer className="mt-auto border-t border-white/5 bg-black/70 backdrop-blur">
        <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-muted gap-3">
            <div className="flex items-center gap-2 text-white font-semibold">
                <img src="/logo.png" alt="ChefIApp" className="w-6 h-6 object-contain" />
                <span>ChefIApp™</span>
            </div>
            <div className="flex gap-6">
                <span>© {new Date().getFullYear()} ChefIApp</span>
                <span>Produto para restauração</span>
            </div>
            <div className="flex gap-6">
                <a href="#" className="hover:text-primary transition-colors">Termos</a>
                <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
            </div>
        </div>
    </footer>
);

export default function Onboarding() {
    const [step, setStep] = useState<Step>('INPUT');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [category, setCategory] = useState('RESTAURANT');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ slug: string; url: string; session_token: string } | null>(null);

    const previewSlug = name ? slugify(name) : result?.slug || '';

    const handleStart = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('BUILDING');

        // Simulate "AI Building" delay to feel premium
        // In real implementation: fetch('/api/onboarding/start', ...)
        setTimeout(async () => {
            // Mock API Response
            // TODO: Replace with fetch to http://localhost:4320/api/onboarding/start
            /*
            const res = await fetch('http://localhost:4320/api/onboarding/start', {
                method: 'POST',
                body: JSON.stringify({ email, name: name || 'Meu Restaurante' })
            });
            const data = await res.json();
            */

            // MOCK DATA for Interface Dev
            const mockData = {
                session_token: 'mock-session-token-' + Date.now(),
                user_id: 'user-123',
                company_id: 'comp-123',
                restaurant_id: 'rest-123',
                slug: 'restaurante-' + Math.floor(Math.random() * 1000),
                status: 'IDENTITY_CREATED'
            };

            // Autofill logic
            setName('O Melhor Burger');
            setCity('Lisboa');
            setResult({
                slug: mockData.slug,
                url: `/public/${mockData.slug}`,
                session_token: mockData.session_token
            });
            setStep('CONFIRM');
        }, 2500); // 2.5s "Magic" delay
    };

    const handleConfirm = async () => {
        setLoading(true);
        // Simulate API Call
        // fetch('/api/onboarding/confirm', ...)
        setTimeout(() => {
            // Mock
            const finalSlug = slugify(name || result?.slug || 'demo');
            window.location.href = `http://localhost:4320/public/${finalSlug}`;
        }, 1500);
    };

    if (step === 'BUILDING') {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center text-white p-6">
                    <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mb-8"></div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                        Criando sua estrutura...
                    </h2>
                    <p className="text-neutral-500 mt-2">Configurando banco de dados, menus e pagamentos.</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (step === 'CONFIRM') {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col animate-in fade-in zoom-in duration-500">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <div className="max-w-md w-full bg-neutral-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
                        <h2 className="text-xl font-bold text-white mb-6">Confirme os dados</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1">Nome do Restaurante</label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1">Link Público (Preview)</label>
                                <div className="w-full bg-black/30 border border-white/5 rounded-lg px-4 py-3 text-neutral-400 font-mono text-sm truncate flex items-center">
                                    <span className="text-neutral-600 mr-1">chefiapp.com/</span>
                                    <span className="text-gold-500">{previewSlug}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1">Cidade</label>
                                <input
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1">Categoria</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none transition-colors appearance-none"
                                >
                                    <option value="RESTAURANT">Restaurante</option>
                                    <option value="BAR">Bar / Gastrobar</option>
                                    <option value="CAFE">Café / Padaria</option>
                                    <option value="HOTEL">Hotel</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="w-full mt-8 bg-gold-500 hover:bg-gold-400 text-black font-semibold h-12 rounded-lg transition-all transform active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Finalizando...' : 'Publicar Agora'}
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 relative overflow-hidden flex flex-col">
            <Header />
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(201,162,39,0.1),transparent_50%)] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center justify-center flex-1 p-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300 mb-4">
                            ChefIApp
                        </h1>
                        <p className="text-neutral-400">
                            Primeiro serviço guiado. Digite seu email para começar.
                        </p>
                    </div>

                    <form onSubmit={handleStart} className="space-y-4">
                        <div className="group relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-gold-500 to-orange-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                            <input
                                type="email"
                                required
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="relative w-full bg-neutral-900 border border-white/10 rounded-lg px-6 py-4 text-lg text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500/50 transition-all font-light"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold h-14 rounded-lg text-lg transition-all transform active:scale-[0.98] shadow-[0_0_20px_rgba(201,162,39,0.3)] hover:shadow-[0_0_30px_rgba(201,162,39,0.5)]"
                        >
                            Entrar em operação
                        </button>

                        <p className="text-center text-xs text-neutral-600 mt-4">
                            Não é necessário cartão de crédito. Setup instantâneo.
                        </p>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
}
