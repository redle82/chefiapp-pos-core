/**
 * CORE RESET PAGE — Tela Neutra de Reset
 * 
 * Esta é a única tela permitida após a limpeza total.
 * Nenhuma UI antiga deve aparecer.
 * Nenhum redirecionamento automático.
 * 
 * Esta tela indica que o sistema está em modo de reset
 * e aguardando reconstrução guiada pelo Core.
 */

import React from 'react';

export function CoreResetPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🔄</div>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>
          UI RESET / CORE ONLY
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#999' }}>
          Sistema em modo de reset controlado.
        </p>
        <div
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '2rem',
            marginTop: '2rem',
            textAlign: 'left',
          }}
        >
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#32d74b' }}>
            Status do Core
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '0.5rem' }}>
              ✅ Core validado (TESTES A–E concluídos)
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              ✅ Docker Core ativo
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              ✅ Schema, RPCs e Constraints congelados
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              🔄 UI aguardando reconstrução guiada
            </li>
          </ul>
        </div>
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#1a1a1a',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#666',
          }}
        >
          <p style={{ margin: 0 }}>
            Nenhuma UI antiga está ativa. Nenhum redirecionamento automático.
            <br />
            Sistema pronto para reconstrução passo a passo, guiada pelo Core.
          </p>
        </div>
      </div>
    </div>
  );
}
