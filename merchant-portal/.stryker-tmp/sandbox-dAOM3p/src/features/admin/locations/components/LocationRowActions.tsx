/**
 * LocationRowActions — Menu ⋯ por Ubicação: Configurar mesas, impressoras, horários, Ver staff.
 * Atalhos de configuração por location (sem caçar na sidebar).
 */
// @ts-nocheck


import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Location } from "../types";

const BASE = "/admin/config";

const ACTIONS: { key: string; label: string; path: string }[] = [
  { key: "mesas", label: "Configurar mesas", path: `${BASE}/ubicaciones/tables` },
  { key: "impresoras", label: "Configurar impresoras", path: `${BASE}/impresoras` },
  { key: "horarios", label: "Configurar horarios", path: `${BASE}/delivery/horarios` },
  { key: "staff", label: "Ver staff", path: "/admin/config/empleados" },
];

interface LocationRowActionsProps {
  location: Location;
  onEdit: () => void;
}

export function LocationRowActions({ location, onEdit }: LocationRowActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: 4,
          border: "none",
          background: "none",
          cursor: "pointer",
          color: "var(--text-secondary)",
          borderRadius: 4,
        }}
        aria-label="Más acciones"
      >
        ⋯
      </button>
      <button
        type="button"
        onClick={onEdit}
        style={{
          padding: 4,
          border: "none",
          background: "none",
          cursor: "pointer",
          color: "var(--text-secondary)",
          borderRadius: 4,
        }}
        aria-label="Editar"
      >
        ✎
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            minWidth: 180,
            backgroundColor: "var(--card-bg-on-dark)",
            border: "1px solid var(--surface-border)",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 10,
            padding: 4,
          }}
        >
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(a.path);
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "8px 12px",
                textAlign: "left",
                fontSize: 13,
                color: "var(--text-primary)",
                border: "none",
                background: "none",
                cursor: "pointer",
                borderRadius: 4,
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
