import React from 'react';

export const AntiMarketing = () => {
    return (
        <article style={{ lineHeight: '1.8', fontSize: '18px', color: '#e5e5e5' }}>
            {/* Header */}
            <header style={{ marginBottom: '64px', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    borderRadius: '100px',
                    background: 'rgba(255, 59, 48, 0.1)', // Red tint for "Anti"
                    color: '#ff453a',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '24px',
                    letterSpacing: '1px'
                }}>
                    CONTRA-INTUITIVO
                </div>
                <h1 style={{
                    fontSize: 'clamp(32px, 5vw, 48px)',
                    fontWeight: 800,
                    marginBottom: '24px',
                    lineHeight: '1.2'
                }}>
                    Pare de fazer Marketing.<br />
                    (Por enquanto)
                </h1>
                <p style={{ fontSize: '20px', opacity: 0.6, maxWidth: '600px', margin: '0 auto' }}>
                    Encher um balde furado não é "crescimento".<br />
                    É desperdício de água.
                </p>
            </header>

            {/* Introduction */}
            <section style={{ marginBottom: '48px' }}>
                <p style={{ marginBottom: '24px' }}>
                    A indústria vende a ideia de que o problema do seu restaurante é "falta de clientes novos". Agências te empurram tráfego pago, influenciadores e promoções.
                </p>
                <p>
                    Mas se a sua operação não é perfeita, <strong>marketing é suicídio</strong>.
                </p>
                <p style={{ borderLeft: '4px solid #ff453a', paddingLeft: '24px', fontStyle: 'italic', margin: '32px 0', color: '#fff' }}>
                    Trazer 1.000 pessoas para uma experiência ruim não constrói um negócio. Constrói 1.000 detratores que nunca mais voltarão.
                </p>
            </section>

            {/* The Concept */}
            <section style={{ marginBottom: '64px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px', color: '#fff' }}>
                    Retenção &gt; Aquisição
                </h2>
                <p style={{ marginBottom: '24px' }}>
                    O lucro real de um restaurante não está na primeira visita. Está na terceira, na décima, na quinquagésima. O LTV (Lifetime Value) é construído na consistência do prato e na velocidade do serviço.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '40px' }}>
                    <Box title="Marketing Tradicional" color="#ff453a">
                        Foca em "trazer gente".<br />
                        Custo alto (CAC).<br />
                        Resultado efêmero.
                    </Box>
                    <Box title="Marketing Operacional" color="#32d74b">
                        Foca em "não perder gente".<br />
                        Custo zero.<br />
                        Resultado composto.
                    </Box>
                </div>
            </section>

            {/* Closing */}
            <section>
                <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px', color: '#fff' }}>
                    Conserte a Casa Primeiro
                </h2>
                <p style={{ marginBottom: '32px' }}>
                    Antes de gastar R$1,00 em anúncios, invista em um sistema que garanta que o pedido saia certo, na hora certa, na temperatura certa.
                </p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#e5e5e5' }}>
                    O melhor marketing do mundo é um prato que chega em 12 minutos, quente e perfeito. O resto é ruído.
                </p>
            </section>
        </article>
    );
};

const Box = ({ title, color, children }: { title: string, color: string, children: React.ReactNode }) => (
    <div style={{
        padding: '24px',
        borderRadius: '16px',
        background: `rgba(${color === '#32d74b' ? '50,215,75' : '255, 69, 58'}, 0.05)`,
        border: `1px solid ${color}`,
        textAlign: 'center'
    }}>
        <h3 style={{ color: color, fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>{title}</h3>
        <p style={{ fontSize: '14px', lineHeight: '1.6', opacity: 0.8 }}>{children}</p>
    </div>
);
