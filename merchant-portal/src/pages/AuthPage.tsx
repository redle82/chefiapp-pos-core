/**
 * AuthPage - Autenticação Pura
 * 
 * 🔒 ARQUITETURA SOBERANA
 * 
 * REGRA DE OURO: Auth apenas autentica. Não decide fluxo.
 * FlowGate é a única autoridade que decide o próximo passo.
 * 
 * ⚠️ PROTEÇÃO CONTRA REGRESSÃO:
 * - NUNCA redirecionar após OAuth (OAuth já redireciona para /app)
 * - NUNCA decidir onboarding
 * - NUNCA usar flags técnicas (isLocal, technicalLogin, etc)
 * - NUNCA criar múltiplos pontos de decisão
 * 
 * Ver: CONSTITUTION.md
 */
import React, { useState } from 'react';
import { supabase } from '../core/supabase';
import { InlineAlert } from '../ui/design-system';
import { Button } from '../ui/design-system/Button';
import { Card } from '../ui/design-system/Card';
import { GlobalFooter } from '../components/GlobalFooter';
import { OSFrame } from '../ui/design-system/sovereign/OSFrame';
import { OSCopy } from '../ui/design-system/sovereign/OSCopy';
import { Logger } from '../core/logger/Logger';

export const AuthPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOAuth = async (provider: 'google' | 'apple') => {
        try {
            setLoading(true);
            setError(null);

            // 🔒 ARQUITETURA SOBERANA: OAuth sempre redireciona para /app
            // FlowGate é a única autoridade que decide o próximo passo.
            const baseUrl = window.location.origin;
            const redirectUrl = `${baseUrl}/app`;

            const { data, error: authErr } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: redirectUrl,
                    scopes: 'openid email profile',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });

            if (authErr) {
                console.error('[AuthPage] OAuth error:', authErr);
                Logger.error('Auth: OAuth login failed', authErr as Error, {
                    provider,
                    redirectUrl
                });
                throw authErr;
            }

            // OAuth redirects automatically
            console.log('[AuthPage] OAuth initiated, redirecting to:', redirectUrl);
            Logger.info('Auth: OAuth login initiated', {
                provider,
                redirectUrl
            });
        } catch (err: any) {
            console.error('[AuthPage] OAuth exception:', err);
            Logger.error('Auth: OAuth exception', err as Error, {
                provider,
                redirectUrl
            });
            setError(err.message || 'Erro ao iniciar autenticação. Verifique se o OAuth está configurado no Supabase.');
            setLoading(false);
        }
    };

    return (
        <OSFrame context="auth" className="auth-page-frame">
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f5f5f7',
                padding: '20px'
            }}>
                <Card elevated padding="lg" style={{ maxWidth: '400px', width: '100%' }}>
                    <div className="text-center mb-8" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
                            {OSCopy.auth.loginTitle}
                        </h1>
                        <p style={{ opacity: 0.6, fontSize: '14px' }}>
                            {OSCopy.auth.loginSubtitle}
                        </p>
                    </div>

                    {error && (
                        <InlineAlert variant="error" style={{ marginBottom: '16px' }}>
                            {error}
                        </InlineAlert>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Button
                            onClick={() => handleOAuth('google')}
                            disabled={loading}
                            variant="primary"
                            size="lg"
                            style={{ width: '100%' }}
                        >
                            🌍 Entrar com Google
                        </Button>
                        <p style={{ fontSize: '12px', opacity: 0.6, textAlign: 'center', marginTop: '8px' }}>
                            {OSCopy.auth.privacyNote}
                        </p>
                    </div>

                    {/* 🛠️ DEV LOGIN SECTION (TEMPORARY FOR E2E) */}
                    <div style={{ marginTop: 32, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24 }}>
                        <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-500 mb-4 text-center">Development Access</h3>
                        <div className="flex flex-col gap-3">
                            <input
                                id="dev-email"
                                type="email"
                                placeholder="test@chefiapp.com"
                                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none transition-colors"
                            />
                            <input
                                id="dev-password"
                                type="password"
                                placeholder="password"
                                className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-amber-500/50 outline-none transition-colors"
                            />
                            <Button
                                onClick={async () => {
                                    try {
                                        setLoading(true);
                                        const email = (document.getElementById('dev-email') as HTMLInputElement).value;
                                        const password = (document.getElementById('dev-password') as HTMLInputElement).value;

                                        if (!email || !password) throw new Error('Credenciais faltando');

                                        // Try Login
                                        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });

                                        if (loginErr) {
                                            // Handle "Invalid login credentials" by trying SignUp (Dev Mode lazy creation)
                                            console.log('Login failed, trying signup...', loginErr.message);
                                            Logger.warn('Auth: Dev login failed, attempting signup', {
                                                email,
                                                error: loginErr.message
                                            });
                                            const { error: signUpErr } = await supabase.auth.signUp({
                                                email,
                                                password,
                                                options: { data: { name: 'Dev Tester' } }
                                            });
                                            if (signUpErr) {
                                                Logger.error('Auth: Dev signup failed', signUpErr as Error, { email });
                                                throw signUpErr;
                                            }
                                            Logger.info('Auth: Dev account created', { email });
                                            alert('Conta criada! Verifique email ou se auto-confirmou.');
                                        } else {
                                            Logger.info('Auth: Dev login successful', { email });
                                        }

                                        // 🔒 ARQUITETURA SOBERANA: Redirecionar para /app após auth
                                        window.location.href = '/app';
                                    } catch (err: any) {
                                        Logger.error('Auth: Dev login exception', err as Error, { email });
                                        setError(err.message);
                                        setLoading(false);
                                    }
                                }}
                                variant="secondary"
                                size="sm"
                                style={{ width: '100%', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b' }}
                            >
                                ⚡ Entrar (Dev Mode)
                            </Button>
                        </div>
                    </div>
                </Card>

                <GlobalFooter />
            </div>
        </OSFrame>
    );
};
