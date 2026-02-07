/**
 * InstallPage — Instalar TPV / KDS como dispositivos com identidade fixa
 *
 * /app/install — Escolher "Instalar como TPV" ou "Instalar como KDS".
 * Requer restaurante no runtime (login). Cria gm_equipment + installed_modules
 * e guarda identidade local (device_id, restaurant_id, module) para o dispositivo
 * nunca mais perguntar qual é o restaurante.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRestaurantRuntime } from "../context/RestaurantRuntimeContext";
import { dockerCoreClient } from "../core-boundary/docker-core/connection";
import { insertInstalledModule } from "../core-boundary/writers/RuntimeWriter";
import { BackendType, getBackendType } from "../core/infra/backendAdapter";
import {
  setInstalledDevice,
  type InstalledDeviceModule,
} from "../core/storage/installedDeviceStorage";
import type { AdminDevice } from "../features/admin/devices/deviceTypes";

const styles = {
  page: {
    minHeight: "100vh",
    padding: 24,
    backgroundColor: "#0a0a0a",
    color: "#fafafa",
    fontFamily: "Inter, system-ui, sans-serif",
    maxWidth: 720,
    margin: "0 auto",
  },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 8 },
  subtitle: {
    fontSize: 15,
    color: "#a3a3a3",
    marginBottom: 32,
    lineHeight: 1.5,
  },
  card: {
    padding: 24,
    borderRadius: 12,
    border: "1px solid #262626",
    backgroundColor: "#141414",
    marginBottom: 24,
  },
  cardTitle: { fontSize: 18, fontWeight: 600, marginBottom: 8 },
  cardDesc: {
    fontSize: 14,
    color: "#a3a3a3",
    marginBottom: 16,
    lineHeight: 1.5,
  },
  link: { fontSize: 13, color: "#eab308", wordBreak: "break-all" as const },
  section: { marginTop: 20, marginBottom: 12 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#737373",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginBottom: 8,
  },
  instructions: { fontSize: 14, color: "#d4d4d4", lineHeight: 1.6, margin: 0 },
  btn: {
    display: "inline-block",
    padding: "12px 20px",
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    marginTop: 16,
    marginRight: 12,
  },
  btnPrimary: { backgroundColor: "#eab308", color: "#0a0a0a" },
  btnSecondary: {
    backgroundColor: "transparent",
    color: "#a3a3a3",
    border: "1px solid #404040",
  },
  input: {
    padding: "12px 14px",
    fontSize: 15,
    border: "1px solid #404040",
    borderRadius: 8,
    background: "#171717",
    color: "#fafafa",
    width: "100%",
    maxWidth: 320,
    marginBottom: 16,
  },
  error: { fontSize: 13, color: "#ff6b6b", marginBottom: 12 },
};

export function InstallPage() {
  const { runtime } = useRestaurantRuntime();
  const navigate = useNavigate();
  const restaurantId = runtime?.restaurant_id ?? null;
  const isDocker = getBackendType() === BackendType.docker;

  const [installing, setInstalling] = useState<InstalledDeviceModule | null>(
    null
  );
  const [deviceNameTpv, setDeviceNameTpv] = useState("");
  const [deviceNameKds, setDeviceNameKds] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleInstall(moduleId: InstalledDeviceModule) {
    if (!restaurantId || !isDocker) {
      setError(
        "Requer restaurante e Core Docker. Faça login e escolha o restaurante."
      );
      return;
    }
    const defaultName = moduleId === "tpv" ? "TPV_BALCAO_01" : "KDS_COZINHA_01";
    const name =
      (moduleId === "tpv" ? deviceNameTpv : deviceNameKds).trim() ||
      defaultName;
    setError(null);
    setInstalling(moduleId);
    try {
      const kind = moduleId === "tpv" ? "TPV" : "KDS";
      const { data: equipment, error: eqError } = await dockerCoreClient
        .from("gm_equipment")
        .insert({
          restaurant_id: restaurantId,
          name,
          kind,
          is_active: true,
        })
        .select("id")
        .single();

      if (eqError || !equipment?.id) {
        throw new Error(
          eqError?.message ?? "Falha ao criar dispositivo no Core."
        );
      }

      const { error: modError } = await insertInstalledModule(
        restaurantId,
        moduleId,
        moduleId === "tpv" ? "TPV" : "KDS"
      );
      if (modError) {
        throw new Error(modError);
      }

      const installed: AdminDevice = {
        device_id: equipment.id,
        restaurant_id: restaurantId,
        module_id: moduleId,
        device_name: name,
      } as any;

      // Persist using legacy storage contract; AdminDevice fornece semântica
      // mais rica para a camada de admin, mas aqui mantemos o formato esperado.
      setInstalledDevice(installed as any);

      navigate(moduleId === "tpv" ? "/op/tpv" : "/op/kds", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao instalar dispositivo."
      );
    } finally {
      setInstalling(null);
    }
  }

  if (!restaurantId) {
    return (
      <div style={styles.page}>
        <h1 style={styles.title}>Instalar TPV e KDS</h1>
        <p style={styles.subtitle}>
          Para instalar um dispositivo (TPV ou KDS), é necessário ter um
          restaurante associado. Faça login e escolha o restaurante no portal.
        </p>
        <Link to="/dashboard" style={{ ...styles.btn, ...styles.btnPrimary }}>
          Ir para o Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Instalar TPV e KDS</h1>
      <p style={styles.subtitle}>
        Instale este browser como TPV (Caixa) ou KDS (Cozinha). O dispositivo
        fica ligado a este restaurante e deixa de perguntar qual é o
        restaurante.
      </p>

      {error && <p style={styles.error}>{error}</p>}

      {/* Card TPV */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>TPV (Caixa)</h2>
        <p style={styles.cardDesc}>
          Este dispositivo passará a ser o TPV deste restaurante. Produtos e
          pedidos usam este restaurante.
        </p>
        <label
          style={{
            display: "block",
            marginBottom: 8,
            fontSize: 13,
            color: "#a3a3a3",
          }}
        >
          Nome do dispositivo (ex: TPV_BALCAO_01)
        </label>
        <input
          type="text"
          style={styles.input}
          placeholder="TPV_BALCAO_01"
          value={deviceNameTpv}
          onChange={(e) => setDeviceNameTpv(e.target.value)}
          disabled={!!installing}
        />
        <button
          type="button"
          style={{ ...styles.btn, ...styles.btnPrimary }}
          onClick={() => handleInstall("tpv")}
          disabled={!!installing}
        >
          {installing === "tpv" ? "A instalar…" : "Instalar como TPV"}
        </button>
      </div>

      {/* Card KDS */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>KDS (Cozinha)</h2>
        <p style={styles.cardDesc}>
          Este dispositivo passará a ser o KDS deste restaurante. Verá os
          pedidos criados no TPV.
        </p>
        <label
          style={{
            display: "block",
            marginBottom: 8,
            fontSize: 13,
            color: "#a3a3a3",
          }}
        >
          Nome do dispositivo (ex: KDS_COZINHA_01)
        </label>
        <input
          type="text"
          style={styles.input}
          placeholder="KDS_COZINHA_01"
          value={deviceNameKds}
          onChange={(e) => setDeviceNameKds(e.target.value)}
          disabled={!!installing}
        />
        <button
          type="button"
          style={{ ...styles.btn, ...styles.btnPrimary }}
          onClick={() => handleInstall("kds")}
          disabled={!!installing}
        >
          {installing === "kds" ? "A instalar…" : "Instalar como KDS"}
        </button>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Como usar depois</div>
        <p style={styles.instructions}>
          Depois de instalar, abra <strong>/op/tpv</strong> ou{" "}
          <strong>/op/kds</strong>. O dispositivo não voltará a pedir o
          restaurante. Para instalar noutro browser ou dispositivo, volte a esta
          página com o mesmo utilizador e restaurante.
        </p>
      </div>
    </div>
  );
}
