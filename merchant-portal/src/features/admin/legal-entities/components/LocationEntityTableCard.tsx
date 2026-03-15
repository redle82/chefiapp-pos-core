/**
 * Card 3 — Relação Localização → Entidade legal.
 * Tabela: Localização | Entidade legal associada.
 * Fase 1: 1 entidade; todas as localizações usam a mesma.
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Location } from "../../locations/types";
import { locationsStore } from "../../locations/store/locationsStore";
import { legalEntitiesStore } from "../store/legalEntitiesStore";

export function LocationEntityTableCard() {
  const { t } = useTranslation("config");
  const locations = useMemo(() => locationsStore.getLocations(), []);
  const entity = useMemo(() => legalEntitiesStore.getEntity(), []);

  /** Fase 1: 1 entidade → todas as localizações usam a mesma. */
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
        {t("legalEntities.cardTitle")}
      </h3>
      <p
        style={{
          margin: "0 0 16px 0",
          fontSize: 13,
          color: "var(--text-secondary)",
        }}
      >
        {t("legalEntities.cardDesc")}
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
                {t("legalEntities.columnLocation")}
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                }}
              >
                {t("legalEntities.columnEntity")}
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
                  {t("legalEntities.emptyLocations")}
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
          {t("legalEntities.warningNoEntity")}
        </p>
      )}
    </div>
  );
}
