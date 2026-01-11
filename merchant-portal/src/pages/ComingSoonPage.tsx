
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SOVEREIGN_MANIFEST } from './Dashboard/dashboard_manifest';
import type { SovereignModule } from './Dashboard/dashboard_manifest';
import { AdminLayout } from '../ui/design-system/layouts/AdminLayout';
import { AdminSidebar } from '../ui/design-system/domain/AdminSidebar';
import { OSCopy } from '../ui/design-system/sovereign/OSCopy';

export const ComingSoonPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const moduleId = searchParams.get('module');

    // Find module in manifest
    const findModule = (): SovereignModule | null => {
        for (const section of SOVEREIGN_MANIFEST) {
            const found = section.modules.find(m => m.id === moduleId);
            if (found) return found;
        }
        return null;
    };

    const module = findModule();

    return (
        <AdminLayout
            sidebar={<AdminSidebar activePath="/app/coming-soon" onNavigate={navigate} />}
            content={
                <div style={{ padding: '40px', maxWidth: '800px' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <button
                            onClick={() => navigate('/app/dashboard')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#32d74b',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            ← {OSCopy.navigation.dashboard}
                        </button>
                    </div>

                    {!module ? (
                        <div style={{ textAlign: 'center', padding: '80px 0' }}>
                            <h1 style={{ color: '#fff', fontSize: '24px', marginBottom: '16px' }}>{OSCopy.modules.notFoundTitle}</h1>
                            <p style={{ color: 'rgba(255,255,255,0.4)' }}>{OSCopy.modules.notFoundDesc}</p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                                <div style={{ fontSize: '48px' }}>{module.icon || '📦'}</div>
                                <div>
                                    <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 600, margin: 0 }}>
                                        {module.label}
                                    </h1>
                                    <div style={{
                                        display: 'inline-block',
                                        marginTop: '8px',
                                        padding: '4px 12px',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase',
                                        background: module.status === 'locked' ? 'rgba(255,59,48,0.1)' : 'rgba(50,215,75,0.1)',
                                        color: module.status === 'locked' ? '#ff3b30' : '#32d74b',
                                        border: `1px solid ${module.status === 'locked' ? '#ff3b3033' : '#32d74b33'}`
                                    }}>
                                        {module.status}
                                    </div>
                                </div>
                            </div>

                            <p style={{ fontSize: '18px', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)', marginBottom: '48px' }}>
                                {module.description}
                            </p>

                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '32px'
                            }}>
                                <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '24px' }}>Ficha de Evolução</h3>

                                <div style={{ display: 'grid', gap: '24px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', opacity: 0.4, marginBottom: '4px', textTransform: 'uppercase' }}>{OSCopy.modules.phaseLabel}</div>
                                        <div style={{ color: '#fff', fontWeight: 500 }}>{module.phase || 'Definition'}</div>
                                    </div>

                                    {module.dependencies && module.dependencies.length > 0 && (
                                        <div>
                                            <div style={{ fontSize: '12px', opacity: 0.4, marginBottom: '8px', textTransform: 'uppercase' }}>{OSCopy.modules.dependenciesLabel}</div>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {module.dependencies.map(dep => (
                                                    <span key={dep} style={{
                                                        background: 'rgba(255,255,255,0.05)',
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        color: '#fff'
                                                    }}>
                                                        {dep}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#32d74b' }}>
                                            <div style={{ width: '8px', height: '8px', background: '#32d74b', borderRadius: '50%', boxShadow: '0 0 10px #32d74b' }}></div>
                                            <span style={{ fontSize: '14px', fontWeight: 600 }}>{OSCopy.modules.observationActive}</span>
                                        </div>
                                        <p style={{ fontSize: '13px', opacity: 0.4, marginTop: '8px' }}>
                                            {OSCopy.modules.observationDesc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            }
        />
    );
};
