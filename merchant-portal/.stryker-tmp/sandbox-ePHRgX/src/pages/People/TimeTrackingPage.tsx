/**
 * TimeTrackingPage - Página de Banco de Horas
 */
// @ts-nocheck


import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import {
  timeTrackingEngine,
  type TimeEntry,
} from "../../core/people/TimeTrackingEngine";
import { GlobalLoadingView } from "../../ui/design-system/components";

export function TimeTrackingPage() {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime.restaurant_id ?? null;
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      // TODO: Buscar employee_id real
      const mockEmployeeId = "mock-employee-id";
      setEmployeeId(mockEmployeeId);

      try {
        const active = await timeTrackingEngine.getActiveEntry(mockEmployeeId);
        setActiveEntry(active);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // Últimos 7 dias
        const list = await timeTrackingEngine.listEntries(
          mockEmployeeId,
          startDate,
        );
        setEntries(list);
      } catch (error) {
        console.error("Error fetching time entries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleClockIn = async () => {
    if (!employeeId) return;

    try {
      if (!restaurantId) {
        alert("Restaurante não identificado");
        return;
      }
      await timeTrackingEngine.clockIn(employeeId, restaurantId);
      window.location.reload();
    } catch (error) {
      console.error("Error clocking in:", error);
      alert("Erro ao registrar entrada");
    }
  };

  const handleClockOut = async () => {
    if (!activeEntry) return;

    try {
      await timeTrackingEngine.clockOut(activeEntry.id);
      window.location.reload();
    } catch (error) {
      console.error("Error clocking out:", error);
      alert("Erro ao registrar saída");
    }
  };

  if (loading) {
    return (
      <GlobalLoadingView
        message="Carregando..."
        layout="portal"
        variant="fullscreen"
      />
    );
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>
        Banco de Horas
      </h1>

      {/* Entrada Ativa */}
      {activeEntry ? (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#e7f3ff",
            borderRadius: "8px",
          }}
        >
          <h2
            style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}
          >
            Entrada Ativa
          </h2>
          <div style={{ marginBottom: "12px" }}>
            <div>
              <strong>Entrada:</strong> {activeEntry.clockIn.toLocaleString()}
            </div>
            {activeEntry.isLate && (
              <div style={{ color: "#dc3545", marginTop: "4px" }}>
                ⚠️ Atraso: {activeEntry.lateMinutes} minutos
              </div>
            )}
          </div>
          <button
            onClick={handleClockOut}
            style={{
              padding: "12px 24px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Registrar Saída
          </button>
        </div>
      ) : (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
          }}
        >
          <button
            onClick={handleClockIn}
            style={{
              padding: "12px 24px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: 600,
            }}
          >
            Registrar Entrada
          </button>
        </div>
      )}

      {/* Histórico */}
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
          Histórico (Últimos 7 dias)
        </h2>
        {entries.length === 0 ? (
          <p style={{ color: "#666" }}>Nenhuma entrada registrada</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {entries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: "12px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {entry.clockIn.toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666" }}>
                      {entry.clockIn.toLocaleTimeString()} -{" "}
                      {entry.clockOut?.toLocaleTimeString() || "Em andamento"}
                    </div>
                    {entry.isLate && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#dc3545",
                          marginTop: "4px",
                        }}
                      >
                        ⚠️ Atraso: {entry.lateMinutes} min
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "16px", fontWeight: 600 }}>
                      {formatDuration(entry.workedMinutes)}
                    </div>
                    {entry.overtimeMinutes > 0 && (
                      <div style={{ fontSize: "12px", color: "#ff9800" }}>
                        +{formatDuration(entry.overtimeMinutes)} extras
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
