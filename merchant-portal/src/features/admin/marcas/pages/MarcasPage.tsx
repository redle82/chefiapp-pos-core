/**
 * MarcasPage — Marca principal e sub-marcas.
 */

import { MarcaPrincipalCard } from "../components/MarcaPrincipalCard";
import { SubMarcasCard } from "../components/SubMarcasCard";

export function MarcasPage() {
  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px 0", color: "#111827" }}>
          Marcas
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
          Marca principal y sub-marcas del restaurante.
        </p>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        <MarcaPrincipalCard />
        <SubMarcasCard />
      </div>
    </div>
  );
}
