/**
 * QR CODE GENERATOR — Gerador de QR Code para Mesas
 * 
 * FASE 9: QR Mesa
 * 
 * REGRAS:
 * - Gera URL para página da mesa
 * - Usa biblioteca externa para gerar QR code visual (opcional)
 * - Retorna URL que pode ser usada em qualquer gerador de QR
 */
// @ts-nocheck


export interface QRCodeData {
  url: string;
  tableNumber: number;
  restaurantSlug: string;
}

/**
 * Gera URL para página da mesa.
 */
export function generateTableURL(restaurantSlug: string, tableNumber: number): string {
  const baseURL = window.location.origin;
  return `${baseURL}/public/${restaurantSlug}/mesa/${tableNumber}`;
}

/**
 * Componente para exibir QR Code (usando API externa ou biblioteca).
 * Por enquanto, apenas exibe a URL que pode ser copiada.
 */
export function QRCodeDisplay({ url, tableNumber }: { url: string; tableNumber: number }) {
  // Usar API pública para gerar QR code (exemplo: qrcode.tec-it.com)
  const qrCodeImageURL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>QR Code - Mesa {tableNumber}</h3>
      <img
        src={qrCodeImageURL}
        alt={`QR Code para Mesa ${tableNumber}`}
        style={{
          border: '2px solid #ddd',
          borderRadius: '8px',
          padding: '1rem',
          backgroundColor: '#fff',
        }}
      />
      <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
        <div>URL: <code style={{ fontSize: '0.8rem' }}>{url}</code></div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(url);
            alert('URL copiada para a área de transferência!');
          }}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#22c55e',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Copiar URL
        </button>
      </div>
    </div>
  );
}
