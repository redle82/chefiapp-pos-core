import React from 'react';

export const FoundingPPVista = () => {
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
                    FRAMEWORK PROPRIETÁRIO
                </div>
                <h1 style={{
                    fontSize: 'clamp(32px, 5vw, 48px)',
                    fontWeight: 800,
                    marginBottom: '24px',
                    lineHeight: '1.2'
                }}>
                    PPVista: Por que KPIs tradicionais<br />mentem para você
                </h1>
                <p style={{ fontSize: '20px', opacity: 0.6, maxWidth: '600px', margin: '0 auto' }}>
                    A maioria dos sistemas mede o "O Quê" (vendas).<br />
                    Nós medimos o "Como" (comportamento).
                </p>
            </header>

            {/* Introduction */}
            <section style={{ marginBottom: '48px' }}>
                <p style={{ marginBottom: '24px' }}>
                    Imagine um capitão de navio que só olha para o mar atrás dele. Ele sabe exatamente quantos quilômetros viajou, mas não tem ideia se está indo em direção a um iceberg.
                </p>
                <p>
                    A maioria dos donos de restaurante opera assim. Eles abrem o dashboard financeiro, veem o Ticket Médio de ontem, o CMV do mês passado e o Faturamento da semana.
                </p>
                <p style={{ borderLeft: '4px solid #32d74b', paddingLeft: '24px', fontStyle: 'italic', margin: '32px 0', color: '#fff' }}>
                    São métricas de autópsia. Elas explicam por que o paciente morreu (ou sobreviveu), mas não ajudam a operar a cirurgia agora.
                </p>
            </section>

            {/* The Concept */}
            <section style={{ marginBottom: '64px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px', color: '#fff' }}>
                    O Nascimento do PPVista
                </h2>
                <p style={{ marginBottom: '24px' }}>
                    Nos laboratórios do <strong>Goldmonkey Studio</strong> e no campo de batalha do <strong>Sofia Gastrobar</strong>, descobrimos que existe uma camada invisível de dados que precede o financeiro.
                </p>
                <p>Chamamos de <strong>Arquitetura de Comportamento</strong>.</p>
                <p>O Framework PPVista não olha para números frios. Ele olha para <strong>Rastros Cognitivos</strong>.</p>
            </section>

            {/* The Acronym */}
            <section style={{ marginBottom: '64px', background: 'rgba(255,255,255,0.02)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'grid', gap: '32px' }}>
                    <Definition letter="P" word="Pace (Ritmo)" desc="A velocidade com que a cozinha aceita pedidos vs a capacidade real. Não é sobre rapidez, é sobre cadência." />
                    <Definition letter="P" word="Precision (Precisão)" desc="Quantas vezes um pedido volta? Quantas vezes uma comanda é reaberta? O erro custa o triplo do tempo do acerto." />
                    <Definition letter="V" word="Volume (Carga)" desc="A pressão hidrostática sobre a equipe. Quanto a equipe aguenta antes de quebrar o protocolo?" />
                    <Definition letter="ista" word="Insta (Instantaneidade)" desc="O tempo de reação entre o erro e a correção. Se o feedback demora, o hábito errado se instala." />
                </div>
            </section>

            {/* Closing */}
            <section>
                <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px', color: '#fff' }}>
                    O Sistema Nervoso
                </h2>
                <p style={{ marginBottom: '32px' }}>
                    O <strong>ChefIApp</strong> não é um TPV passivo que aceita qualquer coisa que você digita. Ele é um agente ativo que aplica o PPVista em tempo real.
                </p>
                <p style={{ marginBottom: '32px' }}>
                    Se um garçom tenta lançar um pedido de forma "preguiçosa", o sistema bloqueia. Se o caixa tenta fechar o dia sem conferência cega, o sistema exige.
                </p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#32d74b' }}>
                    Não esperamos que sua equipe seja perfeita. Instalamos um sistema que não aceita imperfeições.
                </p>
            </section>
        </article>
    );
};

const Definition = ({ letter, word, desc }: { letter: string, word: string, desc: string }) => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '48px', fontWeight: 800, color: '#32d74b', lineHeight: '1', minWidth: '60px' }}>{letter}</div>
        <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>{word}</h3>
            <p style={{ opacity: 0.7, fontSize: '16px' }}>{desc}</p>
        </div>
    </div>
);
