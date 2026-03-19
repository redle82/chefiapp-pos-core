import { useEffect, useState } from "react";
import {
  getProgramConfig,
  configureProgram,
  type LoyaltyProgramConfig,
} from "../../../../core/loyalty/LoyaltyPointsService";
import { useRestaurantRuntime } from "../../../../core/runtime/useRestaurantRuntime";

export default function LoyaltyDashboardPage() {
  const { restaurantId } = useRestaurantRuntime();
  const [config, setConfig] = useState<LoyaltyProgramConfig | null>(null);

  useEffect(() => {
    if (restaurantId) setConfig(getProgramConfig(restaurantId));
  }, [restaurantId]);

  const save = (updates: Partial<LoyaltyProgramConfig>) => {
    if (!restaurantId) return;
    configureProgram(restaurantId, updates);
    setConfig(getProgramConfig(restaurantId));
  };

  if (!config) return null;

  const inputStyle = {
    background: "#0a0a0a",
    border: "1px solid #262626",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#fafafa",
    fontSize: 14,
    width: "100%",
  } as const;

  return (
    <div className="page-enter admin-content-page" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ color: "#fafafa", fontSize: 24, fontWeight: 700, margin: 0 }}>Loyalty Program</h1>
        <button
          onClick={() => save({ enabled: !config.enabled })}
          style={{
            background: config.enabled ? "#22c55e" : "#525252",
            color: "#fff",
            border: "none",
            borderRadius: 9999,
            padding: "6px 20px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {config.enabled ? "Active" : "Inactive"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Points per €1 spent", key: "earnRatio" as const, value: config.earnRatio },
          { label: "Redemption value (cents/point)", key: "redemptionValue" as const, value: config.redemptionValue },
          { label: "Min points to redeem", key: "minRedeemBalance" as const, value: config.minRedeemBalance },
          { label: "Max redeem % of order", key: "maxRedeemPercentage" as const, value: config.maxRedeemPercentage },
          { label: "Points expire (days, 0=never)", key: "pointsExpireDays" as const, value: config.pointsExpireDays },
          { label: "Welcome bonus (points)", key: "welcomeBonus" as const, value: config.welcomeBonus },
          { label: "Birthday bonus (points)", key: "birthdayBonus" as const, value: config.birthdayBonus },
        ].map((field) => (
          <div key={field.key} style={{ background: "#171717", borderRadius: 12, padding: 16, border: "1px solid #262626" }}>
            <label style={{ color: "#a3a3a3", fontSize: 12, display: "block", marginBottom: 6 }}>{field.label}</label>
            <input
              type="number"
              style={inputStyle}
              value={field.value}
              onChange={(e) => save({ [field.key]: Number(e.target.value) })}
            />
          </div>
        ))}
      </div>

      <div style={{ background: "#171717", borderRadius: 12, padding: 20, border: "1px solid #262626" }}>
        <h3 style={{ color: "#fafafa", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>How It Works</h3>
        <div style={{ color: "#d4d4d4", fontSize: 13, lineHeight: 1.8 }}>
          <p>• Customers earn <strong style={{ color: "#f59e0b" }}>{config.earnRatio} point{config.earnRatio !== 1 ? "s" : ""}</strong> for every €1 spent</p>
          <p>• Each point is worth <strong style={{ color: "#f59e0b" }}>€{(config.redemptionValue / 100).toFixed(2)}</strong> when redeemed</p>
          <p>• Minimum <strong style={{ color: "#f59e0b" }}>{config.minRedeemBalance} points</strong> to redeem (= €{(config.minRedeemBalance * config.redemptionValue / 100).toFixed(2)})</p>
          <p>• Points can cover up to <strong style={{ color: "#f59e0b" }}>{config.maxRedeemPercentage}%</strong> of the order total</p>
          {config.pointsExpireDays > 0 && <p>• Points expire after <strong style={{ color: "#f59e0b" }}>{config.pointsExpireDays} days</strong></p>}
          {config.welcomeBonus > 0 && <p>• New members receive <strong style={{ color: "#f59e0b" }}>{config.welcomeBonus} bonus points</strong></p>}
          {config.birthdayBonus > 0 && <p>• Birthday bonus: <strong style={{ color: "#f59e0b" }}>{config.birthdayBonus} points</strong></p>}
        </div>
      </div>
    </div>
  );
}
