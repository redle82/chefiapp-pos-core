/**
 * SoftwareTpvPage — Configuración e Modo rápido do TPV.
 */

export function SoftwareTpvPage() {
  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px 0", color: "#111827" }}>
          Software TPV
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
          Configuración general y modo rápido del punto de venta.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            backgroundColor: "#fff",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "#111827" }}>
            Configuración
          </h3>
          <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#6b7280" }}>
            Preferencias del TPV: idioma, moneda, comportamiento de cierre, etc.
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>
            En breve: opciones guardables por ubicación.
          </p>
        </div>
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            backgroundColor: "#fff",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "#111827" }}>
            Modo rápido
          </h3>
          <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#6b7280" }}>
            Atajos y flujo rápido para servicio en pico (barra, terraza).
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>
            En breve: activar modo rápido y personalizar atajos.
          </p>
        </div>
      </div>
    </div>
  );
}
