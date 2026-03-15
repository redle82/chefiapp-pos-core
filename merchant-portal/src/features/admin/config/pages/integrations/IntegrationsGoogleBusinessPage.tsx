/**
 * IntegrationsGoogleBusinessPage — Google Business Profile integration.
 * Ref: CHEFIAPP_INTEGRATIONS_HUB_SPEC.md
 *
 * Connect Google Business Profile, view reviews, sync ratings.
 */

import { useFormatLocale } from "@/core/i18n/useFormatLocale";
import { useCallback, useEffect, useState } from "react";
import { Logger } from "../../../../../core/logger";
import { IntegrationRegistry } from "../../../../../integrations";
import {
  createGoogleBusinessAdapter,
  GOOGLE_BUSINESS_ADAPTER_ID,
  GoogleBusinessAPI,
  type GoogleBusinessProfile,
  type GoogleBusinessReview,
} from "../../../../../integrations/adapters/google-business/GoogleBusinessAdapter";
import { AdminPageHeader } from "../../../dashboard/components/AdminPageHeader";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export function IntegrationsGoogleBusinessPage() {
  const locale = useFormatLocale();
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [profile, setProfile] = useState<GoogleBusinessProfile | null>(null);
  const [reviews, setReviews] = useState<GoogleBusinessReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerAdapter = useCallback((enabled: boolean) => {
    const adapter = createGoogleBusinessAdapter({ enabled });
    IntegrationRegistry.register(adapter).catch(() => {});
  }, []);

  useEffect(() => {
    registerAdapter(status === "connected");
    return () => {
      IntegrationRegistry.unregister(GOOGLE_BUSINESS_ADAPTER_ID).catch(
        () => {},
      );
    };
  }, [registerAdapter, status]);

  const handleConnect = async () => {
    setStatus("connecting");
    setError(null);
    try {
      const p = await GoogleBusinessAPI.connect();
      setProfile(p);
      setStatus("connected");
      // Auto-load reviews
      setLoadingReviews(true);
      const r = await GoogleBusinessAPI.getReviews();
      setReviews(r);
      setLastSyncAt(new Date());
      setLoadingReviews(false);
    } catch (err) {
      Logger.error("[GoogleBusinessPage] connect error:", err);
      setError(
        "Não foi possível conectar ao Google Business Profile. Tente novamente.",
      );
      setStatus("error");
    }
  };

  const handleDisconnect = async () => {
    try {
      await GoogleBusinessAPI.disconnect();
    } catch {
      // ignore
    }
    setProfile(null);
    setReviews([]);
    setLastSyncAt(null);
    setStatus("disconnected");
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setLoadingReviews(true);
    try {
      const r = await GoogleBusinessAPI.getReviews();
      setReviews(r);
      setLastSyncAt(new Date());
    } catch (err) {
      Logger.error("[GoogleBusinessPage] sync error:", err);
    } finally {
      setLoadingReviews(false);
      setSyncing(false);
    }
  };

  const statusLabel: Record<ConnectionStatus, string> = {
    disconnected: "Desligado",
    connecting: "A conectar…",
    connected: "Conectado",
    error: "Erro",
  };

  const statusColor: Record<ConnectionStatus, string> = {
    disconnected: "var(--text-secondary)",
    connecting: "var(--color-warning)",
    connected: "var(--color-success)",
    error: "var(--color-error)",
  };

  const statusBg: Record<ConnectionStatus, string> = {
    disconnected: "var(--card-bg-on-dark)",
    connecting: "var(--status-warning-bg)",
    connected: "var(--status-success-bg)",
    error: "var(--status-error-bg)",
  };

  return (
    <div className="page-enter admin-content-page">
      <AdminPageHeader
        title="Google Business Profile"
        subtitle="Conecte o seu perfil Google para gerir reviews, ratings e presença online."
      />

      {/* ── Connection Card ── */}
      <section style={{ marginBottom: 24 }}>
        <div
          style={{
            padding: 24,
            border: "1px solid var(--surface-border)",
            borderRadius: 12,
            backgroundColor: "var(--card-bg-on-dark)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  margin: "0 0 4px 0",
                  color: "var(--text-primary)",
                }}
              >
                Google Business Profile
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "var(--text-secondary)",
                }}
              >
                Sincronize reviews, ratings e informações do seu restaurante no
                Google.
              </p>
            </div>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                background: statusBg[status],
                color: statusColor[status],
              }}
            >
              {statusLabel[status]}
            </span>
          </div>

          {error && (
            <p
              style={{
                color: "var(--color-error)",
                fontSize: 13,
                margin: "0 0 12px 0",
              }}
            >
              {error}
            </p>
          )}

          {status === "disconnected" || status === "error" ? (
            <button
              onClick={handleConnect}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                background: "#4285F4",
                color: "white",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Conectar com Google
            </button>
          ) : status === "connecting" ? (
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              A conectar…
            </p>
          ) : null}

          {status === "connected" && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--surface-border)",
                  background: "var(--status-primary-bg)",
                  color: "var(--text-primary)",
                  fontSize: 13,
                  cursor: syncing ? "not-allowed" : "pointer",
                  opacity: syncing ? 0.7 : 1,
                }}
              >
                {syncing ? "Sincronizando…" : "Sincronizar agora"}
              </button>
              <button
                onClick={handleDisconnect}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--surface-border)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Desconectar
              </button>
            </div>
          )}
          {status === "connected" && (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 12,
                color: "var(--text-secondary)",
              }}
            >
              Última sincronização:{" "}
              {lastSyncAt ? lastSyncAt.toLocaleString(locale) : "—"}
            </p>
          )}
        </div>
      </section>

      {/* ── Profile Card ── */}
      {profile && status === "connected" && (
        <section style={{ marginBottom: 24 }}>
          <div
            style={{
              padding: 24,
              border: "1px solid var(--surface-border)",
              borderRadius: 12,
              backgroundColor: "var(--card-bg-on-dark)",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: "0 0 16px 0",
                color: "var(--text-primary)",
              }}
            >
              Perfil conectado
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                  }}
                >
                  Nome
                </span>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 14,
                    color: "var(--text-primary)",
                  }}
                >
                  {profile.title}
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                  }}
                >
                  Categoria
                </span>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 14,
                    color: "var(--text-primary)",
                  }}
                >
                  {profile.category}
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                  }}
                >
                  Rating
                </span>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 14,
                    color: "var(--text-primary)",
                  }}
                >
                  ⭐ {profile.rating} ({profile.reviewsCount} reviews)
                </p>
              </div>
              <div>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                  }}
                >
                  Morada
                </span>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 14,
                    color: "var(--text-primary)",
                  }}
                >
                  {profile.address.street}, {profile.address.city}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Reviews ── */}
      {status === "connected" && (
        <section>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              margin: "0 0 12px 0",
              color: "var(--text-primary)",
            }}
          >
            Últimas reviews
          </h2>
          {loadingReviews ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 16,
                    border: "1px solid var(--surface-border)",
                    borderRadius: 10,
                    backgroundColor: "var(--card-bg-on-dark)",
                  }}
                >
                  <div
                    style={{
                      height: 12,
                      width: "40%",
                      background: "var(--status-primary-bg)",
                      borderRadius: 6,
                      marginBottom: 10,
                    }}
                  />
                  <div
                    style={{
                      height: 10,
                      width: "80%",
                      background: "var(--status-primary-bg)",
                      borderRadius: 6,
                    }}
                  />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Sem reviews disponíveis.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reviews.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: 16,
                    border: "1px solid var(--surface-border)",
                    borderRadius: 10,
                    backgroundColor: "var(--card-bg-on-dark)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: 14,
                          color: "var(--text-primary)",
                        }}
                      >
                        {r.author}
                      </span>
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 13,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {"⭐".repeat(r.rating)}
                      </span>
                    </div>
                    <span
                      style={{ fontSize: 12, color: "var(--text-secondary)" }}
                    >
                      {new Date(r.createTime).toLocaleDateString(locale)}
                    </span>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: r.reply
                        ? "var(--status-success-bg)"
                        : "var(--status-warning-bg)",
                      color: r.reply
                        ? "var(--color-success)"
                        : "var(--color-warning)",
                      width: "fit-content",
                      marginBottom: 8,
                    }}
                  >
                    {r.reply ? "Respondido" : "Pendente"}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {r.comment}
                  </p>
                  {r.reply && (
                    <div
                      style={{
                        marginTop: 10,
                        paddingLeft: 12,
                        borderLeft: "2px solid var(--color-success)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--color-success)",
                          fontWeight: 500,
                        }}
                      >
                        Sua resposta
                      </span>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 13,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {r.reply.comment}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
