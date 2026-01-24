/**
 * 🧬 SYSTEM HEALTH WIDGET
 * 
 * Dashboard widget that displays the Bootstrap Kernel's SYSTEM_STATE.
 * Shows surfaces, systems, guards, and observability status.
 */

import React from 'react';
import { useSystemState } from '../../core/kernel';
import type { SurfaceStatus, SystemStatus, KernelHealth } from '../../core/kernel/types';

// ========================================
// STATUS HELPERS
// ========================================

function getStatusIcon(status: KernelHealth | SurfaceStatus | SystemStatus | boolean): string {
    if (status === true) return '✅';
    if (status === false) return '❌';

    switch (status) {
        case 'OK':
        case 'ACTIVE':
            return '✅';
        case 'CONFIGURED':
            return '⚙️';
        case 'DEGRADED':
        case 'PARTIAL':
            return '⚠️';
        case 'FAILED':
        case 'ERROR':
        case 'MISSING':
        case 'INACTIVE':
            return '❌';
        default:
            return '❓';
    }
}

function getStatusColor(status: KernelHealth | SurfaceStatus | SystemStatus | boolean): string {
    if (status === true) return '#32d74b';
    if (status === false) return '#ff453a';

    switch (status) {
        case 'OK':
        case 'ACTIVE':
            return '#32d74b'; // Green
        case 'CONFIGURED':
            return '#0a84ff'; // Blue
        case 'DEGRADED':
        case 'PARTIAL':
            return '#ff9f0a'; // Orange
        case 'FAILED':
        case 'ERROR':
        case 'MISSING':
        case 'INACTIVE':
            return '#ff453a'; // Red
        default:
            return '#8e8e93'; // Gray
    }
}

// ========================================
// COMPONENT
// ========================================

export function SystemHealthWidget() {
    const { state, loading, refresh } = useSystemState();

    if (loading) {
        return (
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 12,
                padding: 16,
                border: '1px solid rgba(255,255,255,0.08)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 18 }}>🧬</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Bootstrap Kernel</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                    Inicializando...
                </div>
            </div>
        );
    }

    if (!state) {
        return null;
    }

    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 12,
            padding: 16,
            border: '1px solid rgba(255,255,255,0.08)'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🧬</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>System State</span>
                    <span style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: getStatusColor(state.kernel),
                        color: '#fff',
                        fontWeight: 800
                    }}>
                        {state.kernel}
                    </span>
                </div>
                <button
                    onClick={refresh}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 4,
                        padding: '4px 8px',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: 10,
                        cursor: 'pointer'
                    }}
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Environment Badge */}
            <div style={{
                display: 'inline-block',
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 4,
                background: state.environment === 'prod'
                    ? 'rgba(255, 69, 58, 0.2)'
                    : state.environment === 'staging'
                        ? 'rgba(255, 159, 10, 0.2)'
                        : 'rgba(50, 215, 75, 0.2)',
                color: state.environment === 'prod'
                    ? '#ff453a'
                    : state.environment === 'staging'
                        ? '#ff9f0a'
                        : '#32d74b',
                fontWeight: 800,
                marginBottom: 12,
                textTransform: 'uppercase'
            }}>
                {state.environment}
            </div>

            {/* Surfaces */}
            <div style={{ marginBottom: 12 }}>
                <div style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 6
                }}>
                    Surfaces
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(state.surfaces).map(([id, status]) => (
                        <div
                            key={id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 11,
                                padding: '3px 6px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 4,
                                border: `1px solid ${getStatusColor(status)}33`
                            }}
                        >
                            <span>{getStatusIcon(status)}</span>
                            <span style={{ color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>
                                {id}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Systems */}
            <div style={{ marginBottom: 12 }}>
                <div style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 6
                }}>
                    Systems
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(state.systems).map(([id, status]) => (
                        <div
                            key={id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 11,
                                padding: '3px 6px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 4,
                                border: `1px solid ${getStatusColor(status)}33`
                            }}
                        >
                            <span>{getStatusIcon(status)}</span>
                            <span style={{ color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>
                                {id}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Guards */}
            <div style={{ marginBottom: 12 }}>
                <div style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 6
                }}>
                    Guards
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(state.guards).map(([id, active]) => (
                        <div
                            key={id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 11,
                                padding: '3px 6px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 4,
                                border: `1px solid ${active ? '#32d74b33' : '#ff453a33'}`
                            }}
                        >
                            <span>{active ? '🛡️' : '⚠️'}</span>
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                                {id}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Observability */}
            <div>
                <div style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 6
                }}>
                    Observability
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(state.observability).map(([id, active]) => (
                        <div
                            key={id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: 11,
                                padding: '3px 6px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 4,
                                border: `1px solid ${active ? '#32d74b33' : '#8e8e9333'}`
                            }}
                        >
                            <span>{getStatusIcon(active)}</span>
                            <span style={{ color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>
                                {id}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div style={{
                marginTop: 12,
                paddingTop: 8,
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 9,
                color: 'rgba(255,255,255,0.3)'
            }}>
                <span>v{state.version}</span>
                <span>{new Date(state.timestamp).toLocaleTimeString()}</span>
            </div>
        </div>
    );
}
