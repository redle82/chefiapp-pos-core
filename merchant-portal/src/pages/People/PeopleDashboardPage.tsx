/**
 * PeopleDashboardPage - Dashboard de Pessoas
 *
 * Mostra perfis operacionais, histórico comportamental e correlações.
 * VPC: tema escuro, Inter, estados vazios/loading consistentes.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EmployeeProfileCard } from "../../components/People/EmployeeProfileCard";
import {
  employeeProfileEngine,
  type EmployeeProfile,
} from "../../core/people/EmployeeProfileEngine";
import { useRestaurantId } from "../../core/hooks/useRestaurantId";
import { GlobalLoadingView } from "../../ui/design-system/components";

const VPC = {
  bg: "#0a0a0a",
  surface: "#141414",
  border: "#262626",
  text: "#fafafa",
  textMuted: "#a3a3a3",
  accent: "#22c55e",
};

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
    <div
      style={{
        minHeight: "100vh",
        background: VPC.bg,
        color: VPC.text,
        fontFamily: "var(--vpc-font, Inter), system-ui, sans-serif",
        padding: "32px 24px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            marginBottom: "8px",
            color: VPC.text,
          }}
        >
          Pessoas — Perfis Operacionais
        </h1>
        <p style={{ color: VPC.textMuted, fontSize: 14 }}>
          Perfis e correlações com a operação.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {profiles.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              background: VPC.surface,
              border: `1px solid ${VPC.border}`,
              borderRadius: 8,
            }}
          >
            <p style={{ color: VPC.text, fontSize: 18, marginBottom: "8px" }}>
              Nenhum perfil operacional encontrado
            </p>
            <p style={{ color: VPC.textMuted, fontSize: 14 }}>
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
