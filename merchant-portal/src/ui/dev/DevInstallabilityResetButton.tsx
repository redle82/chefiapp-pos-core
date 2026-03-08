import { useMemo, useState } from "react";
import { resetBrowserInstallability } from "../../core/pwa/resetBrowserInstallability";

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  );
}

export function DevInstallabilityResetButton() {
  const [running, setRunning] = useState(false);

  const visible = useMemo(() => {
    if (typeof window === "undefined") return false;
    return import.meta.env.DEV || isLocalHostname(window.location.hostname);
  }, []);

  if (!visible) return null;

  const handleClick = async () => {
    setRunning(true);
    await resetBrowserInstallability();
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={() => {
        void handleClick();
      }}
      disabled={running}
      title="Limpa SW/cache/localStorage e recarrega"
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 100000,
        border: "1px solid #4b5563",
        background: "#111827",
        color: "#e5e7eb",
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 11,
        fontWeight: 600,
        cursor: running ? "default" : "pointer",
        opacity: running ? 0.7 : 1,
      }}
    >
      {running ? "Resetando..." : "DEV: Reset PWA Cache"}
    </button>
  );
}
