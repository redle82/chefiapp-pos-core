/**
 * KDSStandalone — Kitchen Display System (Standalone Mode)
 *
 * OBJETIVO: Rodar em tablet/TV da cozinha SEM login, SEM sidebar, SEM auth.
 * ROTA: /kds/:restaurantId
 *
 * ARQUITETURA:
 * - KDSLayout: Container escuro full-screen
 * - OrderProvider: Gerencia pedidos + realtime + polling defensivo
 * - KitchenDisplay: UI dos tickets + feedback offline
 *
 * HARDENING:
 * - Se offline, banner vermelho + ações bloqueadas
 * - Polling defensivo de 30s como fallback para realtime
 * - Refetch automático na reconexão
 *
 * 🔴 RISK: restaurantId vem da URL e é salvo em localStorage.
 *          Qualquer um com a URL pode ver os pedidos.
 *          TODO: Implementar token de acesso para KDS se necessário.
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { OrderProvider } from "../context/OrderContextReal";
// DOCKER CORE: Kernel removido - acesso direto ao Core via PostgREST/RPCs
import { KernelProvider } from "../../../core/kernel/KernelContext";
import { setTabIsolated } from "../../../core/storage/TabIsolatedStorage";
import { OfflineOrderProvider } from "../context/OfflineOrderContext";
import { KDSLayout } from "./KDSLayout";
import styles from "./KDSStandalone.module.css";
import KitchenDisplay from "./KitchenDisplay";

const KDSStandalone = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [ready, setReady] = useState(false);

  // Mission 55: Smart Routing (Kitchen vs Bar)
  // Read ?station=BAR or ?station=KITCHEN from URL
  const searchParams = new URLSearchParams(window.location.search);
  const stationParam = searchParams.get("station")?.toUpperCase();
  const initialStation =
    stationParam === "BAR" || stationParam === "KITCHEN" ? stationParam : "ALL";

  // === CONTROLE DE VERSÃO: Respeitar kdsVersion e noLegacy ===
  const kdsVersion = searchParams.get("kdsVersion");
  const noLegacy = searchParams.get("noLegacy") === "true";
  const useNewKDS = kdsVersion === "new" || noLegacy;

  useEffect(() => {
    if (restaurantId) {
      // SEEDING: Inject ID into storage so OrderProvider works naturally
      // This replicates the effect of logging in and selecting a restaurant
      // but scoped just for this session/tab.
      console.log("[KDS Standalone] Seeding Restaurant ID:", restaurantId);
      if (useNewKDS) {
        console.log(
          "[KDS Standalone] ✅ Usando KDS NOVO (kdsVersion=new ou noLegacy=true)",
        );
      }
      setTabIsolated("chefiapp_restaurant_id", restaurantId);
      setReady(true);
    }
  }, [restaurantId, useNewKDS]);

  if (!restaurantId) {
    return (
      <div className={styles.errorMessage}>
        Erro: ID do Restaurante não fornecido na URL.
      </div>
    );
  }

  if (!ready) {
    return <div className={styles.flashPrevention} />; // Flash prevention
  }

  // === CONTROLE DE VERSÃO: Forçar KDS novo quando solicitado ===
  // Se useNewKDS=true, sempre renderizar KitchenDisplay (versão nova)
  // mesmo em caso de erro/offline, sem fallback para versão antiga
  return (
    <KDSLayout>
      <KernelProvider tenantId={restaurantId}>
        <OfflineOrderProvider>
          <OrderProvider restaurantId={restaurantId}>
            <KitchenDisplay
              initialStation={initialStation as any}
              forceNewVersion={useNewKDS}
            />
          </OrderProvider>
        </OfflineOrderProvider>
      </KernelProvider>
    </KDSLayout>
  );
};

export default KDSStandalone;
