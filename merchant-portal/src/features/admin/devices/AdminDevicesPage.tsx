/**
 * AdminDevicesPage — Lista de dispositivos (gestão) + Vincular dispositivo (Gerar PIN).
 * Rota: /admin/config/dispositivos. CODE_AND_DEVICE_PAIRING_CONTRACT.
 * Ref: DEVICE_TURN_SHIFT_TASK_CONTRACT.md
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRestaurantRuntime } from "../../../context/RestaurantRuntimeContext";
import {
  getDevicesList,
  setActivePairingRequest,
  type DeviceListEntry,
} from "../../auth/connectByCode";
import { AdminPageHeader } from "../dashboard/components/AdminPageHeader";
import type { AdminDevice, AdminDeviceStatus } from "./deviceTypes";

const PAIRING_VALIDITY_MS = 60_000; // 60s

function generatePairingPin(): string {
  const n = 4 + Math.floor(Math.random() * 2); // 4 or 5 digits
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10).toString();
  return s;
}

function mapToListEntryToAdminDevice(e: DeviceListEntry): AdminDevice {
  return {
    id: e.id,
    type: e.type,
    name: e.name,
    assignedRole: e.assignedRole as AdminDevice["assignedRole"],
    currentApp: undefined,
    operatorSessionId: null,
    lastHeartbeat: e.lastHeartbeat ?? null,
    notes: null,
  };
}

// MVP: shared list from devicePairing, or mock when empty
function useDevicesMock(): AdminDevice[] {
  return useMemo(
    () => [
      {
        id: "dev-1",
        type: "tpv",
        name: "TPV_BALCAO_01",
        assignedRole: "waiter",
        currentApp: "waiter",
        operatorSessionId: null,
        lastHeartbeat: new Date(Date.now() - 60_000).toISOString(),
        notes: null,
      },
      {
        id: "dev-2",
        type: "kds",
        name: "KDS_COZINHA_01",
        assignedRole: "kitchen",
        currentApp: "kitchen",
        operatorSessionId: null,
        lastHeartbeat: new Date(Date.now() - 120_000).toISOString(),
        notes: null,
      },
    ],
    []
  );
}

function statusLabel(s: AdminDeviceStatus): string {
  switch (s) {
    case "online":
      return "Online";
    case "offline":
      return "Offline";
    default:
      return "Desconhecido";
  }
}

function deriveStatus(device: AdminDevice): AdminDeviceStatus {
  const last = device.lastHeartbeat ? new Date(device.lastHeartbeat).getTime() : 0;
  const ago = Date.now() - last;
  if (ago < 120_000) return "online";
  if (ago < 600_000) return "offline";
  return "unknown";
}

export function AdminDevicesPage() {
  const { runtime } = useRestaurantRuntime();
  const restaurantId = runtime?.restaurant_id ?? null;
  const sharedList = useMemo(() => getDevicesList(), []);
  const mockList = useDevicesMock();
  const devices = sharedList.length > 0 ? sharedList.map(mapToListEntryToAdminDevice) : mockList;
  const [statusFilter, setStatusFilter] = useState<AdminDeviceStatus | "all">("all");
  const [pairingPin, setPairingPin] = useState<string | null>(null);
  const [pairingExpiresAt, setPairingExpiresAt] = useState<number | null>(null);

  const handleGeneratePin = useCallback(() => {
    if (!restaurantId) return;
    const pin = generatePairingPin();
    const expiresAt = Date.now() + PAIRING_VALIDITY_MS;
    setActivePairingRequest({ pairingPin: pin, expiresAt, restaurantId });
    setPairingPin(pin);
    setPairingExpiresAt(expiresAt);
  }, [restaurantId]);

  useEffect(() => {
    if (pairingExpiresAt == null) return;
    const t = setInterval(() => {
      if (Date.now() >= pairingExpiresAt) {
        setPairingPin(null);
        setPairingExpiresAt(null);
        clearInterval(t);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [pairingExpiresAt]);

  const filtered =
    statusFilter === "all"
      ? devices
      : devices.filter((d) => deriveStatus(d) === statusFilter);

  return (
    <div style={{ width: "100%", maxWidth: 960, margin: 0 }}>
      <AdminPageHeader
        title="Gestión de dispositivos"
        subtitle="Estado e vínculo dos terminais. Vincular dispositivo com PIN (válido 60s)."
      />

      {/* Vincular dispositivo — Gerar PIN */}
      <section
        style={{
          marginBottom: 24,
          padding: 16,
          backgroundColor: "var(--card-bg-on-dark)",
          border: "1px solid var(--surface-border)",
          borderRadius: 8,
        }}
      >
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 12px 0" }}>
          Vincular dispositivo
        </h2>
        <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "var(--text-secondary)" }}>
          Gere um PIN e digite-o no TPV ou KDS para vincular o dispositivo. O PIN expira em 60 segundos.
        </p>
        <button
          type="button"
          onClick={handleGeneratePin}
          disabled={!restaurantId}
          style={{
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 6,
            border: "1px solid var(--surface-border)",
            backgroundColor: "var(--card-bg-on-dark)",
            color: restaurantId ? "var(--text-primary)" : "var(--text-tertiary)",
            cursor: restaurantId ? "pointer" : "not-allowed",
          }}
        >
          Gerar PIN
        </button>
        {pairingPin != null && pairingExpiresAt != null && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: "monospace", fontSize: 24, letterSpacing: 4, color: "var(--text-primary)" }}>
              {pairingPin}
            </span>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Expira em {Math.max(0, Math.ceil((pairingExpiresAt - Date.now()) / 1000))}s
            </span>
          </div>
        )}
      </section>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Filtrar:</span>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as AdminDeviceStatus | "all")
          }
          style={{
            padding: "6px 10px",
            fontSize: 13,
            border: "1px solid var(--surface-border)",
            borderRadius: 6,
            backgroundColor: "var(--card-bg-on-dark)",
            color: "var(--text-primary)",
          }}
        >
          <option value="all">Todos</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="unknown">Desconhecido</option>
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: 24,
              textAlign: "center",
              backgroundColor: "var(--card-bg-on-dark)",
              border: "1px dashed var(--surface-border)",
              borderRadius: 8,
              color: "var(--text-secondary)",
              fontSize: 14,
            }}
          >
            Nenhum dispositivo corresponde ao filtro.
          </div>
        ) : (
          filtered.map((device) => {
            const status = deriveStatus(device);
            const lastSeen = device.lastHeartbeat
              ? new Date(device.lastHeartbeat).toLocaleString("pt-PT", {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : "—";

            return (
              <div
                key={device.id}
                style={{
                  padding: 16,
                  backgroundColor: "var(--card-bg-on-dark)",
                  border: "1px solid var(--surface-border)",
                  borderRadius: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {device.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {device.type === "tpv" ? "TPV" : "KDS"}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 999,
                      backgroundColor:
                        status === "online"
                          ? "var(--status-success-bg)"
                          : status === "offline"
                            ? "var(--status-error-bg)"
                            : "var(--card-bg-on-dark)",
                      color:
                        status === "online"
                          ? "var(--color-success)"
                          : status === "offline"
                            ? "var(--color-error)"
                            : "var(--text-secondary)",
                    }}
                  >
                    {statusLabel(status)}
                  </span>
                </div>

                <dl
                  style={{
                    margin: 0,
                    fontSize: 12,
                    display: "grid",
                    gap: 4,
                  }}
                >
                  {device.assignedRole != null && (
                    <>
                      <dt style={{ color: "var(--text-secondary)", margin: 0 }}>Papel</dt>
                      <dd style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>
                        {device.assignedRole}
                      </dd>
                    </>
                  )}
                  {device.currentApp != null && (
                    <>
                      <dt style={{ color: "var(--text-secondary)", margin: 0 }}>App actual</dt>
                      <dd style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>
                        {device.currentApp}
                      </dd>
                    </>
                  )}
                  <dt style={{ color: "var(--text-secondary)", margin: 0 }}>Último heartbeat</dt>
                  <dd style={{ margin: 0, color: "var(--text-primary)" }}>{lastSeen}</dd>
                </dl>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
