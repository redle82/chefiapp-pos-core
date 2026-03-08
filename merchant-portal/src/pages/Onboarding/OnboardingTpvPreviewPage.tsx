/**
 * Onboarding 5min — Tela 6: Preview TPV (mapa das mesas, nome do restaurante, resumo, TPV simulado).
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 * Mostra nome do restaurante, informação das telas anteriores e mapa visual das mesas.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { dockerCoreClient } from "../../infra/docker-core/connection";
import { fetchRestaurantForIdentity } from "../../infra/readers/RuntimeReader";
import { Button, Card } from "../../ui/design-system/primitives";
import { TPVMinimal } from "../TPVMinimal/TPVMinimal";
import styles from "./OnboardingTpvPreviewPage.module.css";

interface TableRow {
  id: string;
  number: number;
}

export function OnboardingTpvPreviewPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("onboarding");
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [restaurantCity, setRestaurantCity] = useState<string | null>(null);
  const [restaurantType, setRestaurantType] = useState<string | null>(null);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);

  const restaurantId =
    getTabIsolated("chefiapp_restaurant_id") ??
    (typeof window !== "undefined"
      ? window.localStorage.getItem("chefiapp_restaurant_id")
      : null);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    Promise.all([
      fetchRestaurantForIdentity(restaurantId),
      dockerCoreClient
        .from("gm_tables")
        .select("id,number")
        .eq("restaurant_id", restaurantId)
        .order("number", { ascending: true })
        .then(({ data, error }) => {
          if (error || !data) return [];
          return (Array.isArray(data) ? data : []).map(
            (r: { id: string; number: number }) => ({
              id: r.id,
              number: r.number,
            }),
          );
        })
        .catch(() => []),
    ])
      .then(([identity, tablesList]) => {
        if (!mounted) return;
        if (identity) {
          setRestaurantName(
            identity.name ?? t("fiveMin.tpvPreview.restaurantFallback"),
          );
          setRestaurantCity(identity.city ?? null);
          setRestaurantType(identity.type ?? null);
        }
        setTables(tablesList);
      })
      .catch(() => {
        if (mounted)
          setRestaurantName(t("fiveMin.tpvPreview.restaurantFallback"));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [restaurantId]);

  const displayTables =
    tables.length > 0
      ? tables
      : Array.from({ length: 10 }, (_, i) => ({
          id: `fallback-${i + 1}`,
          number: i + 1,
        }));

  return (
    <div data-onboarding-step="6" className={styles.pageRoot}>
      <OnboardingStepIndicator step={7} total={9} />
      <div className={styles.header}>
        <h1 className={styles.title}>{t("fiveMin.tpvPreview.headline")}</h1>
        <p className={styles.subtitle}>{t("fiveMin.tpvPreview.message")}</p>

        {!loading && (
          <Card padding="lg" className={styles.previewCard}>
            <h2 className={styles.restaurantName}>{restaurantName}</h2>
            <div className={styles.restaurantInfo}>
              {restaurantCity && <span>{restaurantCity}</span>}
              {restaurantType && <span>{restaurantType}</span>}
            </div>
            <div className={styles.summaryText}>
              {t("fiveMin.tpvPreview.summaryText")}
            </div>
            <div className={styles.tableMapSection}>
              <div className={styles.tableMapLabel}>
                {t("fiveMin.tpvPreview.tableMapLabel")}
              </div>
              <div className={styles.tableGrid}>
                <div className={styles.tableItem}>
                  {t("fiveMin.tpvPreview.counter")}
                </div>
                {displayTables.slice(0, 9).map((tbl) => (
                  <div key={tbl.id} className={styles.tableItem}>
                    {t("fiveMin.tpvPreview.table", { number: tbl.number })}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        <div className={styles.actions}>
          <Button
            type="button"
            tone="success"
            variant="solid"
            onClick={() => navigate("/onboarding/plan-trial")}
          >
            {t("fiveMin.tpvPreview.cta")}
          </Button>
          <Link to="/onboarding/ritual" className={styles.ritualLink}>
            {t("fiveMin.tpvPreview.linkRitual")}
          </Link>
        </div>
      </div>
      <div className={styles.tpvContainer}>
        <TPVMinimal mode="preview" />
      </div>
      {/* Fixed CTA at bottom: always visible to proceed (Step 7 or 8) */}
      <div className={styles.fixedCta}>
        <Button
          type="button"
          tone="success"
          variant="solid"
          onClick={() => navigate("/onboarding/plan-trial")}
        >
          {t("fiveMin.tpvPreview.cta")}
        </Button>
        <Link to="/onboarding/ritual" className={styles.ritualLink}>
          {t("fiveMin.tpvPreview.linkRitual")}
        </Link>
      </div>
    </div>
  );
}
