import { useEffect, useState } from "react";
import { useRestaurantRuntime } from "../../../../context/RestaurantRuntimeContext";
import { dockerCoreClient } from "../../../../core-boundary/docker-core/connection";
import { useAuth } from "../../../../core/auth/useAuth";

export function AdminTopbar() {
  const { runtime } = useRestaurantRuntime();
  const { user } = useAuth();
  const [locationName, setLocationName] = useState("");

  const restaurantId = runtime.restaurant_id ?? null;
  const userEmail = user?.email ?? "";
  const userInitial = userEmail.charAt(0).toUpperCase() || "?";

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    (async () => {
      const { data: row } = await dockerCoreClient
        .from("gm_restaurants")
        .select("name")
        .eq("id", restaurantId)
        .maybeSingle();
      if (!cancelled && row) {
        setLocationName(
          ((row as Record<string, unknown>).name as string) ?? "",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  return (
    <header
      style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "#0f172a",
          }}
        >
          ChefIApp OS
        </span>
        <select
          value={locationName}
          onChange={() => {}}
          style={{
            fontSize: 13,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            color: "#374151",
          }}
        >
          <option value={locationName}>{locationName || "Cargando…"}</option>
        </select>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          type="button"
          style={{
            fontSize: 13,
            padding: "8px 12px",
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
            cursor: "pointer",
            color: "#4c1d95",
            fontWeight: 500,
          }}
        >
          Assistente IA
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "#4b5563",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "999px",
              backgroundColor: "#ede9fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              color: "#5b21b6",
            }}
          >
            {userInitial}
          </div>
          <span>{userEmail || "—"}</span>
        </div>
      </div>
    </header>
  );
}
