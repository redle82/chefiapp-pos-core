import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { track } from "../analytics/track";
import "../App.css";
import { CONFIG } from "../config";
import { useCoreHealth } from "../core/health/useCoreHealth";
import {
  getTabIsolated,
  setTabIsolated,
} from "../core/storage/TabIsolatedStorage";
import { useOnboardingState } from "../hooks/useOnboardingState";
import { Badge } from "../ui/design-system/Badge";
import { Button } from "../ui/design-system/Button";
import { Card } from "../ui/design-system/Card";
import styles from "./TPVReadyPage.module.css";

// Router Guard meta — page consumes the system, does not decide
export const routeMeta = {
  contractIds: ["ONT-002", "ONT-003", "CAP-004"],
  allowedPreviewStates: ["live"] as Array<"live">,
};

/**
 * TPVReadyPage — Página final: TPV pronto para operar
 */
export function TPVReadyPage() {
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_BASE || CONFIG.API_BASE;
  const internalToken = import.meta.env.VITE_INTERNAL_TOKEN || "dev-internal";
  const restaurantId = getTabIsolated("chefiapp_restaurant_id");
  const slug = getTabIsolated("chefiapp_slug") || "sofia-gastrobar";

  const {
    status: healthStatus,
    check: checkHealth,
    isChecking,
  } = useCoreHealth({ baseUrl: apiBase, autoStart: true });

  const { loading, gates, loadState, isReadyForTPV } = useOnboardingState({
    apiBase,
    internalToken,
    restaurantId: restaurantId ?? undefined,
  });

  useEffect(() => {
    loadState();
    checkHealth();
  }, []);

  useEffect(() => {
    if (
      !loading &&
      isReadyForTPV &&
      !getTabIsolated("chefiapp_evt_tpv_ready")
    ) {
      setTabIsolated("chefiapp_evt_tpv_ready", "1");
      track("tpv_ready");
    }
  }, [loading, isReadyForTPV]);

  // No local redirects; Router Guard handles protection and remediation

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.loadingContent}>
          <Card className={styles.loadingCard}>A preparar o teu painel…</Card>
        </div>
      </div>
    );
  }

  const publicUrl = `${apiBase}/public/${slug}`;
  const tier = gates.tier || "free";

  const isHealthUp = healthStatus === "UP";
  const canOperate = isHealthUp && isReadyForTPV && gates.ok === true;
  const blockedMessage = !isHealthUp
    ? "Sistema indisponivel. Aguarda a recuperacao ou tenta novamente."
    : gates.ok === false
    ? gates.message || "Bloqueado pelos gates do setup."
    : !isReadyForTPV
    ? "Faltam passos obrigatorios antes de operar o TPV."
    : null;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageContent}>
        <div className={styles.pageContainer}>
          {canOperate ? (
            <>
              <Badge
                variant="success"
                label="Online e pronto"
                icon="✓"
                className="mb-4"
              />

              <h1 className={`h1 ${styles.headerTitle}`}>
                O teu TPV está pronto.
              </h1>
              <p className={`muted ${styles.headerSubtitle}`}>
                Já podes receber pedidos.
              </p>
            </>
          ) : (
            <>
              <Badge
                variant="warning"
                label="A aguardar core"
                icon="⚠️"
                className="mb-4"
              />
              <h1 className={`h1 ${styles.headerTitle}`}>
                Ainda não é seguro operar.
              </h1>
              <p className={`muted ${styles.headerSubtitle}`}>
                {blockedMessage ||
                  "Confirma saúde do backend e passos obrigatórios."}
              </p>
            </>
          )}

          <Card className={styles.mainCard}>
            <div className={styles.statusHeader}>
              <div>
                <div className="h3">
                  {canOperate ? "Tudo pronto" : "Acesso bloqueado"}
                </div>
                <div className={`muted ${styles.statusSubtext}`}>
                  {canOperate
                    ? "O essencial está concluído."
                    : "Core precisa estar UP e passos obrigatórios completos."}
                </div>
              </div>
              <div
                className={
                  canOperate
                    ? styles.statusIconSuccess
                    : styles.statusIconWarning
                }
              >
                {canOperate ? "✓" : "!"}
              </div>
            </div>

            <ul className={styles.checklistList}>
              <li className={canOperate ? styles.checklistItemSuccess : ""}>
                ✓ Identidade
              </li>
              <li className={canOperate ? styles.checklistItemSuccess : ""}>
                ✓ Menu
              </li>
              <li className={canOperate ? styles.checklistItemSuccess : ""}>
                ✓ Página criada
              </li>
              <li className={styles.checklistItemOptional}>
                Pagamentos (opcional)
              </li>
              {!isHealthUp && (
                <li className={styles.checklistItemError}>
                  Backend indisponível
                </li>
              )}
            </ul>

            <div className={styles.actionsGrid}>
              <Button
                variant="primary"
                onClick={() => navigate("/app/tpv")}
                disabled={!canOperate || isChecking}
                className={styles.buttonFullWidth}
              >
                {canOperate ? "Abrir TPV" : "Aguardar core"}
              </Button>
              <a
                href={canOperate ? publicUrl : undefined}
                {...(!canOperate && { "aria-disabled": "true" })}
                target={canOperate ? "_blank" : undefined}
                rel={canOperate ? "noreferrer" : undefined}
                className={`btn ${
                  canOperate
                    ? styles.publicLinkActive
                    : styles.publicLinkDisabled
                }`}
              >
                Ver página pública
              </a>
            </div>
          </Card>

          <div className={`muted ${styles.secondaryActions}`}>
            <Button
              variant="ghost"
              onClick={() => navigate("/app/setup/menu")}
              className={styles.buttonWithMargin}
            >
              Editar menu
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/app/setup/design")}
            >
              Ajustar design
            </Button>
          </div>

          {gates.addons && gates.addons.length > 0 && (
            <Card className={styles.addonsCard}>
              <div className="h3">Add-ons disponíveis</div>
              <div className={styles.addonsList}>
                {gates.addons.map((addon: string) => (
                  <Badge key={addon} label={addon} variant="info" />
                ))}
              </div>
            </Card>
          )}

          {tier === "free" && (
            <div className={`banner warn ${styles.upgradeBanner}`}>
              <div className={`bannerTitle ${styles.upgradeBannerTitle}`}>
                ⚡ Desbloqueie mais funcionalidades
              </div>
              <div className={`bannerText ${styles.upgradeBannerText}`}>
                Upgrade para Pro e acesse pagamentos online, analytics avançado
                e mais.
              </div>
              <div className={`bannerActions ${styles.upgradeBannerActions}`}>
                <Button
                  variant="primary"
                  onClick={() => console.log("Upgrade flow em breve!")}
                  title="Em breve"
                >
                  Ver planos
                </Button>
              </div>
            </div>
          )}

          <div className={styles.footer}>
            ChefIApp POS v1.0 • Sistema de Registo Fiscal
          </div>
        </div>
      </div>
    </div>
  );
}
