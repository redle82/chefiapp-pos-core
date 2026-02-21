// @ts-nocheck
// useMentorshipMessages.ts — Hook para expor sugestões/contextos do MentorEngine
import { useCallback, useState } from "react";
import type { EnvironmentState, OperatorProfile } from "./ContextAnalyzer";
import type { FeedbackEntry, FeedbackStats } from "./FeedbackLoop";
import {
  MentorEngine,
  type MentorshipEvent,
  type MentorshipMessage,
} from "./MentorEngine";

const mentor = new MentorEngine();

// Default context para modo trial
mentor.setContext(
  { role: "manager", experience: "experienced", shiftsCompleted: 50 },
  {},
);

export function useMentorshipMessages() {
  const [messages, setMessages] = useState<MentorshipMessage[]>(
    mentor.getMessages(),
  );

  const addEvent = useCallback((event: MentorshipEvent) => {
    mentor.addEvent(event);
    setMessages([...mentor.getMessages()]);
  }, []);

  const setContext = useCallback(
    (operator: OperatorProfile, env?: Partial<EnvironmentState>) => {
      mentor.setContext(operator, env);
    },
    [],
  );

  const addFeedback = useCallback(
    (messageId: string, rating: FeedbackEntry["rating"]) => {
      mentor.addFeedback(messageId, rating);
      // Regenerar mensagens (feedback pode suprimir padrões)
      setMessages([...mentor.getMessages()]);
    },
    [],
  );

  const getFeedbackStats = useCallback((): FeedbackStats => {
    return mentor.getFeedbackStats();
  }, []);

  return { messages, addEvent, setContext, addFeedback, getFeedbackStats };
}
