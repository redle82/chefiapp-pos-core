import React, { useState, useEffect } from 'react';

interface Step2Props {
    onNext: () => void;
}

export const Step2_TheBridge: React.FC<Step2Props> = ({ onNext }) => {
    const [listening, setListening] = useState(false);

    // Simulate listening for webhook
    useEffect(() => {
        const timer = setTimeout(() => {
            setListening(true);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const webhookUrl = "https://api.chefiapp.com/webhooks/gf/tenant_123";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(webhookUrl);
        alert("Link copiado!");
    };

    return (
        <div>
            <h2 className="migration-step-title">Conecte seu canal de vendas</h2>
            <p className="migration-step-subtitle">
                Receba seus pedidos do GloriaFood direto na cozinha do ChefIApp.<br />
                Não desligue nada. Apenas integre.
            </p>

            <div className="input-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                    1. Copie este link secreto:
                </label>
                <div className="webhook-display">
                    <code>{webhookUrl}</code>
                    <button className="copy-btn" onClick={copyToClipboard}>COPIAR</button>
                </div>
            </div>

            <div className="input-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                    2. Cole no GloriaFood:
                </label>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                    Admin Panel &gt; Settings &gt; Integrations &gt; Webhooks
                </p>
            </div>

            <div style={{
                marginTop: '40px',
                padding: '20px',
                background: listening ? '#f0fdf4' : '#f8fafc',
                borderRadius: '12px',
                border: `1px solid ${listening ? '#bbf7d0' : '#e2e8f0'}`,
                textAlign: 'center'
            }}>
                {listening ? (
                    <>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🟢</div>
                        <h4 style={{ margin: 0, color: '#166534' }}>Sinal detectado!</h4>
                        <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#15803d' }}>
                            Estamos prontos para receber pedidos.
                        </p>
                    </>
                ) : (
                    <>
                        <div className="loading-pulse">📡 Procurando sinal do GloriaFood...</div>
                    </>
                )}
            </div>

            <button className="action-btn" onClick={onNext}>
                Continuar (Testar Depois)
            </button>
        </div>
    );
};
