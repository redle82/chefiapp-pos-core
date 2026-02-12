// useMentorshipMessages.ts
// React hook to expose mentorship messages from MentorEngine
import { useEffect, useState } from "react";
import type { MentorshipEvent, MentorshipMessage } from "./MentorEngine";
import { MentorEngine } from "./MentorEngine";

export function useMentorshipMessages(
  events: MentorshipEvent[],
): MentorshipMessage[] {
  const [messages, setMessages] = useState<MentorshipMessage[]>([]);

  useEffect(() => {
    const engine = new MentorEngine(events);
    setMessages(engine.getMessages());
  }, [JSON.stringify(events)]);

  return messages;
}
