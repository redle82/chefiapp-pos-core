import { useState } from "react";

export function AdminTopbar() {
  const [location] = useState("SOFIA GASTROBAR IBIZA");

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
          value={location}
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
          <option value={location}>{location}</option>
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
            E
          </div>
          <span>redle82@hotmail.com</span>
        </div>
      </div>
    </header>
  );
}

