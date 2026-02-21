import React, { useEffect, useRef, useState } from "react";
import { StaffLayout } from "../../ui/design-system/layouts/StaffLayout";
import { Badge } from "../../ui/design-system/primitives/Badge";
import { Card } from "../../ui/design-system/Card";
import { Text } from "../../ui/design-system/primitives/Text";
import { colors } from "../../ui/design-system/tokens/colors";
import KDS from "../TPV/KDS/KitchenDisplay"; // The Kitchen Tool
import { PortioningTaskView } from "./components/PortioningTaskView";
import { TaskWhyBadge } from "./components/TaskWhyBadge";
import { useStaff } from "./context/StaffContext";
import type { Task } from "./context/StaffCoreTypes";
import { useTaskTimer } from "./hooks/useTaskTimer"; // P3-4
import styles from "./WorkerTaskFocus.module.css";

// ------------------------------------------------------------------
// 🛠️ THE TOOL RENDERER (The Heart of "Task = Tool")
// ------------------------------------------------------------------

export const WorkerTaskFocus: React.FC<{ task: Task; onBack?: () => void }> = ({
  task,
  onBack,
}) => {
  const { completeTask } = useStaff();

  // P3-4: Task Timer
  const timer = useTaskTimer();

  // Auto-start timer when task is focused
  useEffect(() => {
    if (task.status === "focused" && !timer.isRunning) {
      timer.start();
    }
    return () => {
      if (timer.isRunning) {
        timer.stop();
      }
    };
  }, [task.status]);

  // Handle back/cancel - unfocus the task
  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  // TOOL SWITCHER
  const renderTool = () => {
    // Portioning tasks
    if (task.type?.startsWith("portioning_") || task.context?.session_id) {
      return (
        <PortioningTaskView
          task={task}
          onComplete={() => completeTask(task.id)}
        />
      );
    }

    switch (task.uiMode) {
      case "production":
        return <KDS />;
      case "check":
        return (
          <CheckTool task={task} onComplete={() => completeTask(task.id)} />
        );
      case "counter":
        return (
          <CounterTool task={task} onComplete={() => completeTask(task.id)} />
        );
      case "confirm":
      default:
        return (
          <ConfirmTool task={task} onComplete={() => completeTask(task.id)} />
        );
    }
  };

  // Shell manda no scroll; quando dentro do Shell usar flex:1 minHeight:0. Legacy full-page usa 100vh.
  return (
    <div className={styles.container}>
      {/* Escape hatch - botão voltar */}
      {onBack && (
        <button onClick={handleBack} className={styles.backButton}>
          ← Voltar
        </button>
      )}

      {/* P3-4: Task Timer */}
      {task.status === "focused" && (
        <div className={styles.timerBadge}>
          <span>⏱️</span>
          <span>{timer.formattedTime}</span>
        </div>
      )}

      {renderTool()}
    </div>
  );
};

// ------------------------------------------------------------------
// 🧰 MICRO-TOOLS (UDS Enhanced)
// ------------------------------------------------------------------

// 👆 INTERACTION: Hold to Complete Button
const LongPressButton: React.FC<{
  onClick: () => void;
  label: string;
  tone?: "success" | "action";
}> = ({ onClick, label, tone = "action" }) => {
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPress = () => {
    setPressing(true);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onClick();
          return 100;
        }
        return p + 4;
      });
    }, 30);
  };

  const endPress = () => {
    setPressing(false);
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const baseColor =
    tone === "success" ? colors.success.base : colors.action.base;

  return (
    <button
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      className={styles.longPressButton}
      style={{
        background: pressing ? colors.surface.layer3 : colors.surface.layer2,
        border: `1px solid ${baseColor}`,
      }}
    >
      <div
        className={styles.progressFill}
        style={{
          width: `${progress}%`,
          background: baseColor,
        }}
      />
      <span
        className={styles.buttonLabel}
        style={{
          color: pressing && progress < 100 ? baseColor : colors.text.primary,
        }}
      >
        {progress >= 100 ? "PRONTO!" : pressing ? "SEGURANDO..." : label}
      </span>
    </button>
  );
};

const Header = ({ task, icon }: { task: Task; icon: string }) => (
  <div className={styles.headerRow}>
    <div className={styles.headerIcon}>{icon}</div>
    <div className={styles.headerContent}>
      <div className={styles.headerMeta}>
        <Badge
          label={task.context?.toUpperCase() || "TAREFA"}
          size="sm"
          status="ready"
        />
        {(task.meta?.event_id || task.meta?.source === "voice_operations") && (
          <TaskWhyBadge taskId={task.id} taskMeta={task.meta} compact={true} />
        )}
      </div>
      <Text size="xl" weight="black" color="primary">
        {task.title}
      </Text>
    </div>
  </div>
);

const CheckTool: React.FC<{ task: Task; onComplete: () => void }> = ({
  task,
  onComplete,
}) => {
  return (
    <StaffLayout title="Tarefa de Verificação" userName="Staff" status="active">
      <div className={styles.toolLayout}>
        <Header task={task} icon="✓" />

        <Card surface="layer1" padding="xl" className={styles.checkCard}>
          <Text size="2xl" weight="bold">
            {task.description}
          </Text>

          <div className={styles.buttonWrapper}>
            <LongPressButton
              onClick={onComplete}
              label="SEGURE PARA CONFIRMAR"
              tone="success"
            />
          </div>
        </Card>
      </div>
    </StaffLayout>
  );
};

const CounterTool: React.FC<{ task: Task; onComplete: () => void }> = ({
  task,
  onComplete,
}) => (
  <StaffLayout title="Tarefa de Contagem" userName="Staff" status="active">
    <div className={styles.toolLayout}>
      <Header task={task} icon="🔢" />

      <Card surface="layer1" padding="xl" className={styles.counterCard}>
        <Text size="sm" color="tertiary">
          CONTAGEM RÁPIDA
        </Text>
        <Text size="4xl" weight="black" color="action">
          12
        </Text>

        <div className={styles.counterButtons}>
          <CircularButton label="-" onClick={() => {}} />
          <CircularButton label="+" onClick={() => {}} tone="action" />
        </div>

        <div className={styles.counterSubmit}>
          <LongPressButton onClick={onComplete} label="REGISTRAR ESTOQUE" />
        </div>
      </Card>
    </div>
  </StaffLayout>
);

const ConfirmTool: React.FC<{ task: Task; onComplete: () => void }> = ({
  task,
  onComplete,
}) => (
  <StaffLayout title="Leitura Obrigatória" userName="Staff" status="active">
    <div className={styles.toolLayout}>
      <Header task={task} icon="ℹ️" />

      <Card surface="layer1" padding="xl" className={styles.confirmCard}>
        <Text size="xl" weight="bold" color="primary">
          {task.title}
        </Text>
        <Text size="md" color="secondary" className={styles.confirmDescription}>
          {task.description}
        </Text>

        {task.reason && (
          <div className={styles.reasonBlock}>
            <Text size="xs" weight="bold" color="destructive">
              MOTIVO: {task.reason}
            </Text>
          </div>
        )}

        <div className={styles.confirmSubmit}>
          <LongPressButton onClick={onComplete} label="ESTOU CIENTE" />
        </div>
      </Card>
    </div>
  </StaffLayout>
);

const CircularButton = ({
  label,
  onClick,
  tone = "neutral",
}: {
  label: string;
  onClick: () => void;
  tone?: "neutral" | "action";
}) => (
  <button className={styles.circularButton} data-tone={tone} onClick={onClick}>
    {label}
  </button>
);
