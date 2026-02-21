/**
 * TASK BUILDER MINIMAL — Configuração de Tarefas
 *
 * Não cria tarefas manualmente.
 * Ativa/desativa packs e ajusta parâmetros.
 */
// @ts-nocheck


import { useEffect, useState } from "react";
import type { CoreTaskPack } from "../../infra/docker-core/types";
import {
  readActivatedPacks,
  readPacksByContext,
} from "../../infra/readers/TaskPackReader";
import {
  activatePack,
  deactivatePack,
} from "../../infra/writers/TaskPackWriter";

interface TaskBuilderMinimalProps {
  restaurantId: string;
}

export function TaskBuilderMinimal({ restaurantId }: TaskBuilderMinimalProps) {
  const [allPacks, setAllPacks] = useState<CoreTaskPack[]>([]);
  const [activatedPacks, setActivatedPacks] = useState<CoreTaskPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [operationType, setOperationType] = useState<string>("RESTAURANTE");
  const [teamSize, setTeamSize] = useState<number>(5);
  const [tableCount, setTableCount] = useState<number>(10);

  useEffect(() => {
    loadPacks();
  }, [restaurantId, operationType, teamSize, tableCount]);

  const loadPacks = async () => {
    try {
      setLoading(true);
      const [all, activated] = await Promise.all([
        readPacksByContext(operationType, teamSize, tableCount),
        readActivatedPacks(restaurantId),
      ]);
      setAllPacks(all);
      setActivatedPacks(activated);
    } catch (err) {
      console.error("Erro ao carregar packs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePack = async (packId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await activatePack(restaurantId, packId);
      } else {
        await deactivatePack(restaurantId, packId);
      }
      await loadPacks();
    } catch (err) {
      console.error("Erro ao ativar/desativar pack:", err);
    }
  };

  const isPackActivated = (packId: string) => {
    return activatedPacks.some((p) => p.id === packId);
  };

  // Calcular preview de impacto
  const calculateImpact = () => {
    const activeCount = activatedPacks.length;
    const estimatedTasksPerShift = activeCount * 2.5; // Estimativa simples
    return {
      packs: activeCount,
      tasksPerShift: Math.round(estimatedTasksPerShift),
    };
  };

  const impact = calculateImpact();

  if (loading) {
    return <div>Carregando packs...</div>;
  }

  return (
    <div>
      {/* Contexto do Restaurante */}
      <div
        style={{
          padding: "16px",
          backgroundColor: "#f3f4f6",
          borderRadius: "8px",
          marginBottom: "24px",
        }}
      >
        <h3
          style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px" }}
        >
          Contexto do Restaurante
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
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
              Tipo de Operação
            </label>
            <select
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              <option value="AMBULANTE">Ambulante</option>
              <option value="BAR">Bar</option>
              <option value="RESTAURANTE">Restaurante</option>
              <option value="RESTAURANTE_GRANDE">Restaurante Grande</option>
              <option value="MULTIUNIDADE">Multiunidade</option>
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
              Tamanho da Equipe
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={teamSize}
              onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
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
              Nº de Mesas
            </label>
            <input
              type="number"
              min="0"
              max="200"
              value={tableCount}
              onChange={(e) => setTableCount(parseInt(e.target.value) || 0)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            />
          </div>
        </div>
      </div>

      {/* Packs Disponíveis */}
      <div style={{ marginBottom: "24px" }}>
        <h3
          style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}
        >
          📦 Packs de Tarefas
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {allPacks.map((pack) => {
            const isActivated = isPackActivated(pack.id);
            return (
              <div
                key={pack.id}
                style={{
                  padding: "16px",
                  backgroundColor: isActivated ? "#f0fdf4" : "#fff",
                  border: `2px solid ${isActivated ? "#22c55e" : "#e5e7eb"}`,
                  borderRadius: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                        {pack.name}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#666",
                          backgroundColor: "#f3f4f6",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {pack.code}
                      </span>
                      {isActivated && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#22c55e",
                            fontWeight: "bold",
                          }}
                        >
                          ✓ Ativado
                        </span>
                      )}
                    </div>
                    {pack.description && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginBottom: "8px",
                        }}
                      >
                        {pack.description}
                      </p>
                    )}
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                      {pack.operation_type && `Tipo: ${pack.operation_type} • `}
                      {pack.min_team_size &&
                        `Equipe: ${pack.min_team_size}-${
                          pack.max_team_size || "∞"
                        } • `}
                      {pack.min_tables !== null &&
                        `Mesas: ${pack.min_tables}-${pack.max_tables || "∞"}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handleTogglePack(pack.id, !isActivated)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: isActivated ? "#dc2626" : "#22c55e",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    {isActivated ? "✗ Desativar" : "✓ Ativar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview de Impacto */}
      <div
        style={{
          padding: "16px",
          backgroundColor: "#dbeafe",
          borderRadius: "8px",
          border: "1px solid #3b82f6",
        }}
      >
        <h3
          style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}
        >
          📊 Preview do Impacto
        </h3>
        <p style={{ fontSize: "14px", color: "#1e40af" }}>
          Com essa configuração, sua equipe verá em média:
        </p>
        <ul
          style={{
            marginTop: "8px",
            paddingLeft: "20px",
            fontSize: "14px",
            color: "#1e40af",
          }}
        >
          <li>
            <strong>{impact.packs}</strong> packs ativados
          </li>
          <li>
            <strong>{impact.tasksPerShift}</strong> tarefas por turno (estimado)
          </li>
          <li>Tarefas automáticas (produção) + recorrentes (operação)</li>
        </ul>
      </div>
    </div>
  );
}
