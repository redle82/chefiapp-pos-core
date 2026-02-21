// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useMentorshipMessages } from "../../../../core/mentorship/useMentorshipMessages";
import type { MentorshipEvent } from "../../core/intelligence/MentorEngine";
import { extractMentorshipEvents } from "./extractMentorshipEvents";
import "./MentorPage.css";

export const MentorPage: React.FC = () => {
  const [events, setEvents] = useState<MentorshipEvent[]>([]);

  // Função para popular o localStorage com 3 eventos reais de mentoria
  const popularEventosTeste = () => {
    const events = [
      {
        name: "order_created",
        ts: Date.now() - 60000,
        payload: { orderId: "123", value: 50 },
      },
      {
        name: "sla_violation",
        ts: Date.now() - 30000,
        payload: { orderId: "124", sla: "15min" },
      },
      {
        name: "stockout",
        ts: Date.now() - 10000,
        payload: { productId: "789", name: "Coca-Cola" },
      },
    ];
    const json = JSON.stringify(events);
    localStorage.setItem("chefiapp_analytics_queue", json);
    sessionStorage.setItem("chefiapp_analytics_queue", json);
    setEvents(
      events.map((evt) => ({
        type:
          evt.name === "order_created"
            ? "ORDER_CREATED"
            : evt.name === "sla_violation"
            ? "SLA_VIOLATION"
            : evt.name === "stockout"
            ? "STOCKOUT"
            : "DELAY",
        timestamp: new Date(evt.ts).toISOString(),
        details: evt.payload || {},
      })),
    );
  };

  useEffect(() => {
    setEvents(extractMentorshipEvents());
    // Optionally, add polling or event listeners for live updates
  }, []);

  const messages = useMentorshipMessages(events);

  // Fallback visual: exemplos de mensagens se não houver eventos reais
  const exemplos = [
    {
      id: "exemplo-1",
      message:
        "Você teve 2 SLAs violados hoje. Analise horários e equipe para evitar recorrência.",
      context: "SLA",
    },
    {
      id: "exemplo-2",
      message:
        "Estoque zerado em 1 item. Considere configurar reposição automática.",
      context: "Estoque",
    },
    {
      id: "exemplo-3",
      message:
        "Seu primeiro pedido foi criado! Veja no KDS e acompanhe o fluxo.",
      context: "Onboarding",
    },
  ];

  return (
    <div
      className="mentor-page-container"
      style={{ background: "#fff", color: "#222", minHeight: 300 }}
    >
      <h2 style={{ color: "#222" }}>Mentoria Inteligente</h2>
      <button style={{ marginBottom: 16 }} onClick={popularEventosTeste}>
        Popular eventos de teste
      </button>
      {messages.length === 0 ? (
        <>
          <p style={{ color: "#444", fontWeight: 500 }}>
            Nenhuma sugestão no momento.
          </p>
          <div style={{ marginTop: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Exemplos:</div>
            {exemplos.map((msg) => (
              <div
                key={msg.id}
                className="mentor-message"
                style={{
                  background: "#f7f7f7",
                  color: "#222",
                  marginBottom: 12,
                }}
              >
                <div className="mentor-message-title">{msg.message}</div>
                <div className="mentor-message-context">
                  Contexto: {msg.context}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className="mentor-message">
            <div className="mentor-message-title">{msg.message}</div>
            <div className="mentor-message-context">
              Contexto: {msg.context}
            </div>
            <div className="mentor-message-actions">
              <button>Útil</button>
              <button>Não útil</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
