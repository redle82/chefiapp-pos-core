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
          color: "#6b7280",
          fontSize: 14,
        }}
      >
        Nenhuma ubicación. Adicione a primeira com o botão abaixo.
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
