/**
 * LocationModal — Criar/editar Ubicação.
 * Campos: nome, endereço, cidade, país, postalCode, timezone, currency (EUR default), ativo, principal.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { currencyService } from "../../../../core/currency/CurrencyService";
import type { Location } from "../types";

const CURRENCIES = [
  { value: "EUR", label: "EUR" },
  { value: "USD", label: "USD" },
  { value: "GBP", label: "GBP" },
  { value: "BRL", label: "BRL" },
  { value: "MXN", label: "MXN" },
  { value: "CAD", label: "CAD" },
  { value: "AUD", label: "AUD" },
];
const TIMEZONES = [
  { value: "Europe/Madrid", label: "Europe/Madrid" },
  { value: "Europe/Lisbon", label: "Europe/Lisbon" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "America/Chicago", label: "America/Chicago" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
  { value: "America/Mexico_City", label: "America/Mexico_City" },
  { value: "America/Toronto", label: "America/Toronto" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
  { value: "UTC", label: "UTC" },
];

interface LocationModalProps {
  location: Location | null; // null = criar
  onClose: () => void;
  onSave: (data: Omit<Location, "id" | "createdAt" | "updatedAt">) => void;
}

const emptyForm = (): Omit<Location, "id" | "createdAt" | "updatedAt"> => ({
  name: "",
  address: "",
  country: "",
  city: "",
  postalCode: "",
  timezone: "Europe/Madrid",
  currency: currencyService.getDefaultCurrency(),
  isActive: true,
  isPrimary: false,
});

export function LocationModal({
  location,
  onClose,
  onSave,
}: LocationModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    if (location) {
      setForm({
        name: location.name,
        address: location.address,
        country: location.country,
        city: location.city,
        postalCode: location.postalCode,
        timezone: location.timezone,
        currency: location.currency,
        isActive: location.isActive,
        isPrimary: location.isPrimary ?? false,
      });
    } else {
      setForm(emptyForm());
    }
  }, [location]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  const isEdit = !!location;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--card-bg-on-dark)",
          borderRadius: 12,
          maxWidth: 480,
          width: "100%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: 24,
              borderBottom: "1px solid var(--surface-border)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {isEdit ? "Editar ubicación" : "Nueva ubicación"}
            </h2>
          </div>
          <div
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Nombre
              </span>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                placeholder="Ej. Sofia Gastrobar Ibiza"
                style={{
                  padding: "8px 12px",
                  fontSize: 14,
                  border: "1px solid var(--surface-border)",
                  borderRadius: 8,
                  boxSizing: "border-box",
                }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Dirección
              </span>
              <input
                type="text"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                placeholder="Calle, número, código postal, ciudad, país"
                style={{
                  padding: "8px 12px",
                  fontSize: 14,
                  border: "1px solid var(--surface-border)",
                  borderRadius: 8,
                  boxSizing: "border-box",
                }}
              />
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <label
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  Ciudad
                </span>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                  style={{
                    padding: "8px 12px",
                    fontSize: 14,
                    border: "1px solid var(--surface-border)",
                    borderRadius: 8,
                    boxSizing: "border-box",
                  }}
                />
              </label>
              <label
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  Código postal
                </span>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, postalCode: e.target.value }))
                  }
                  style={{
                    padding: "8px 12px",
                    fontSize: 14,
                    border: "1px solid var(--surface-border)",
                    borderRadius: 8,
                    boxSizing: "border-box",
                  }}
                />
              </label>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <label
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  País (código)
                </span>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, country: e.target.value }))
                  }
                  placeholder="ES, PT, BR"
                  maxLength={3}
                  style={{
                    padding: "8px 12px",
                    fontSize: 14,
                    border: "1px solid var(--surface-border)",
                    borderRadius: 8,
                    boxSizing: "border-box",
                  }}
                />
              </label>
              <label
                style={{ display: "flex", flexDirection: "column", gap: 4 }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  Moneda
                </span>
                <select
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currency: e.target.value }))
                  }
                  style={{
                    padding: "8px 12px",
                    fontSize: 14,
                    border: "1px solid var(--surface-border)",
                    borderRadius: 8,
                    boxSizing: "border-box",
                  }}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                Zona horaria (IANA)
              </span>
              <select
                value={form.timezone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, timezone: e.target.value }))
                }
                style={{
                  padding: "8px 12px",
                  fontSize: 14,
                  border: "1px solid var(--surface-border)",
                  borderRadius: 8,
                  boxSizing: "border-box",
                }}
              >
                {TIMEZONES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <div
              style={{
                display: "flex",
                gap: 24,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                  Activo
                </span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.isPrimary ?? false}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isPrimary: e.target.checked }))
                  }
                />
                <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
                  Principal
                </span>
              </label>
            </div>
          </div>
          <div
            style={{
              padding: 24,
              borderTop: "1px solid var(--surface-border)",
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 14px",
                fontSize: 13,
                color: "var(--text-secondary)",
                border: "1px solid var(--surface-border)",
                borderRadius: 8,
                cursor: "pointer",
                backgroundColor: "var(--card-bg-on-dark)",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-inverse)",
                backgroundColor: "var(--color-primary)",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              {isEdit ? t("common:save") : t("common:create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
