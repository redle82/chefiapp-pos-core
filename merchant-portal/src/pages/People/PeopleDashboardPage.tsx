/**
 * PeopleDashboardPage - Dashboard de Pessoas
 *
 * Mostra perfis operacionais, histórico comportamental e correlações.
 * VPC: tema escuro, Inter, estados vazios/loading consistentes.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmployeeProfileCard } from "../../components/People/EmployeeProfileCard";
import {
  employeeProfileEngine,
  type EmployeeProfile,
} from "../../core/people/EmployeeProfileEngine";
import { GlobalLoadingView } from "../../ui/design-system/components";
import { useRestaurantId } from "../../ui/hooks/useRestaurantId";
import styles from "./PeopleDashboardPage.module.css";

export function PeopleDashboardPage() {
  const navigate = useNavigate();
  const { restaurantId, loading: loadingRestaurantId } = useRestaurantId();
  const [profiles, setProfiles] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!restaurantId) return;

      try {
        const fetchedProfiles = await employeeProfileEngine.list(restaurantId);
        setProfiles(fetchedProfiles);
      } catch (error) {
        console.error("Error fetching profiles:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!loadingRestaurantId && restaurantId) {
      fetchProfiles();
    }
  }, [restaurantId, loadingRestaurantId]);

  if (loading || loadingRestaurantId || !restaurantId) {
    return (
      <GlobalLoadingView
        message="Carregando perfis..."
        layout="operational"
        variant="fullscreen"
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Pessoas — Perfis Operacionais</h1>
        <p className={styles.subtitle}>Perfis e correlações com a operação.</p>
      </div>

      <div className={styles.list}>
        {profiles.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>
              Nenhum perfil operacional encontrado
            </p>
            <p className={styles.emptyText}>
              Perfis são criados automaticamente quando funcionários completam
              tarefas
            </p>
          </div>
        ) : (
          profiles.map((profile) => (
            <EmployeeProfileCard
              key={profile.id}
              profile={profile}
              onSelect={() => navigate(`/people/${profile.employeeId}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
