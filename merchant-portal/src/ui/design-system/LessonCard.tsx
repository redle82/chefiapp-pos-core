import React from "react";
import type { MicroLesson } from "../../intelligence/education/MicroLessonEngine";
import { Button } from "./Button";
import { Card } from "./Card";
import styles from "./LessonCard.module.css";
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
      className={styles.card}
      style={{ "--accent-color": colors.action.base } as React.CSSProperties}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <Text
            size="xs"
            weight="bold"
            color="primary"
            className={styles.label}
          >
            🧠 Micro-Treinamento ({lesson.durationSeconds}s)
          </Text>
        </div>

        <Text size="lg" weight="bold" color="primary">
          {lesson.title}
        </Text>

        <Text size="sm" color="secondary" className={styles.quote}>
          "{lesson.content}"
        </Text>

        <div className={styles.actions}>
          <Button tone="action" size="sm" onClick={onComplete}>
            JÁ SEI / ENTENDI
          </Button>
        </div>
      </div>
    </Card>
  );
};
