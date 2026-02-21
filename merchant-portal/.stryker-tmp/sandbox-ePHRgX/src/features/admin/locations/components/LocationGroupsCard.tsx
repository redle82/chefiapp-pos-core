/**
 * LocationGroupsCard — Grupos de ubicaciones: Nombre, Ubicaciones (count) + botão + e Editar.
 * Ref: Last.app Grupos de ubicaciones — camada opcional.
 */
// @ts-nocheck


import { useState } from "react";
import type { Location, LocationGroup } from "../types";
import { GroupModal } from "./GroupModal";
import { locationsStore } from "../store/locationsStore";

interface LocationGroupsCardProps {
  groups: LocationGroup[];
  locations: Location[];
  onRefresh: () => void;
}

export function LocationGroupsCard({
  groups,
  locations,
  onRefresh,
}: LocationGroupsCardProps) {
  const [modalGroup, setModalGroup] = useState<LocationGroup | null | "new">(null);

  const handleSave = (name: string, locationIds: string[]) => {
    if (modalGroup === "new") {
      locationsStore.addGroup(name, locationIds);
    } else if (modalGroup && modalGroup !== "new") {
      locationsStore.updateGroup(modalGroup.id, { name, locationIds });
    }
    onRefresh();
  };

  return (
    <>
      <div
        style={{
          border: "1px solid var(--surface-border)",
          borderRadius: 12,
          backgroundColor: "var(--card-bg-on-dark)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 16px 12px",
            borderBottom: "1px solid var(--surface-border)",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Grupos de ubicaciones
          </h3>
          <button
            type="button"
            onClick={() => setModalGroup("new")}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              borderRadius: 8,
              backgroundColor: "var(--color-primary)",
              color: "var(--text-inverse)",
              fontSize: 18,
              cursor: "pointer",
            }}
            aria-label="Añadir grupo"
          >
            +
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--surface-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Nombre
                </th>
                <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Ubicaciones
                </th>
                <th style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, width: 80 }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "var(--text-secondary)",
                      fontSize: 14,
                    }}
                  >
                    No hay grupos. Crea uno para agrupar ubicaciones (ej. Ibiza, Franquicias).
                  </td>
                </tr>
              ) : (
                groups.map((grp) => (
                  <tr key={grp.id} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                    <td style={{ padding: "12px 16px", color: "var(--text-primary)", fontWeight: 500 }}>
                      {grp.name}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                      {grp.locationIds.length} ubicaciones
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        type="button"
                        onClick={() => setModalGroup(grp)}
                        style={{
                          padding: 4,
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "var(--text-secondary)",
                          borderRadius: 4,
                          fontSize: 14,
                        }}
                        aria-label="Editar grupo"
                      >
                        ✎
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalGroup !== null && (
        <GroupModal
          group={modalGroup === "new" ? null : modalGroup}
          locations={locations}
          onClose={() => setModalGroup(null)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
