import React from 'react';
import { useCoreHealth } from '../../core/health/useCoreHealth';

/**
 * AppStaffHome
 * 
 * The default view for a logged-in staff member.
 * "O AppStaff não decide -> ele obedece."
 */
export const AppStaffHome: React.FC = () => {
    // In strict mode, we'd fetch presence here.
    const { status } = useCoreHealth();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* 1. System Status Card */}
            <section style={{
                padding: 16,
                backgroundColor: '#222',
                borderRadius: 8,
                borderLeft: '4px solid ' + (status === 'UP' ? '#4ade80' : '#f87171')
            }}>
                <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7, margin: '0 0 8px 0' }}>
                    Status Operacional
                </h2>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                    {status === 'UP' ? 'Operação Estável' : 'Atenção Necessária'}
                </div>
            </section>

            {/* 2. Your Context */}
            <section>
                <h2 style={{ fontSize: 14, opacity: 0.7, marginBottom: 12 }}>Seu Papel Agora</h2>
                <div style={{
                    padding: 24,
                    border: '1px dashed #444',
                    borderRadius: 8,
                    textAlign: 'center',
                    color: '#888'
                }}>
                    Nenhuma função ativa. <br />
                    <small>Realize o Check-in.</small>
                </div>
            </section>
        </div>
    );
};
