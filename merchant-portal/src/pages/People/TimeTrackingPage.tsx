/**
 * TimeTrackingPage - Página de Banco de Horas
 */

import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import {
  timeTrackingEngine,
  type TimeEntry,
} from "../../core/people/TimeTrackingEngine";
import { GlobalLoadingView } from "../../ui/design-system/components";
import styles from "./TimeTrackingPage.module.css";

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
    <div className={styles.container}>
      <h1 className={styles.title}>Banco de Horas</h1>

      {/* Entrada Ativa */}
      {activeEntry ? (
        <div className={`${styles.statusCard} ${styles.activeCard}`}>
          <h2 className={styles.sectionTitle}>Entrada Ativa</h2>
          <div className={styles.statusMeta}>
            <div>
              <strong>Entrada:</strong> {activeEntry.clockIn.toLocaleString()}
            </div>
            {activeEntry.isLate && (
              <div className={styles.lateWarning}>
                ⚠️ Atraso: {activeEntry.lateMinutes} minutos
              </div>
            )}
          </div>
          <button
            onClick={handleClockOut}
            className={`${styles.actionButton} ${styles.clockOutButton}`}
          >
            Registrar Saída
          </button>
        </div>
      ) : (
        <div className={`${styles.statusCard} ${styles.idleCard}`}>
          <button
            onClick={handleClockIn}
            className={`${styles.actionButton} ${styles.clockInButton}`}
          >
            Registrar Entrada
          </button>
        </div>
      )}

      {/* Histórico */}
      <div>
        <h2 className={styles.sectionTitle}>Histórico (Últimos 7 dias)</h2>
        {entries.length === 0 ? (
          <p className={styles.emptyText}>Nenhuma entrada registrada</p>
        ) : (
          <div className={styles.entriesList}>
            {entries.map((entry) => (
              <div key={entry.id} className={styles.entryCard}>
                <div className={styles.entryRow}>
                  <div>
                    <div className={styles.entryDate}>
                      {entry.clockIn.toLocaleDateString()}
                    </div>
                    <div className={styles.entryTime}>
                      {entry.clockIn.toLocaleTimeString()} -{" "}
                      {entry.clockOut?.toLocaleTimeString() || "Em andamento"}
                    </div>
                    {entry.isLate && (
                      <div className={styles.entryLate}>
                        ⚠️ Atraso: {entry.lateMinutes} min
                      </div>
                    )}
                  </div>
                  <div className={styles.entrySummary}>
                    <div className={styles.entryWorked}>
                      {formatDuration(entry.workedMinutes)}
                    </div>
                    {entry.overtimeMinutes > 0 && (
                      <div className={styles.entryOvertime}>
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
