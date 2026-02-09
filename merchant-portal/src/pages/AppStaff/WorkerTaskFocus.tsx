import React, { useEffect, useRef, useState } from "react";
import { StaffLayout } from "../../ui/design-system/layouts/StaffLayout";
import { Card } from "../../ui/design-system/primitives/Card";
import { Text } from "../../ui/design-system/primitives/Text";
import { colors } from "../../ui/design-system/tokens/colors";
import { radius } from "../../ui/design-system/tokens/radius";
import KDS from "../TPV/KDS/KitchenDisplay"; // The Kitchen Tool
import { PortioningTaskView } from "./components/PortioningTaskView";
import { useStaff } from "./context/StaffContext";
import type { Task } from "./context/StaffCoreTypes";
import { useTaskTimer } from "./hooks/useTaskTimer"; // P3-4

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
    <div
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        background: colors.surface.base,
        position: "relative",
      }}
    >
      {/* Escape hatch - botão voltar */}
      {onBack && (
        <button
          onClick={handleBack}
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 100,
            background: colors.surface.layer2,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: radius.md,
            padding: "8px 16px",
            color: colors.text.secondary,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
          }}
        >
          ← Voltar
        </button>
      )}

      {/* P3-4: Task Timer */}
      {task.status === "focused" && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 100,
            background: colors.surface.layer2,
            border: `1px solid ${colors.border.subtle}`,
            borderRadius: radius.md,
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            fontWeight: 600,
            color: colors.text.primary,
          }}
        >
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
      style={{
        width: "100%",
        padding: "16px 24px",
        borderRadius: radius.md,
        background: pressing ? colors.surface.layer3 : colors.surface.layer2,
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: 600,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        userSelect: "none",
        touchAction: "none",
        border: `1px solid ${baseColor}`,
        transition: "all 0.2s ease",
        height: 64,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${progress}%`,
          background: baseColor,
          opacity: 0.2,
          transition: "width 30ms linear",
        }}
      />
      <span
        style={{
          position: "relative",
          zIndex: 10,
          color: pressing && progress < 100 ? baseColor : colors.text.primary,
        }}
      >
        {progress >= 100 ? "PRONTO!" : pressing ? "SEGURANDO..." : label}
      </span>
    </button>
  );
};

const Header = ({ task, icon }: { task: Task; icon: string }) => (
  <div
    style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}
  >
    <div style={{ fontSize: 32 }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: 24,
        }}
      >
        <Header task={task} icon="✓" />

        <Card
          surface="layer1"
          padding="xl"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 32,
          }}
        >
          <Text size="2xl" weight="bold">
            {task.description}
          </Text>

          <div style={{ width: "100%", maxWidth: 400 }}>
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 24,
      }}
    >
      <Header task={task} icon="🔢" />

      <Card
        surface="layer1"
        padding="xl"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <Text size="sm" color="tertiary">
          CONTAGEM RÁPIDA
        </Text>
        <Text size="4xl" weight="black" color="action">
          12
        </Text>

        <div style={{ display: "flex", gap: 24 }}>
          <CircularButton label="-" onClick={() => {}} />
          <CircularButton label="+" onClick={() => {}} tone="action" />
        </div>

        <div style={{ width: "100%", marginTop: 32, maxWidth: 400 }}>
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 24,
      }}
    >
      <Header task={task} icon="ℹ️" />

      <Card
        surface="layer1"
        padding="xl"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <Text size="xl" weight="bold" color="primary">
          {task.title}
        </Text>
        <Text size="md" color="secondary" style={{ lineHeight: 1.6 }}>
          {task.description}
        </Text>

        {task.reason && (
          <div
            style={{
              padding: 12,
              background: "rgba(225, 29, 72, 0.1)",
              borderLeft: `3px solid ${colors.destructive.base}`,
            }}
          >
            <Text size="xs" weight="bold" color="destructive">
              MOTIVO: {task.reason}
            </Text>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
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
  <button
    style={{
      width: 64,
      height: 64,
      borderRadius: "50%",
      background:
        tone === "action" ? colors.action.base : colors.surface.layer3,
      color: colors.text.primary,
      border: "none",
      fontSize: 32,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
    onClick={onClick}
  >
    {label}
  </button>
);
