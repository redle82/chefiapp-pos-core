import React, { useState } from 'react';

interface Step3Props {
    onNext: () => void;
}

export const Step3_TheImport: React.FC<Step3Props> = ({ onNext }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleUpload = () => {
        setUploading(true);
        // Fake progress simulation
        let current = 0;
        const interval = setInterval(() => {
            current += 5;
            if (current > 100) {
                clearInterval(interval);
                onNext(); // Move to next step automatically on completion
            } else {
                setProgress(current);
            }
        }, 100);
    };

    return (
        <div>
            <h2 className="migration-step-title">Resgate seu Passado</h2>
            <p className="migration-step-subtitle">
                Seus relatórios antigos não servem de nada largados numa planilha.<br />
                Vamos dar vida a eles agora.
            </p>

            {!uploading ? (
                <div
                    onClick={handleUpload}
                    style={{
                        border: '2px dashed #cbd5e1',
                        borderRadius: '16px',
                        padding: '60px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: '#f8fafc',
                        transition: 'all 0.2s'
                    }}
                >
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '20px' }}>📂</span>
                    <h3 style={{ margin: '0 0 10px', color: '#334155' }}>Solte seus CSVs ou PDFs aqui</h3>
                    <p style={{ margin: 0, color: '#64748b' }}>
                        Suportamos GloriaFood, iFood e TPVs antigos.
                    </p>
                    <button
                        style={{
                            marginTop: '20px',
                            background: 'white',
                            border: '1px solid #cbd5e1',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Selecionar Arquivos
                    </button>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <h3 style={{ marginBottom: '20px' }}>Processando Histórico...</h3>
                    <div style={{
                        width: '100%',
                        height: '10px',
                        background: '#e2e8f0',
                        borderRadius: '5px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: '#4f46e5',
                            transition: 'width 0.2s ease'
                        }} />
                    </div>
                    <p style={{ marginTop: '15px', color: '#64748b' }}>
                        {progress < 30 ? "Lendo arquivos..." :
                            progress < 70 ? "Identificando clientes..." :
                                "Recalculando faturamento..."}
                    </p>
                </div>
            )}

            {!uploading && (
                <button
                    className="action-btn"
                    style={{ background: 'transparent', color: '#64748b', marginTop: '10px', width: 'auto', display: 'block', margin: '20px auto' }}
                    onClick={onNext}
                >
                    Pular importação por enquanto
                </button>
            )}
        </div>
    );
};
