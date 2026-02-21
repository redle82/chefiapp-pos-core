import React, { useState } from 'react';
import { DiagnosticEngine } from '../diagnostics/DiagnosticEngine';

interface SystemErrorUIProps {
    code: string;
    title: string;
    debugInfo?: any;
    onRetry: () => void;
}

export const SystemErrorUI: React.FC<SystemErrorUIProps> = ({ code, title, debugInfo, onRetry }) => {
    const [reportCopied, setReportCopied] = useState(false);

    const handleCopyReport = () => {
        const report = DiagnosticEngine.generateReport();
        navigator.clipboard.writeText(JSON.stringify(report, null, 2));
        setReportCopied(true);
        setTimeout(() => setReportCopied(false), 2000);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#0F172A', // Dark Navy (Goldmonkey Brand)
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            zIndex: 9999,
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🛡️</div>

                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    O sistema pausou para proteger seus dados
                </h1>

                <p style={{ color: '#94A3B8', marginBottom: '2rem' }}>
                    {title || "Encontramos uma inconsistência inesperada."}
                </p>

                <div style={{
                    backgroundColor: '#1E293B',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '2rem',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    border: '1px solid #334155'
                }}>
                    <div style={{ color: '#FCD34D', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        CÓDIGO: {code}
                    </div>
                    <div style={{ color: '#64748B', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '100px', overflowY: 'auto' }}>
                        {debugInfo ? JSON.stringify(debugInfo).slice(0, 150) + "..." : "Sem detalhes técnicos."}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        onClick={onRetry}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: '#FCD34D', // Gold
                            color: '#0F172A',
                            fontWeight: 'bold',
                            borderRadius: '0.375rem',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Tentar Restaurar Sistema (Recarregar)
                    </button>

                    <button
                        onClick={handleCopyReport}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: 'transparent',
                            color: '#64748B',
                            borderRadius: '0.375rem',
                            border: '1px solid #334155',
                            cursor: 'pointer'
                        }}
                    >
                        {reportCopied ? "Relatório Copiado!" : "Copiar Relatório de Diagnóstico"}
                    </button>
                </div>

                <p style={{ marginTop: '2rem', color: '#475569', fontSize: '0.75rem' }}>
                    Envie o relatório para o suporte se o problema persistir.
                </p>
            </div>
        </div>
    );
};
