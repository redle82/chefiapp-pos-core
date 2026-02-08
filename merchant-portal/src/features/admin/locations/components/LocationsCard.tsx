/**
 * LocationsCard — Lista/tabela de Ubicaciones: Nombre, Dirección + badge Principal/Ativo + ações (Editar, ⋯) + botão +.
 * Ref: Last.app Ubicaciones — cadastro de unidades.
 */

import { useState } from "react";
import type { Location } from "../types";
import { LocationRowActions } from "./LocationRowActions";
import { LocationModal } from "./LocationModal";
import { locationsStore } from "../store/locationsStore";

interface LocationsCardProps {
  locations: Location[];
  onRefresh: () => void;
}

export function LocationsCard({ locations, onRefresh }: LocationsCardProps) {
  const [modalLocation, setModalLocation] = useState<Location | null | "new">(null);

  const handleSave = (data: Omit<Location, "id" | "createdAt" | "updatedAt">) => {
    if (modalLocation === "new") {
      locationsStore.addLocation(data);
    } else if (modalLocation && modalLocation !== "new") {
      locationsStore.updateLocation(modalLocation.id, data);
    }
    onRefresh();
  };

  return (
    <>
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          backgroundColor: "#fff",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 16px 12px",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Ubicaciones
          </h3>
          <button
            type="button"
            onClick={() => setModalLocation("new")}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              borderRadius: 8,
              backgroundColor: "#7c3aed",
              color: "#fff",
              fontSize: 18,
              cursor: "pointer",
            }}
            aria-label="Añadir ubicación"
          >
            +
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 600 }}>
                  Nombre
                </th>
                <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 600 }}>
                  Dirección
                </th>
                <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 600, width: 80 }}>
                  Estado
                </th>
                <th style={{ padding: "12px 16px", color: "#6b7280", fontWeight: 600, width: 80 }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {locations.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "#6b7280",
                      fontSize: 14,
                    }}
                  >
                    No hay ubicaciones. Añade la primera con el botón +.
                  </td>
                </tr>
              ) : (
                locations.map((loc) => (
                  <tr key={loc.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 16px", color: "#111827" }}>
                      <span style={{ fontWeight: 500 }}>{loc.name}</span>
                      {loc.isPrimary && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#7c3aed",
                            backgroundColor: "#f3e8ff",
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                        >
                          Principal
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>
                      {loc.address || "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: loc.isActive ? "#059669" : "#6b7280",
                        }}
                      >
                        {loc.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <LocationRowActions
                        location={loc}
                        onEdit={() => setModalLocation(loc)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalLocation !== null && (
        <LocationModal
          location={modalLocation === "new" ? null : modalLocation}
          onClose={() => setModalLocation(null)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
