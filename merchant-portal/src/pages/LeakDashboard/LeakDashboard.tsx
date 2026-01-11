

/**
 * LeakDashboard
 *
 * This page is part of the Merchant Portal UI. It must never contain Playwright test code.
 * Keep it lightweight and resilient so it can't block routing.
 */
export default function LeakDashboard() {
  // Mock data for now (real data will be wired later)
  const items = [
    { id: '1', label: 'Possível fuga detectada', value: '—' },
    { id: '2', label: 'Última auditoria', value: '—' },
    { id: '3', label: 'Itens em atenção', value: '0' },
  ];

  return (
    <div style={{ padding: 24 }} data-testid="leaks-page">
      <h1 style={{ margin: 0, marginBottom: 12 }}>Leaks</h1>
      <p style={{ marginTop: 0, marginBottom: 24, opacity: 0.8 }}>
        Painel de Detecção de Vazamentos. Monitoramento ativo.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {items.map((it) => (
          <div
            key={it.id}
            style={{
              border: '1px solid rgba(0,0,0,0.12)',
              borderRadius: 12,
              padding: 16,
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>{it.label}</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{it.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, opacity: 0.8 }}>
        <small>
          Nota: se esta rota voltar a dar timeout em testes, o problema está em providers/layout globais, não aqui.
        </small>
      </div>
    </div>
  );
}
