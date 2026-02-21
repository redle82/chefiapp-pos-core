// @ts-nocheck
// TaskSuggestionsMentorEngine.tsx — Exibe sugestões/alertas do MentorEngine (Onda 6)
import type { MentorshipMessage } from "../../core/intelligence/MentorEngine";

interface Props {
  messages: MentorshipMessage[];
  onFeedback?: (
    messageId: string,
    rating: "useful" | "not_useful" | "dismissed",
  ) => void;
}

export function TaskSuggestionsMentorEngine({ messages, onFeedback }: Props) {
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
      <h4 style={{ margin: "0 0 12px 0" }}>
        🧠 Sugestões Inteligentes (MentorEngine)
      </h4>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {messages.map((msg) => (
          <li
            key={msg.id}
            style={{
              marginBottom: 12,
              padding: 12,
              background: msg.type === "alert" ? "#FEF2F2" : "#F0FDF4",
              borderRadius: 6,
              borderLeft: `4px solid ${
                msg.type === "alert" ? "#EF4444" : "#22C55E"
              }`,
            }}
          >
            <div>
              <strong>
                {msg.type === "alert" ? "⚠️ Alerta:" : "💡 Sugestão:"}
              </strong>{" "}
              {msg.text}
            </div>
            {msg.mentorshipType && (
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                Tipo: {msg.mentorshipType}
              </div>
            )}
            {onFeedback && (
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button
                  onClick={() => onFeedback(msg.id, "useful")}
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    border: "1px solid #22C55E",
                    borderRadius: 4,
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  👍 Útil
                </button>
                <button
                  onClick={() => onFeedback(msg.id, "not_useful")}
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    border: "1px solid #EF4444",
                    borderRadius: 4,
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  👎 Não útil
                </button>
                <button
                  onClick={() => onFeedback(msg.id, "dismissed")}
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    border: "1px solid #9CA3AF",
                    borderRadius: 4,
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  ✕ Dispensar
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
