import React from "react";
import { useOperatorSession } from "../AppStaff/context/OperatorSessionContext";
import type { OperatorSession } from "../AppStaff/context/StaffCoreTypes";

type ControlRoomSession = OperatorSession;

export const ControlRoomPage: React.FC = () => {
  // MVP: reutiliza a sessão atual como exemplo; no futuro, virá de uma fonte
  // agregada (websocket/polling).
  const { session } = useOperatorSession();
  const sessions: ControlRoomSession[] = [session];

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        backgroundColor: "#020617",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#6b7280",
            }}
          >
            Sala de controlo
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: 0,
              color: "#f9fafb",
            }}
          >
            Sessions ativas por operador
          </h1>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#9ca3af",
          }}
        >
          MVP — leitura apenas, 1 sessão local (mock)
        </div>
      </header>

      <main>
        {sessions.length === 0 ? (
          <div
            style={{
              borderRadius: 12,
              padding: 24,
              border: "1px dashed rgba(148,163,184,0.6)",
              background:
                "radial-gradient(circle at top left, rgba(15,23,42,0.9), rgba(15,23,42,0.6))",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🛰️</div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: "#e5e7eb",
                marginBottom: 4,
              }}
            >
              Nenhuma sessão ativa
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af" }}>
              Quando operadores estiverem ligados nos seus dispositivos, as
              sessões aparecem aqui em tempo real.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {sessions.map((s, idx) => {
              const roleLabel = s.role;
              const appLabel = s.activeApp;
              const lastSeen = new Date(s.lastSeenAt).toLocaleTimeString();

              const status: "ok" | "alert" = "ok";

              return (
                <article
                  key={idx}
                  style={{
                    borderRadius: 14,
                    padding: 16,
                    border: "1px solid rgba(148,163,184,0.4)",
                    background:
                      "radial-gradient(circle at top left, #020617, #020617)",
                    boxShadow:
                      "0 18px 45px rgba(15,23,42,0.66), 0 0 0 1px rgba(15,23,42,0.9)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "#6b7280",
                        }}
                      >
                        {roleLabel}
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#e5e7eb",
                        }}
                      >
                        {s.operatorId ?? "Operador anónimo"}
                      </div>
                    </div>
                    <div
                      style={{
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 11,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor:
                          status === "ok"
                            ? "rgba(22,163,74,0.16)"
                            : "rgba(220,38,38,0.16)",
                        color:
                          status === "ok" ? "rgb(74,222,128)" : "rgb(252,165,165)",
                        border:
                          status === "ok"
                            ? "1px solid rgba(34,197,94,0.5)"
                            : "1px solid rgba(248,113,113,0.5)",
                      }}
                    >
                      <span style={{ fontSize: 9 }}>
                        {status === "ok" ? "●" : "▲"}
                      </span>
                      <span>{status === "ok" ? "OK" : "Alerta"}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "#9ca3af",
                    }}
                  >
                    <div>
                      <div style={{ opacity: 0.8 }}>App ativa</div>
                      <div style={{ color: "#e5e7eb", marginTop: 2 }}>
                        {appLabel}
                      </div>
                    </div>
                    <div>
                      <div style={{ opacity: 0.8 }}>Modo de ecrã</div>
                      <div style={{ color: "#e5e7eb", marginTop: 2 }}>
                        {s.screenMode}
                      </div>
                    </div>
                    <div>
                      <div style={{ opacity: 0.8 }}>Visto por último</div>
                      <div style={{ color: "#e5e7eb", marginTop: 2 }}>
                        {lastSeen}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      paddingTop: 8,
                      borderTop: "1px dashed rgba(55,65,81,0.8)",
                      fontSize: 11,
                      color: "#6b7280",
                    }}
                  >
                    Sessão local mockada — futuras versões vão agregar múltiplos
                    operadores e devices em tempo real.
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

