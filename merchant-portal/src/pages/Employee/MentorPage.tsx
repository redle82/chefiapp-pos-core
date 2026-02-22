/**
 * Employee Mentor - Mentor IA do Funcionário
 */

import { useNavigate } from "react-router-dom";
import { BottomTabs } from "../../components/navigation/BottomTabs";
import { Header } from "../../components/navigation/Header";
import { EmptyState } from "../../components/ui/EmptyState";
import type { MentorshipMessage } from "../../types/mentor";
import styles from "./MentorPage.module.css";

export function EmployeeMentorPage() {
  const navigate = useNavigate();

  // TODO: Integrar com Mentoria IA
  // TODO: Buscar mentoria contextual
  // TODO: Coletar feedback
  const mentorship: MentorshipMessage | null = null; // Placeholder

  return (
    <div className={styles.page}>
      <Header title="Mentor IA" subtitle="O que fazer agora" />

      <div className={styles.content}>
        {!mentorship ? (
          <EmptyState title="Nada para agora" message="Continue assim!" />
        ) : (
          <div className={styles.mentorCard}>
            <h3 className={styles.title}>{mentorship.content.title}</h3>
            <p className={styles.message}>{mentorship.content.message}</p>
            <div className={styles.contextBox}>
              <div className={styles.contextLabel}>Contexto:</div>
              <div className={styles.contextValue}>
                Baseado em: {mentorship.context.pattern} (
                {mentorship.context.frequency}x)
              </div>
            </div>
            <div className={styles.actionBox}>
              <div className={styles.actionTitle}>Ação Sugerida:</div>
              <div className={styles.actionLine}>
                <strong>O que:</strong> {mentorship.content.action.what}
              </div>
              <div className={styles.actionLine}>
                <strong>Por quê:</strong> {mentorship.content.action.why}
              </div>
              <div className={styles.actionLine}>
                <strong>Como:</strong> {mentorship.content.action.how}
              </div>
            </div>
            <div className={styles.primaryActionsRow}>
              <button
                onClick={() => {
                  // TODO: Executar ação
                }}
                className={styles.primaryButton}
              >
                Fazer Agora
              </button>
              <button
                onClick={() => navigate("/employee/mentor/training")}
                className={styles.secondaryButton}
              >
                Ver Treino
              </button>
            </div>
            <div className={styles.feedbackActionsRow}>
              <button
                onClick={() => {
                  // TODO: Marcar como útil
                }}
                className={styles.usefulButton}
              >
                Foi útil
              </button>
              <button
                onClick={() => {
                  // TODO: Marcar como não útil
                }}
                className={styles.notUsefulButton}
              >
                Não foi útil
              </button>
            </div>
          </div>
        )}

        <div className={styles.quickActionsList}>
          <button
            onClick={() => navigate("/employee/mentor/training")}
            className={styles.quickActionButton}
          >
            <div className={styles.quickActionTitle}>Treino Rápido (2 min)</div>
            <div className={styles.quickActionDescription}>
              Micro-lição baseada no seu erro real
            </div>
          </button>
          <button
            onClick={() => navigate("/employee/mentor/feedback")}
            className={styles.quickActionButton}
          >
            <div className={styles.quickActionTitle}>Feedback do Turno</div>
            <div className={styles.quickActionDescription}>
              3 pontos: forte / melhorar / próximo passo
            </div>
          </button>
        </div>
      </div>

      <BottomTabs role="employee" />
    </div>
  );
}
