/**
 * LiveActivityTicker — Social proof (mock dynamic, ready for API).
 */
import { useEffect, useState } from "react";

type Activity = {
  id: string;
  text: string;
  timestamp: number;
};

const MOCK_ACTIVITIES: Omit<Activity, "timestamp">[] = [
  { id: "1", text: "3 restaurantes ativaram hoje" },
  { id: "2", text: "Novo cliente em Madrid" },
  { id: "3", text: "Restaurante em Lisboa acabou de começar o trial" },
  { id: "4", text: "2 novos pedidos nos últimos 5 min" },
];

function rotate(activities: Activity[]): Activity[] {
  if (activities.length === 0) return [];
  const [first, ...rest] = activities;
  return [...rest, { ...first, timestamp: Date.now() }];
}

export function LiveActivityTicker() {
  const [items, setItems] = useState<Activity[]>(() =>
    MOCK_ACTIVITIES.map((a, i) => ({
      ...a,
      timestamp: Date.now() - i * 1000,
    }))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setItems((prev) => rotate(prev));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const current = items[0];
  if (!current) return null;

  return (
    <div
      style={{
        padding: "8px 16px",
        borderRadius: 8,
        background: "rgba(251,191,36,0.08)",
        border: "1px solid rgba(251,191,36,0.2)",
        fontSize: "0.8rem",
        color: "rgba(255,255,255,0.9)",
      }}
    >
      <span style={{ marginRight: 8 }}>●</span>
      {current.text}
    </div>
  );
}
