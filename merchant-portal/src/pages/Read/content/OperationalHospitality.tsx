import React from 'react';

export const OperationalHospitality = () => {
    return (
        <article style={{ lineHeight: '1.8', fontSize: '18px', color: '#e5e5e5' }}>
            {/* Header */}
            <header style={{ marginBottom: '64px', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    borderRadius: '100px',
                    background: 'rgba(50,215,75,0.1)',
                    color: '#32d74b',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '24px',
                    letterSpacing: '1px'
                }}>
                    FILOSOFIA DE SERVIÇO
                </div>
                <h1 style={{
                    fontSize: 'clamp(32px, 5vw, 48px)',
                    fontWeight: 800,
                    marginBottom: '24px',
                    lineHeight: '1.2'
                }}>
                    Hospitalidade Operacional:<br />
                    O Sorriso não paga a espera.
                </h1>
                <p style={{ fontSize: '20px', opacity: 0.6, maxWidth: '600px', margin: '0 auto' }}>
                    A maior forma de respeito ao cliente não é ser simpático.<br />
                    É ser competente.
                </p>
            </header>

            {/* Introduction */}
            <section style={{ marginBottom: '48px' }}>
                <p style={{ marginBottom: '24px' }}>
                    Existe um mito na hostelaria de que "Hospitalidade" é sobre calor humano, sorrisos e conversas agradáveis. Isso é verdade, mas é apenas a camada superficial.
                </p>
                <p>
                    Se o cliente espera 40 minutos por um prato, não existe sorriso no mundo que recupere essa experiência. A "simpatia" se torna um insulto quando a operação falha.
                </p>
                <p style={{ borderLeft: '4px solid #32d74b', paddingLeft: '24px', fontStyle: 'italic', margin: '32px 0', color: '#fff' }}>
                    A verdadeira hospitalidade é invisível. Ela é a ausência de atrito. É a água chegando antes da sede. É a conta chegando antes da pressa.
                </p>
            </section>

            {/* The Concept */}
            <section style={{ marginBottom: '64px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px', color: '#fff' }}>
                    A Máquina de Confiança
                </h2>
                <p style={{ marginBottom: '24px' }}>
                    Quando um cliente entra no seu restaurante, ele está fazendo um contrato de confiança não assinado: "Eu te dou meu tempo e dinheiro, você me dá nutrição e segurança".
                </p>
                <p style={{ marginBottom: '24px' }}>
                    Um sistema operacional robusto (como o ChefIApp) não serve para "controlar garçons". Ele serve para garantir que esse contrato seja cumprido, independente de quem esteja trabalhando naquela noite.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '16px', marginTop: '32px' }}>
                    <CheckItem text="O cliente não deve repetir o pedido." />
                    <CheckItem text="A cozinha não deve perguntar 'o que sai agora?'." />
                    <CheckItem text="O caixa não deve demorar para fechar a conta." />
                </ul>
            </section>

            {/* Closing */}
            <section>
                <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px', color: '#fff' }}>
                    Organização é Amor
                </h2>
                <p style={{ marginBottom: '32px' }}>
                    Parece frio dizer isso, mas a organização militar de uma cozinha é a maior prova de amor que você pode dar ao seu convidado. Significa que você respeita o tempo dele o suficiente para construir processos que funcionam.
                </p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#32d74b' }}>
                    ChefIApp automatiza a competência, para que sua equipe possa focar na simpatia.
                </p>
            </section>
        </article>
    );
};

const CheckItem = ({ text }: { text: string }) => (
    <li style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '18px' }}>
        <span style={{ color: '#32d74b' }}>✓</span>
        <span style={{ opacity: 0.8 }}>{text}</span>
    </li>
);
