/**
 * InstallPage — Instalar TPV / KDS como dispositivos com identidade fixa
 *
 * Rota canónica: /admin/devices (Tienda de dispositivos). /app/install redireciona para aqui.
 * Requer restaurante no runtime (login). Cria gm_equipment + installed_modules
 * e guarda identidade local (device_id, restaurant_id, module) para o dispositivo
 * nunca mais perguntar qual é o restaurante.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRestaurantRuntime } from "../context/RestaurantRuntimeContext";
import { dockerCoreClient } from "../infra/docker-core/connection";
import { insertInstalledModule } from "../infra/writers/RuntimeWriter";
import { BackendType, getBackendType } from "../core/infra/backendAdapter";
import { openOperationalInNewWindow } from "../core/operational/openOperationalWindow";
import {
  setInstalledDevice,
  type InstalledDeviceModule,
} from "../core/storage/installedDeviceStorage";
import { setTabIsolated } from "../core/storage/TabIsolatedStorage";
import type { AdminDevice } from "../features/admin/devices/deviceTypes";
import { AdminPageHeader } from "../features/admin/dashboard/components/AdminPageHeader";

const styles = {
  page: {
    minHeight: "100vh",
    padding: 24,
    backgroundColor: "var(--surface-base, #0a0a0a)",
    color: "var(--text-primary, #fafafa)",
    fontFamily: "Inter, system-ui, sans-serif",
    maxWidth: 720,
    margin: "0 auto",
  },
  card: {
    padding: 24,
    borderRadius: 12,
    border: "1px solid var(--surface-border, #262626)",
    backgroundColor: "var(--card-bg-on-dark, var(--surface-elevated, #141414))",
    marginBottom: 24,
  },
  cardTitle: { fontSize: 18, fontWeight: 600, marginBottom: 8 },
  cardDesc: {
    fontSize: 14,
    color: "var(--text-secondary, #a3a3a3)",
    marginBottom: 16,
    lineHeight: 1.5,
  },
  link: { fontSize: 13, color: "#eab308", wordBreak: "break-all" as const },
  section: { marginTop: 20, marginBottom: 12 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-tertiary, #737373)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginBottom: 8,
  },
  instructions: {
    fontSize: 14,
    color: "var(--text-secondary, #d4d4d4)",
    lineHeight: 1.6,
    margin: 0,
  },
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
    color: "var(--text-secondary, #a3a3a3)",
    border: "1px solid var(--surface-border, #404040)",
  },
  input: {
    padding: "12px 14px",
    fontSize: 15,
    border: "1px solid var(--surface-border, #404040)",
    borderRadius: 8,
    background: "var(--surface-elevated, #171717)",
    color: "var(--text-primary, #fafafa)",
    width: "100%",
    maxWidth: 320,
    marginBottom: 16,
  },
  error: { fontSize: 13, color: "#ff6b6b", marginBottom: 12 },
};

export function InstallPage() {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;
  const isDocker = getBackendType() === BackendType.docker;

  const [installing, setInstalling] = useState<InstalledDeviceModule | null>(
    null
  );
  const [deviceNameTpv, setDeviceNameTpv] = useState("");
  const [deviceNameKds, setDeviceNameKds] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<{
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const ev = e as unknown as {
        prompt(): Promise<void>;
        userChoice: Promise<{ outcome: string }>;
      };
      setInstallPrompt(ev);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

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
      const payload = {
        restaurant_id: restaurantId,
        name,
        kind,
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      const { data: equipment, error: eqError } = await dockerCoreClient
        .from("gm_equipment")
        .upsert(payload, { onConflict: "restaurant_id,name" })
        .select("id")
        .single();

      if (eqError || !equipment?.id) {
        throw new Error(
          eqError?.message ?? "Falha ao criar/atualizar dispositivo no Core."
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
      // Persistir restaurant_id para que, ao abrir de novo (raiz ou /op/tpv), FlowGate veja hasLocalOrg e mostre só o TPV.
      if (typeof window !== "undefined") {
        setTabIsolated("chefiapp_restaurant_id", restaurantId);
        window.localStorage.setItem("chefiapp_restaurant_id", restaurantId);
      }

      // Abrir TPV/KDS em janela dedicada (nome fixo = reutiliza a mesma janela = sensação de app instalado)
      if (typeof window !== "undefined") {
        openOperationalInNewWindow(moduleId);
      }
      // Manter o utilizador na página de instalação (pode instalar outro dispositivo)
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
        <AdminPageHeader
          title="Instalar TPV e KDS"
          subtitle="Para instalar um dispositivo (TPV ou KDS), é necessário ter um restaurante associado. Faça login e escolha o restaurante no portal."
        />
        <Link to="/dashboard" style={{ ...styles.btn, ...styles.btnPrimary }}>
          Ir para o Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <AdminPageHeader
        title="Instalar TPV e KDS"
        subtitle="Instale este browser como TPV (Caixa) ou KDS (Cozinha). O dispositivo fica ligado a este restaurante e deixa de perguntar qual é o restaurante."
      />

      {error && <p style={styles.error}>{error}</p>}

      {/* Instalar aplicação no ambiente de trabalho (ícone no desktop) */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Ícone no ambiente de trabalho</h2>
        <p style={styles.cardDesc}>
          Para ter o TPV como aplicação (ícone no desktop ou ecrã inicial),
          instale a aplicação. Ao abrir o ícone, o TPV abre diretamente sem
          barra do navegador.
        </p>
        {installPrompt ? (
          <button
            type="button"
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={async () => {
              if (!installPrompt) return;
              installPrompt.prompt();
              await installPrompt.userChoice;
              setInstallPrompt(null);
            }}
          >
            Instalar no ambiente de trabalho
          </button>
        ) : (
          <p style={{ fontSize: 13, color: "var(--text-secondary, #a3a3a3)", margin: 0 }}>
            Em localhost o ícone pode não estar disponível. Use o menu do browser
            (⋮ no Chrome) → &quot;Instalar ChefIApp&quot; ou &quot;Adicionar ao ecrã
            inicial&quot; para criar o ícone no ambiente de trabalho. Em produção
            (HTTPS) o botão &quot;Instalar no ambiente de trabalho&quot; aparece
            aqui quando disponível.
          </p>
        )}
      </div>

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
            color: "var(--text-secondary, #a3a3a3)",
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
            color: "var(--text-secondary, #a3a3a3)",
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
        <div style={styles.sectionTitle}>Abrir dispositivo em janela dedicada</div>
        <p style={styles.instructions}>
          Para usar o TPV ou KDS como dispositivo dedicado (fora da web de
          configuração), abra numa nova janela. O dispositivo não voltará a
          pedir o restaurante.
        </p>
        <button
          type="button"
          style={{ ...styles.btn, ...styles.btnSecondary }}
          onClick={() => openOperationalInNewWindow("tpv")}
        >
          Abrir TPV em nova janela
        </button>
        <button
          type="button"
          style={{ ...styles.btn, ...styles.btnSecondary }}
          onClick={() => openOperationalInNewWindow("kds")}
        >
          Abrir KDS em nova janela
        </button>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Como usar depois</div>
        <p style={styles.instructions}>
          Use &quot;Instalar no ambiente de trabalho&quot; para criar um ícone
          no desktop (ou ecrã inicial no telemóvel). Ao abrir o ícone, o TPV
          abre diretamente. Alternativa: &quot;Abrir TPV/KDS em nova janela&quot;
          abre no browser. Para outro dispositivo, volte aqui com o mesmo
          utilizador e restaurante.
        </p>
      </div>
    </div>
  );
}
