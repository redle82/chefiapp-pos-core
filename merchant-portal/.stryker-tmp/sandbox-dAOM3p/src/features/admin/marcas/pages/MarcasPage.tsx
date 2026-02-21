/**
 * MarcasPage — Marca principal e sub-marcas.
 */
// @ts-nocheck


import { MarcaPrincipalCard } from "../components/MarcaPrincipalCard";
import { SubMarcasCard } from "../components/SubMarcasCard";
import { AdminPageHeader } from "../../dashboard/components/AdminPageHeader";

export function MarcasPage() {
  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <AdminPageHeader
        title="Marcas"
        subtitle="Marca principal y sub-marcas del restaurante."
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        <MarcaPrincipalCard />
        <SubMarcasCard />
      </div>
    </div>
  );
}
