import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Colors, Spacing, Typography } from '../../ui/design-system/tokens';
import { Card } from '../../ui/design-system/Card';
import { Button } from '../../ui/design-system/Button';
import { recordLogout } from '../../core/auth/authAudit';
import { supabase } from '../../core/supabase';

export const DraftDashboard: React.FC = () => {
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await recordLogout();
        await supabase.auth.signOut();
        navigate('/login');
    };

    // Container style mimicking the premium "Sovereign" feel
    // Similar to OnboardingWizard but essentially a 'Waiting Room'
    return (
        <div style={{
            minHeight: '100vh',
            background: '#000',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: Spacing.xl,
            fontFamily: Typography.fontFamily
        }}>
            {/* Header / Brand */}
            <div style={{ width: '100%', maxWidth: '900px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing['3xl'] }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: Colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold', color: '#000' }}>C</div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.5 }}>ChefIApp</span>
                        <span style={{ fontSize: 9, opacity: 0.5, letterSpacing: 0.5 }}>GOLDMONKEY SECURITY LAYER</span>
                    </div>
                </div>

                <button
                    onClick={handleSignOut}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        opacity: 0.4,
                        fontSize: 12,
                        cursor: 'pointer',
                        textDecoration: 'underline'
                    }}
                >
                    Sair
                </button>
            </div>

            {/* Main Content Area */}
            <div style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>

                {/* Icon / Visual */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{ marginBottom: Spacing.xl }}
                >
                    <div style={{
                        width: 80, height: 80,
                        background: 'rgba(255, 69, 58, 0.1)',
                        borderRadius: '50%',
                        margin: '0 auto',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(255, 69, 58, 0.3)',
                        fontSize: '32px'
                    }}>
                        🔒
                    </div>
                </motion.div>

                {/* Title */}
                <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: Spacing.md, letterSpacing: -1 }}>
                    Sistema em Rascunho
                </h1>

                {/* Narrative */}
                <p style={{ fontSize: '16px', lineHeight: '1.6', opacity: 0.6, marginBottom: Spacing.xl }}>
                    Seu núcleo operacional foi criado com sucesso, mas o sistema permanece em modo de proteção até confirmarmos que este restaurante existe no mundo real.
                </p>

                {/* Action Card */}
                <Card padding="lg" style={{ textAlign: 'left', marginBottom: Spacing.xl, border: '1px solid #333', background: '#111' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                Ativação Necessária
                                <span style={{ fontSize: 10, background: '#ff453a', color: 'white', padding: '2px 6px', borderRadius: 4 }}>PENDENTE</span>
                            </h3>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.5 }}>
                                Protocolo Anti-Ghosting // Etapa única
                            </p>
                        </div>
                    </div>

                    <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: Spacing.lg, lineHeight: '1.5' }}>
                        Para liberar vendas, cardápio e pagamentos, conecte seu estabelecimento ao mundo real. Leva menos de 1 minuto.
                    </p>

                    <Button
                        variant="primary"
                        onClick={() => navigate('/app/activation')}
                        style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '15px' }}
                    >
                        Iniciar Ativação →
                    </Button>
                </Card>

                {/* "What gets unlocked" List */}
                <div style={{ textAlign: 'left', opacity: 0.5, fontSize: '13px' }}>
                    <p style={{ fontWeight: 600, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>O que será liberado:</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.sm }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>✅ Gestão de Menu</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>✅ TPV (Vendas)</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>✅ Dashboard Financeiro</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>✅ Link Público para Clientes</li>
                    </ul>
                </div>

                <div style={{ marginTop: 60, fontSize: 11, opacity: 0.2, fontFamily: 'monospace' }}>
                    SYSTEM_REF: DRAFT_MODE // AWAITING_PROOF
                </div>

            </div>
        </div>
    );
};
