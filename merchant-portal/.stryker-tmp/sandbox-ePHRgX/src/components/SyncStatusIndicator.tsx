// @ts-nocheck
import React from "react";
import { useOfflineOrder } from "../pages/TPV/context/OfflineOrderContext";
import styles from "./SyncStatusIndicator.module.css";

export const SyncStatusIndicator: React.FC = () => {
  const { isOffline, pendingCount, forceSync, isSyncing } = useOfflineOrder();

  const containerClassName = `${styles.container} ${
    pendingCount > 0
      ? styles.pending
      : isOffline
      ? styles.offline
      : styles.online
  } ${pendingCount > 0 && !isSyncing ? styles.clickable : ""}`;
  const dotClassName = `${styles.dot} ${
    pendingCount > 0
      ? styles.dotPending
      : isOffline
      ? styles.dotOffline
      : styles.dotOnline
  }`;

  if (pendingCount > 0) {
    // Pending State
    return (
      <div
        className={containerClassName}
        onClick={!isSyncing ? forceSync : undefined}
        title={isSyncing ? "Syncing..." : "Click to force sync"}
      >
        <div className={dotClassName} />
        <span>{isSyncing ? "Syncing..." : `${pendingCount} Pending`}</span>
        {isSyncing && <span className={styles.syncingIcon}>⏳</span>}
      </div>
    );
  }

  if (isOffline) {
    // Offline State
    return (
      <div className={containerClassName}>
        <div className={dotClassName} />
        <span>OFFLINE</span>
      </div>
    );
  }

  // Online & Synced State
  return (
    <div className={containerClassName}>
      <div className={dotClassName} />
      <span className={styles.onlineText}>ONLINE</span>
    </div>
  );
};
