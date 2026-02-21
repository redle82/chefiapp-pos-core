import { useEffect, useState } from "react";
// LEGACY / LAB — blocked in Docker mode
import { motion } from "framer-motion";
import { db } from "../../core/db";
import { FiscalQueue } from "../../core/fiscal/FiscalQueueWorker";
import { SyncEngine, type SyncEngineState } from "../../core/sync/SyncEngine";
import styles from "./SystemHealthCard.module.css";

interface HealthState {
  status:
    | "ONLINE"
    | "CRITICAL"
    | "WARNING"
    | "RECOVERED"
    | "RECOVERY"
    | "OFFLINE"
    | "SYNCING";
  message: string;
  details?: string;
  metadata?: any;
}

export const SystemHealthCard = ({
  restaurantId,
}: {
  restaurantId: string;
}) => {
  const [health, setHealth] = useState<HealthState>({
    status: "ONLINE",
    message: "Sistema Operacional",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;

    // Local State Trackers
    let syncState: SyncEngineState = {
      isProcessing: false,
      networkStatus: navigator.onLine ? "online" : "offline",
      pendingCount: 0,
    };
    let fiscalPending = 0;

    const updateHealth = () => {
      // Priority 1: Network / Sync Status
      if (syncState.networkStatus === "offline") {
        setHealth({
          status: "OFFLINE",
          message: "Modo Offline Ativo",
          details:
            "O sistema está operando localmente. Alterações serão sincronizadas quando a conexão retornar.",
        });
        return;
      }

      if (syncState.isProcessing) {
        setHealth({
          status: "SYNCING",
          message: "Sincronizando Dados",
          details: `Processando ${syncState.pendingCount} itens pendentes...`,
        });
        return;
      }

      // Priority 2: Fiscal Compliance
      if (fiscalPending > 0) {
        setHealth({
          status: "WARNING",
          message: "Pendências Fiscais",
          details: `Existem ${fiscalPending} faturas aguardando assinatura fiscal.`,
        });
        return;
      }

      // Priority 3: Cloud Intelligence (Alerts/Recovery)
      checkCloudHealth();
    };

    const checkCloudHealth = async () => {
      try {
        // 1. Check for Recovery Mode Pulse (Most recent)
        const { data: pulses } = await db
          .from("empire_pulses")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .order("created_at", { ascending: false })
          .limit(5);

        const isRecovery = pulses?.some(
          (p: Record<string, any>) => p.type === "SYSTEM_RECOVERY_MODE",
        );

        // 2. Check for Active Alerts
        const { data: alerts } = await db
          .from("alerts")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .is("resolved_at", null)
          .order("created_at", { ascending: false });

        if (isRecovery) {
          const recoveryPulse = pulses?.find(
            (p: Record<string, any>) => p.type === "SYSTEM_RECOVERY_MODE",
          );
          setHealth({
            status: "RECOVERY",
            message: "Modo de Recuperação Ativo",
            details: `O sistema está mitigando instabilidades detectadas.`,
            metadata: recoveryPulse?.payload,
          });
        } else if (alerts && alerts.length > 0) {
          const alert = alerts[0];
          // OPERATIONAL_ALERTS_CONTRACT: critical = bloqueio/verdade; só mostrar CRITICAL quando severity === "critical"
          const status: HealthState["status"] =
            alert.severity === "critical" ? "CRITICAL" : "WARNING";

          setHealth({
            status,
            message: alert.message || "Alerta de Sistema Ativo",
            details:
              alert.alert_type === "ALERT_NO_PULSE"
                ? "Silêncio Operacional detectado."
                : "Instabilidade detectada.",
            metadata: alert.metadata,
          });
        } else {
          // Default Healthy
          setHealth({
            status: "ONLINE",
            message: "Sistema Operacional",
            details: "Todos os serviços ativos e sincronizados.",
          });
        }
      } catch (e) {
        console.error("Health check failed", e);
      } finally {
        setLoading(false);
      }
    };

    // Subscriptions
    const unsubSync = SyncEngine.subscribe((state) => {
      syncState = state;
      updateHealth();
    });

    const unsubFiscal = FiscalQueue.subscribe((count) => {
      fiscalPending = count;
      updateHealth();
    });

    // Cloud Subscription
    const channel = db
      .channel("health-widget-v1.2")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alerts",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => checkCloudHealth(),
      )
      .subscribe();

    // Initial sanity check
    checkCloudHealth();

    return () => {
      unsubSync();
      unsubFiscal();
      db.removeChannel(channel);
    };
  }, [restaurantId]);

  if (loading) return <div className={styles.loadingSkeleton} />;

  const colors = {
    CRITICAL: {
      bg: "rgba(255, 69, 58, 0.1)",
      border: "rgba(255, 69, 58, 0.3)",
      dot: "#ff453a",
      glow: "rgba(255, 69, 58, 0.4)",
    },
    WARNING: {
      bg: "rgba(255, 214, 10, 0.1)",
      border: "rgba(255, 214, 10, 0.3)",
      dot: "#ffd60a",
      glow: "rgba(255, 214, 10, 0.4)",
    },
    ONLINE: {
      bg: "rgba(50, 215, 75, 0.1)",
      border: "rgba(50, 215, 75, 0.3)",
      dot: "#32d74b",
      glow: "rgba(50, 215, 75, 0.5)",
    },
    RECOVERED: {
      bg: "rgba(50, 215, 75, 0.1)",
      border: "rgba(50, 215, 75, 0.3)",
      dot: "#32d74b",
      glow: "none",
    },
    RECOVERY: {
      bg: "rgba(10, 132, 255, 0.1)",
      border: "rgba(10, 132, 255, 0.3)",
      dot: "#0a84ff",
      glow: "rgba(10, 132, 255, 0.6)",
    },
    OFFLINE: {
      bg: "rgba(255, 69, 58, 0.1)",
      border: "rgba(255, 69, 58, 0.3)",
      dot: "#ff453a",
      glow: "none",
    },
    SYNCING: {
      bg: "rgba(255, 159, 10, 0.1)",
      border: "rgba(255, 159, 10, 0.3)",
      dot: "#ff9f0a",
      glow: "rgba(255, 159, 10, 0.6)",
    },
  };

  const config = colors[health.status] || colors.ONLINE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.container}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <div className={styles.leftContent}>
        <motion.div
          animate={
            health.status === "RECOVERY" || health.status === "SYNCING"
              ? { scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }
              : health.status === "OFFLINE"
              ? { opacity: 0.5 }
              : { opacity: [0.5, 1, 0.5] }
          }
          transition={{
            repeat: Infinity,
            duration:
              health.status === "RECOVERY" || health.status === "SYNCING"
                ? 1.5
                : 2,
          }}
          className={styles.statusDot}
          style={{
            background: config.dot,
            boxShadow: `0 0 12px ${config.glow}`,
          }}
        />

        <div>
          <h3 className={styles.title}>{health.message}</h3>
          <p className={styles.details}>{health.details}</p>
        </div>
      </div>

      <div className={styles.rightContent}>
        <span className={styles.engineLabel}>ENGINE CORE v1.1</span>
        <span className={styles.statusLabel} style={{ color: config.dot }}>
          {health.status === "ONLINE"
            ? "ONLINE"
            : health.status === "OFFLINE"
            ? "OFFLINE"
            : health.status === "SYNCING"
            ? "SYNCING..."
            : health.status === "RECOVERY"
            ? "RECOVERY"
            : health.status === "WARNING"
            ? "ALERTA"
            : "OBSERVANDO"}
        </span>
      </div>

      {/* Subtle progress/scan effect if not online */}
      {health.status !== "ONLINE" && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className={styles.scanLine}
          style={{
            background: `linear-gradient(90deg, transparent, ${config.dot}, transparent)`,
          }}
        />
      )}
    </motion.div>
  );
};
