// useMentorshipMessages.ts — Hook para expor sugestões/contextos do MentorEngine
import { useState } from "react";
import {
  MentorEngine,
  type MentorshipEvent,
  type MentorshipMessage,
} from "./MentorEngine";

const mentor = new MentorEngine();

export function useMentorshipMessages() {
  const [messages, setMessages] = useState<MentorshipMessage[]>(
    mentor.getMessages(),
  );

  function addEvent(event: MentorshipEvent) {
    mentor.addEvent(event);
    setMessages(mentor.getMessages());
  }

  return { messages, addEvent };
}
