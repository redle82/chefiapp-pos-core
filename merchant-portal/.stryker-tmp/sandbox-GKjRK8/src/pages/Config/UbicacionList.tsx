/**
 * UbicacionList — Lista de localizações (contexto operacional).
 * Ref: CONFIG_LOCATION_VS_CONTRACT.md.
 */

import { space } from "@chefiapp/core-design-system";
import type { Location } from "../../features/admin/locations/types";
import { UbicacionCard } from "./UbicacionCard";

interface UbicacionListProps {
  locations: Location[];
}

export function UbicacionList({ locations }: UbicacionListProps) {
  if (locations.length === 0) {
    return (
      <p
        style={{
          margin: 0,
          padding: 24,
          textAlign: "center",
          color: "var(--text-secondary)",
          fontSize: 14,
        }}
      >
        Ainda não tem locais. Use o botão abaixo para adicionar o primeiro.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: space.md }}>
      {locations.map((loc) => (
        <UbicacionCard key={loc.id} location={loc} />
      ))}
    </div>
  );
}
