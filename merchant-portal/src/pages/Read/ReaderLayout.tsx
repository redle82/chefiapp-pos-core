import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ConciergeWidget } from '../../ui/components/ConciergeWidget';
import { OSFrame } from '../../ui/design-system/sovereign/OSFrame';
import { OSSignature } from '../../ui/design-system/sovereign/OSSignature';
import { OSCopy } from '../../ui/design-system/sovereign/OSCopy';

export const ReaderLayout = () => {
    return (
        // Law 3: State is Sovereign (using 'landing' context for Research Hub - Public Kernel)
        <OSFrame context="landing">
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                {/* Minimal Header */}
                <header style={{
                    padding: '24px 32px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(11,11,12,0.8)',
                    backdropFilter: 'blur(10px)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100
                }}>
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Law 2: Logo is Signature */}
                        <OSSignature state="ignition" size="sm" />
                        <span style={{ fontWeight: 600, fontSize: '14px', letterSpacing: '1px', opacity: 0.7, color: '#fff' }}>
                            {OSCopy.research.hubTitle}
                        </span>
                    </Link>

                    <Link to="/signup" style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#32d74b',
                        textDecoration: 'none',
                        padding: '8px 16px',
                        border: '1px solid rgba(50,215,75,0.2)',
                        borderRadius: '100px'
                    }}>
                        {OSCopy.research.accessAction}
                    </Link>
                </header>

                {/* Reading Content */}
                <main style={{ flex: 1 }}>
                    <Outlet />
                </main>

                {/* Global Footer for Reader */}
                <footer style={{ padding: '48px', textAlign: 'center', opacity: 0.4, fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '80px' }}>
                    <Link to="/" style={{ color: '#fff', textDecoration: 'none', marginRight: '24px' }}>Home</Link>
                    <Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>Login</Link>
                    {/* Law 4: Text is Regulated */}
                    <p style={{ marginTop: '16px' }}>{OSCopy.research.footer}</p>
                </footer>

                <ConciergeWidget />
            </div>
        </OSFrame>
    );
};
