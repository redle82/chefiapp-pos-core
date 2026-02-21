/**
 * Card 3 — Relação Ubicación → Entidade legal.
 * Tabela: Ubicación | Entidad legal asociada.
 * Fase 1: 1 entidade; todas as ubicaciones usam a mesma.
 */
// @ts-nocheck


import { useMemo } from "react";
import type { Location } from "../../locations/types";
import { locationsStore } from "../../locations/store/locationsStore";
import { legalEntitiesStore } from "../store/legalEntitiesStore";

export function LocationEntityTableCard() {
  const locations = useMemo(() => locationsStore.getLocations(), []);
  const entity = useMemo(() => legalEntitiesStore.getEntity(), []);

  /** Fase 1: 1 entidade → todas as ubicaciones usam a mesma. */
  const entityName = entity?.legalName ?? "—";

  return (
    <div
      style={{
        border: "1px solid var(--surface-border)",
        borderRadius: 12,
        padding: 16,
        backgroundColor: "var(--card-bg-on-dark)",
      }}
    >
      <h3
        style={{
          margin: "0 0 8px 0",
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        Asociación a ubicaciones
      </h3>
      <p
        style={{
          margin: "0 0 16px 0",
          fontSize: 13,
          color: "var(--text-secondary)",
        }}
      >
        Qué entidad legal se usa en cada ubicación. Resuelve franquicias,
        multi-empresa y grupos.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--surface-border)", textAlign: "left" }}>
              <th
                style={{
                  padding: "12px 16px",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                }}
              >
                Ubicación
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                }}
              >
                Entidad legal asociada
              </th>
            </tr>
          </thead>
          <tbody>
            {locations.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  style={{
                    padding: 24,
                    textAlign: "center",
                    color: "var(--text-secondary)",
                    fontSize: 14,
                  }}
                >
                  No hay ubicaciones. Crea ubicaciones en Configuración →
                  Ubicaciones.
                </td>
              </tr>
            ) : (
              locations.map((loc: Location) => (
                <tr key={loc.id} style={{ borderBottom: "1px solid var(--surface-border)" }}>
                  <td style={{ padding: "12px 16px", color: "var(--text-primary)", fontWeight: 500 }}>
                    {loc.name}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                    {entityName}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {locations.length > 0 && !entity && (
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            color: "var(--color-warning)",
          }}
        >
          Define la entidad legal principal en el primer card para que se
          asocie a las ubicaciones.
        </p>
      )}
    </div>
  );
}
