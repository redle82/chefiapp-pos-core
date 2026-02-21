/**
 * MAP BUILDER MINIMAL — Configuração do Mapa do Restaurante
 *
 * Define zonas e mesas (contexto operacional).
 */
// @ts-nocheck


import { useEffect, useState } from "react";
import type {
  CoreRestaurantTable,
  CoreRestaurantZone,
} from "../../infra/docker-core/types";
import { readTables, readZones } from "../../infra/readers/MapReader";
import {
  deactivateTable,
  deactivateZone,
  upsertTable,
  upsertZone,
} from "../../infra/writers/MapWriter";

interface MapBuilderMinimalProps {
  restaurantId: string;
}

const ZONE_CODES = [
  { code: "BAR", name: "Bar" },
  { code: "KITCHEN", name: "Cozinha" },
  { code: "PASS", name: "Pass" },
  { code: "SERVICE", name: "Salão" },
  { code: "CASHIER", name: "Caixa" },
];

export function MapBuilderMinimal({ restaurantId }: MapBuilderMinimalProps) {
  const [zones, setZones] = useState<CoreRestaurantZone[]>([]);
  const [tables, setTables] = useState<CoreRestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [newZoneCode, setNewZoneCode] = useState<string>("SERVICE");
  const [newZoneName, setNewZoneName] = useState<string>("");
  const [newTableNumber, setNewTableNumber] = useState<number>(1);
  const [newTableZone, setNewTableZone] = useState<string>("");

  useEffect(() => {
    loadMap();
  }, [restaurantId]);

  const loadMap = async () => {
    try {
      setLoading(true);
      const [zonesData, tablesData] = await Promise.all([
        readZones(restaurantId),
        readTables(restaurantId),
      ]);
      setZones(zonesData);
      setTables(tablesData);
    } catch (err) {
      console.error("Erro ao carregar mapa:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async () => {
    if (!newZoneName.trim()) return;
    try {
      await upsertZone({
        restaurant_id: restaurantId,
        code: newZoneCode,
        name: newZoneName,
        sort_order: zones.length,
      });
      setNewZoneName("");
      await loadMap();
    } catch (err) {
      console.error("Erro ao criar zona:", err);
    }
  };

  const handleCreateTable = async () => {
    if (!newTableNumber || newTableNumber <= 0) return;
    try {
      await upsertTable({
        restaurant_id: restaurantId,
        number: newTableNumber,
        zone_id: newTableZone || null,
      });
      setNewTableNumber(1);
      setNewTableZone("");
      await loadMap();
    } catch (err) {
      console.error("Erro ao criar mesa:", err);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm("Tem certeza que deseja desativar esta zona?")) return;
    try {
      await deactivateZone(zoneId);
      await loadMap();
    } catch (err) {
      console.error("Erro ao desativar zona:", err);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm("Tem certeza que deseja desativar esta mesa?")) return;
    try {
      await deactivateTable(tableId);
      await loadMap();
    } catch (err) {
      console.error("Erro ao desativar mesa:", err);
    }
  };

  if (loading) {
    return <div>Carregando mapa...</div>;
  }

  return (
    <div>
      {/* Zonas */}
      <div style={{ marginBottom: "32px" }}>
        <h3
          style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}
        >
          🗺️ Zonas do Restaurante
        </h3>

        {/* Criar Nova Zona */}
        <div
          style={{
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  marginBottom: "4px",
                  fontWeight: "bold",
                }}
              >
                Código
              </label>
              <select
                value={newZoneCode}
                onChange={(e) => setNewZoneCode(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                {ZONE_CODES.map((z) => (
                  <option key={z.code} value={z.code}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  marginBottom: "4px",
                  fontWeight: "bold",
                }}
              >
                Nome
              </label>
              <input
                type="text"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="Ex: Salão Principal"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
            <button
              onClick={handleCreateZone}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              + Criar Zona
            </button>
          </div>
        </div>

        {/* Lista de Zonas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {zones.map((zone) => (
            <div
              key={zone.id}
              style={{
                padding: "12px",
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ fontWeight: "bold" }}>{zone.name}</span>
                <span
                  style={{ marginLeft: "8px", fontSize: "12px", color: "#666" }}
                >
                  ({zone.code})
                </span>
              </div>
              <button
                onClick={() => handleDeleteZone(zone.id)}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                ✗
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Mesas */}
      <div>
        <h3
          style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}
        >
          🪑 Mesas
        </h3>

        {/* Criar Nova Mesa */}
        <div
          style={{
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  marginBottom: "4px",
                  fontWeight: "bold",
                }}
              >
                Número da Mesa
              </label>
              <input
                type="number"
                min="1"
                value={newTableNumber}
                onChange={(e) =>
                  setNewTableNumber(parseInt(e.target.value) || 1)
                }
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  marginBottom: "4px",
                  fontWeight: "bold",
                }}
              >
                Zona (opcional)
              </label>
              <select
                value={newTableZone}
                onChange={(e) => setNewTableZone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              >
                <option value="">Sem zona</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreateTable}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              + Criar Mesa
            </button>
          </div>
        </div>

        {/* Lista de Mesas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {tables.map((table) => {
            const zone = zones.find((z) => z.id === table.zone_id);
            return (
              <div
                key={table.id}
                style={{
                  padding: "12px",
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontWeight: "bold" }}>
                    Mesa {table.number}
                  </span>
                  {zone && (
                    <span
                      style={{
                        marginLeft: "8px",
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      ({zone.name})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteTable(table.id)}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  ✗
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
