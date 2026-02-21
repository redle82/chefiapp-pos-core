// @ts-nocheck
import React from "react";
import { useOperatorSession } from "../AppStaff/context/OperatorSessionContext";
import type { OperatorSession } from "../AppStaff/context/StaffCoreTypes";
import styles from "./ControlRoomPage.module.css";

type ControlRoomSession = OperatorSession;

export const ControlRoomPage: React.FC = () => {
  // MVP: reutiliza a sessão atual como exemplo; no futuro, virá de uma fonte
  // agregada (websocket/polling).
  const { session } = useOperatorSession();
  const sessions: ControlRoomSession[] = [session];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <div className={styles.headerLabel}>Sala de controlo</div>
          <h1 className={styles.headerTitle}>Sessions ativas por operador</h1>
        </div>
        <div className={styles.headerNote}>
          MVP — leitura apenas, 1 sessão local (mock)
        </div>
      </header>

      <main>
        {sessions.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🛰️</div>
            <div className={styles.emptyTitle}>Nenhuma sessão ativa</div>
            <div className={styles.emptyDescription}>
              Quando operadores estiverem ligados nos seus dispositivos, as
              sessões aparecem aqui em tempo real.
            </div>
          </div>
        ) : (
          <div className={styles.sessionsGrid}>
            {sessions.map((s, idx) => {
              const roleLabel = s.role;
              const appLabel = s.activeApp;
              const lastSeen = new Date(s.lastSeenAt).toLocaleTimeString();

              const status: "ok" | "alert" = "ok";

              return (
                <article key={idx} className={styles.sessionCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderInfo}>
                      <div className={styles.roleLabel}>{roleLabel}</div>
                      <div className={styles.operatorName}>
                        {s.operatorId ?? "Operador anónimo"}
                      </div>
                    </div>
                    <div className={styles.statusBadge} data-status={status}>
                      <span className={styles.statusIcon}>
                        {status === "ok" ? "●" : "▲"}
                      </span>
                      <span>{status === "ok" ? "OK" : "Alerta"}</span>
                    </div>
                  </div>

                  <div className={styles.metadata}>
                    <div>
                      <div className={styles.metadataLabel}>App ativa</div>
                      <div className={styles.metadataValue}>{appLabel}</div>
                    </div>
                    <div>
                      <div className={styles.metadataLabel}>Modo de ecrã</div>
                      <div className={styles.metadataValue}>{s.screenMode}</div>
                    </div>
                    <div>
                      <div className={styles.metadataLabel}>
                        Visto por último
                      </div>
                      <div className={styles.metadataValue}>{lastSeen}</div>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
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
