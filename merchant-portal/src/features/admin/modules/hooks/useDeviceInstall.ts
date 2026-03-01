/**
 * useDeviceInstall — Hook reutilizável para instalar TPV/KDS como dispositivo.
 *
 * Extraído de InstallPage.tsx para poder ser usado tanto na página de dispositivos
 * como diretamente no Hub Módulos.
 *
 * Fluxo: cria/atualiza gm_equipment → insere installed_module → persiste identidade local.
 */

import { useCallback, useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import {
  BackendType,
  getBackendType,
} from "../../../../core/infra/backendAdapter";
import {
  getInstalledDevice,
  setInstalledDevice,
  type InstalledDeviceModule,
} from "../../../../core/storage/installedDeviceStorage";
import { setTabIsolated } from "../../../../core/storage/TabIsolatedStorage";
import { dockerCoreClient } from "../../../../infra/docker-core/connection";
import { insertInstalledModule } from "../../../../infra/writers/RuntimeWriter";

export interface UseDeviceInstallReturn {
  /** Módulo que está a ser instalado agora (null = idle) */
  installing: InstalledDeviceModule | null;
  /** Erro da última tentativa */
  error: string | null;
  /** Se já existe dispositivo instalado localmente */
  hasLocalDevice: boolean;
  /** Módulo do dispositivo local (se existir) */
  localDeviceModule: InstalledDeviceModule | null;
  /** Se o PWA install prompt está disponível */
  canInstallPwa: boolean;
  /** Dispara a instalação PWA no desktop */
  triggerPwaInstall: () => Promise<void>;
  /** Instala o dispositivo (gm_equipment + identity + abre janela) */
  installDevice: (
    moduleId: InstalledDeviceModule,
    deviceName?: string,
  ) => Promise<boolean>;
}

export function useDeviceInstall(): UseDeviceInstallReturn {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;
  const isDocker = getBackendType() === BackendType.docker;

  const [installing, setInstalling] = useState<InstalledDeviceModule | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<{
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  } | null>(null);

  const localDevice = getInstalledDevice();
  const hasLocalDevice = localDevice !== null;
  const localDeviceModule = localDevice?.module_id ?? null;

  // Capturar PWA install prompt
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

  const triggerPwaInstall = useCallback(async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }, [installPrompt]);

  const installDevice = useCallback(
    async (
      moduleId: InstalledDeviceModule,
      deviceName?: string,
    ): Promise<boolean> => {
      if (!restaurantId || !isDocker) {
        setError(
          "Requer restaurante e Core Docker. Faça login e escolha o restaurante.",
        );
        return false;
      }

      const defaultName =
        moduleId === "tpv" ? "TPV_BALCAO_01" : "KDS_COZINHA_01";
      const name = deviceName?.trim() || defaultName;
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

        const { data: equipment, error: eqError } = (await dockerCoreClient
          .from("gm_equipment")
          .upsert(payload, { onConflict: "restaurant_id,name" })
          .select("id")
          .single()) as {
          data: { id: string } | null;
          error: { message: string } | null;
        };

        if (eqError || !equipment?.id) {
          throw new Error(
            eqError?.message ?? "Falha ao criar/atualizar dispositivo no Core.",
          );
        }

        const { error: modError } = await insertInstalledModule(
          restaurantId,
          moduleId,
          kind,
        );
        if (modError) throw new Error(modError);

        // Persistir identidade local
        setInstalledDevice({
          device_id: equipment.id,
          restaurant_id: restaurantId,
          module_id: moduleId,
          device_name: name,
        });

        if (typeof window !== "undefined") {
          setTabIsolated("chefiapp_restaurant_id", restaurantId);
          window.localStorage.setItem("chefiapp_restaurant_id", restaurantId);
        }

        // UXG-002: Do NOT auto-open operational window after install.
        // The caller (DeviceInstallDialog) handles post-install UX.
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao instalar dispositivo.",
        );
        return false;
      } finally {
        setInstalling(null);
      }
    },
    [restaurantId, isDocker],
  );

  return {
    installing,
    error,
    hasLocalDevice,
    localDeviceModule,
    canInstallPwa: installPrompt !== null,
    triggerPwaInstall,
    installDevice,
  };
}
