/**
 * Onboarding 5min — Tela 6: Preview TPV (mapa das mesas, nome do restaurante, resumo, TPV simulado).
 * Ref: docs/contracts/ONBOARDING_5MIN_9_TELAS_CONTRACT.md
 * Mostra nome do restaurante, informação das telas anteriores e mapa visual das mesas.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OnboardingStepIndicator } from "../../components/onboarding/OnboardingStepIndicator";
import { fetchRestaurantForIdentity } from "../../core-boundary/readers/RuntimeReader";
import { dockerCoreClient } from "../../core-boundary/docker-core/connection";
import { ONBOARDING_5MIN_COPY } from "../../copy/onboarding5min";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";
import { TPVMinimal } from "../TPVMinimal/TPVMinimal";
import { Button, Card } from "../../ui/design-system/primitives";
import { colors } from "../../ui/design-system/tokens/colors";
import { spacing } from "../../ui/design-system/tokens/spacing";

interface TableRow {
  id: string;
  number: number;
}

export function OnboardingTpvPreviewPage() {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [restaurantCity, setRestaurantCity] = useState<string | null>(null);
  const [restaurantType, setRestaurantType] = useState<string | null>(null);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);

  const restaurantId =
    getTabIsolated("chefiapp_restaurant_id") ??
    (typeof window !== "undefined" ? window.localStorage.getItem("chefiapp_restaurant_id") : null);

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
          return (Array.isArray(data) ? data : []).map((r: { id: string; number: number }) => ({
            id: r.id,
            number: r.number,
          }));
        })
        .catch(() => []),
    ])
      .then(([identity, tablesList]) => {
        if (!mounted) return;
        if (identity) {
          setRestaurantName(identity.name ?? "Seu Restaurante");
          setRestaurantCity(identity.city ?? null);
          setRestaurantType(identity.type ?? null);
        }
        setTables(tablesList);
      })
      .catch(() => {
        if (mounted) setRestaurantName("Seu Restaurante");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [restaurantId]);

  const displayTables = tables.length > 0 ? tables : Array.from({ length: 10 }, (_, i) => ({ id: `fallback-${i + 1}`, number: i + 1 }));

  return (
    <div
      data-onboarding-step="6"
      style={{
        background: colors.surface.base,
        minHeight: "100vh",
        color: colors.text.primary,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <OnboardingStepIndicator step={7} total={9} />
      <div
        style={{
          padding: spacing[4],
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <h1 style={{ fontSize: 20, marginBottom: spacing[2], color: colors.text.primary }}>
          {ONBOARDING_5MIN_COPY.tpvPreview.headline}
        </h1>
        <p style={{ color: colors.text.secondary, fontSize: 14, marginBottom: spacing[4] }}>
          {ONBOARDING_5MIN_COPY.tpvPreview.message}
        </p>

        {!loading && (
          <Card padding="lg" style={{ marginBottom: spacing[4] }}>
            <h2 style={{ fontSize: 18, marginBottom: spacing[3], color: colors.text.primary }}>
              {restaurantName}
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing[4], marginBottom: spacing[4], fontSize: 14, color: colors.text.secondary }}>
              {restaurantCity && <span>{restaurantCity}</span>}
              {restaurantType && <span>{restaurantType}</span>}
            </div>
            <div style={{ marginBottom: spacing[2], fontSize: 13, color: colors.text.tertiary ?? colors.text.secondary }}>
              Resumo do que configuraste: identidade, local e perfil do dia. Aqui em baixo vês o mapa das mesas e o TPV em preview.
            </div>
            <div style={{ marginTop: spacing[4] }}>
              <div style={{ fontSize: 14, marginBottom: spacing[2], color: colors.text.secondary }}>Mapa das mesas</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: spacing[2],
                  maxWidth: 360,
                }}
              >
                <div
                  style={{
                    padding: spacing[3],
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Balcão
                </div>
                {displayTables.slice(0, 9).map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: spacing[3],
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      textAlign: "center",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Mesa {t.number}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: spacing[3], alignItems: "flex-start" }}>
          <Button
            type="button"
            tone="success"
            variant="solid"
            onClick={() => navigate("/onboarding/plan-trial")}
          >
            {ONBOARDING_5MIN_COPY.tpvPreview.cta}
          </Button>
          <Link
            to="/onboarding/ritual"
            style={{
              fontSize: 14,
              color: colors.action?.base ?? "#22c55e",
              textDecoration: "underline",
            }}
          >
            {ONBOARDING_5MIN_COPY.tpvPreview.linkRitual}
          </Link>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 400 }}>
        <TPVMinimal mode="preview" />
      </div>
      {/* CTA fixo em baixo: sempre visível para avançar (Tela 7 ou 8) */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          left: 0,
          right: 0,
          padding: spacing[4],
          background: colors.surface.base,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: spacing[3],
          alignItems: "center",
        }}
      >
        <Button
          type="button"
          tone="success"
          variant="solid"
          onClick={() => navigate("/onboarding/plan-trial")}
        >
          {ONBOARDING_5MIN_COPY.tpvPreview.cta}
        </Button>
        <Link
          to="/onboarding/ritual"
          style={{
            fontSize: 14,
            color: colors.action?.base ?? "#22c55e",
            textDecoration: "underline",
          }}
        >
          {ONBOARDING_5MIN_COPY.tpvPreview.linkRitual}
        </Link>
      </div>
    </div>
  );
}
