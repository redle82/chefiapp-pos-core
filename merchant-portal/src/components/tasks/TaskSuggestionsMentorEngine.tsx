// TaskSuggestionsMentorEngine.tsx — Exibe sugestões/alertas do MentorEngine (Onda 6)
import type { MentorshipMessage } from "../../core/intelligence/MentorEngine";

interface Props {
  messages: MentorshipMessage[];
}

export function TaskSuggestionsMentorEngine({ messages }: Props) {
  if (!messages.length) return null;

  return (
    <div
      style={{
        padding: 16,
        background: "#E0F2FE",
        borderRadius: 8,
        margin: "16px 0",
      }}
    >
      <h4>Sugestões Inteligentes (MentorEngine)</h4>
      <ul>
        {messages.map((msg) => (
          <li key={msg.id} style={{ marginBottom: 8 }}>
            <strong>{msg.type === "alert" ? "Alerta:" : "Sugestão:"}</strong>{" "}
            {msg.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
