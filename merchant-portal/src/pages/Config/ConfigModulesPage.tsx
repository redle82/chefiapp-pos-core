/**
 * ConfigModulesPage - Página de Módulos Instalados
 *
 * Mostra módulos disponíveis e permite instalar/desinstalar
 */

import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../context/RestaurantRuntimeContext";
import { useRestaurantId } from "../../core/hooks/useRestaurantId";
import { BackendType, getBackendType } from "../../core/infra/backendAdapter";
import { tpvInstaller } from "../../core/modules/tpv/TPVInstaller";
import type { HealthStatus } from "../../core/modules/types";
import {
  getModulesEnabled,
  setModulesEnabled,
  type ModulesEnabled,
} from "../../core/storage/modulesConfigStorage";
// Auth only — temporary until Core Auth (session)
import { db } from "../../core/db";
import styles from "./ConfigModulesPage.module.css";

// LEGACY: Supabase client removed — Docker Core only
const supabase = null as any;

interface InstalledModule {
  id: string;
  moduleId: string;
  moduleName: string;
  version: string;
  status: string;
  installedAt: Date;
}

export function ConfigModulesPage() {
  const {
    runtime,
    installModule: runtimeInstallModule,
    refresh,
  } = useRestaurantRuntime();
  const { restaurantId: runtimeRestaurantId } = useRestaurantId();
  const [modules, setModules] = useState<InstalledModule[]>([]);
  const isDocker = getBackendType() === BackendType.docker;
  const [availableModules] = useState([
    {
      id: "tpv",
      name: "TPV (Point of Sale)",
      description: "Sistema de vendas e caixa",
      icon: "💳",
    },
    {
      id: "kds",
      name: "KDS",
      description: "Kitchen Display System",
      icon: "👨‍🍳",
    },
    {
      id: "reservations",
      name: "Reservations",
      description: "Sistema de reservas",
      icon: "📅",
    },
    {
      id: "bank_hours",
      name: "Bank of Hours",
      description: "Banco de horas",
      icon: "⏰",
    },
    {
      id: "purchases",
      name: "Purchases",
      description: "Compras automáticas",
      icon: "🛒",
    },
    {
      id: "stock_automation",
      name: "Stock Automation",
      description: "Automação de estoque",
      icon: "🤖",
    },
  ]);
  const [installing, setInstalling] = useState<string | null>(null);
  const [healthStatuses, setHealthStatuses] = useState<
    Record<string, HealthStatus>
  >({});
  const [restaurantId, setRestaurantId] = useState<string>("");
  const restaurantIdForFetch =
    runtime?.restaurant_id ?? runtimeRestaurantId ?? "";
  // FASE 1 Passo 2: preferência TPV/KDS ativo (localStorage até haver backend)
  const ridForModules =
    restaurantIdForFetch ||
    (typeof window !== "undefined"
      ? localStorage.getItem("chefiapp_restaurant_id")
      : null) ||
    "";
  const [modulesEnabled, setModulesEnabledState] = useState<ModulesEnabled>(
    () => getModulesEnabled(ridForModules),
  );

  useEffect(() => {
    setModulesEnabledState(getModulesEnabled(ridForModules || null));
  }, [ridForModules]);

  const handleToggleModuleEnabled = (
    key: keyof ModulesEnabled,
    value: boolean,
  ) => {
    const next = { ...modulesEnabled, [key]: value };
    setModulesEnabledState(next);
    setModulesEnabled(ridForModules || null, next);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (getBackendType() === BackendType.docker) {
          const rid =
            restaurantIdForFetch ||
            (typeof window !== "undefined"
              ? localStorage.getItem("chefiapp_restaurant_id")
              : null);
          if (rid) setRestaurantId(rid);
          setModules([]);
          return;
        }

        // Buscar restaurant_id (apenas quando backend não é Docker)
        const {
          data: { session },
        } = await db.auth.getSession();
        if (!session) return;

        const { data: profile } = await db
          .from("profiles")
          .select("restaurant_id")
          .eq("id", session.user.id)
          .single();

        const rid = profile?.restaurant_id;
        if (!rid) return;

        setRestaurantId(rid);

        const { data: installed, error } = await supabase
          .from("installed_modules")
          .select("*")
          .eq("restaurant_id", rid);

        if (error) throw error;

        setModules(
          (installed || []).map((m: Record<string, any>) => ({
            id: m.id,
            moduleId: m.module_id,
            moduleName: m.module_name,
            version: m.version,
            status: m.status,
            installedAt: new Date(m.installed_at),
          })),
        );

        const healthMap: Record<string, HealthStatus> = {};
        for (const module of availableModules) {
          if (module.id === "tpv") {
            const health = await tpvInstaller.health(rid);
            healthMap[module.id] = health;
          }
        }
        setHealthStatuses(healthMap);
      } catch (error) {
        console.error("Error fetching modules:", error);
      }
    };

    fetchData();
  }, [restaurantIdForFetch]);

  const isInstalled = (moduleId: string) => {
    if (isDocker && runtime?.installed_modules) {
      return runtime.installed_modules.includes(moduleId);
    }
    return modules.some(
      (m) => m.moduleId === moduleId && m.status === "active",
    );
  };

  const handleInstall = async (moduleId: string) => {
    const backendIsDocker = getBackendType() === BackendType.docker;
    const rid = backendIsDocker ? runtime?.restaurant_id : restaurantId;
    if (!rid) {
      alert("Restaurante não encontrado");
      return;
    }

    setInstalling(moduleId);
    try {
      if (backendIsDocker) {
        await runtimeInstallModule(moduleId);
        await refresh();
        alert(
          `${moduleId === "tpv" ? "TPV" : moduleId} instalado com sucesso!`,
        );
      } else if (moduleId === "tpv") {
        const result = await tpvInstaller.install(rid);
        if (result.success) {
          alert("TPV instalado com sucesso!");
          window.location.reload();
        } else {
          alert(`Erro: ${result.message}`);
        }
      } else {
        alert(`Instalação de ${moduleId} ainda não implementada`);
      }
    } catch (error) {
      console.error("Error installing module:", error);
      alert(
        `Erro ao instalar módulo: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      setInstalling(null);
    }
  };

  const handleUninstall = async (moduleId: string) => {
    if (isDocker) {
      alert(
        "Desinstalação de módulos em modo Docker ainda não disponível. Os módulos instalados permanecem ativos.",
      );
      return;
    }
    if (!restaurantId) return;
    if (!confirm(`Tem certeza que deseja desinstalar ${moduleId}?`)) return;

    try {
      if (moduleId === "tpv") {
        const result = await tpvInstaller.uninstall(restaurantId);
        if (result.success) {
          alert("TPV desinstalado com sucesso!");
          window.location.reload();
        } else {
          alert(`Erro: ${result.message}`);
        }
      } else {
        alert(`Desinstalação de ${moduleId} ainda não implementada`);
      }
    } catch (error) {
      console.error("Error uninstalling module:", error);
      alert(`Erro ao desinstalar módulo: ${error}`);
    }
  };

  const getHealthStatus = (moduleId: string) => {
    return healthStatuses[moduleId];
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Módulos Instalados</h1>
        <p className={styles.headerSub}>
          Instale e gerencie módulos do sistema
        </p>
      </div>

      {/* FASE 1 Passo 2: TPV/KDS ativo (preferência Dono) */}
      <div className={styles.operationalSection}>
        <h2 className={styles.operationalTitle}>Módulos operacionais</h2>
        <p className={styles.operationalDesc}>
          Ative ou desative o TPV e o KDS para este restaurante.
        </p>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={modulesEnabled.tpv}
            onChange={(e) => handleToggleModuleEnabled("tpv", e.target.checked)}
          />
          <span>TPV ativo</span>
        </label>
        <label className={styles.checkboxLabelLast}>
          <input
            type="checkbox"
            checked={modulesEnabled.kds}
            onChange={(e) => handleToggleModuleEnabled("kds", e.target.checked)}
          />
          <span>KDS ativo</span>
        </label>
      </div>

      <div className={styles.moduleList}>
        {availableModules.map((module) => {
          const installed = isInstalled(module.id);
          const health = getHealthStatus(module.id);

          return (
            <div key={module.id} className={styles.moduleCard}>
              <div className={styles.moduleContent}>
                <div className={styles.moduleHeader}>
                  <span className={styles.moduleIcon}>{module.icon}</span>
                  <div>
                    <h3 className={styles.moduleName}>{module.name}</h3>
                    <p className={styles.moduleDesc}>{module.description}</p>
                  </div>
                </div>

                {installed && (
                  <div className={styles.moduleMetaRow}>
                    {modules.find((m) => m.moduleId === module.id) && (
                      <>
                        <span>
                          Versão:{" "}
                          {
                            modules.find((m) => m.moduleId === module.id)!
                              .version
                          }
                        </span>
                        <span>
                          Instalado em:{" "}
                          {modules
                            .find((m) => m.moduleId === module.id)!
                            .installedAt.toLocaleDateString()}
                        </span>
                      </>
                    )}
                    {health && (
                      <span
                        className={styles.healthBadge}
                        data-health={health.health}
                      >
                        Saúde: {health.health}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                {installed ? (
                  <button
                    onClick={() => handleUninstall(module.id)}
                    className={styles.uninstallBtn}
                  >
                    Desinstalar
                  </button>
                ) : (
                  <button
                    onClick={() => handleInstall(module.id)}
                    disabled={installing === module.id}
                    className={styles.installBtn}
                    data-installing={installing === module.id}
                  >
                    {installing === module.id ? "Instalando..." : "Instalar"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
