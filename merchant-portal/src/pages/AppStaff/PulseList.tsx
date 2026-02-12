import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRestaurantIdentity } from "../../core/identity/useRestaurantIdentity";
import { Badge } from "../../ui/design-system/Badge";
import { Button } from "../../ui/design-system/Button";
import { Card } from "../../ui/design-system/Card";
import { Colors, Spacing, Typography } from "../../ui/design-system/tokens";
// LEGACY / LAB — blocked in Docker mode
import { db } from "../../core/db";
import { getTabIsolated } from "../../core/storage/TabIsolatedStorage";

// ------------------------------------------------------------------
// 🫀 PULSE HISTORIAN: THE SYSTEM MEMORY
// "Proof of life. Proof of vigilance."
// ------------------------------------------------------------------

interface Pulse {
  id: string;
  type: string;
  created_at: string;
  payload: any;
}

export const PulseList: React.FC = () => {
  const navigate = useNavigate();
  const { identity } = useRestaurantIdentity();
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("...");

  // Identity Layer: tab title = restaurante protagonista
  useEffect(() => {
    document.title = identity.name
      ? `${identity.name} — Orders`
      : "ChefIApp POS — Orders";
    return () => {
      document.title = "ChefIApp POS";
    };
  }, [identity.name]);

  useEffect(() => {
    const fetchPulses = async () => {
      // A) TRIAL MODE CHECK
      const isTrial = getTabIsolated("chefiapp_trial_mode") === "true";

      if (isTrial) {
        setRestaurantName("Restaurante Trial");
        setPulses([
          {
            id: "1",
            type: "SYSTEM_CHECK",
            created_at: new Date().toISOString(),
            payload: { status: "OK" },
          },
          {
            id: "2",
            type: "TRIAL_PULSE",
            created_at: new Date(Date.now() - 60000).toISOString(),
            payload: { message: "Operação em Trial" },
          },
          {
            id: "3",
            type: "ONBOARDING_COMPLETE",
            created_at: new Date(Date.now() - 3600000).toISOString(),
            payload: { step: "setup" },
          },
        ]);
        setLoading(false);
        return;
      }

      // B) REAL MODE
      try {
        // FASE 3.5: Usa dockerCoreClient em vez de supabase direto
        const { readRestaurantMemberByUserId, readEmpirePulses } = await import(
          "../../../core-boundary/readers/PulseReader"
        );

        // 1. Get Restaurant ID via auth
        const {
          data: { user },
        } = await db.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }

        // 2. Get Restaurant Member (via PulseReader)
        const member = await readRestaurantMemberByUserId(user.id);

        if (!member) {
          console.error("Member not found");
          setLoading(false);
          return;
        }

        setRestaurantName((member.restaurants as any)?.name || "Unknown");

        // 3. Fetch History (via PulseReader)
        const history = await readEmpirePulses(member.restaurant_id, 50);

        setPulses(history || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching pulses:", err);
        setLoading(false);
      }
    };

    fetchPulses();
  }, [navigate]);

  return (
    <div
      style={{
        padding: Spacing.xl,
        flex: 1,
        minHeight: 0,
        background: Colors.surface.base,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily,
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* HEADER */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: Spacing.xl,
          }}
        >
          <div>
            <div
              style={{
                fontSize: Typography.uiTiny.fontSize,
                fontWeight: Typography.uiTiny.fontWeight,
                textTransform: Typography.uiTiny.textTransform,
                color: Colors.text.secondary,
                letterSpacing: Typography.uiTiny.letterSpacing,
                marginBottom: 4,
              }}
            >
              SYSTEM MEMORY // TELEMETRY
            </div>
            <h2
              style={{
                fontSize: Typography.h3.fontSize,
                color: Colors.text.primary,
              }}
            >
              {restaurantName}
            </h2>
          </div>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </header>

        {/* LIST */}
        <Card padding="lg">
          {loading ? (
            <div
              style={{ padding: Spacing.xl, textAlign: "center", opacity: 0.5 }}
            >
              Syncing Telemetry...
            </div>
          ) : pulses.length === 0 ? (
            <div
              style={{ padding: Spacing.xl, textAlign: "center", opacity: 0.5 }}
            >
              No pulses recorded yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {pulses.map((pulse, index) => (
                <div
                  key={pulse.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: `${Spacing.md} 0`,
                    borderBottom:
                      index < pulses.length - 1
                        ? `1px solid ${Colors.surface.border}`
                        : "none",
                    gap: Spacing.md,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: Typography.uiTiny.fontSize,
                      color: Colors.text.tertiary,
                      minWidth: 80,
                    }}
                  >
                    {new Date(pulse.created_at).toLocaleTimeString()}
                  </div>

                  <div style={{ minWidth: 150 }}>
                    <Badge label={pulse.type} variant="secondary" />
                  </div>

                  <div
                    style={{
                      fontSize: Typography.uiSmall.fontSize,
                      color: Colors.text.secondary,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                      fontFamily: "monospace",
                    }}
                  >
                    {JSON.stringify(pulse.payload)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div
          style={{
            marginTop: Spacing.xl,
            textAlign: "center",
            fontSize: Typography.uiTiny.fontSize,
            color: Colors.text.tertiary,
            fontFamily: "monospace",
          }}
        >
          LOG_END // LIMIT_50
        </div>
      </div>
    </div>
  );
};
