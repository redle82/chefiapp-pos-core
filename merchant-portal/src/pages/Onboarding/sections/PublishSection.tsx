/**
 * PublishSection - Seção de Publicação
 *
 * Última seção: valida tudo e permite publicar o restaurante
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../../../context/OnboardingContext";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import { useBootstrapState } from "../../../hooks/useBootstrapState";

export function PublishSection() {
  const { state, canPublish } = useOnboarding();
  const bootstrap = useBootstrapState();
  const { publishRestaurant: publishRuntime } = useRestaurantRuntime();
  const [isPublishing, setIsPublishing] = React.useState(false);
  const navigate = useNavigate();

  const requiredSections: Array<{ id: string; label: string }> = [
    { id: "identity", label: "Identidade" },
    { id: "location", label: "Localização" },
    { id: "schedule", label: "Horários" },
    { id: "menu", label: "Cardápio" },
    { id: "people", label: "Pessoas" },
  ];

  const handlePublish = async () => {
    if (!canPublish()) {
      alert("Complete todas as seções obrigatórias antes de publicar.");
      return;
    }

    setIsPublishing(true);
    try {
      // Usar publishRestaurant do RestaurantRuntimeContext (publicação real)
      await publishRuntime();

      // Redirecionar para Dashboard (portal de sistemas)
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro ao publicar:", error);
      alert(
        `Erro ao publicar restaurante: ${
          error?.message || "Erro desconhecido"
        }`,
      );
      setIsPublishing(false);
    }
  };

  return (
    <div style={{ padding: "48px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>
        🚀 Publicar Restaurante
      </h1>
      <p style={{ fontSize: "14px", color: "#666", marginBottom: "32px" }}>
        Revise tudo e ative seu restaurante
      </p>

      {/* Resumo */}
      <div
        style={{
          marginBottom: "32px",
          padding: "24px",
          backgroundColor: "#f8f9fa",
          borderRadius: "12px",
        }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
          Resumo da Configuração
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {requiredSections.map((section) => {
            const sectionState =
              state.sections[section.id as keyof typeof state.sections];
            const isComplete = sectionState.status === "COMPLETE";

            return (
              <div
                key={section.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                }}
              >
                <span style={{ fontSize: "20px" }}>
                  {isComplete ? "✅" : "❌"}
                </span>
                <span style={{ fontSize: "14px", flex: 1 }}>
                  {section.label}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    backgroundColor: isComplete ? "#28a745" : "#dc3545",
                    color: "#fff",
                  }}
                >
                  {isComplete ? "Completo" : "Incompleto"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* O que acontece ao publicar */}
      <div
        style={{
          marginBottom: "32px",
          padding: "24px",
          backgroundColor: "#e7f3ff",
          borderRadius: "12px",
        }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
          O que acontece ao publicar:
        </h3>
        <ul
          style={{
            margin: 0,
            paddingLeft: "20px",
            fontSize: "14px",
            color: "#666",
          }}
        >
          <li>Restaurante fica ativo e operacional</li>
          <li>Primeiro pedido de teste é criado automaticamente</li>
          <li>Pedido aparece no KDS</li>
          <li>Você será redirecionado para o Dashboard</li>
        </ul>
      </div>

      {/* Aviso Core offline: só quando offline-erro */}
      {bootstrap.coreStatus === "offline-erro" && (
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#fef2f2",
            borderRadius: "8px",
            border: "1px solid #fecaca",
            fontSize: "14px",
            color: "#991b1b",
          }}
        >
          Core indisponível. Inicie o Core para publicar.
        </div>
      )}

      {/* Botão Publicar: desativar quando Core não está online */}
      <button
        onClick={handlePublish}
        disabled={
          !canPublish() || isPublishing || bootstrap.coreStatus !== "online"
        }
        style={{
          width: "100%",
          padding: "16px",
          fontSize: "16px",
          fontWeight: 600,
          color: "#fff",
          backgroundColor:
            canPublish() && bootstrap.coreStatus === "online" && !isPublishing
              ? "#667eea"
              : "#ccc",
          border: "none",
          borderRadius: "8px",
          cursor:
            canPublish() && bootstrap.coreStatus === "online" && !isPublishing
              ? "pointer"
              : "not-allowed",
          transition: "all 0.2s ease",
        }}
      >
        {isPublishing
          ? "Publicando..."
          : bootstrap.coreStatus !== "online"
          ? "Core indisponível — aguarde"
          : canPublish()
          ? "🚀 Publicar Restaurante"
          : "Complete as seções obrigatórias"}
      </button>

      {!canPublish() && (
        <p
          style={{
            marginTop: "16px",
            fontSize: "12px",
            color: "#dc3545",
            textAlign: "center",
          }}
        >
          Complete todas as seções obrigatórias antes de publicar
        </p>
      )}

      {/* Acesso Rápido aos Sistemas */}
      <div
        style={{
          marginTop: "48px",
          padding: "24px",
          backgroundColor: "#f8f9fa",
          borderRadius: "12px",
          border: "1px solid #e0e0e0",
        }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
          🧩 Acesso aos Sistemas do ChefIApp
        </h3>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
          Estes são os módulos do sistema operacional. Alguns podem estar
          bloqueados até a publicação.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          {/* TPV */}
          <button
            onClick={() => navigate("/tpv")}
            style={{
              padding: "12px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#1a1a1a",
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
              e.currentTarget.style.borderColor = "#667eea";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#fff";
              e.currentTarget.style.borderColor = "#e0e0e0";
            }}
          >
            <span>🖥️</span>
            <span>TPV (Caixa)</span>
          </button>

          {/* Task System */}
          <button
            onClick={() => navigate("/tasks")}
            style={{
              padding: "12px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#1a1a1a",
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
              e.currentTarget.style.borderColor = "#667eea";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#fff";
              e.currentTarget.style.borderColor = "#e0e0e0";
            }}
          >
            <span>✅</span>
            <span>Tarefas</span>
          </button>

          {/* People */}
          <button
            onClick={() => navigate("/people")}
            style={{
              padding: "12px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#1a1a1a",
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
              e.currentTarget.style.borderColor = "#667eea";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#fff";
              e.currentTarget.style.borderColor = "#e0e0e0";
            }}
          >
            <span>👥</span>
            <span>Pessoas</span>
          </button>

          {/* Health */}
          <button
            onClick={() => navigate("/health")}
            style={{
              padding: "12px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#1a1a1a",
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
              e.currentTarget.style.borderColor = "#667eea";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#fff";
              e.currentTarget.style.borderColor = "#e0e0e0";
            }}
          >
            <span>💚</span>
            <span>Saúde</span>
          </button>

          {/* Mentor */}
          <button
            onClick={() => navigate("/mentor")}
            style={{
              padding: "12px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#1a1a1a",
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
              e.currentTarget.style.borderColor = "#667eea";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#fff";
              e.currentTarget.style.borderColor = "#e0e0e0";
            }}
          >
            <span>🤖</span>
            <span>Mentor IA</span>
          </button>

          {/* Purchases */}
          <button
            onClick={() => navigate("/purchases")}
            style={{
              padding: "12px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#1a1a1a",
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
              e.currentTarget.style.borderColor = "#667eea";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#fff";
              e.currentTarget.style.borderColor = "#e0e0e0";
            }}
          >
            <span>🛒</span>
            <span>Compras</span>
          </button>

          {/* Financial */}
          <button
            onClick={() => navigate("/financial")}
            style={{
              padding: "12px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#1a1a1a",
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
              e.currentTarget.style.borderColor = "#667eea";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#fff";
              e.currentTarget.style.borderColor = "#e0e0e0";
            }}
          >
            <span>💰</span>
            <span>Financeiro</span>
          </button>

          {/* Reservations */}
          <button
            onClick={() => navigate("/reservations")}
            style={{
              padding: "12px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#1a1a1a",
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
              e.currentTarget.style.borderColor = "#667eea";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#fff";
              e.currentTarget.style.borderColor = "#e0e0e0";
            }}
          >
            <span>📅</span>
            <span>Reservas</span>
          </button>

          {/* Como tudo se conecta (TRIAL_GUIDE_SPEC) */}
          <button
            onClick={() => navigate("/auth")}
            style={{
              padding: "12px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#1a1a1a",
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
              e.currentTarget.style.borderColor = "#667eea";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#fff";
              e.currentTarget.style.borderColor = "#e0e0e0";
            }}
          >
            <span>🧭</span>
            <span>Ver como tudo se conecta</span>
          </button>

          {/* Config Tree */}
          <button
            onClick={() => navigate("/config")}
            style={{
              padding: "12px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#1a1a1a",
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
              e.currentTarget.style.borderColor = "#667eea";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#fff";
              e.currentTarget.style.borderColor = "#e0e0e0";
            }}
          >
            <span>⚙️</span>
            <span>Config Tree</span>
          </button>
        </div>
      </div>
    </div>
  );
}
