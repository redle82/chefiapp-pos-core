/**
 * LocationsPage — Ubicaciones / Locais (cadastro de unidades).
 * Dois cards: Ubicaciones (lista) + Grupos de ubicaciones.
 * Ref: Last.app Ubicaciones — tudo no sistema acontece dentro de uma Ubicación.
 */

import { useState, useCallback } from "react";
import { LocationsCard } from "../components/LocationsCard";
import { LocationGroupsCard } from "../components/LocationGroupsCard";
import { locationsStore } from "../store/locationsStore";

export function LocationsPage() {
  const [locations, setLocations] = useState(locationsStore.getLocations());
  const [groups, setGroups] = useState(locationsStore.getGroups());

  const refresh = useCallback(() => {
    setLocations(locationsStore.getLocations());
    setGroups(locationsStore.getGroups());
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <header style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: "0 0 4px 0",
            color: "#111827",
          }}
        >
          Ubicaciones
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "#6b7280",
          }}
        >
          Añade, edita o agrupa las ubicaciones de tu restaurante para mantener
          las operaciones organizadas.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <LocationsCard locations={locations} onRefresh={refresh} />
        <LocationGroupsCard
          groups={groups}
          locations={locations}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
}
