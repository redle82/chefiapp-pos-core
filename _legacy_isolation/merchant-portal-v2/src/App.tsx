import React, { useState } from 'react';
import { TPVMinimal } from './components/tpv/TPVMinimal';
import { KDSMinimal } from './components/kds/KDSMinimal';
import { StatePanel } from './components/observability/StatePanel';

function App() {
  // Restaurant ID hardcoded para desenvolvimento (será substituído por seleção real)
  const [restaurantId] = useState<string>('6d676ae5-2375-42d2-8db3-e4e80ddb1b76');
  const [view, setView] = useState<'tpv' | 'kds' | 'state'>('tpv');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
      {/* Navegação Simples */}
      <nav style={{
        padding: 15,
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #334155',
        display: 'flex',
        gap: 10,
      }}>
        <button
          onClick={() => setView('tpv')}
          style={{
            padding: '8px 16px',
            backgroundColor: view === 'tpv' ? '#3b82f6' : '#334155',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          TPV
        </button>
        <button
          onClick={() => setView('kds')}
          style={{
            padding: '8px 16px',
            backgroundColor: view === 'kds' ? '#3b82f6' : '#334155',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          KDS
        </button>
        <button
          onClick={() => setView('state')}
          style={{
            padding: '8px 16px',
            backgroundColor: view === 'state' ? '#3b82f6' : '#334155',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Estado
        </button>
      </nav>

      {/* Conteúdo */}
      {view === 'tpv' && <TPVMinimal restaurantId={restaurantId} />}
      {view === 'kds' && <KDSMinimal restaurantId={restaurantId} />}
      {view === 'state' && <StatePanel restaurantId={restaurantId} />}
    </div>
  );
}

export default App;
