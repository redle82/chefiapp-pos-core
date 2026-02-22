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
import styles from "./PublishSection.module.css";

export function PublishSection() {
  const { state, canPublish } = useOnboarding();
  const bootstrap = useBootstrapState();
  const { publishRestaurant: publishRuntime } = useRestaurantRuntime();
  const [isPublishing, setIsPublishing] = React.useState(false);
  const navigate = useNavigate();
  const publishEnabled =
    canPublish() && bootstrap.coreStatus === "online" && !isPublishing;

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
    <div className={styles.container}>
      <h1 className={styles.title}>🚀 Publicar Restaurante</h1>
      <p className={styles.subtitle}>Revise tudo e ative seu restaurante</p>

      {/* Resumo */}
      <div className={styles.panel}>
        <h3 className={styles.sectionTitle}>Resumo da Configuração</h3>
        <div className={styles.summaryList}>
          {requiredSections.map((section) => {
            const sectionState =
              state.sections[section.id as keyof typeof state.sections];
            const isComplete = sectionState.status === "COMPLETE";

            return (
              <div key={section.id} className={styles.summaryItem}>
                <span className={styles.summaryIcon}>
                  {isComplete ? "✅" : "❌"}
                </span>
                <span className={styles.summaryLabel}>{section.label}</span>
                <span
                  className={`${styles.summaryStatus} ${
                    isComplete ? styles.statusComplete : styles.statusIncomplete
                  }`}
                >
                  {isComplete ? "Completo" : "Incompleto"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* O que acontece ao publicar */}
      <div className={`${styles.panel} ${styles.infoPanel}`}>
        <h3 className={styles.sectionTitleCompact}>
          O que acontece ao publicar:
        </h3>
        <ul className={styles.infoList}>
          <li>Restaurante fica ativo e operacional</li>
          <li>Primeiro pedido de teste é criado automaticamente</li>
          <li>Pedido aparece no KDS</li>
          <li>Você será redirecionado para o Dashboard</li>
        </ul>
      </div>

      {/* Aviso Core offline: só quando offline-erro */}
      {bootstrap.coreStatus === "offline-erro" && (
        <div className={styles.errorBanner}>
          Core indisponível. Inicie o Core para publicar.
        </div>
      )}

      {/* Botão Publicar: desativar quando Core não está online */}
      <button
        onClick={handlePublish}
        disabled={
          !canPublish() || isPublishing || bootstrap.coreStatus !== "online"
        }
        className={`${styles.publishButton} ${
          publishEnabled
            ? styles.publishButtonEnabled
            : styles.publishButtonDisabled
        }`}
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
        <p className={styles.publishHint}>
          Complete todas as seções obrigatórias antes de publicar
        </p>
      )}

      {/* Acesso Rápido aos Sistemas */}
      <div className={`${styles.panel} ${styles.accessPanel}`}>
        <h3 className={styles.sectionTitle}>
          🧩 Acesso aos Sistemas do ChefIApp
        </h3>
        <p className={styles.accessDescription}>
          Estes são os módulos do sistema operacional. Alguns podem estar
          bloqueados até a publicação.
        </p>

        <div className={styles.systemsGrid}>
          {/* TPV */}
          <button
            onClick={() => navigate("/tpv")}
            className={styles.systemButton}
          >
            <span>🖥️</span>
            <span>TPV (Caixa)</span>
          </button>

          {/* Task System */}
          <button
            onClick={() => navigate("/tasks")}
            className={styles.systemButton}
          >
            <span>✅</span>
            <span>Tarefas</span>
          </button>

          {/* People */}
          <button
            onClick={() => navigate("/people")}
            className={styles.systemButton}
          >
            <span>👥</span>
            <span>Pessoas</span>
          </button>

          {/* Health */}
          <button
            onClick={() => navigate("/health")}
            className={styles.systemButton}
          >
            <span>💚</span>
            <span>Saúde</span>
          </button>

          {/* Mentor */}
          <button
            onClick={() => navigate("/mentor")}
            className={styles.systemButton}
          >
            <span>🤖</span>
            <span>Mentor IA</span>
          </button>

          {/* Purchases */}
          <button
            onClick={() => navigate("/purchases")}
            className={styles.systemButton}
          >
            <span>🛒</span>
            <span>Compras</span>
          </button>

          {/* Financial */}
          <button
            onClick={() => navigate("/financial")}
            className={styles.systemButton}
          >
            <span>💰</span>
            <span>Financeiro</span>
          </button>

          {/* Reservations */}
          <button
            onClick={() => navigate("/reservations")}
            className={styles.systemButton}
          >
            <span>📅</span>
            <span>Reservas</span>
          </button>

          {/* Como tudo se conecta (TRIAL_GUIDE_SPEC) */}
          <button
            onClick={() => navigate("/auth")}
            className={styles.systemButton}
          >
            <span>🧭</span>
            <span>Ver como tudo se conecta</span>
          </button>

          {/* Config Tree */}
          <button
            onClick={() => navigate("/admin/config")}
            className={styles.systemButton}
          >
            <span>⚙️</span>
            <span>Config Tree</span>
          </button>
        </div>
      </div>
    </div>
  );
}
