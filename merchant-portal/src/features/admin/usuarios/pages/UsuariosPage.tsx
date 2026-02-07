/**
 * UsuariosPage — Usuarios Administradores (owners, managers, permisões).
 * Fase 1: tabela vazia + estrutura; Fase 2: CRUD real.
 */

export function UsuariosPage() {
  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px 0", color: "#111827" }}>
          Usuarios Administradores
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
          Owners, managers e permisões. Fase 2: invitaciones y roles por ubicación.
        </p>
      </header>
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          backgroundColor: "#fff",
        }}
      >
        <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: "#111827" }}>
          Administradores
        </h3>
        <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#6b7280" }}>
          Lista de usuarios con acceso de owner o manager al portal.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 600 }}>Email</th>
                <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 600 }}>Rol</th>
                <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 600, width: 80 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} style={{ padding: 40, textAlign: "center", color: "#6b7280", fontSize: 14 }}>
                  En fase 2 se podrán invitar administradores y asignar roles por ubicación.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
