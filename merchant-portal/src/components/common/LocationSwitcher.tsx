import { useEffect, useState } from "react";
import {
  getLocations,
  switchLocation,
  getActiveLocationId,
  type Location,
} from "../../core/multi-location/MultiLocationService";
import { useRestaurantRuntime } from "../../core/runtime/useRestaurantRuntime";

export default function LocationSwitcher() {
  const { restaurantId } = useRestaurantRuntime();
  const [locations, setLocations] = useState<Location[]>([]);
  const [open, setOpen] = useState(false);
  const [currentName, setCurrentName] = useState("");

  useEffect(() => {
    // Try to load locations for the organization
    if (restaurantId) {
      getLocations(restaurantId).then((locs) => {
        setLocations(locs);
        const activeId = getActiveLocationId() || restaurantId;
        const current = locs.find((l) => l.id === activeId);
        if (current) setCurrentName(current.name);
      });
    }
  }, [restaurantId]);

  // Only show if there are 2+ locations
  if (locations.length < 2) return null;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 8,
          padding: "4px 12px",
          color: "#f59e0b",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 14 }}>📍</span>
        {currentName || "Select Location"}
        <span style={{ fontSize: 10, marginLeft: 4 }}>▼</span>
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: 4,
              background: "#171717",
              border: "1px solid #262626",
              borderRadius: 8,
              minWidth: 220,
              zIndex: 100,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              overflow: "hidden",
            }}
          >
            {locations.map((loc) => {
              const isActive =
                loc.id === (getActiveLocationId() || restaurantId);
              return (
                <button
                  key={loc.id}
                  onClick={() => {
                    switchLocation(loc.id);
                    setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "10px 16px",
                    background: isActive ? "rgba(245,158,11,0.1)" : "transparent",
                    border: "none",
                    borderBottom: "1px solid #1a1a1a",
                    color: isActive ? "#f59e0b" : "#d4d4d4",
                    fontSize: 13,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background:
                        loc.status === "open" ? "#22c55e" : "#525252",
                    }}
                  />
                  {loc.name}
                  {isActive && (
                    <span style={{ marginLeft: "auto", fontSize: 11 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
