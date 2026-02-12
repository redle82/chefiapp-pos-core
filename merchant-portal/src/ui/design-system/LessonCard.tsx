import React from "react";
import type { MicroLesson } from "../../intelligence/education/MicroLessonEngine";
import { Button } from "./primitives/Button";
import { Card } from "./primitives/Card";
import { Text } from "./primitives/Text";
import { colors } from "./tokens/colors";

interface LessonCardProps {
  lesson: MicroLesson;
  onComplete: () => void;
  onDismiss?: () => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  onComplete,
}) => {
  return (
    <Card
      surface="layer2"
      padding="md"
      style={{
        borderLeft: `4px solid ${colors.primary.base}`,
        backgroundColor: "#F0F9FF",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            size="xs"
            weight="bold"
            color="primary"
            style={{ textTransform: "uppercase" }}
          >
            🧠 Micro-Treinamento ({lesson.durationSeconds}s)
          </Text>
        </div>

        <Text size="lg" weight="bold" color="primary">
          {lesson.title}
        </Text>

        <Text size="sm" color="secondary" style={{ fontStyle: "italic" }}>
          "{lesson.content}"
        </Text>

        <div
          style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}
        >
          <Button tone="action" size="sm" onClick={onComplete}>
            JÁ SEI / ENTENDI
          </Button>
        </div>
      </div>
    </Card>
  );
};
